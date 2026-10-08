import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

import {
  buildTretyakovProgrammeAdapter,
  TRETYAKOV_PROGRAMME_SOURCE_URL
} from '../src/integrations/tretyakovProgrammeAdapter.ts';
import { ingestLiveProviderSnapshot } from '../src/travel/liveProviderIngestion.ts';
import { projectLiveDestinationFeed } from '../src/travel/liveDestinationAuthority.ts';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function main() {
  const sourceUrl = process.env.TRETYAKOV_PROGRAMME_URL?.trim() || TRETYAKOV_PROGRAMME_SOURCE_URL;
  if (!/^https:\/\//i.test(sourceUrl)) throw new Error('TRETYAKOV_PROGRAMME_URL must use HTTPS');

  const fetchedAt = new Date().toISOString();
  const response = await fetch(sourceUrl, {
    method: 'GET',
    headers: {
      'user-agent': 'MoscowCityJourneyOS/1.0 live-programme-smoke',
      'accept': 'text/html,application/xhtml+xml'
    }
  });

  const rawHtml = await response.text();
  const finalUrl = response.url || sourceUrl;
  const contentType = response.headers.get('content-type') || '';
  const payloadSha256 = sha256(rawHtml);

  const rawOut = process.env.LIVE_PROGRAMME_RAW_OUT?.trim();
  if (rawOut) {
    await writeFile(rawOut, rawHtml, 'utf8');
  }

  const diagnosticsOut = process.env.LIVE_PROGRAMME_DIAGNOSTICS_OUT?.trim();
  if (diagnosticsOut) {
    await writeFile(diagnosticsOut, JSON.stringify({
      schemaVersion: 1,
      requestedUrl: sourceUrl,
      finalUrl,
      status: response.status,
      ok: response.ok,
      contentType,
      fetchedAt,
      rawHtmlSha256: payloadSha256,
      byteLength: Buffer.byteLength(rawHtml, 'utf8')
    }, null, 2) + '\n', 'utf8');
  }

  if (!response.ok) {
    throw new Error(`Tretyakov programme HTTP ${response.status}: ${rawHtml.slice(0, 400)}`);
  }

  const adapter = buildTretyakovProgrammeAdapter(sourceUrl);
  const snapshot = {
    schemaVersion: 1,
    providerId: adapter.provider.id,
    snapshotId: `tretyakov:programme:${fetchedAt}`,
    sourceUrl,
    fetchedAt,
    payloadSha256,
    payload: rawHtml
  };

  const normalizedAt = new Date().toISOString();
  const ingestion = ingestLiveProviderSnapshot({
    adapter,
    snapshot,
    normalizedAt
  });

  const projection = projectLiveDestinationFeed(ingestion.feed, normalizedAt);
  const entity = projection.entities[0];
  if (!entity) throw new Error('Tretyakov programme projection is empty');

  const evidence = {
    schemaVersion: 1,
    kind: 'live-city-programme-real-smoke',
    providerId: adapter.provider.id,
    adapterId: adapter.id,
    sourceUrl,
    fetchedAt,
    normalizedAt,
    rawHtmlSha256: payloadSha256,
    ingestionRecord: ingestion.record,
    normalizedFeed: ingestion.feed,
    projection: {
      entityId: entity.id,
      canonicalDestinationNodeId: entity.canonicalDestinationNodeId,
      freshness: entity.freshness,
      operationalStatus: entity.operationalStatus,
      startsAt: entity.startsAt,
      endsAt: entity.endsAt,
      journeyEligible: entity.journeyEligible,
      providerName: entity.providerName,
      observedAt: entity.observedAt,
      expiresAt: entity.expiresAt
    }
  };

  const evidenceOut = process.env.LIVE_PROGRAMME_EVIDENCE_OUT?.trim();
  if (evidenceOut) {
    await writeFile(evidenceOut, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  }

  console.log(JSON.stringify({
    status: 'pass',
    providerId: adapter.provider.id,
    sourceUrl,
    rawHtmlSha256: payloadSha256,
    freshness: entity.freshness,
    operationalStatus: entity.operationalStatus,
    startsAt: entity.startsAt ?? null,
    endsAt: entity.endsAt ?? null,
    expiresAt: entity.expiresAt,
    evidenceFile: evidenceOut || null,
    rawFile: rawOut || null
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
