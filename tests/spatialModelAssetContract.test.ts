import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HERITAGE_MOBILE_GLB_BUDGETS_V1,
  validateSpatialModelBinaryReport,
  type SpatialModelBinaryReport
} from '../src/spatial/spatialModelAssetContract.ts';

function validReport(): SpatialModelBinaryReport {
  return {
    schemaVersion: 1,
    format: 'glb',
    filename: 'heritage-model.glb',
    sha256: 'a'.repeat(64),
    bytes: 1_200_000,
    glbVersion: 2,
    declaredLengthMatches: true,
    nodes: 120,
    meshes: 80,
    primitives: 100,
    triangles: 80_000,
    materials: 20,
    textures: 12,
    images: 12,
    animations: 0,
    skins: 0,
    externalBuffers: 0,
    externalImages: 0
  };
}

test('mobile heritage GLB report passes inside the shared production budgets', () => {
  const validation = validateSpatialModelBinaryReport(validReport());

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.blockers, []);
  assert.equal(HERITAGE_MOBILE_GLB_BUDGETS_V1.singleGlbBytes, 5 * 1024 * 1024);
  assert.equal(HERITAGE_MOBILE_GLB_BUDGETS_V1.triangles, 150000);
});

test('mobile heritage GLB report fails closed on external resources and dynamic scene data', () => {
  const report = validReport();
  report.externalBuffers = 1;
  report.externalImages = 2;
  report.animations = 1;
  report.skins = 1;

  const validation = validateSpatialModelBinaryReport(report);

  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('external-buffers-not-allowed:1'));
  assert.ok(validation.blockers.includes('external-images-not-allowed:2'));
  assert.ok(validation.blockers.includes('static-scene-animations-not-allowed:1'));
  assert.ok(validation.blockers.includes('static-scene-skins-not-allowed:1'));
});

test('mobile heritage GLB report rejects oversized and over-complex models', () => {
  const report = validReport();
  report.bytes = HERITAGE_MOBILE_GLB_BUDGETS_V1.singleGlbBytes + 1;
  report.nodes = HERITAGE_MOBILE_GLB_BUDGETS_V1.nodes + 1;
  report.triangles = HERITAGE_MOBILE_GLB_BUDGETS_V1.triangles + 1;

  const validation = validateSpatialModelBinaryReport(report);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.blockers.some((item) => item.startsWith('mobile-budget-exceeded:singleGlbBytes:'))
  );
  assert.ok(
    validation.blockers.some((item) => item.startsWith('mobile-budget-exceeded:nodes:'))
  );
  assert.ok(
    validation.blockers.some((item) => item.startsWith('mobile-budget-exceeded:triangles:'))
  );
});

test('GLB identity report requires version 2, exact declared length, safe filename and SHA-256', () => {
  const report = validReport();
  report.filename = 'model.gltf';
  report.sha256 = 'bad';
  report.glbVersion = 1;
  report.declaredLengthMatches = false;

  const validation = validateSpatialModelBinaryReport(report);

  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('binary-filename-invalid'));
  assert.ok(validation.blockers.includes('binary-sha256-invalid'));
  assert.ok(validation.blockers.includes('glb-version-not-2'));
  assert.ok(validation.blockers.includes('glb-declared-length-mismatch'));
});
