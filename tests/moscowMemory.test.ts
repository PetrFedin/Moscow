import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMoscowMemoryNext,
  createEmptyMoscowMemory,
  mergeTripIntoMoscowMemory
} from '../src/travel/moscowMemory.ts';
import {
  addManualTripItem,
  createPersonalTrip,
  recordTripVisit
} from '../src/travel/personalTrip.ts';

function tripWithVisit(input:{
  tripId:string;
  itemId:string;
  visitId:string;
  title:string;
  discoveryItemId:string;
  visitedAt:string;
}){
  let trip=createPersonalTrip({
    id:input.tripId,
    destinationId:'moscow',
    title:'Moscow plan',
    startDate:'2026-10-07',
    endDate:'2026-10-07',
    createdAt:'2026-10-07T08:00:00Z'
  });
  trip=addManualTripItem({
    trip,
    itemId:input.itemId,
    dayDate:'2026-10-07',
    title:input.title,
    kind:'museum',
    updatedAt:'2026-10-07T08:10:00Z',
    note:`discoveryItemId=${input.discoveryItemId}; truth=demo`
  });
  return recordTripVisit({
    trip,
    visitId:input.visitId,
    dayDate:'2026-10-07',
    visitedAt:input.visitedAt,
    title:input.title,
    kind:'museum',
    itemId:input.itemId,
    evidence:'user-confirmed',
    updatedAt:input.visitedAt
  });
}

test('same trip visit can be synchronized repeatedly without duplicate memory count',()=>{
  const trip=tripWithVisit({
    tripId:'plan-a',
    itemId:'item-a',
    visitId:'visit-a',
    title:'Museum A',
    discoveryItemId:'demo-a',
    visitedAt:'2026-10-07T10:00:00Z'
  });
  const empty=createEmptyMoscowMemory('2026-10-07T09:00:00Z');
  const once=mergeTripIntoMoscowMemory({memory:empty,trip,updatedAt:'2026-10-07T10:01:00Z'});
  const twice=mergeTripIntoMoscowMemory({memory:once,trip,updatedAt:'2026-10-07T10:02:00Z'});
  assert.equal(twice.entries.length,1);
  assert.equal(twice.entries[0]!.visitCount,1);
  assert.deepEqual(twice.entries[0]!.visitIds,['visit-a']);
});

test('same place visited in another plan becomes a real repeat visit',()=>{
  const first=tripWithVisit({
    tripId:'plan-a',
    itemId:'item-a',
    visitId:'visit-a',
    title:'Museum A',
    discoveryItemId:'demo-a',
    visitedAt:'2026-10-07T10:00:00Z'
  });
  const second=tripWithVisit({
    tripId:'plan-b',
    itemId:'item-b',
    visitId:'visit-b',
    title:'Museum A',
    discoveryItemId:'demo-a',
    visitedAt:'2026-12-01T11:00:00Z'
  });
  const memory1=mergeTripIntoMoscowMemory({
    memory:createEmptyMoscowMemory('2026-10-07T09:00:00Z'),
    trip:first,
    updatedAt:'2026-10-07T10:01:00Z'
  });
  const memory2=mergeTripIntoMoscowMemory({
    memory:memory1,
    trip:second,
    updatedAt:'2026-12-01T11:01:00Z'
  });
  assert.equal(memory2.entries.length,1);
  assert.equal(memory2.entries[0]!.visitCount,2);
  assert.deepEqual(memory2.entries[0]!.visitIds.sort(),['visit-a','visit-b']);
  assert.equal(memory2.entries[0]!.lastVisitedAt,'2026-12-01T11:00:00Z');
});

test('next-plan suggestions separate revisit candidates from unseen discovery',()=>{
  const trip=tripWithVisit({
    tripId:'plan-a',
    itemId:'item-a',
    visitId:'visit-a',
    title:'Museum A',
    discoveryItemId:'demo-a',
    visitedAt:'2026-10-07T10:00:00Z'
  });
  const memory=mergeTripIntoMoscowMemory({
    memory:createEmptyMoscowMemory('2026-10-07T09:00:00Z'),
    trip,
    updatedAt:'2026-10-07T10:01:00Z'
  });
  const next=buildMoscowMemoryNext({
    memory,
    discoveryItemIds:['demo-a','demo-b','demo-c'],
    unseenLimit:10
  });
  assert.equal(next.revisit[0]?.discoveryItemId,'demo-a');
  assert.deepEqual(next.unseenDiscoveryItemIds,['demo-b','demo-c']);
});
