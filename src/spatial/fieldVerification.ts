import {
  isSameCalibrationPlacement,
  type CalibrationProfile
} from './calibration.ts';
import {
  isReleaseEligibleMeasuredResidual,
  type RomanovMeasuredControlPointResidual
} from './alignmentResidual.ts';
import type { RomanovEra } from './romanov-hotspots.ts';
import { romanovControlPoints } from './romanovControlPoints.ts';
import {
  currentRomanovMetricBinding,
  isCurrentRomanovMetricBinding,
  type RomanovMetricBinding
} from './romanovMetricAuthority.ts';
import {
  summarizeHeritageFieldMatrix,
  type HeritageFieldMatrixPolicy
} from './heritageFieldMatrix.ts';

export type FieldDistanceMeters = 5 | 10 | 15;
export type FieldPlatform = 'ios' | 'android' | string;
export type ControlPointResidual = RomanovMeasuredControlPointResidual;

export type RomanovFieldLighting =
  | 'daylight'
  | 'overcast-daylight'
  | 'dusk'
  | 'night'
  | 'artificial';

export type RomanovFieldConditions = {
  lighting: RomanovFieldLighting;
  trackingLossObserved: boolean;
  interruptionObserved: boolean;
  notes: string;
};

export function isRomanovFieldConditionsRecorded(
  value: RomanovFieldConditions | undefined
): value is RomanovFieldConditions {
  if (!value) return false;
  const lightingValid = value.lighting === 'daylight'
    || value.lighting === 'overcast-daylight'
    || value.lighting === 'dusk'
    || value.lighting === 'night'
    || value.lighting === 'artificial';
  return lightingValid
    && typeof value.trackingLossObserved === 'boolean'
    && typeof value.interruptionObserved === 'boolean'
    && typeof value.notes === 'string'
    && value.notes.trim().length > 0;
}

export type RomanovFieldSession = {
  id: string;
  capturedAt: string;
  era: RomanovEra;
  viewingDistanceMeters: FieldDistanceMeters;
  calibration: CalibrationProfile;
  devicePlatform: FieldPlatform;
  deviceVersion: string;
  deviceLabel?: string;
  appBuild?: string;
  metricBinding?: RomanovMetricBinding;
  surveyPacketId?: string;
  fieldConditions?: RomanovFieldConditions;
  observations: ControlPointResidual[];
  measurementEligiblePoints?: number;
  meanResidualCm: number;
  maxResidualCm: number;
  passed: boolean;
};

export type RomanovDeviceVerification = {
  deviceKey: string;
  deviceLabel: string;
  platform: FieldPlatform;
  calibrationVersion: number;
  sessionIds: string[];
  distancesPassed: FieldDistanceMeters[];
  completeDistanceMatrix: boolean;
};

export type RomanovFieldMatrixSummary = {
  surveyPacketId?: string;
  sessions: number;
  passedSessions: number;
  currentMetricSessions: number;
  staleMetricSessions: number;
  unmeasuredSessions: number;
  staleCalibrationSessions: number;
  completeDevices: RomanovDeviceVerification[];
  iosCompleteDevices: number;
  androidCompleteDevices: number;
  crossPlatformReady: boolean;
  releaseSessionCount: number;
  fieldConditionsComplete: boolean;
  daylightEvidence: boolean;
  eligibleForPersistentAnchor: boolean;
};

export const ROMANOV_FIELD_DISTANCES: FieldDistanceMeters[] = [5, 10, 15];
export const ROMANOV_FIELD_REQUIRED_POINTS = 5;
export const ROMANOV_REQUIRED_IOS_DEVICES = 2;
export const ROMANOV_REQUIRED_ANDROID_DEVICES = 2;
export const ROMANOV_FIELD_MEAN_TARGET_CM = 35;
export const ROMANOV_FIELD_MAX_TARGET_CM = 60;

export function summarizeResiduals(values: ControlPointResidual[]) {
  const finite = values.filter((item) => Number.isFinite(item.residualCm) && item.residualCm >= 0);
  if (finite.length === 0) return { meanResidualCm: 0, maxResidualCm: 0, passed: false };

  const meanResidualCm = finite.reduce((sum, item) => sum + item.residualCm, 0) / finite.length;
  const maxResidualCm = Math.max(...finite.map((item) => item.residualCm));
  const passed = finite.length >= ROMANOV_FIELD_REQUIRED_POINTS
    && meanResidualCm <= ROMANOV_FIELD_MEAN_TARGET_CM
    && maxResidualCm <= ROMANOV_FIELD_MAX_TARGET_CM;

  return { meanResidualCm, maxResidualCm, passed };
}

function eligibleObservations(
  observations: ControlPointResidual[],
  calibrationVersion: number,
  viewingDistanceMeters: FieldDistanceMeters,
  surveyPacketId?: string
) {
  return observations.filter((observation) => isReleaseEligibleMeasuredResidual(observation, {
    calibrationVersion,
    distanceBucketMeters: viewingDistanceMeters,
    surveyPacketId
  }));
}

