import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTretyakovNewLiveAdapter,
  normalizeTretyakovNewPage,
  TRETYAKOV_NEW_SOURCE_URL
} from '../src/integrations/tretyakovLiveCityAdapter.ts';
import {
  ingestLiveProviderSnapshot,
  type LiveProviderSnapshot
} from '../src/travel/liveProviderIngestion.ts';
import { projectLiveDestinationFeed } from '../src/travel/liveDestinationAuthority.ts';

const html = `
<html>
  <body>
    <h1>Новая Третьяковка</h1>
    <div>г. Москва, Крымский Вал, 10</div>
    <div>ВС, ВТ, СР, ЧТ, ПТ, СБ: 10:00 — 21:00 (кассы и вход до 20:00)</div>
    <div>ПН: выходной</div>
    <div>Сегодня открыто до 21:00 (кассы и вход до 20:00)</div>
  </body>
</html>
`;

function snapshot(fetchedAt = '2026-10-08T09:00:00.000Z'): LiveProviderSnapshot<string> {
  return {
    schemaVersion: 1,
    providerId: 'tretyakov-official',
    snapshotId: 'tretyakov-snapshot-1',
    sourceUrl: TRETYAKOV_NEW_SOURCE_URL,
    fetchedAt,
    payloadSha256: 'a'.repeat(64),
    payload: html
  };
}

test('Tretyakov adapter normalizes official weekly hours into a canonical live overlay', () => {
  const entities = normalizeTretyakovNewPage(html, snapshot());
  assert.equal(entities.length, 1);

  const entity = entities[0]!;
  assert.equal(entity.id, 'new-tretyakov-live');
  assert.equal(entity.canonicalDestinationNodeId, 'new-tretyakov');
  assert.equal(entity.latitude, undefined);
  assert.equal(entity.longitude, undefined);
  assert.equal(entity.kind, 'museum');
  assert.equal(entity.operationalStatus, 'open');
  assert.equal(entity.openingHours?.timezone, 'Europe/Moscow');
  assert.ok((entity.openingHours?.windows.length ?? 0) >= 6);
});

test('Tretyakov adapter uses common ingestion and projects current opening truth', () => {
  const adapter = buildTretyakovNewLiveAdapter();
  const result = ingestLiveProviderSnapshot({
    adapter,
    snapshot: snapshot(),
    normalizedAt: '2026-10-08T09:00:05.000Z'
  });

  assert.equal(result.record.providerId, 'tretyakov-official');
  assert.equal(result.record.normalizedEntityCount, 1);

  const projection = projectLiveDestinationFeed(
    result.feed,
    '2026-10-08T09:05:00.000Z'
  );
  const entity = projection.entities[0]!;
  assert.equal(entity.freshness, 'fresh');
  assert.equal(entity.operationalStatus, 'open');
  assert.equal(entity.openingState, 'open');
  assert.equal(entity.journeyEligible, true);
  assert.equal(entity.canonicalDestinationNodeId, 'new-tretyakov');
});

test('Tretyakov source structure fails closed when identity or hours disappear', () => {
  assert.throws(
    () => normalizeTretyakovNewPage(
      '<html><body>Крымский Вал, 10</body></html>',
      snapshot()
    ),
    /identity marker/
  );

  assert.throws(
    () => normalizeTretyakovNewPage(
      '<html><body>Новая Третьяковка Крымский Вал, 10 Сегодня открыто до 21:00</body></html>',
      snapshot()
    ),
    /opening-hours schedule not found/
  );
});

test('Tretyakov stale snapshot cannot remain a current live truth', () => {
  const adapter = buildTretyakovNewLiveAdapter();
  const result = ingestLiveProviderSnapshot({
    adapter,
    snapshot: snapshot('2026-10-08T09:00:00.000Z'),
    normalizedAt: '2026-10-08T09:30:00.000Z'
  });

  const projection = projectLiveDestinationFeed(
    result.feed,
    '2026-10-08T10:00:01.000Z'
  );

  assert.equal(projection.entities[0]?.freshness, 'stale');
  assert.equal(projection.entities[0]?.operationalStatus, 'unknown');
  assert.equal(projection.entities[0]?.openingState, 'unknown');
  assert.equal(projection.entities[0]?.journeyEligible, false);
});
