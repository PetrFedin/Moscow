import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cityPulseDemoLoads,
  cityPulseDemoOpportunities
} from '../src/travel/cityPulseDemo.ts';

test('city pulse demo spans multiple districts and categories',()=>{
  assert.ok(new Set(cityPulseDemoOpportunities.map(x=>x.district)).size >= 4);
  assert.ok(new Set(cityPulseDemoOpportunities.map(x=>x.category)).size >= 4);
});

test('city pulse never presents demo availability as live truth',()=>{
  assert.ok(cityPulseDemoOpportunities.every(x=>x.availabilityState==='demo'));
  assert.ok(cityPulseDemoLoads.every(x=>x.noteRu.startsWith('DEMO')));
});

test('city pulse models traveler partner and city value together',()=>{
  for(const item of cityPulseDemoOpportunities){
    assert.ok(item.reasonRu.length>20);
    assert.ok(item.partnerValueRu.length>20);
    assert.ok(item.cityValueRu.length>20);
  }
});
