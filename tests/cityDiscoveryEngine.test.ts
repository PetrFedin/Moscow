import test from 'node:test';
import assert from 'node:assert/strict';

import { cityDiscoveryDemoCatalog } from '../src/travel/cityDiscoveryDemoCatalog.ts';
import { discoveryQuickFilters, rankCityDiscovery } from '../src/travel/cityDiscoveryEngine.ts';

test('city discovery catalog spans broad tourism categories',()=>{
  assert.ok(new Set(cityDiscoveryDemoCatalog.map(x=>x.kind)).size >= 8);
  assert.ok(new Set(cityDiscoveryDemoCatalog.map(x=>x.district)).size >= 7);
});

test('organic ranking excludes sponsored inventory',()=>{
  const ranked=rankCityDiscovery(cityDiscoveryDemoCatalog,{
    now:'2026-10-07T17:10:00+03:00',
    freeWindowMinutes:180,
    preferredKinds:['museum','exhibition','restaurant','concert','bar'],
    visitedIds:[]
  });
  assert.ok(ranked.organic.every(x=>x.sponsored!==true));
  assert.ok(ranked.sponsored.every(x=>x.sponsored===true));
});

test('visited inventory is penalized but not deleted from model',()=>{
  const target=cityDiscoveryDemoCatalog.find(x=>x.id==='demo-gorky-park');
  assert.ok(target);
  const ranked=rankCityDiscovery([target!],{
    now:'2026-10-07T17:10:00+03:00',
    freeWindowMinutes:120,
    preferredKinds:['park'],
    visitedIds:['demo-gorky-park']
  });
  assert.equal(ranked.organic.length,1);
  assert.equal(ranked.organic[0]!.isNew,false);
});

test('starts-soon filters are monotonic',()=>{
  const q=discoveryQuickFilters(cityDiscoveryDemoCatalog,'2026-10-07T17:10:00+03:00');
  assert.ok(q.starts30.length <= q.starts60.length);
  assert.ok(q.starts60.length <= q.starts120.length);
});

test('demo availability remains explicitly non-provider truth',()=>{
  for(const item of cityDiscoveryDemoCatalog){
    if(item.availabilityTruth==='demo') assert.equal(item.truth,'demo');
  }
});
