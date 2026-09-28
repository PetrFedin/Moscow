import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRomanovMeasuredResidual,
  transformRomanovModelPointToWorld
} from '../src/spatial/alignmentResidual.ts';
import {
  defaultRomanovCalibration,
  type CalibrationProfile
} from '../src/spatial/calibration.ts';
import {
  serializeFieldCampaignPackage,
  serializeFieldSessionBundle,
  type RomanovFieldCampaignPackage,
  type RomanovFieldSessionBundle
} from '../src/spatial/fieldCampaign.ts';
import {
  createFieldSession,
  type FieldDistanceMeters,
  type RomanovFieldSession
} from '../src/spatial/fieldVerification.ts';
import {
  createPersistentAnchorRecord,
  markAnchorHostLocalized,
  markAnchorRecoveryResolved,
  markAnchorResolved,
  markAnchorVerified,
  serializePersistentAnchorPackage,
  type RomanovPersistentAnchorPackage
} from '../src/spatial/persistentAnchor.ts';
import { modelWorldToAnchorFrame } from '../src/spatial/persistentAnchorFrame.ts';
import {
  buildRomanovP0EvidencePackage,
  parseRomanovP0EvidencePackage,
  serializeRomanovP0EvidencePackage
} from '../src/spatial/romanovP0EvidencePackage.ts';
import {
  parseRomanovP0EvidenceManifest,
  validateRomanovP0EvidenceManifest
} from '../src/spatial/romanovP0EvidenceManifest.ts';
import { romanovControlPoints } from '../src/spatial/romanovControlPoints.ts';
import { verifyCalibration } from '../src/spatial/romanovReleaseGate.ts';
import {
  createEmptyRomanovSurveyPacket,
  type RomanovSurveyPacket
} from '../src/spatial/romanovSurvey.ts';

function survey(): RomanovSurveyPacket {
  const value = createEmptyRomanovSurveyPacket();
  value.points = romanovControlPoints.map((point, index) => ({
    controlPointId: point.id,
    modelPointMeters: [index * 0.1, 0, 0] as [number, number, number],
    geodetic: {
      latitude: 55.75193 + index * 0.000001,
      longitude: 37.62845 + index * 0.000001,
      altitudeMeters: 150
    },
    method: 'total-station' as const,
    horizontalAccuracyCm: 2,
    verticalAccuracyCm: 3,
    measuredAt: '2026-09-28T08:00:00.000Z',
    measuredBy: 'survey-authority',
    evidenceRef: `evidence/romanov/control-point-${index + 1}.jpg`,
    status: 'verified' as const
  }));
  value.approvedAt = '2026-09-28T08:30:00.000Z';
  value.approvedBy = 'survey-lead';
  return value;
}

function calibration(
  version: number,
  anchorId: string,
  offset: number
): CalibrationProfile {
  return {
    ...defaultRomanovCalibration,
    version,
    sessionAnchorId: anchorId,
    translation: [offset, offset * 0.1, -4 - offset] as [number, number, number],
    rotationEulerDeg: [0, offset, 0] as [number, number, number]
  };
}

function session(
  surveyPacketId: string,
  distance: FieldDistanceMeters,
  deviceLabel: string,
  platform: string,
  cal: CalibrationProfile,
  appBuild = 'field-2026.09.28.1'
): RomanovFieldSession {
  const observations = romanovControlPoints.map((point, index) => {
    const modelPoint: [number, number, number] = [index * 0.1, 0, 0];
    const expected = transformRomanovModelPointToWorld(modelPoint, cal);
    const observed: [number, number, number] = [
      expected[0] + 0.1,
      expected[1],
      expected[2]
    ];
    return buildRomanovMeasuredResidual({
      controlPointId: point.id,
      surveyPacketId,
      calibration: cal,
      modelPointMeters: modelPoint,
      observedWorldPointMeters: observed,
      cameraWorldPointMeters: [
        observed[0],
        observed[1],
        observed[2] + distance
      ],
      distanceBucketMeters: distance,
      hitType: 'ExistingPlane',
      capturedAt: '2026-09-28T09:00:00.000Z'
    });
  });

  return createFieldSession({
    era: '1857',
    viewingDistanceMeters: distance,
    calibration: cal,
    devicePlatform: platform,
    deviceVersion: `${platform}-test-os`,
    deviceLabel,
    appBuild,
    surveyPacketId,
    fieldConditions: {
      lighting: 'daylight',
      trackingLossObserved: false,
      interruptionObserved: false,
      notes: 'Daylight field session; tracking stable; no interruption observed.'
    },
    observations
  });
}

