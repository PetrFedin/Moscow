import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateMoscowReleaseEvidence, type ReleaseEvidence } from '../src/travel/releaseCandidateAcceptance.ts';

const sha='0123456789abcdef0123456789abcdef01234567';
const evidence=():ReleaseEvidence=>({
  expectedSha:sha,expectedBranch:'main',expectedServiceId:'srv-dakkd0lg1s2s73ckof9g',
  website:{status:200,contentType:'text/html; charset=utf-8'},
  release:{status:200,body:{schemaVersion:1,kind:'moscow-runtime-release-identity',source:'render-runtime-environment',commitSha:sha,branch:'main',repository:'PetrFedin/Moscow',serviceId:'srv-dakkd0lg1s2s73ckof9g'}},
  health:{status:200,body:{ok:true,service:'moscow-live-city-authority'}},
  readiness:{status:200,body:{ready:true,reason:'fresh-current-truth',freshEntityCount:2}}
});
test('release acceptance needs independent HTML, running SHA, server health and fresh provider truth',()=>{
  const result=evaluateMoscowReleaseEvidence(evidence());
  assert.equal(result.releaseReady,true);
  assert.equal(result.checks.filter(x=>x.status==='PASS').length,4);
});
test('a healthy older deployment cannot pass the checked commit',()=>{
  const baseline=evidence();const result=evaluateMoscowReleaseEvidence({...baseline,release:{status:200,body:{...(baseline.release.body as object),commitSha:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}}});
  assert.equal(result.releaseReady,false);
  assert.equal(result.checks.find(x=>x.name==='release-sha')?.status,'BLOCKED');
});
test('HTTP 503 city freshness does not pass even when web and release SHA match',()=>{
  const baseline=evidence();const result=evaluateMoscowReleaseEvidence({...baseline,readiness:{status:503,body:{ready:false,reason:'current-truth-expired',freshEntityCount:0}}});
  assert.equal(result.releaseReady,false);
  assert.equal(result.checks.find(x=>x.name==='live-city-readiness')?.status,'BLOCKED');
});
test('bare 200 JSON, unknown repo and missing runtime commit are not accepted as deployed web',()=>{
  const baseline=evidence();
  assert.equal(evaluateMoscowReleaseEvidence({...baseline,website:{status:200,contentType:'application/json'}}).releaseReady,false);
  assert.equal(evaluateMoscowReleaseEvidence({...baseline,release:{status:200,body:{...(baseline.release.body as object),repository:'external/other'}}}).releaseReady,false);
  assert.equal(evaluateMoscowReleaseEvidence({...baseline,release:{status:200,body:{...(baseline.release.body as object),commitSha:null}}}).releaseReady,false);
});
test('release target requires a full exact commit and valid target service',()=>{
  assert.throws(()=>evaluateMoscowReleaseEvidence({...evidence(),expectedSha:'abcd'}),/Expected commit SHA/);
  assert.throws(()=>evaluateMoscowReleaseEvidence({...evidence(),expectedServiceId:'../../secret'}),/service ID/);
});
