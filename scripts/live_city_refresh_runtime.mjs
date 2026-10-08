import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

import {
  buildTretyakovNewLiveAdapter,
  TRETYAKOV_NEW_SOURCE_URL
} from '../src/integrations/tretyakovLiveCityAdapter.ts';
import {
  buildTretyakovProgrammeAdapter,
  TRETYAKOV_PROGRAMME_SOURCE_URL
} from '../src/integrations/tretyakovProgrammeAdapter.ts';
import { runLiveCityRefreshRuntime } from '../src/travel/liveCityRefreshRuntime.ts';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function fetchHtml(sourceUrl, userAgent) {
  const fetchedAt = new Date().toISOString();
  const response = await fetch(sourceUrl, {
    method: 'GET',
    headers: {
      'user-agent': userAgent,
      'accept': 'text/html,application/xhtml+xml'
    }
  });
  const rawHtml = await response.text();
  if (!response.ok) {
    throw new Error(`Live city refresh HTTP ${response.status} for ${sourceUrl}: ${rawHtml.slice(0, 300)}`);
  }
  return {
    sourceUrl,
    fetchedAt,
    rawHtml,
    payloadSha256: sha256(rawHtml),
    finalUrl: response.url || sourceUrl,
    contentType: response.headers.get('content-type') || ''
  };
}

async function main() {
  const venueUrl = process.env.TRETYAKOV_LIVE_URL?.trim() || TRETYAKOV_NEW_SOURCE_URL;
  const programmeUrl = process.env.TRETYAKOV_PROGRAMME_URL?.trim() || TRETYAKOV_PROGRAMME_SOURCE_URL;
  for (const url of [venueUrl, programmeUrl]) {
    if (!/^https:\/\//i.test(url)) throw new Error(`Live city source must use HTTPS: ${url}`);
  }

  const [venueFetch, programmeFetch] = await Promise.all([
    fetchHtml(venueUrl, 'MoscowCityJourneyOS/1.0 live-city-refresh'),
    fetchHtml(programmeUrl, 'MoscowCityJourneyOS/1.0 live-programme-refresh')
  ]);

  const venueAdapter = buildTretyakovNewLiveAdapter(venueUrl);
  const programmeAdapter = buildTretyakovProgrammeAdapter(programmeUrl);

  const refreshedAt = new Date().toISOString();
  const refresh = runLiveCityRefreshRuntime({
    refreshedAt,
    sources: [
      {
        adapter: venueAdapter,
        snapshot: {
          schemaVersion: 1,
          providerId: venueAdapter.provider.id,
          snapshotId: `tretyakov:new:${venueFetch.fetchedAt}`,
          sourceUrl: venueUrl,
          fetchedAt: venueFetch.fetchedAt,
          payloadSha256: venueFetch.payloadSha256,
          payload: venueFetch.rawHtml
        }
      },
      {
        adapter: programmeAdapter,
        snapshot: {
          schemaVersion: 1,
          providerId: programmeAdapter.provider.id,
          snapshotId: `tretyakov:programme:${programmeFetch.fetchedAt}`,
          sourceUrl: programmeUrl,
          fetchedAt: programmeFetch.fetchedAt,
          payloadSha256: programmeFetch.payloadSha256,
          payload: programmeFetch.rawHtml
        }
      }
    ]
  });

  const outputDir = process.env.LIVE_CITY_REFRESH_OUT_DIR?.trim() || 'evidence/live-city-current';
  await mkdir(outputDir, { recursive: true });

  const snapshot = {
    schemaVersion: 1,
    kind: 'live-city-current-snapshot',
    destinationId: refresh.destinationId,
    refreshedAt: refresh.refreshedAt,
    sourceSnapshots: [
      {
        providerId: venueAdapter.provider.id,
        sourceUrl: venueUrl,
        fetchedAt: venueFetch.fetchedAt,
        finalUrl: venueFetch.finalUrl,
        contentType: venueFetch.contentType,
        payloadSha256: venueFetch.payloadSha256
      },
      {
        providerId: programmeAdapter.provider.id,
        sourceUrl: programmeUrl,
        fetchedAt: programmeFetch.fetchedAt,
        finalUrl: programmeFetch.finalUrl,
        contentType: programmeFetch.contentType,
        payloadSha256: programmeFetch.payloadSha256
      }
    ],
    ingestionRecords: refresh.ingestionRecords,
    mergedFeed: refresh.mergedFeed,
    projection: refresh.projection,
    disruptions: refresh.disruptions
  };

  await Promise.all([
    writeFile(`${outputDir}/current.json`, JSON.stringify(snapshot, null, 2) + '\n', 'utf8'),
    writeFile(`${outputDir}/tretyakov-venue.html`, venueFetch.rawHtml, 'utf8'),
    writeFile(`${outputDir}/tretyakov-programme.html`, programmeFetch.rawHtml, 'utf8')
  ]);

  console.log(JSON.stringify({
    status: 'pass',
    refreshedAt: refresh.refreshedAt,
    providers: refresh.ingestionRecords.map((record) => ({
      providerId: record.providerId,
      snapshotId: record.snapshotId,
      payloadSha256: record.payloadSha256,
      snapshotFreshness: record.snapshotFreshness
    })),
    entities: refresh.projection.entities.map((entity) => ({
      id: entity.id,
      freshness: entity.freshness,
      operationalStatus: entity.operationalStatus,
      openingState: entity.openingState,
      journeyEligible: entity.journeyEligible
    })),
    disruptions: refresh.disruptions,
    output: `${outputDir}/current.json`
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