function proofFixture() {
  const measuredSurvey = survey();
  const hostCalibration = calibration(11, 'ios-authority-anchor', 0.7);
  const devices = [
    { label: 'iPhone 16 Pro #1', platform: 'ios', cal: hostCalibration },
    { label: 'iPhone 16 Pro #2', platform: 'ios', cal: calibration(5, 'ios-b-anchor', 2.2) },
    { label: 'Pixel Pro #1', platform: 'android', cal: calibration(3, 'android-a-anchor', -1.3) },
    { label: 'Pixel Pro #2', platform: 'android', cal: calibration(8, 'android-b-anchor', 5.1) }
  ];

  const sessions = devices.flatMap((device) =>
    ([5, 10, 15] as FieldDistanceMeters[]).map((distance) =>
      session(
        measuredSurvey.id,
        distance,
        device.label,
        device.platform,
        device.cal
      )
    )
  );

  const verifiedCalibration = verifyCalibration({
    calibration: hostCalibration,
    survey: measuredSurvey,
    sessions,
    localAnchorId: 'ios-authority-anchor',
    deviceLabel: 'iPhone 16 Pro #1',
    devicePlatform: 'ios'
  });

  const hostPose = {
    position: [0.25, 0.05, -2.5] as [number, number, number],
    rotationEulerDeg: [0, 8, 0] as [number, number, number]
  };
  let anchor = createPersistentAnchorRecord({
    provider: 'reactvision',
    providerAnchorId: 'cloud-anchor-final-proof',
    calibration: verifiedCalibration,
    hostSessionAnchorId: 'ios-authority-anchor',
    hostAnchorPose: hostPose,
    anchorFrameModelTransform: modelWorldToAnchorFrame(
      verifiedCalibration,
      hostPose
    ),
    hostedByDeviceLabel: 'iPhone 16 Pro #1'
  });
  anchor = markAnchorHostLocalized(anchor, {
    continuityResidualCm: 6,
    continuityRotationDeg: 0.4
  });
  anchor = markAnchorResolved(anchor, {
    resolvedByDeviceLabel: 'Pixel Pro #1',
    resolveSessionId: 'resolve-runtime-before-restart'
  });
  anchor = markAnchorVerified(anchor, {
    verifiedByDeviceLabel: 'Pixel Pro #1'
  });
  anchor = markAnchorRecoveryResolved(anchor, {
    recoveredByDeviceLabel: 'Pixel Pro #1',
    recoverySessionId: 'resolve-runtime-after-restart',
    trigger: 'app-restart'
  });

  const campaign = JSON.parse(
    serializeFieldCampaignPackage(measuredSurvey)
  ) as RomanovFieldCampaignPackage;

  const sessionBundles = devices.map((device) =>
    JSON.parse(
      serializeFieldSessionBundle(
        sessions.filter((item) => item.deviceLabel === device.label)
      )
    ) as RomanovFieldSessionBundle
  );

  const anchorProof = JSON.parse(
    serializePersistentAnchorPackage(anchor)
  ) as RomanovPersistentAnchorPackage;

  return { campaign, sessionBundles, anchorProof };
}

test('complete real-shaped P0 evidence consolidates into one release-ready package', () => {
  const fixture = proofFixture();
  const pkg = buildRomanovP0EvidencePackage(fixture);

  assert.equal(pkg.releaseReady, true);
  assert.equal(pkg.releaseGate.state, 'field-verified-spatial-scene');
  assert.equal(pkg.releaseSessionIds.length, 12);
  assert.equal(pkg.deviceInventory.length, 4);
  assert.equal(pkg.appBuild, 'field-2026.09.28.1');
  assert.deepEqual(pkg.packageBlockers, []);

  const serialized = serializeRomanovP0EvidencePackage(pkg);
  const parsed = parseRomanovP0EvidencePackage(serialized);
  assert.equal(parsed.releaseReady, true);
  assert.deepEqual(parsed.releaseSessionIds, pkg.releaseSessionIds);
});

test('mixed release build ids block the consolidated proof', () => {
  const fixture = proofFixture();
  fixture.sessionBundles[3] = {
    ...fixture.sessionBundles[3]!,
    sessions: fixture.sessionBundles[3]!.sessions.map((item) => ({
      ...item,
      appBuild: 'different-field-build'
    }))
  };

  const pkg = buildRomanovP0EvidencePackage(fixture);
  assert.equal(pkg.releaseReady, false);
  assert.ok(pkg.packageBlockers.includes('release-build-id-mismatch'));
});

test('duplicate physical device bundle is rejected by package authority', () => {
  const fixture = proofFixture();
  fixture.sessionBundles[3] = structuredClone(fixture.sessionBundles[2]!);

  const pkg = buildRomanovP0EvidencePackage(fixture);
  assert.equal(pkg.releaseReady, false);
  assert.ok(pkg.packageBlockers.includes('duplicate-device-bundle'));
  assert.ok(pkg.packageBlockers.includes('duplicate-field-session-id'));
});

test('verified anchor without restart recovery cannot become final P0 evidence', () => {
  const fixture = proofFixture();
  const anchor = structuredClone(fixture.anchorProof.anchor);
  delete anchor.recoveryResolvedAt;
  delete anchor.recoveryByDeviceLabel;
  delete anchor.recoverySessionId;
  delete anchor.recoveryTrigger;
  fixture.anchorProof.anchor = anchor;

  const pkg = buildRomanovP0EvidencePackage(fixture);
  assert.equal(pkg.releaseReady, false);
  assert.ok(
    pkg.releaseGate.blockers.includes('restart-recovery-resolve-not-verified')
  );
});

test('manifest requires four distinct safe JSON bundle paths', () => {
  const valid = {
    kind: 'romanov-p0-evidence-manifest',
    version: 1,
    campaignPath: 'evidence/romanov/campaign.json',
    sessionBundlePaths: [
      'evidence/romanov/ios-1.json',
      'evidence/romanov/ios-2.json',
      'evidence/romanov/android-1.json',
      'evidence/romanov/android-2.json'
    ],
    anchorProofPath: 'evidence/romanov/final-anchor.json'
  } as const;

  assert.equal(validateRomanovP0EvidenceManifest(valid).valid, true);
  assert.deepEqual(
    parseRomanovP0EvidenceManifest(JSON.stringify(valid)),
    valid
  );

  const traversal = structuredClone(valid);
  traversal.campaignPath = '../campaign.json';
  assert.equal(validateRomanovP0EvidenceManifest(traversal).valid, false);

  const tooFew = structuredClone(valid);
  tooFew.sessionBundlePaths = tooFew.sessionBundlePaths.slice(0, 3);
  assert.equal(validateRomanovP0EvidenceManifest(tooFew).valid, false);
});
