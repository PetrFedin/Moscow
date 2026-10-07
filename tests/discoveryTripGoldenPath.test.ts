import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addDiscoveryItemToTrip,
  suggestDiscoveryTripPlacements
} from '../src/travel/discoveryTripBridge.ts';
import {
  addManualTripItem,
  createPersonalTrip,
  recordTripVisit
} from '../src/travel/personalTrip.ts';
import { cityDiscoveryDemoCatalog } from '../src/travel/cityDiscoveryDemoCatalog.ts';

function baseTrip(){
  return createPersonalTrip({
    id:'trip-1',
    destinationId:'moscow',
    title:'Moscow',
    startDate:'2026-10-07',
    endDate:'2026-10-09',
    createdAt:'2026-10-07T09:00:00Z'
  });
}

test('flexible discovery item is placed into a free trip window',()=>{
  const trip=addManualTripItem({
    trip:baseTrip(),
    itemId:'fixed-1',
    dayDate:'2026-10-07',
    title:'Existing ticket',
    kind:'theatre',
    updatedAt:'2026-10-07T09:00:00Z',
    plannedStartAt:'2026-10-07T18:00:00+03:00',
    plannedEndAt:'2026-10-07T20:00:00+03:00',
    commitment:{kind:'ticket',status:'confirmed',verification:'user-declared'}
  });
  const item=cityDiscoveryDemoCatalog.find(x=>x.id==='demo-zamoskvorechye-dinner')!;
  const placements=suggestDiscoveryTripPlacements({trip,item,maxPerDay:1});
  assert.ok(placements.length>=1);
  assert.ok(placements.every(x=>x.source==='free-window'));
  assert.ok(placements.some(x=>x.dayDate==='2026-10-07' && x.conflict===false));
});

test('timed discovery event keeps its own time and exposes schedule conflict',()=>{
  const trip=addManualTripItem({
    trip:baseTrip(),
    itemId:'fixed-1',
    dayDate:'2026-10-07',
    title:'Existing booking',
    kind:'event',
    updatedAt:'2026-10-07T09:00:00Z',
    plannedStartAt:'2026-10-07T19:00:00+03:00',
    plannedEndAt:'2026-10-07T21:00:00+03:00'
  });
  const item=cityDiscoveryDemoCatalog.find(x=>x.id==='demo-theatre-tonight')!;
  const placements=suggestDiscoveryTripPlacements({trip,item});
  assert.equal(placements.length,1);
  assert.equal(placements[0]!.source,'event-time');
  assert.equal(placements[0]!.conflict,true);
  assert.deepEqual(placements[0]!.conflictItemIds,['fixed-1']);
});

test('conflicting placement cannot be added',()=>{
  const trip=addManualTripItem({
    trip:baseTrip(),
    itemId:'fixed-1',
    dayDate:'2026-10-07',
    title:'Existing booking',
    kind:'event',
    updatedAt:'2026-10-07T09:00:00Z',
    plannedStartAt:'2026-10-07T19:00:00+03:00',
    plannedEndAt:'2026-10-07T21:00:00+03:00'
  });
  const item=cityDiscoveryDemoCatalog.find(x=>x.id==='demo-theatre-tonight')!;
  const placement=suggestDiscoveryTripPlacements({trip,item})[0]!;
  assert.throws(()=>addDiscoveryItemToTrip({
    trip,item,placement,language:'ru',itemId:'new',updatedAt:'2026-10-07T10:00:00Z',commitmentMode:'plan-only'
  }),/conflicting/);
});

test('user ticket from Explore becomes a Wallet commitment without provider confirmation',()=>{
  const trip=baseTrip();
  const item=cityDiscoveryDemoCatalog.find(x=>x.id==='demo-zamoskvorechye-dinner')!;
  const placement=suggestDiscoveryTripPlacements({trip,item,maxPerDay:1})[0]!;
  const next=addDiscoveryItemToTrip({
    trip,item,placement,language:'ru',itemId:'discovery-1',updatedAt:'2026-10-07T10:00:00Z',commitmentMode:'user-ticket'
  });
  const added=next.items.find(x=>x.id==='discovery-1')!;
  assert.equal(added.commitment?.kind,'ticket');
  assert.equal(added.commitment?.verification,'user-declared');
  assert.equal(added.status,'planned');
});

test('visit closes the loop into completed trip history',()=>{
  const trip=baseTrip();
  const item=cityDiscoveryDemoCatalog.find(x=>x.id==='demo-zamoskvorechye-dinner')!;
  const placement=suggestDiscoveryTripPlacements({trip,item,maxPerDay:1})[0]!;
  const planned=addDiscoveryItemToTrip({
    trip,item,placement,language:'ru',itemId:'discovery-1',updatedAt:'2026-10-07T10:00:00Z',commitmentMode:'plan-only'
  });
  const visited=recordTripVisit({
    trip:planned,
    visitId:'visit-1',
    dayDate:placement.dayDate,
    visitedAt:'2026-10-07T12:00:00Z',
    title:item.titleRu,
    kind:'food',
    itemId:'discovery-1',
    evidence:'user-confirmed',
    updatedAt:'2026-10-07T12:00:00Z'
  });
  assert.equal(visited.items.find(x=>x.id==='discovery-1')?.status,'completed');
  assert.equal(visited.visits.length,1);
  assert.equal(visited.visits[0]!.evidence,'user-confirmed');
});
