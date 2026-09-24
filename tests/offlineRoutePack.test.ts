import assert from 'node:assert/strict';
import test from 'node:test';

import { romanovModelCatalog } from '../src/spatial/romanovModelCatalog.ts';
import {
  assertRoutePackManifest,
  validateRoutePackManifest,
  type RoutePackManifest
} from '../src/features/offline/routePackManifest.ts';
import {
  createVarvarkaRoutePackManifest,
  getVarvarkaOfflineCoverage,
  ROMANOV_ARCHIVE_1857_ASSET_ID,
  VARVARKA_REQUIRED_BUNDLED_DATA_IDS
} from '../src/features/offline/varvarkaRoutePack.ts';

test('Varvarka offline manifest covers every required Romanov scene asset', () => {
  const manifest = createVarvarkaRoutePackManifest('ru', '2026-09-18T17:20:00.000Z');
  const coverage = getVarvarkaOfflineCoverage(manifest);

  assert.equal(manifest.routeId, 'varvarka-zaryadye-pilot');
  assert.match(manifest.version, /^varvarka-offline-v3\+/);
  assert.deepEqual(validateRoutePackManifest(manifest), []);
  assert.equal(coverage.complete, true);
  assert.deepEqual(coverage.missing, []);

  const bundledIds = new Set((manifest.bundled ?? []).map((asset) => asset.id));
  for (const model of romanovModelCatalog) {
    assert.equal(bundledIds.has(model.id), true, `missing bundled model: ${model.id}`);
  }
  for (const id of VARVARKA_REQUIRED_BUNDLED_DATA_IDS) {
    assert.equal(bundledIds.has(id), true, `missing bundled data: ${id}`);
  }
  assert.equal(bundledIds.has('varvarka-route-data-v2'), true);
  assert.equal(bundledIds.has('varvarka-place-sources-v1'), true);
  assert.equal(bundledIds.has('varvarka-audio-catalog-v1'), true);
  assert.equal(manifest.files.some((asset) => asset.kind === 'audio'), false, 'pending recordings must not enter offline pack');

  const archive = manifest.files.find((asset) => asset.id === ROMANOV_ARCHIVE_1857_ASSET_ID);
  assert.ok(archive);
  assert.equal(archive.kind, 'image');
  assert.equal(archive.required, true);
  assert.match(archive.url, /^https:\/\//);
  assert.equal(archive.filename, 'romanov-timm-1857.jpg');
});

test('Romanov bundled model catalog covers every era/trust combination and runtime', () => {
  assert.equal(romanovModelCatalog.length, 4);

  const combinations = new Set(romanovModelCatalog.map((item) => `${item.era}:${item.trustMode}`));
  assert.deepEqual(
    [...combinations].sort(),
    ['1857:documented', '1857:public', '1859:documented', '1859:public']
  );

  for (const model of romanovModelCatalog) {
    assert.deepEqual(model.allowedRuntimeModes, ['model3d', 'ar', 'vr']);
    assert.match(model.assetPath, /^assets\/models\/romanov-/);
    assert.match(model.assetPath, /\.glb$/);
  }
});

test('route pack manifest rejects duplicate ids and unsafe filenames', () => {
  const bad: RoutePackManifest = {
    routeId: 'route',
    version: 'v1',
    downloadedAt: '2026-09-18T17:20:00.000Z',
    locale: 'ru',
    files: [
      { id: 'same', url: 'http://example.com/a.jpg', filename: '../a.jpg', kind: 'image' }
    ],
    bundled: [
      { id: 'same', kind: 'data', required: true }
    ]
  };

  const errors = validateRoutePackManifest(bad);
  assert.ok(errors.some((item) => item.includes('duplicate asset id')));
  assert.ok(errors.some((item) => item.includes('must use https')));
  assert.ok(errors.some((item) => item.includes('unsafe filename')));
  assert.throws(() => assertRoutePackManifest(bad));
});


test('offline audio assets require SHA-256 authority before the pack can be accepted', () => {
  const base: RoutePackManifest = {
    routeId: 'route',
    version: 'v1',
    downloadedAt: '2026-09-24T12:00:00.000Z',
    locale: 'ru',
    files: [
      { id: 'audio', url: 'https://example.com/audio.m4a', filename: 'audio.m4a', kind: 'audio' }
    ]
  };

  assert.ok(validateRoutePackManifest(base).some((item) => item.includes('audio asset requires sha256')));
  assert.ok(validateRoutePackManifest({
    ...base,
    files: [{ ...base.files[0]!, sha256: 'bad' }]
  }).some((item) => item.includes('invalid sha256')));
  assert.deepEqual(validateRoutePackManifest({
    ...base,
    files: [{ ...base.files[0]!, sha256: 'a'.repeat(64) }]
  }), []);
});
