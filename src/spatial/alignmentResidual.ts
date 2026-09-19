import type { CalibrationProfile } from './calibration.ts';
import type { FieldDistanceMeters } from './fieldVerification.ts';

export type RomanovWorldPointMeters = [number, number, number];

export type RomanovResidualHitType =
  | 'DepthPoint'
  | 'ExistingPlaneUsingExtent'
  | 'ExistingPlane'
  | 'FeaturePoint'
  | string;

export const ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY = {
  id: 'romanov-ar-world-residual-v1',
  version: 1,
  distanceBucketToleranceFraction: 0.2,
  minimumDistanceBucketToleranceMeters: 1,
  releaseEligibleHitTypes: [
    'DepthPoint',
    'ExistingPlaneUsingExtent',
    'ExistingPlane'
  ] as const
};

export type RomanovAlignmentMeasurementEvidence = {
  authorityId: typeof ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY.id;
  authorityVersion: typeof ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY.version;
  surveyPacketId: string;
  calibrationVersion: number;
  distanceBucketMeters: FieldDistanceMeters;
  actualViewingDistanceMeters: number;
  hitType: RomanovResidualHitType;
  modelWorldPointMeters: RomanovWorldPointMeters;
  observedWorldPointMeters: RomanovWorldPointMeters;
  cameraWorldPointMeters: RomanovWorldPointMeters;
  residualVectorCm: RomanovWorldPointMeters;
  capturedAt: string;
};

export type RomanovMeasuredControlPointResidual = {
  controlPointId: string;
  residualCm: number;
  evidence?: RomanovAlignmentMeasurementEvidence;
};

const degToRad = (value: number) => value * Math.PI / 180;

function rotateX([x, y, z]: RomanovWorldPointMeters, angleDeg: number): RomanovWorldPointMeters {
  const a = degToRad(angleDeg);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

function rotateY([x, y, z]: RomanovWorldPointMeters, angleDeg: number): RomanovWorldPointMeters {
  const a = degToRad(angleDeg);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

function rotateZ([x, y, z]: RomanovWorldPointMeters, angleDeg: number): RomanovWorldPointMeters {
  const a = degToRad(angleDeg);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z];
}

export function transformRomanovModelPointToWorld(
  point: RomanovWorldPointMeters,
  calibration: CalibrationProfile
): RomanovWorldPointMeters {
  const scaled: RomanovWorldPointMeters = [
    point[0] * calibration.scale,
    point[1] * calibration.scale,
    point[2] * calibration.scale
  ];

  // The P0 calibrator exposes Yaw and translation; X/Z rotations remain supported
  // here using the same XYZ Euler convention used by the Viro scene node.
  const rotated = rotateZ(
    rotateY(
      rotateX(scaled, calibration.rotationEulerDeg[0]),
      calibration.rotationEulerDeg[1]
    ),
    calibration.rotationEulerDeg[2]
  );

  return [
    rotated[0] + calibration.translation[0],
    rotated[1] + calibration.translation[1],
    rotated[2] + calibration.translation[2]
  ];
}

export function distanceMeters(
  a: RomanovWorldPointMeters,
  b: RomanovWorldPointMeters
) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function distanceBucketToleranceMeters(bucket: FieldDistanceMeters) {
  return Math.max(
    ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY.minimumDistanceBucketToleranceMeters,
    bucket * ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY.distanceBucketToleranceFraction
  );
}

export function isDistanceBucketConsistent(actualMeters: number, bucket: FieldDistanceMeters) {
  return Number.isFinite(actualMeters)
    && actualMeters > 0
    && Math.abs(actualMeters - bucket) <= distanceBucketToleranceMeters(bucket);
}

export function buildRomanovMeasuredResidual(input: {
  controlPointId: string;
  surveyPacketId: string;
  calibration: CalibrationProfile;
  modelPointMeters: RomanovWorldPointMeters;
  observedWorldPointMeters: RomanovWorldPointMeters;
  cameraWorldPointMeters: RomanovWorldPointMeters;
  distanceBucketMeters: FieldDistanceMeters;
  hitType: RomanovResidualHitType;
  capturedAt?: string;
}): RomanovMeasuredControlPointResidual {
  const modelWorldPointMeters = transformRomanovModelPointToWorld(
    input.modelPointMeters,
    input.calibration
  );
  const observed = input.observedWorldPointMeters;
  const vectorMeters: RomanovWorldPointMeters = [
    observed[0] - modelWorldPointMeters[0],
    observed[1] - modelWorldPointMeters[1],
    observed[2] - modelWorldPointMeters[2]
  ];
  const residualCm = Math.hypot(...vectorMeters) * 100;
  const actualViewingDistanceMeters = distanceMeters(input.cameraWorldPointMeters, observed);

  return {
    controlPointId: input.controlPointId,
    residualCm,
    evidence: {
      authorityId: ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY.id,
      authorityVersion: ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY.version,
      surveyPacketId: input.surveyPacketId,
      calibrationVersion: input.calibration.version,
      distanceBucketMeters: input.distanceBucketMeters,
      actualViewingDistanceMeters,
      hitType: input.hitType,
      modelWorldPointMeters,
      observedWorldPointMeters: observed,
      cameraWorldPointMeters: input.cameraWorldPointMeters,
      residualVectorCm: [
        vectorMeters[0] * 100,
        vectorMeters[1] * 100,
        vectorMeters[2] * 100
      ],
      capturedAt: input.capturedAt ?? new Date().toISOString()
    }
  };
}

export function isReleaseEligibleMeasuredResidual(
  residual: RomanovMeasuredControlPointResidual,
  expected?: {
    calibrationVersion?: number;
    distanceBucketMeters?: FieldDistanceMeters;
    surveyPacketId?: string;
  }
) {
  const evidence = residual.evidence;
  if (!evidence) return false;

  const recomputed = distanceMeters(
    evidence.modelWorldPointMeters,
    evidence.observedWorldPointMeters
  ) * 100;

  if (!Number.isFinite(residual.residualCm) || residual.residualCm < 0) return false;
  if (Math.abs(recomputed - residual.residualCm) > 0.05) return false;
  if (evidence.authorityId !== ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY.id) return false;
  if (evidence.authorityVersion !== ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY.version) return false;
  if (!ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY.releaseEligibleHitTypes.includes(
    evidence.hitType as (typeof ROMANOV_ALIGNMENT_MEASUREMENT_AUTHORITY.releaseEligibleHitTypes)[number]
  )) return false;
  if (!isDistanceBucketConsistent(evidence.actualViewingDistanceMeters, evidence.distanceBucketMeters)) return false;
  if (expected?.calibrationVersion !== undefined && evidence.calibrationVersion !== expected.calibrationVersion) return false;
  if (expected?.distanceBucketMeters !== undefined && evidence.distanceBucketMeters !== expected.distanceBucketMeters) return false;
  if (expected?.surveyPacketId !== undefined && evidence.surveyPacketId !== expected.surveyPacketId) return false;
  return true;
}
