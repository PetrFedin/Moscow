import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeExperienceSnapshot } from '../src/persistence/experiencePersistence.ts';
import { planWalkStopCompletion, commitWalkStopCompletion } from '../src/travel/walkStopCompletion.ts';

const fixture = () => normalizeExperienceSnapshot(null);

test('walk stop completion calculates next step without mutating original progress', () => {
  const before = fixture();
  const stopId = before.routeStopIds[0]!;
  assert.ok(stopId);
  const snapshot = JSON.stringify(before);
  const proposal = planWalkStopCompletion(before, stopId);
  assert.equal(JSON.stringify(before), snapshot);
  assert.deepEqual(proposal.next.routeCompletedStopIds, [stopId]);
  assert.deepEqual(proposal.next.visitedIds, [stopId]);
  assert.equal(proposal.next.routeStep, 1);
  assert.equal(proposal.finalStep, false);
});

test('failed durable commit cannot report completed stop', async () => {
  const before = fixture();
  const stopId = before.routeStopIds[0]!;
  let attempts = 0;
  await assert.rejects(commitWalkStopCompletion({
    state: before,
    placeId: stopId,
    persist: async () => { attempts++; throw new Error('Injected storage failure'); }
  }), /Injected storage failure/);
  assert.equal(attempts, 1);
  assert.deepEqual(before.routeCompletedStopIds, []);
  assert.deepEqual(before.visitedIds, []);
  assert.equal(before.routeStep, 0);

  let persisted: unknown = null;
  const committed = await commitWalkStopCompletion({
    state: before,
    placeId: stopId,
    persist: async next => { persisted = next; }
  });
  assert.deepEqual(persisted, committed.next);
  assert.equal(committed.next.routeStep, 1);
});

test('stale, repeated and finished walk stop completion are rejected before storage is touched', async () => {
  const initial = fixture();
  const active = initial.routeStopIds[0]!;
  const later = initial.routeStopIds[1]!;
  let writes = 0;
  const persist = async () => { writes++; };
  await assert.rejects(commitWalkStopCompletion({state: initial, placeId: later, persist}), /active unfinished/);
  const completed = planWalkStopCompletion(initial, active).next;
  await assert.rejects(commitWalkStopCompletion({state: completed, placeId: active, persist}), /active unfinished|already completed/);
  await assert.rejects(commitWalkStopCompletion({
    state: {...initial, routeFinished: true},placeId: active,persist
  }), /active unfinished/);
  assert.equal(writes, 0);
});

test('last stop finishes the walk with one immutable progress revision', () => {
  const base = fixture();
  assert.ok(base.routeStopIds.length > 0);
  const last = base.routeStopIds.at(-1)!;
  const before = {...base,
    routeStep:base.routeStopIds.length-1,
    routeCompletedStopIds:base.routeStopIds.slice(0,-1),
    visitedIds:base.routeStopIds.slice(0,-1)
  };
  const result = planWalkStopCompletion(before,last);
  assert.equal(result.finalStep,true);
  assert.equal(result.next.routeFinished,true);
  assert.equal(result.next.routeStep,before.routeStep);
  assert.deepEqual(result.next.routeCompletedStopIds,base.routeStopIds);
  assert.equal(before.routeFinished,false);
});
