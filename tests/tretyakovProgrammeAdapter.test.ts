import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTretyakovProgrammeAdapter,
  normalizeTretyakovProgrammePage,
  programmeStatusFromTretyakovContext,
  TRETYAKOV_BOGOLYUBOV_EVENT_ID,
  TRETYAKOV_PROGRAMME_SOURCE_URL
} from '../src/integrations/tretyakovProgrammeAdapter.ts';
import {
  ingestLiveProviderSnapshot,
  type LiveProviderSnapshot
} from '../src/travel/liveProviderIngestion.ts';
import { projectLiveDestinationFeed } from '../src/travel/liveDestinationAuthority.ts';

const html = `
<html>
  <body>
    <h1>Выставки</h1>
    <div>Уже идет 6+ Алексей Боголюбов. От Невы до Босфора 29 сентября 2026 — 6 июня 2027
      Третьяковская галерея</div>
  </body>
</html>
`;

function snapshot(fetchedAt = '2026-10-08T14:00:00.000Z'): LiveProviderSnapshot<string> {
  return {
    schemaVersion: 1,
    providerId: 'tretyakov-programme-official',
    snapshotId: 'tretyakov-programme-snapshot-1',
    sourceUrl: TRETYAKOV_PROGRAMME_SOURCE_URL,
    fetchedAt,
    payloadSha256: 'b'.repeat(64),
    payload: html
  };
}

test('Tretyakov programme parser maps explicit source markers to bounded statuses', () => {
  assert.equal(programmeStatusFromTretyakovContext('Уже идет'), 'scheduled');
  assert.equal(programmeStatusFromTretyakovContext('Скоро будет'), 'scheduled');
  assert.equal(programmeStatusFromTretyakovContext('Архив'), 'finished');
  assert.equal(programmeStatusFromTretyakovContext('Сроки проведения изменены Уже идет'), 'rescheduled');
  assert.equal(programmeStatusFromTretyakovContext('Отменено'), 'cancelled');
  assert.equal(programmeStatusFromTretyakovContext('Без статуса'), 'unknown');
});

test('real target page normalizes as scheduled exhibition with programme dates', () => {
  const entities = normalizeTretyakovProgrammePage(html, snapshot());
  assert.equal(entities.length, 1);

  const entity = entities[0]!;
  assert.equal(entity.id, TRETYAKOV_BOGOLYUBOV_EVENT_ID);
  assert.equal(entity.kind, 'exhibition');
  assert.equal(entity.operationalStatus, 'scheduled');
  assert.equal(entity.startsAt, '2026-09-29T00:00:00+03:00');
  assert.equal(entity.endsAt, '2027-06-06T23:59:59+03:00');
  assert.equal(entity.canonicalDestinationNodeId, TRETYAKOV_BOGOLYUBOV_EVENT_ID);
});

test('programme adapter uses common ingestion and projects source-backed scheduled status', () => {
  const adapter = buildTretyakovProgrammeAdapter();
  const result = ingestLiveProviderSnapshot({
    adapter,
    snapshot: snapshot(),
    normalizedAt: '2026-10-08T14:00:05.000Z'
  });

  assert.equal(result.record.normalizedEntityCount, 1);
  const projection = projectLiveDestinationFeed(result.feed, '2026-10-08T14:05:00.000Z');
  const entity = projection.entities[0]!;
  assert.equal(entity.freshness, 'fresh');
  assert.equal(entity.operationalStatus, 'scheduled');
  assert.equal(entity.journeyEligible, true);
  assert.equal(entity.startsAt, '2026-09-29T00:00:00+03:00');
  assert.equal(entity.endsAt, '2027-06-06T23:59:59+03:00');
});

test('programme source fails closed when target card or explicit marker disappears', () => {
  assert.throws(
    () => normalizeTretyakovProgrammePage(
      '<html><body><h1>Выставки</h1><div>Другая выставка</div></body></html>',
      snapshot()
    ),
    /title marker missing/
  );

  assert.throws(
    () => normalizeTretyakovProgrammePage(
      '<html><body><h1>Выставки</h1><div>29 сентября 2026 — 6 июня 2027 Алексей Боголюбов. От Невы до Босфора Третьяковская галерея</div></body></html>',
      snapshot()
    ),
    /explicit status marker missing/
  );
});

test('stale programme evidence degrades operational status to unknown', () => {
  const adapter = buildTretyakovProgrammeAdapter();
  const result = ingestLiveProviderSnapshot({
    adapter,
    snapshot: snapshot('2026-10-08T14:00:00.000Z'),
    normalizedAt: '2026-10-08T14:30:00.000Z'
  });
  const projection = projectLiveDestinationFeed(result.feed, '2026-10-08T15:00:01.000Z');
  assert.equal(projection.entities[0]?.freshness, 'stale');
  assert.equal(projection.entities[0]?.operationalStatus, 'unknown');
  assert.equal(projection.entities[0]?.journeyEligible, false);
});
