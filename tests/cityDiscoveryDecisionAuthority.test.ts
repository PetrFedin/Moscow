import test from 'node:test';
import assert from 'node:assert/strict';

import {
  accessibilityFitFor,
  evaluateDiscoveryDecision,
  familyFitFor,
  openingStateAt,
  priceFitFor,
  travelFitFor
} from '../src/travel/cityDiscoveryDecisionAuthority.ts';
import { buildDiscoveryCollections } from '../src/travel/cityDiscoveryCollections.ts';
import { cityDiscoveryDemoCatalog } from '../src/travel/cityDiscoveryDemoCatalog.ts';
import { rankCityDiscovery } from '../src/travel/cityDiscoveryEngine.ts';
import { buildTravelEstimates, demoCityTravelTimeAdapter } from '../src/travel/cityTravelTimeAdapter.ts';

const travel=buildTravelEstimates(
  cityDiscoveryDemoCatalog.map(item=>item.id),
  demoCityTravelTimeAdapter,
  {originKey:'test',mode:'mixed'}
);

test('opening-hours authority distinguishes open, closing-soon and closed',()=>{
  const museum=cityDiscoveryDemoCatalog.find(x=>x.id==='demo-museum-evening')!;
  assert.equal(openingStateAt(museum.openingHours,'2026-10-07T17:10:00+03:00',90),'open');
  assert.equal(openingStateAt(museum.openingHours,'2026-10-07T20:15:00+03:00',90),'closing-soon');
  assert.equal(openingStateAt(museum.openingHours,'2026-10-07T22:00:00+03:00',60),'closed');
});

test('price fit preserves preference instead of treating premium as universally better',()=>{
  assert.equal(priceFitFor('free','budget'),'good');
  assert.equal(priceFitFor('mid','budget'),'acceptable');
  assert.equal(priceFitFor('premium','budget'),'over-budget');
});

test('family and age rules exclude adult nightlife for a child party',()=>{
  const bar=cityDiscoveryDemoCatalog.find(x=>x.id==='demo-nightlife-khitrovka')!;
  assert.equal(familyFitFor(bar,[8],'2026-10-07T21:15:00+03:00'),'ineligible');
});

test('required step-free access never upgrades unknown accessibility to eligible',()=>{
  const exhibition=cityDiscoveryDemoCatalog.find(x=>x.id==='demo-basmanny-exhibition')!;
  assert.equal(accessibilityFitFor(exhibition,'required'),'needs-verification');
  const decision=evaluateDiscoveryDecision(exhibition,{
    now:'2026-10-07T17:10:00+03:00',
    freeWindowMinutes:120,
    accessibilityIntent:'required',
    travelByItemId:travel
  });
  assert.equal(decision.eligible,false);
  assert.ok(decision.blockers.includes('accessibility-needs-verification'));
});

test('travel friction measures total window and experience share',()=>{
  assert.equal(travelFitFor({durationMinutes:90,freeWindowMinutes:120,travelMinutes:20}).fit,'tight');
  assert.equal(travelFitFor({durationMinutes:60,freeWindowMinutes:90,travelMinutes:16}).fit,'good');
  assert.equal(travelFitFor({durationMinutes:180,freeWindowMinutes:180,travelMinutes:48}).fit,'does-not-fit');
});

test('organic ranking excludes hard decision blockers',()=>{
  const ranked=rankCityDiscovery(cityDiscoveryDemoCatalog,{
    now:'2026-10-07T17:10:00+03:00',
    freeWindowMinutes:180,
    preferredKinds:['exhibition','museum','restaurant'],
    currentDistrict:'Басманный',
    visitedDistricts:['Якиманка'],
    accessibilityIntent:'required',
    budgetPreference:'mid',
    weather:'clear',
    travelByItemId:travel
  });
  assert.equal(ranked.organic.some(x=>x.id==='demo-basmanny-exhibition'),false);
  assert.equal(ranked.organic.some(x=>x.id==='demo-museum-evening'),true);
});

test('contextual collections cover all planned Wave 2 collection surfaces',()=>{
  const collections=buildDiscoveryCollections(cityDiscoveryDemoCatalog,{
    now:'2026-10-07T17:10:00+03:00',
    freeWindowMinutes:180,
    preferredKinds:[],
    currentDistrict:'Басманный',
    visitedDistricts:['Якиманка','Тверской'],
    budgetPreference:'mid',
    weather:'rain',
    childrenAges:[],
    accessibilityIntent:'none',
    travelByItemId:travel
  });
  assert.deepEqual(
    collections.map(x=>x.id),
    ['tonight','weekend','rainy-day','free','new-district','family','after-theatre','continue-evening']
  );
  assert.ok(collections.find(x=>x.id==='free')!.items.some(x=>x.id==='demo-free-architecture'));
  assert.ok(collections.find(x=>x.id==='rainy-day')!.items.some(x=>x.id==='demo-museum-evening'));
  assert.ok(collections.find(x=>x.id==='after-theatre')!.items.some(x=>x.id==='demo-zamoskvorechye-dinner'));
});

test('demo travel estimates remain explicitly demo truth',()=>{
  assert.equal(travel['demo-zamoskvorechye-dinner']?.truth,'demo');
  assert.equal(travel['demo-zamoskvorechye-dinner']?.minutes,20);
});