function sessionIdDevicePart(input: Pick<RomanovFieldSession, 'devicePlatform' | 'deviceVersion' | 'deviceLabel'>) {
  const raw = `${input.devicePlatform}-${input.deviceLabel?.trim() || input.deviceVersion}`.toLowerCase();
  const normalized = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'unknown-device';
}

export function createFieldSession(input: Omit<RomanovFieldSession, 'id' | 'capturedAt' | 'metricBinding' | 'measurementEligiblePoints' | 'meanResidualCm' | 'maxResidualCm' | 'passed'> & { metricBinding?: RomanovMetricBinding }): RomanovFieldSession {
  const summary = summarizeResiduals(input.observations);
  const surveyIds = [...new Set(input.observations.map((item) => item.evidence?.surveyPacketId).filter(Boolean))] as string[];
  const surveyPacketId = input.surveyPacketId ?? (surveyIds.length === 1 ? surveyIds[0] : undefined);
  const eligible = eligibleObservations(
    input.observations,
    input.calibration.version,
    input.viewingDistanceMeters,
    surveyPacketId
  );
  const capturedAt = new Date().toISOString();

  return {
    ...input,
    id: `romanov-field-${capturedAt}-${sessionIdDevicePart(input)}-${input.viewingDistanceMeters}m`,
    capturedAt,
    metricBinding: input.metricBinding ?? currentRomanovMetricBinding,
    surveyPacketId,
    measurementEligiblePoints: eligible.length,
    meanResidualCm: summary.meanResidualCm,
    maxResidualCm: summary.maxResidualCm,
    passed: summary.passed
      && eligible.length >= ROMANOV_FIELD_REQUIRED_POINTS
      && surveyIds.length === 1
  };
}

export function isFieldSessionEvidenceAuthoritative(session: RomanovFieldSession) {
  if (!session.surveyPacketId) return false;
  if (session.observations.length !== ROMANOV_FIELD_REQUIRED_POINTS) return false;

  const expectedIds = new Set(romanovControlPoints.map((point) => point.id));
  const observedIds = session.observations.map((item) => item.controlPointId);
  if (new Set(observedIds).size !== ROMANOV_FIELD_REQUIRED_POINTS) return false;
  if (observedIds.some((id) => !expectedIds.has(id))) return false;
  if (session.observations.some((item) => item.evidence?.surveyPacketId !== session.surveyPacketId)) return false;

  return eligibleObservations(
    session.observations,
    session.calibration.version,
    session.viewingDistanceMeters,
    session.surveyPacketId
  ).length === ROMANOV_FIELD_REQUIRED_POINTS;
}

function normalizedDeviceKey(session: RomanovFieldSession) {
  const label = session.deviceLabel?.trim();
  return `${session.devicePlatform}:${label || session.deviceVersion}`.toLowerCase();
}

export type RomanovFieldMatrixOptions = {
  surveyPacketId?: string;
  localCalibrationVersion?: number;
};

const romanovFieldMatrixPolicy: HeritageFieldMatrixPolicy<RomanovFieldSession> = {
  distances: [...ROMANOV_FIELD_DISTANCES],
  requiredPlatforms: {
    ios: ROMANOV_REQUIRED_IOS_DEVICES,
    android: ROMANOV_REQUIRED_ANDROID_DEVICES
  },
  getSessionId: (session) => session.id,
  getSurveyPacketId: (session) => session.surveyPacketId,
  getDeviceKey: normalizedDeviceKey,
  getDeviceLabel: (session) =>
    session.deviceLabel?.trim() || `${session.devicePlatform} ${session.deviceVersion}`,
  getPlatform: (session) => session.devicePlatform,
  getDistance: (session) => session.viewingDistanceMeters,
  getPlacementVersion: (session) => session.calibration.version,
  isSamePlacement: (left, right) =>
    isSameCalibrationPlacement(left.calibration, right.calibration),
  isCurrentAuthority: (session) =>
    isCurrentRomanovMetricBinding(session.metricBinding),
  isEvidenceAuthoritative: isFieldSessionEvidenceAuthoritative,
  isPassed: (session) => session.passed,
  hasFieldConditions: (session) =>
    isRomanovFieldConditionsRecorded(session.fieldConditions),
  isDaylightEvidence: (session) =>
    session.fieldConditions?.lighting === 'daylight'
    || session.fieldConditions?.lighting === 'overcast-daylight'
};

export function hasCompleteMeasuredPlacement(input: {
  sessions: RomanovFieldSession[];
  surveyPacketId: string;
  calibration: CalibrationProfile;
  deviceLabel?: string;
  devicePlatform?: FieldPlatform;
}) {
  const expectedLabel = input.deviceLabel?.trim().toLowerCase();
  const placementSessions = input.sessions.filter((session) =>
    session.surveyPacketId === input.surveyPacketId
    && isCurrentRomanovMetricBinding(session.metricBinding)
    && isSameCalibrationPlacement(session.calibration, input.calibration)
    && isFieldSessionEvidenceAuthoritative(session)
    && session.passed
    && (!expectedLabel || session.deviceLabel?.trim().toLowerCase() === expectedLabel)
    && (!input.devicePlatform || session.devicePlatform === input.devicePlatform)
  );

  return ROMANOV_FIELD_DISTANCES.every((distance) =>
    placementSessions.some((session) => session.viewingDistanceMeters === distance)
  );
}

