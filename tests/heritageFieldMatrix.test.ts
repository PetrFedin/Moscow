import assert from 'node:assert/strict';
import test from 'node:test';

import {
  summarizeHeritageFieldMatrix,
  type HeritageFieldMatrixPolicy
} from '../src/spatial/heritageFieldMatrix.ts';

type Session = {
  id: string;
  surveyId: string;
  device: string;
  platform: 'ios' | 'android';
  distance: 5 | 10 | 15;
  placement: string;
  placementVersion: number;
  currentAuthority: boolean;
  authoritative: boolean;
  passed: boolean;
  conditions: boolean;
  daylight: boolean;
};

const policy: HeritageFieldMatrixPolicy<Session> = {
  distances: [5, 10, 15],
  requiredPlatforms: { ios: 2, android: 2 },
  getSessionId: (session) => session.id,
  getSurveyPacketId: (session) => session.surveyId,
  getDeviceKey: (session) => `${session.platform}:${session.device}`,
  getDeviceLabel: (session) => session.device,
  getPlatform: (session) => session.platform,
  getDistance: (session) => session.distance,
  getPlacementVersion: (session) => session.placementVersion,
  isSamePlacement: (left, right) => left.placement === right.placement,
  isCurrentAuthority: (session) => session.currentAuthority,
  isEvidenceAuthoritative: (session) => session.authoritative,
  isPassed: (session) => session.passed,
  hasFieldConditions: (session) => session.conditions,
  isDaylightEvidence: (session) => session.daylight
};

function matrix(overrides: Partial<Session> = {}) {
  const devices = [
    ['ios-a', 'ios'],
    ['ios-b', 'ios'],
    ['android-a', 'android'],
    ['android-b', 'android']
  ] as const;

  return devices.flatMap(([device, platform], deviceIndex) =>
    ([5, 10, 15] as const).map((distance) => ({
      id: `${device}-${distance}`,
      surveyId: 'heritage-object-survey-v1',
      device,
      platform,
      distance,
      placement: `${device}-placement`,
      placementVersion: deviceIndex + 1,
      currentAuthority: true,
      authoritative: true,
      passed: true,
      conditions: true,
      daylight: deviceIndex === 0 && distance === 5,
      ...overrides
    }))
  );
}

test('generic heritage field matrix proves a second object without Romanov-specific types', () => {
  const summary = summarizeHeritageFieldMatrix(matrix(), policy, {
    surveyPacketId: 'heritage-object-survey-v1'
  });

  assert.equal(summary.crossPlatformReady, true);
  assert.equal(summary.releaseSessionCount, 12);
  assert.equal(summary.fieldConditionsComplete, true);
  assert.equal(summary.daylightEvidence, true);
  assert.equal(summary.eligibleForPersistentAnchor, true);
  assert.equal(summary.platformCompleteDevices.ios, 2);
  assert.equal(summary.platformCompleteDevices.android, 2);
  assert.equal(summary.completeDevices.length, 4);
});

test('generic kernel rejects mixed placements on one physical device', () => {
  const sessions = matrix();
  const target = sessions.find(
    (session) => session.device === 'ios-a' && session.distance === 10
  );
  assert.ok(target);
  target.placement = 'different-placement';

  const summary = summarizeHeritageFieldMatrix(sessions, policy, {
    surveyPacketId: 'heritage-object-survey-v1'
  });

  assert.equal(summary.platformCompleteDevices.ios, 1);
  assert.equal(summary.crossPlatformReady, false);
  assert.equal(summary.eligibleForPersistentAnchor, false);
});

test('generic kernel requires condition evidence for the exact release sessions', () => {
  const sessions = matrix();
  sessions[0]!.conditions = false;

  const summary = summarizeHeritageFieldMatrix(sessions, policy, {
    surveyPacketId: 'heritage-object-survey-v1'
  });

  assert.equal(summary.crossPlatformReady, true);
  assert.equal(summary.fieldConditionsComplete, false);
  assert.equal(summary.eligibleForPersistentAnchor, false);
});

test('generic kernel requires daylight evidence without inventing it', () => {
  const sessions = matrix({ daylight: false });

  const summary = summarizeHeritageFieldMatrix(sessions, policy, {
    surveyPacketId: 'heritage-object-survey-v1'
  });

  assert.equal(summary.crossPlatformReady, true);
  assert.equal(summary.fieldConditionsComplete, true);
  assert.equal(summary.daylightEvidence, false);
  assert.equal(summary.eligibleForPersistentAnchor, false);
});

test('stale authority sessions do not contribute to a complete matrix', () => {
  const sessions = matrix();
  for (const session of sessions) {
    if (session.device === 'android-b') session.currentAuthority = false;
  }

  const summary = summarizeHeritageFieldMatrix(sessions, policy, {
    surveyPacketId: 'heritage-object-survey-v1'
  });

  assert.equal(summary.staleAuthoritySessions, 3);
  assert.equal(summary.platformCompleteDevices.android, 1);
  assert.equal(summary.crossPlatformReady, false);
});
