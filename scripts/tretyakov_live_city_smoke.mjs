import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

import {
  buildTretyakovNewLiveAdapter,
  TRETYAKOV_NEW_SOURCE_URL
} from '../src/integrations/tretyakovLiveCityAdapter.ts';
import {
  ingestLiveProviderSnapshot
} from '../src/travel/liveProviderIngestion.ts';
import {
  projectLiveDestinationFeed
} from '../src/travel/liveDestinationAuthority.ts';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function main() {
  const sourceUrl = process.env.TRETYAKOV_LIVE_URL?.trim() || TRETYAKOV_NEW_SOURCE_URL;
  if (!/^https:\/\//i.test(sourceUrl)) throw new Error('TRETYAKOV_LIVE_URL must use HTTPS');

  const fetchedAt = new Date().toISOString();
  const response = await fetch(sourceUrl, {
    method: 'GET',
    headers: {
      'user-agent': 'MoscowCityJourneyOS/1.0 live-city-truth-smoke',
      'accept': 'text/html,application/xhtml+xml'
    }
  });

  const rawHtml = await response.text();
  if (!response.ok) {
    throw new Error(`Tretyakov HTTP ${response.status}: ${rawHtml.slice(0, 400)}`);
  }

  const payloadSha256 = sha256(rawHtml);
  const adapter = buildTretyakovNewLiveAdapter(sourceUrl);
  const snapshot = {
    schemaVersion: 1,
    providerId: adapter.provider.id,
    snapshotId: `tretyakov:new:${fetchedAt}`,
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

  const projection = projectLiveDestinationFeed(
    ingestion.feed,
    normalizedAt
  );
  const entity = projection.entities[0];
  if (!entity) throw new Error('Tretyakov live projection is empty');

  const evidence = {
    schemaVersion: 1,
    kind: 'live-city-truth-real-smoke',
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
      openingState: entity.openingState,
      nextOpeningChangeAt: entity.nextOpeningChangeAt,
      journeyEligible: entity.journeyEligible,
      providerName: entity.providerName,
      observedAt: entity.observedAt,
      expiresAt: entity.expiresAt
    }
  };

  const evidenceOut = process.env.LIVE_CITY_EVIDENCE_OUT?.trim();
  const rawOut = process.env.LIVE_CITY_RAW_OUT?.trim();
  if (evidenceOut) {
    await writeFile(evidenceOut, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  }
  if (rawOut) {
    await writeFile(rawOut, rawHtml, 'utf8');
  }

  console.log(JSON.stringify({
    status: 'pass',
    providerId: adapter.provider.id,
    sourceUrl,
    rawHtmlSha256: payloadSha256,
    freshness: entity.freshness,
    operationalStatus: entity.operationalStatus,
    openingState: entity.openingState,
    nextOpeningChangeAt: entity.nextOpeningChangeAt ?? null,
    expiresAt: entity.expiresAt,
    evidenceFile: evidenceOut || null,
    rawFile: rawOut || null
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
