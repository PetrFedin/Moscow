import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildExternalInputRequestTemplate,
  validateExternalInputManifest
} from '../src/government/prePilotExternalInput.ts';
import {
  prePilotHandoffReadiness,
  validatePrePilotHandoffSurface
} from '../src/government/prePilotHandoffReadiness.ts';

test('external input request template is incomplete by default',()=>{
  const manifest=buildExternalInputRequestTemplate('2026-10-06T12:00:00Z');
  const result=validateExternalInputManifest(manifest);
  assert.equal(result.valid,true);
  assert.equal(result.complete,false);
  assert.equal(result.awaiting.length,8);
});

test('external input request pack never carries provider secret values',()=>{
  const manifest=buildExternalInputRequestTemplate('2026-10-06T12:00:00Z');
  const serialized=JSON.stringify(manifest);
  assert.equal(/YCLIENTS_PARTNER_TOKEN/.test(serialized),false);
  assert.equal(/YCLIENTS_USER_TOKEN/.test(serialized),false);
  assert.equal(/token\s*[:=]\s*[^\s]+/i.test(serialized),false);
});

test('handoff readiness requires the full documented surface',()=>{
  const ready=validatePrePilotHandoffSurface({
    docs:[...prePilotHandoffReadiness.requiredDocs],
    commands:[...prePilotHandoffReadiness.requiredCommands]
  });
  assert.equal(ready.ready,true);
  assert.deepEqual(ready.missingDocs,[]);
  assert.deepEqual(ready.missingCommands,[]);

  const notReady=validatePrePilotHandoffSurface({docs:[],commands:[]});
  assert.equal(notReady.ready,false);
  assert.ok(notReady.missingDocs.length>0);
  assert.ok(notReady.missingCommands.length>0);
});
