import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRomanovHotspotNarration,
  getRomanovHotspotById,
  getRomanovHotspots,
  romanovHotspotToViroPosition
} from '../src/spatial/romanov-hotspots.ts';

test('Romanov hotspot visibility follows era and trust mode', () => {
  const facts1857 = getRomanovHotspots('1857', 'documented');
  const public1857 = getRomanovHotspots('1857', 'public');
  const facts1859 = getRomanovHotspots('1859', 'documented');
  const public1859 = getRomanovHotspots('1859', 'public');

  assert.deepEqual(facts1857.map((item) => item.id), ['masonry-core', 'pre-restoration-facade']);
  assert.ok(public1857.length >= facts1857.length);
  assert.deepEqual(facts1859.map((item) => item.id), ['masonry-core']);
  assert.ok(public1859.some((item) => item.id === 'timber-terem'));
  assert.ok(public1859.some((item) => item.id === 'porch-stair'));
});

test('Romanov hotspot source-space coordinates map into Viro axes deterministically', () => {
  const hotspot = getRomanovHotspotById('porch-stair');
  assert.ok(hotspot);
  assert.deepEqual(romanovHotspotToViroPosition(hotspot.position), [-7.15, 4.3, -3.95]);
});

test('unknown Romanov hotspot fails closed', () => {
  assert.equal(getRomanovHotspotById('not-real'), null);
});


test('Romanov hotspot narration is derived from the same evidence/story contract', () => {
  const hotspot = getRomanovHotspotById('masonry-core');
  assert.ok(hotspot);

  const ru = buildRomanovHotspotNarration(hotspot, 'ru');
  const en = buildRomanovHotspotNarration(hotspot, 'en');

  assert.match(ru, /Каменное ядро палат/);
  assert.match(ru, /Подтверждено источником/);
  assert.match(ru, /Нижние каменные объёмы/);

  assert.match(en, /Stone core of the chambers/);
  assert.match(en, /Documented evidence/);
  assert.match(en, /lower masonry/i);
});