export function summarizeFieldMatrix(
  sessions: RomanovFieldSession[],
  options: RomanovFieldMatrixOptions | number = {}
): RomanovFieldMatrixSummary {
  const normalized: RomanovFieldMatrixOptions = typeof options === 'number'
    ? { localCalibrationVersion: options }
    : options;

  const summary = summarizeHeritageFieldMatrix(
    sessions,
    romanovFieldMatrixPolicy,
    {
      surveyPacketId: normalized.surveyPacketId,
      localPlacementVersion: normalized.localCalibrationVersion
    }
  );

  return {
    surveyPacketId: summary.surveyPacketId,
    sessions: summary.sessions,
    passedSessions: summary.passedSessions,
    currentMetricSessions: summary.currentAuthoritySessions,
    staleMetricSessions: summary.staleAuthoritySessions,
    unmeasuredSessions: summary.unmeasuredSessions,
    staleCalibrationSessions: summary.stalePlacementSessions,
    completeDevices: summary.completeDevices.map((device) => ({
      deviceKey: device.deviceKey,
      deviceLabel: device.deviceLabel,
      platform: device.platform,
      calibrationVersion: device.placementVersion,
      sessionIds: [...device.sessionIds],
      distancesPassed: device.distancesPassed as FieldDistanceMeters[],
      completeDistanceMatrix: device.completeDistanceMatrix
    })),
    iosCompleteDevices: summary.platformCompleteDevices.ios ?? 0,
    androidCompleteDevices: summary.platformCompleteDevices.android ?? 0,
    crossPlatformReady: summary.crossPlatformReady,
    releaseSessionCount: summary.releaseSessionCount,
    fieldConditionsComplete: summary.fieldConditionsComplete,
    daylightEvidence: summary.daylightEvidence,
    eligibleForPersistentAnchor: summary.eligibleForPersistentAnchor
  };
}

export function sessionToTsv(session: RomanovFieldSession) {
  const header = [
    'session_id','captured_at','metric_authority_id','metric_authority_version','model_pack_version',
    'survey_packet_id','era','distance_bucket_m','device_platform','device_version','device_label','app_build',
    'control_point','residual_cm','measurement_authority_id','measurement_authority_version','hit_type',
    'actual_viewing_distance_m','model_world_x','model_world_y','model_world_z',
    'observed_world_x','observed_world_y','observed_world_z',
    'camera_world_x','camera_world_y','camera_world_z',
    'lighting','tracking_loss_observed','interruption_observed','field_notes',
    'mean_cm','max_cm','passed'
  ];
  const rows = session.observations.map((item) => {
    const e = item.evidence;
    return [
      session.id, session.capturedAt,
      session.metricBinding?.metricAuthorityId ?? '',
      session.metricBinding?.metricAuthorityVersion?.toString() ?? '',
      session.metricBinding?.modelPackVersion ?? '',
      session.surveyPacketId ?? '',
      session.era, String(session.viewingDistanceMeters),
      session.devicePlatform, session.deviceVersion, session.deviceLabel ?? '', session.appBuild ?? '',
      item.controlPointId, item.residualCm.toFixed(1),
      e?.authorityId ?? '', e?.authorityVersion?.toString() ?? '', e?.hitType ?? '',
      e?.actualViewingDistanceMeters?.toFixed(3) ?? '',
      ...(e?.modelWorldPointMeters?.map((v) => v.toFixed(4)) ?? ['', '', '']),
      ...(e?.observedWorldPointMeters?.map((v) => v.toFixed(4)) ?? ['', '', '']),
      ...(e?.cameraWorldPointMeters?.map((v) => v.toFixed(4)) ?? ['', '', '']),
      session.fieldConditions?.lighting ?? '',
      session.fieldConditions?.trackingLossObserved ? '1' : '0',
      session.fieldConditions?.interruptionObserved ? '1' : '0',
      session.fieldConditions?.notes.replace(/[\t\r\n]+/g, ' ') ?? '',
      session.meanResidualCm.toFixed(1), session.maxResidualCm.toFixed(1), session.passed ? '1' : '0'
    ];
  });
  return [header, ...rows].map((row) => row.join('\t')).join('\n');
}


export function validateFieldSessionIntegrity(session: RomanovFieldSession) {
  if (!isCurrentRomanovMetricBinding(session.metricBinding)) return false;
  if (session.fieldConditions !== undefined && !isRomanovFieldConditionsRecorded(session.fieldConditions)) return false;
  if (!isFieldSessionEvidenceAuthoritative(session)) return false;
  const recomputed = summarizeResiduals(session.observations);
  if (Math.abs(recomputed.meanResidualCm - session.meanResidualCm) > 0.05) return false;
  if (Math.abs(recomputed.maxResidualCm - session.maxResidualCm) > 0.05) return false;
  const expectedPassed = recomputed.passed
    && (session.measurementEligiblePoints ?? 0) >= ROMANOV_FIELD_REQUIRED_POINTS;
  return session.passed === expectedPassed;
}
