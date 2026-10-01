import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';

import { normalizeYclientsWebhookReceipt } from '../src/integrations/yclientsProviderAdapter.ts';

const PORT = Number(process.env.PORT || 3001);
const webhookToken = process.env.YCLIENTS_WEBHOOK_PATH_TOKEN || '';
const retrievalToken = process.env.YCLIENTS_EVIDENCE_RETRIEVAL_TOKEN || '';
const captureTestPayload = process.env.YCLIENTS_CAPTURE_TEST_PAYLOAD === '1';
const companyId = process.env.YCLIENTS_COMPANY_ID || '';
const partnerTokenPresent = Boolean(process.env.YCLIENTS_PARTNER_TOKEN);
const userTokenPresent = Boolean(process.env.YCLIENTS_USER_TOKEN);

let latestEvidence = null;

function json(res, status, body) {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(payload.length),
    'cache-control': 'no-store'
  });
  res.end(payload);
}

function safeEqual(actual, expected) {
  const a = Buffer.from(String(actual));
  const b = Buffer.from(String(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

function pathToken(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null;
  return decodeURIComponent(pathname.slice(prefix.length));
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function readBody(req, maxBytes = 256 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('payload-too-large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, {
      ok: true,
      service: 'moscow-yclients-evidence-receiver',
      time: new Date().toISOString()
    });
  }

  if (req.method === 'GET' && url.pathname === '/ready') {
    const receiverReady = Boolean(webhookToken && retrievalToken);
    const providerSecretsReady = Boolean(companyId && partnerTokenPresent && userTokenPresent);
    const proofReady = receiverReady && providerSecretsReady;
    return json(res, proofReady ? 200 : 503, {
      proofReady,
      receiverReady,
      providerSecretsReady,
      companyIdConfigured: Boolean(companyId),
      partnerTokenConfigured: partnerTokenPresent,
      userTokenConfigured: userTokenPresent,
      rawTestPayloadCaptureEnabled: captureTestPayload,
      evidenceBuffer: 'ephemeral-one-shot',
      immutableArchiveReady: false,
      note: 'PASS #74 requires immediate external archival of retrieved evidence.'
    });
  }

  if (req.method === 'POST' && url.pathname.startsWith('/webhooks/yclients/')) {
    const supplied = pathToken(url.pathname, '/webhooks/yclients/');
    if (!webhookToken || !supplied || !safeEqual(supplied, webhookToken)) {
      return json(res, 404, { ok: false });
    }

    let raw;
    try {
      raw = await readBody(req);
    } catch (error) {
      return json(res, 413, { ok: false, error: error instanceof Error ? error.message : 'payload-error' });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw.toString('utf8'));
    } catch {
      return json(res, 400, { ok: false, error: 'invalid-json' });
    }

    const receivedAt = new Date().toISOString();
    let receipt;
    try {
      receipt = normalizeYclientsWebhookReceipt(parsed, receivedAt);
    } catch (error) {
      return json(res, 422, { ok: false, error: error instanceof Error ? error.message : 'normalization-failed' });
    }

    const payloadSha256 = sha256(raw);
    latestEvidence = {
      receivedAt,
      payloadSha256,
      normalizedReceipt: receipt,
      ...(captureTestPayload ? { rawBase64: raw.toString('base64') } : {})
    };

    console.log(JSON.stringify({
      event: 'yclients-provider-receipt',
      receivedAt: latestEvidence.receivedAt,
      payloadSha256,
      providerEntityId: receipt.providerEntityId,
      receiptId: receipt.receiptId,
      outcome: receipt.outcome,
      rawCaptured: captureTestPayload
    }));

    return json(res, 202, {
      ok: true,
      payloadSha256,
      receiptId: receipt.receiptId
    });
  }

  if (req.method === 'GET' && url.pathname.startsWith('/evidence/yclients/')) {
    const supplied = pathToken(url.pathname, '/evidence/yclients/');
    if (!retrievalToken || !supplied || !safeEqual(supplied, retrievalToken)) {
      return json(res, 404, { ok: false });
    }
    if (!latestEvidence) return json(res, 404, { ok: false, error: 'no-evidence-buffered' });

    const evidence = latestEvidence;
    latestEvidence = null;
    return json(res, 200, {
      ok: true,
      oneTime: true,
      evidence
    });
  }

  return json(res, 404, { ok: false });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({
    event: 'yclients-evidence-receiver-started',
    port: PORT,
    webhookPathConfigured: Boolean(webhookToken),
    retrievalPathConfigured: Boolean(retrievalToken),
    captureTestPayload
  }));
});
