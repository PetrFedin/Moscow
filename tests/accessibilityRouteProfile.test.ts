import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateStepFreeRoute,
  validateAccessibilityClaim,
  validateAccessibilityRouteProfile,
  type AccessibilityRouteProfile
} from '../src/travel/accessibilityRouteProfile.ts';

function profile(claims: AccessibilityRouteProfile['claims']): AccessibilityRouteProfile {
  return {
    schemaVersion: 1,
    id: 'route-accessibility-1',
    routeId: 'varvarka-route',
    version: 1,
    requiredSubjectIds: ['segment-a', 'entrance-b'],
    claims
  };
}

function verifiedStepFree(subjectId: string, value: 'available' | 'not-available' = 'available') {
  return {
    id: 'claim:' + subjectId,
    subjectType: subjectId.startsWith('entrance') ? 'entrance' as const : 'segment' as const,
    subjectId,
    feature: 'step-free' as const,
    state: 'verified' as const,
    value,
    evidenceRefs: ['field:' + subjectId],
    authority: 'field-reviewer',
    verifiedAt: '2026-10-01T09:00:00.000Z',
    validUntil: '2026-11-01T09:00:00.000Z'
  };
}

test('verified accessibility cannot exist without evidence and authority', () => {
  assert.throws(
    () => validateAccessibilityClaim({
      id: 'bad',
      subjectType: 'segment',
      subjectId: 'segment-a',
      feature: 'step-free',
      state: 'verified',
      value: 'available',
      verifiedAt: '2026-10-01T09:00:00.000Z'
    }),
    /evidence\/source/
  );

  assert.throws(
    () => validateAccessibilityClaim({
      id: 'bad-authority',
      subjectType: 'segment',
      subjectId: 'segment-a',
      feature: 'step-free',
      state: 'verified',
      value: 'available',
      evidenceRefs: ['field:a'],
      verifiedAt: '2026-10-01T09:00:00.000Z'
    }),
    /requires authority/
  );
});

test('unknown is a valid first-class accessibility state without fabricated evidence', () => {
  assert.doesNotThrow(() => validateAccessibilityClaim({
    id: 'unknown',
    subjectType: 'entrance',
    subjectId: 'entrance-b',
    feature: 'step-free',
    state: 'unknown',
    value: 'unknown'
  }));
});

test('step-free required passes only when all required subjects are verified accessible', () => {
  const decision = evaluateStepFreeRoute({
    profile: profile([
      verifiedStepFree('segment-a'),
      verifiedStepFree('entrance-b')
    ]),
    intent: 'required',
    nowIso: '2026-10-02T09:00:00.000Z'
  });

  assert.equal(decision.status, 'verified-step-free');
  assert.deepEqual(decision.verifiedAccessibleSubjectIds, ['segment-a', 'entrance-b']);
});

test('verified barrier blocks a required step-free route', () => {
  const decision = evaluateStepFreeRoute({
    profile: profile([
      verifiedStepFree('segment-a'),
      verifiedStepFree('entrance-b', 'not-available')
    ]),
    intent: 'required',
    nowIso: '2026-10-02T09:00:00.000Z'
  });

  assert.equal(decision.status, 'verified-barrier');
  assert.deepEqual(decision.verifiedBarrierSubjectIds, ['entrance-b']);
});

test('missing accessibility fact fails closed for required step-free intent', () => {
  const decision = evaluateStepFreeRoute({
    profile: profile([
      verifiedStepFree('segment-a')
    ]),
    intent: 'required',
    nowIso: '2026-10-02T09:00:00.000Z'
  });

  assert.equal(decision.status, 'needs-accessibility-authority');
  assert.deepEqual(decision.unknownSubjectIds, ['entrance-b']);
});

test('expired verified fact is treated as stale at evaluation time', () => {
  const stale = {
    ...verifiedStepFree('segment-a'),
    validUntil: '2026-10-01T08:00:00.000Z'
  };
  const decision = evaluateStepFreeRoute({
    profile: profile([
      stale,
      verifiedStepFree('entrance-b')
    ]),
    intent: 'required',
    nowIso: '2026-10-02T09:00:00.000Z'
  });

  assert.equal(decision.status, 'needs-accessibility-authority');
  assert.deepEqual(decision.staleSubjectIds, ['segment-a']);
});

test('conflicting accessibility evidence cannot be flattened into a verified route', () => {
  const decision = evaluateStepFreeRoute({
    profile: profile([
      {
        id: 'conflict',
        subjectType: 'segment',
        subjectId: 'segment-a',
        feature: 'step-free',
        state: 'conflicting',
        value: 'available',
        evidenceRefs: ['field:a', 'provider:a'],
        authority: 'accessibility-review',
        verifiedAt: '2026-10-01T09:00:00.000Z'
      },
      verifiedStepFree('entrance-b')
    ]),
    intent: 'required',
    nowIso: '2026-10-02T09:00:00.000Z'
  });

  assert.equal(decision.status, 'needs-accessibility-authority');
  assert.deepEqual(decision.conflictingSubjectIds, ['segment-a']);
});

test('preferred step-free intent can remain usable while exposing unknowns', () => {
  const decision = evaluateStepFreeRoute({
    profile: profile([
      verifiedStepFree('segment-a')
    ]),
    intent: 'preferred',
    nowIso: '2026-10-02T09:00:00.000Z'
  });

  assert.equal(decision.status, 'preferred-with-unknowns');
  assert.deepEqual(decision.unknownSubjectIds, ['entrance-b']);
});

test('no accessibility requirement does not manufacture accessibility claims', () => {
  const decision = evaluateStepFreeRoute({
    profile: profile([]),
    intent: 'none',
    nowIso: '2026-10-02T09:00:00.000Z'
  });

  assert.equal(decision.status, 'not-required');
  assert.equal(decision.verifiedAccessibleSubjectIds.length, 0);
});

test('profile validation rejects duplicate required subjects', () => {
  const invalid: AccessibilityRouteProfile = {
    schemaVersion: 1,
    id: 'invalid',
    routeId: 'route',
    version: 1,
    requiredSubjectIds: ['a', 'a'],
    claims: []
  };
  assert.throws(() => validateAccessibilityRouteProfile(invalid), /must be unique/);
});
