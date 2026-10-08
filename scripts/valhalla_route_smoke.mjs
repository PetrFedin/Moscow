import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

import {
  buildValhallaRoutingAdmission,
  buildValhallaRoutingFeed,
  buildValhallaWalkingRequest,
  normalizeValhallaWalkingRoute
} from '../src/integrations/valhallaRoutingAdapter.ts';
import { validateRealProviderAdmission } from '../src/integrations/realProviderAdmission.ts';
import { validateCitywideRoutingFeed } from '../src/travel/citywideRoutingAuthority.ts';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function endpoint(base) {
  return base.replace(/\/$/, '') + '/route';
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function main() {
  const baseUrl = required('VALHALLA_URL');
  if (!/^https:\/\//i.test(baseUrl)) throw new Error('VALHALLA_URL must use HTTPS');

  const from = {
    id: process.env.ROUTE_FROM_ID?.trim() || 'pushkin-museum',
    latitude: Number(process.env.ROUTE_FROM_LAT || '55.7472'),
    longitude: Number(process.env.ROUTE_FROM_LON || '37.6054')
  };
  const to = {
    id: process.env.ROUTE_TO_ID?.trim() || 'bolshoi-theatre',
    latitude: Number(process.env.ROUTE_TO_LAT || '55.7601'),
    longitude: Number(process.env.ROUTE_TO_LON || '37.6186')
  };

  const fetchedAt = new Date().toISOString();
  const request = buildValhallaWalkingRequest(from, to);
  const url = endpoint(baseUrl);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request)
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`Valhalla HTTP ${response.status}: ${rawText.slice(0, 400)}`);
  }

  const raw = JSON.parse(rawText);
  const expiresAt = new Date(Date.parse(fetchedAt) + 15 * 60_000).toISOString();

  const admission = buildValhallaRoutingAdmission({
    sourceUrl: baseUrl,
    admittedAt: fetchedAt,
    evidenceRef: 'runtime://valhalla/admission',
    capabilityEvidenceRef: 'runtime://valhalla/capabilities',
    schemaEvidenceRef: 'runtime://valhalla/schema'
  });
  const admissionResult = validateRealProviderAdmission(admission);
  if (admissionResult.status !== 'admitted') {
    throw new Error(`Valhalla admission blocked: ${admissionResult.blockers.join(', ')}`);
  }

  const observation = normalizeValhallaWalkingRoute({
    raw,
    sourceUrl: url,
    from,
    to,
    fetchedAt,
    expiresAt,
    observationId: `valhalla:${from.id}:${to.id}:walk:${fetchedAt}`
  });

  const feed = buildValhallaRoutingFeed({
    sourceUrl: baseUrl,
    generatedAt: new Date().toISOString(),
    observations: [observation]
  });

  const validation = validateCitywideRoutingFeed(feed);
  if (!validation.valid) {
    throw new Error(`Routing feed invalid: ${validation.blockers.join(', ')}`);
  }

  const evidence = {
    schemaVersion: 1,
    providerId: 'valhalla',
    adapterId: 'valhalla-route-v1',
    fetchedAt,
    sourceUrl: url,
    request,
    rawResponseSha256: sha256(rawText),
    rawResponse: raw,
    admission,
    admissionResult,
    normalizedFeed: feed
  };

  const output = process.env.ROUTING_EVIDENCE_OUT?.trim();
  if (output) {
    await writeFile(output, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  }

  console.log(JSON.stringify({
    status: 'pass',
    providerId: 'valhalla',
    from: from.id,
    to: to.id,
    durationMinutes: observation.durationMinutes,
    distanceMeters: observation.distanceMeters,
    rawResponseSha256: evidence.rawResponseSha256,
    evidenceFile: output || null
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
