import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMoscowStagingTarget } from '../src/travel/stagingAcceptanceTarget.ts';
const baseline={
  MOSCOW_STAGING_URL:'https://moscow-acceptance-sandbox.onrender.com/',
  MOSCOW_STAGING_SHA:'0123456789abcdef0123456789abcdef01234567',
  MOSCOW_STAGING_BRANCH:'fix/moscow-release-proof-durable-import-20261015',
  MOSCOW_STAGING_SERVICE_ID:'srv-abc123'
};
test('staging requires exact non-production release identity',()=>{
  const result=parseMoscowStagingTarget(baseline);
  assert.equal(result.url,baseline.MOSCOW_STAGING_URL);
  assert.equal(result.expectedSha,baseline.MOSCOW_STAGING_SHA);
});
test('staging rejects public preview and all unsafe URLs',()=>{
  for(const url of ['https://moscow-mobile-preview.onrender.com','https://localhost',
    'https://moscow-acceptance-sandbox.onrender.com/private',
    'https://moscow-acceptance-sandbox.onrender.com/?token=secret',
    'http://moscow-acceptance-sandbox.onrender.com']){
    assert.throws(()=>parseMoscowStagingTarget({...baseline,MOSCOW_STAGING_URL:url}));
  }
});
test('staging rejects production refs and unverified SHA and service identifiers',()=>{
  assert.throws(()=>parseMoscowStagingTarget({...baseline,MOSCOW_STAGING_BRANCH:'main'}));
  assert.throws(()=>parseMoscowStagingTarget({...baseline,MOSCOW_STAGING_SHA:'abc'}));
  assert.throws(()=>parseMoscowStagingTarget({...baseline,MOSCOW_STAGING_SERVICE_ID:'secret'}));
});
