import type { CalibrationProfile } from './calibration.ts';
import type { RomanovEra } from './romanov-hotspots.ts';
import {
  currentRomanovMetricBinding,
  isCurrentRomanovMetricBinding,
  type RomanovMetricBinding
} from './romanovMetricAuthority.ts';

export type FieldDistanceMeters = 5 | 10 | 15;
export type FieldPlatform = 'ios' | 'android' | string;

export type ControlPointResidual = {
  controlPointId: string;
  residualCm: number;
};

export type RomanovFieldSession = {
  id: string;
  capturedAt: string;
  era: RomanovEra;
  viewingDistanceMeters: FieldDistanceMeters;
  calibration: CalibrationProfile;
  devicePlatform: FieldPlatform;
  deviceVersion: string;
  /** Human-readable physical device label, e.g. "iPhone 16 Pro #1" or "Pixel 10 Pro #1". */
  deviceLabel?: string;
  appBuild?: string;
  metricBinding?: RomanovMetricBinding;
  observations: ControlPointResidual[];
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
  sessions: number;
  passedSessions: number;
  currentMetricSessions: number;
  staleMetricSessions: number;
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

// Pilot acceptance target. It is an internal MVP quality gate, not a claim about
// ARKit/ARCore accuracy in all conditions.
export const ROMANOV_FIELD_MEAN_TARGET_CM = 35;
export const ROMANOV_FIELD_MAX_TARGET_CM = 60;

export function summarizeResiduals(values: ControlPointResidual[]) {
  const finite = values.filter((item) => Number.isFinite(item.residualCm) && item.residualCm >= 0);
  if (finite.length === 0) {
    return { meanResidualCm: 0, maxResidualCm: 0, passed: false };
  }

  const meanResidualCm = finite.reduce((sum, item) => sum + item.residualCm, 0) / finite.length;
  const maxResidualCm = Math.max(...finite.map((item) => item.residualCm));
  const passed = finite.length >= ROMANOV_FIELD_REQUIRED_POINTS
    && meanResidualCm <= ROMANOV_FIELD_MEAN_TARGET_CM
    && maxResidualCm <= ROMANOV_FIELD_MAX_TARGET_CM;

  return { meanResidualCm, maxResidualCm, passed };
}

export function createFieldSession(input: Omit<RomanovFieldSession, 'id' | 'capturedAt' | 'metricBinding' | 'meanResidualCm' | 'maxResidualCm' | 'passed'> & { metricBinding?: RomanovMetricBinding }): RomanovFieldSession {
  const summary = summarizeResiduals(input.observations);
  const capturedAt = new Date().toISOString();
  return {
    ...input,
    id: `romanov-field-${capturedAt}-${input.viewingDistanceMeters}m`,
    capturedAt,
    metricBinding: input.metricBinding ?? currentRomanovMetricBinding,
    ...summary
  };
}

function normalizedDeviceKey(session: RomanovFieldSession) {
  const label = session.deviceLabel?.trim();
  return `${session.devicePlatform}:${label || session.deviceVersion}`.toLowerCase();
}

export function summarizeFieldMatrix(sessions: RomanovFieldSession[]): RomanovFieldMatrixSummary {
  const currentMetricSessions = sessions.filter((session) => isCurrentRomanovMetricBinding(session.metricBinding));
  const staleMetricSessions = sessions.length - currentMetricSessions.length;
  const passedSessions = currentMetricSessions.filter((session) => session.passed);
  const grouped = new Map<string, RomanovFieldSession[]>();

  for (const session of passedSessions) {
    const key = normalizedDeviceKey(session);
    const current = grouped.get(key) ?? [];
    current.push(session);
    grouped.set(key, current);
  }

  const completeDevices: RomanovDeviceVerification[] = [];
  for (const [deviceKey, deviceSessions] of grouped) {
    const first = deviceSessions[0];
    if (!first) continue;

    const distancesPassed = ROMANOV_FIELD_DISTANCES.filter((distance) =>
      deviceSessions.some((session) => session.viewingDistanceMeters === distance && session.passed)
    );
    const completeDistanceMatrix = distancesPassed.length === ROMANOV_FIELD_DISTANCES.length;
    if (!completeDistanceMatrix) continue;

    completeDevices.push({
      deviceKey,
      deviceLabel: first.deviceLabel?.trim() || `${first.devicePlatform} ${first.deviceVersion}`,
      platform: first.devicePlatform,
      distancesPassed,
      completeDistanceMatrix
    });
  }

  const iosCompleteDevices = completeDevices.filter((device) => device.platform === 'ios').length;
  const androidCompleteDevices = completeDevices.filter((device) => device.platform === 'android').length;
  const crossPlatformReady = iosCompleteDevices >= ROMANOV_REQUIRED_IOS_DEVICES
    && androidCompleteDevices >= ROMANOV_REQUIRED_ANDROID_DEVICES;

  return {
    sessions: sessions.length,
    passedSessions: passedSessions.length,
    currentMetricSessions: currentMetricSessions.length,
    staleMetricSessions,
    completeDevices,
    iosCompleteDevices,
    androidCompleteDevices,
    crossPlatformReady,
    eligibleForPersistentAnchor: crossPlatformReady
  };
}

export function sessionToTsv(session: RomanovFieldSession) {
  const header = [
    'session_id',
    'captured_at',
    'metric_authority_id',
    'metric_authority_version',
    'model_pack_version',
    'era',
    'distance_m',
    'device_platform',
    'device_version',
    'device_label',
    'app_build',
    'control_point',
    'residual_cm',
    'mean_cm',
    'max_cm',
    'passed'
  ];
  const rows = session.observations.map((item) => [
    session.id,
    session.capturedAt,
    session.metricBinding?.metricAuthorityId ?? '',
    session.metricBinding?.metricAuthorityVersion?.toString() ?? '',
    session.metricBinding?.modelPackVersion ?? '',
    session.era,
    String(session.viewingDistanceMeters),
    session.devicePlatform,
    session.deviceVersion,
    session.deviceLabel ?? '',
    session.appBuild ?? '',
    item.controlPointId,
    item.residualCm.toFixed(1),
    session.meanResidualCm.toFixed(1),
    session.maxResidualCm.toFixed(1),
    session.passed ? '1' : '0'
  ]);
  return [header, ...rows].map((row) => row.join('\t')).join('\n');
}
