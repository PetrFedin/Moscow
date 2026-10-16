import assert from 'node:assert/strict';
import test from 'node:test';
import { createPersonalTrip, addDestinationNodeToTrip, recordTripVisit } from '../src/travel/personalTrip.ts';
import { moscowVarvarkaDestinationPackage } from '../src/travel/moscowDestinationPackage.ts';
import { deriveWalkVisitCandidates } from '../src/travel/walkVisitBridge.ts';

const day = '2026-10-16';
function fixture() {
  const node=moscowVarvarkaDestinationPackage.nodes[0]!;
  const trip=createPersonalTrip({id:'trip-walk-test',destinationId:'moscow',title:'Current trip',startDate:day,dayCount:1,createdAt:day+'T08:00:00Z'});
  const added=addDestinationNodeToTrip({trip,node,itemId:'walk-stop',dayDate:day,updatedAt:day+'T09:00:00Z'});
  return {node,trip:added};
}
test('undated global walk history only offers a candidate on today, never mutates the trip',()=>{
  const {node,trip}=fixture();
  const before=JSON.stringify(trip);
  const candidates=deriveWalkVisitCandidates({trip,walkVisitedIds:[node.id,node.id],dayDate:day,todayInDestination:day});
  assert.equal(candidates.length,1);
  assert.equal(candidates[0]?.itemId,'walk-stop');
  assert.equal(trip.visits.length,0);
  assert.equal(JSON.stringify(trip),before);
});
test('old-day, unrelated places and already-confirmed visits cannot be imported as current visit',()=>{
  const {node,trip}=fixture();
  assert.deepEqual(deriveWalkVisitCandidates({trip,walkVisitedIds:[node.id],dayDate:day,todayInDestination:'2026-10-17'}),[]);
  assert.deepEqual(deriveWalkVisitCandidates({trip,walkVisitedIds:['not-this-place'],dayDate:day,todayInDestination:day}),[]);
  const recorded=recordTripVisit({trip,visitId:'visit-walk',itemId:'walk-stop',destinationNodeId:node.id,dayDate:day,visitedAt:day+'T10:00:00Z',title:node.titleRu,evidence:'user-confirmed',updatedAt:day+'T10:00:00Z'});
  assert.deepEqual(deriveWalkVisitCandidates({trip:recorded,walkVisitedIds:[node.id],dayDate:day,todayInDestination:day}),[]);
});
