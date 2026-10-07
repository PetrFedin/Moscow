import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPilotEvidenceInventory,
  computeEvidenceInventoryRootHash,
  validatePilotEvidenceInventory
} from '../src/government/evidenceArchiveInventory.ts';

test('evidence archive inventory is deterministic and canonically sorted',()=>{
  const files=[
    {path:'02-romanov/b.json',sizeBytes:2,sha256:'b'.repeat(64)},
    {path:'01-build/a.json',sizeBytes:1,sha256:'a'.repeat(64)}
  ];
  const inventory=buildPilotEvidenceInventory({
    runId:'pilot-run-001',
    generatedAt:'2026-10-06T12:00:00Z',
    rootRelative:'evidence/varvarka-zaryadye/pilot-run-001',
    files
  });
  assert.deepEqual(inventory.files.map(f=>f.path),['01-build/a.json','02-romanov/b.json']);
  assert.equal(inventory.rootHash,computeEvidenceInventoryRootHash(inventory.files));
  assert.equal(validatePilotEvidenceInventory(inventory).valid,true);
});

test('evidence archive inventory detects tampering',()=>{
  const inventory=buildPilotEvidenceInventory({
    runId:'pilot-run-001',
    generatedAt:'2026-10-06T12:00:00Z',
    rootRelative:'evidence/varvarka-zaryadye/pilot-run-001',
    files:[
      {path:'02-romanov/a.json',sizeBytes:10,sha256:'a'.repeat(64)}
    ]
  });
  const tampered={
    ...inventory,
    files:[
      {...inventory.files[0]!,sizeBytes:11}
    ]
  };
  const result=validatePilotEvidenceInventory(tampered);
  assert.equal(result.valid,false);
  assert.ok(result.blockers.includes('root-hash-mismatch'));
});

test('evidence inventory explicitly proves file integrity only, not authenticity',()=>{
  const inventory=buildPilotEvidenceInventory({
    runId:'pilot-run-001',
    generatedAt:'2026-10-06T12:00:00Z',
    rootRelative:'evidence/varvarka-zaryadye/pilot-run-001',
    files:[
      {path:'05-provider/raw.json',sizeBytes:10,sha256:'c'.repeat(64)}
    ]
  });
  assert.equal(inventory.integrityMeaning,'file-integrity-only-not-authenticity');
});
