import assert from 'node:assert/strict';
import test from 'node:test';
import { probeMoscowRelease } from '../src/travel/releaseCandidateProbe.ts';

const sha='0123456789abcdef0123456789abcdef01234567';
const config={url:'https://moscow-mobile-preview.onrender.com/',expectedSha:sha,expectedBranch:'main',expectedServiceId:'srv-dakkd0lg1s2s73ckof9g'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
function fakeFetch(options:{wrongSha?:boolean;stale?:boolean;networkFail?:boolean}={}):typeof fetch {
  return (async (input:RequestInfo|URL,init?:RequestInit)=>{
    assert.equal(init?.method,'GET');
    assert.equal(init?.redirect,'manual');
    assert.equal(init?.credentials,'omit');
    const url=new URL(String(input));
    assert.equal(url.origin,'https://moscow-mobile-preview.onrender.com');
    if(options.networkFail)throw new Error('Simulated network failure');
    if(url.pathname==='/')return new Response('<html>Works</html>',{status:200,headers:{'content-type':'text/html; charset=utf-8'}});
    if(url.pathname==='/release')return json({schemaVersion:1,kind:'moscow-runtime-release-identity',source:'render-runtime-environment',commitSha:options.wrongSha?'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa':sha,branch:'main',repository:'PetrFedin/Moscow',serviceId:config.expectedServiceId});
    if(url.pathname==='/health')return json({ok:true,service:'moscow-live-city-authority'});
    if(url.pathname==='/ready')return json(options.stale?{ready:false,reason:'current-truth-expired',freshEntityCount:0}:{ready:true,reason:'fresh-current-truth',freshEntityCount:2},options.stale?503:200);
    throw new Error('Unexpected URL');
  }) as typeof fetch;
}
test('safe read-only probe accepts verified exact deploy and city truth',async()=>{
  const r=await probeMoscowRelease({...config,fetcher:fakeFetch()});
  assert.equal(r.acceptance.releaseReady,true);
  assert.deepEqual(Object.values(r.observedHttpStatuses),[200,200,200,200]);
});
test('old commit and stale city truth are independently blocked',async()=>{
  assert.equal((await probeMoscowRelease({...config,fetcher:fakeFetch({wrongSha:true})})).acceptance.releaseReady,false);
  const stale=await probeMoscowRelease({...config,fetcher:fakeFetch({stale:true})});
  assert.equal(stale.acceptance.checks.at(-1)?.status,'BLOCKED');
  assert.equal(stale.observedHttpStatuses.readiness,503);
});
test('network errors fail closed rather than marking an unproven deploy green',async()=>{
  const r=await probeMoscowRelease({...config,fetcher:fakeFetch({networkFail:true})});
  assert.equal(r.acceptance.releaseReady,false);
  assert.deepEqual(Object.values(r.observedHttpStatuses),[0,0,0,0]);
});
test('probe rejects arbitrary hosts, credentials, paths and invalid commit targets before fetching',async()=>{
  for(const url of ['http://moscow-mobile-preview.onrender.com','https://localhost','https://127.0.0.1','https://moscow-mobile-preview.onrender.com@evil.example','https://moscow-mobile-preview.onrender.com/private','https://moscow-mobile-preview.onrender.com/?token=secret']){
    await assert.rejects(probeMoscowRelease({...config,url,fetcher:fakeFetch()}),/HTTPS root|URL is invalid/);
  }
  await assert.rejects(probeMoscowRelease({...config,expectedSha:'abc',fetcher:fakeFetch()}),/exact 40-character/);
});
test('JSON with oversize response is blocked without parsing it',async()=>{
  const fetcher=(async (input:RequestInfo|URL,init?:RequestInit)=>{
    const path=new URL(String(input)).pathname;
    if(path==='/release')return new Response(JSON.stringify({data:'x'.repeat(40_000)}),{headers:{'content-type':'application/json'}});
    return fakeFetch()(input,init);
  }) as typeof fetch;
  const r=await probeMoscowRelease({...config,fetcher});
  assert.equal(r.acceptance.releaseReady,false);
  assert.equal(r.acceptance.checks[1]?.status,'BLOCKED');
});
