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

export type FieldDistanceMeters = 5 | 10 | 15;
export type FieldPlatform = 'ios' | 'android' | string;
export type ControlPointResidual = RomanovMeasuredControlPointResidual;

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
    id: `romanov-field-${capturedAt}-${input.viewingDistanceMeters}m`,
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

function completeDevicesForSurvey(
  sessions: RomanovFieldSession[],
  surveyPacketId: string
): RomanovDeviceVerification[] {
  const surveySessions = sessions.filter((session) => session.surveyPacketId === surveyPacketId);
  const byDevice = new Map<string, RomanovFieldSession[]>();

  for (const session of surveySessions) {
    const key = normalizedDeviceKey(session);
    const current = byDevice.get(key) ?? [];
    current.push(session);
    byDevice.set(key, current);
  }

  const complete: RomanovDeviceVerification[] = [];
  for (const [deviceKey, deviceSessions] of byDevice) {
    const first = deviceSessions[0];
    if (!first) continue;

    const completeCalibration = deviceSessions.find((candidate) => {
      const placementSessions = deviceSessions.filter((session) =>
        isSameCalibrationPlacement(session.calibration, candidate.calibration)
      );
      return ROMANOV_FIELD_DISTANCES.every((distance) =>
        placementSessions.some((session) =>
          session.viewingDistanceMeters === distance
          && session.passed
          && isFieldSessionEvidenceAuthoritative(session)
        )
      );
    });
    if (!completeCalibration) continue;

    complete.push({
      deviceKey,
      deviceLabel: first.deviceLabel?.trim() || `${first.devicePlatform} ${first.deviceVersion}`,
      platform: first.devicePlatform,
      distancesPassed: [...ROMANOV_FIELD_DISTANCES],
      completeDistanceMatrix: true
    });
  }
  return complete;
}

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

  const currentMetricSessions = sessions.filter((session) => isCurrentRomanovMetricBinding(session.metricBinding));
  const staleMetricSessions = sessions.length - currentMetricSessions.length;
  const surveySessions = normalized.surveyPacketId
    ? currentMetricSessions.filter((session) => session.surveyPacketId === normalized.surveyPacketId)
    : currentMetricSessions;
  const calibrationSessions = normalized.localCalibrationVersion === undefined
    ? surveySessions
    : surveySessions.filter((session) => session.calibration.version === normalized.localCalibrationVersion);
  const staleCalibrationSessions = normalized.localCalibrationVersion === undefined
    ? 0
    : surveySessions.length - calibrationSessions.length;
  const evidenceSessions = calibrationSessions.filter(isFieldSessionEvidenceAuthoritative);
  const unmeasuredSessions = calibrationSessions.length - evidenceSessions.length;
  const passedSessions = evidenceSessions.filter((session) => session.passed);

  const surveyIds = normalized.surveyPacketId
    ? [normalized.surveyPacketId]
    : [...new Set(passedSessions.map((session) => session.surveyPacketId).filter(Boolean))] as string[];

  let selectedSurveyPacketId = normalized.surveyPacketId;
  let completeDevices: RomanovDeviceVerification[] = [];
  for (const surveyPacketId of surveyIds) {
    const candidate = completeDevicesForSurvey(passedSessions, surveyPacketId);
    if (!selectedSurveyPacketId || candidate.length > completeDevices.length) {
      selectedSurveyPacketId = surveyPacketId;
      completeDevices = candidate;
    } else if (surveyPacketId === selectedSurveyPacketId) {
      completeDevices = candidate;
    }
  }

  const iosCompleteDevices = completeDevices.filter((device) => device.platform === 'ios').length;
  const androidCompleteDevices = completeDevices.filter((device) => device.platform === 'android').length;
  const crossPlatformReady = iosCompleteDevices >= ROMANOV_REQUIRED_IOS_DEVICES
    && androidCompleteDevices >= ROMANOV_REQUIRED_ANDROID_DEVICES;

  return {
    surveyPacketId: selectedSurveyPacketId,
    sessions: sessions.length,
    passedSessions: passedSessions.length,
    currentMetricSessions: currentMetricSessions.length,
    staleMetricSessions,
    unmeasuredSessions,
    staleCalibrationSessions,
    completeDevices,
    iosCompleteDevices,
    androidCompleteDevices,
    crossPlatformReady,
    eligibleForPersistentAnchor: crossPlatformReady
  };
}

export function sessionToTsv(session: RomanovFieldSession) {
  const header = [
    'session_id','captured_at','metric_authority_id','metric_authority_version','model_pack_version',
    'survey_packet_id','era','distance_bucket_m','device_platform','device_version','device_label','app_build',
    'control_point','residual_cm','measurement_authority_id','measurement_authority_version','hit_type',
    'actual_viewing_distance_m','model_world_x','model_world_y','model_world_z',
    'observed_world_x','observed_world_y','observed_world_z',
    'camera_world_x','camera_world_y','camera_world_z','mean_cm','max_cm','passed'
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
      session.meanResidualCm.toFixed(1), session.maxResidualCm.toFixed(1), session.passed ? '1' : '0'
    ];
  });
  return [header, ...rows].map((row) => row.join('\t')).join('\n');
}


export function validateFieldSessionIntegrity(session: RomanovFieldSession) {
  if (!isCurrentRomanovMetricBinding(session.metricBinding)) return false;
  if (!isFieldSessionEvidenceAuthoritative(session)) return false;
  const recomputed = summarizeResiduals(session.observations);
  if (Math.abs(recomputed.meanResidualCm - session.meanResidualCm) > 0.05) return false;
  if (Math.abs(recomputed.maxResidualCm - session.maxResidualCm) > 0.05) return false;
  const expectedPassed = recomputed.passed
    && (session.measurementEligiblePoints ?? 0) >= ROMANOV_FIELD_REQUIRED_POINTS;
  return session.passed === expectedPassed;
}
