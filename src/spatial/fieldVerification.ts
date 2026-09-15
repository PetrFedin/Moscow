import type { CalibrationProfile } from './calibration';
import type { RomanovEra } from './romanov-hotspots';

export type FieldDistanceMeters = 5 | 10 | 15;

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
  devicePlatform: string;
  deviceVersion: string;
  observations: ControlPointResidual[];
  meanResidualCm: number;
  maxResidualCm: number;
  passed: boolean;
};

export const ROMANOV_FIELD_DISTANCES: FieldDistanceMeters[] = [5, 10, 15];
export const ROMANOV_FIELD_REQUIRED_POINTS = 5;

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

export function createFieldSession(input: Omit<RomanovFieldSession, 'id' | 'capturedAt' | 'meanResidualCm' | 'maxResidualCm' | 'passed'>): RomanovFieldSession {
  const summary = summarizeResiduals(input.observations);
  const capturedAt = new Date().toISOString();
  return {
    ...input,
    id: `romanov-field-${capturedAt}-${input.viewingDistanceMeters}m`,
    capturedAt,
    ...summary
  };
}

export function sessionToTsv(session: RomanovFieldSession) {
  const header = ['session_id', 'captured_at', 'era', 'distance_m', 'control_point', 'residual_cm', 'mean_cm', 'max_cm', 'passed'];
  const rows = session.observations.map((item) => [
    session.id,
    session.capturedAt,
    session.era,
    String(session.viewingDistanceMeters),
    item.controlPointId,
    item.residualCm.toFixed(1),
    session.meanResidualCm.toFixed(1),
    session.maxResidualCm.toFixed(1),
    session.passed ? '1' : '0'
  ]);
  return [header, ...rows].map((row) => row.join('\t')).join('\n');
}
