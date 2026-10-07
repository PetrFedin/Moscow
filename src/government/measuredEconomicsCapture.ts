import type {
  MeasuredDuration,
  MeasuredHours,
  MeasuredMoney,
  PilotInvestmentEvidence
} from './pilotInvestmentDecision.ts';

export const PILOT_ECONOMICS_CAPTURE_VERSION = 1 as const;

export type PilotEconomicsCapture = {
  version: typeof PILOT_ECONOMICS_CAPTURE_VERSION;
  pilotId: 'varvarka-zaryadye-pilot';
  capturedAt: string;
  preparedBy: string;
  nextVerifiedObjectVariableCost: MeasuredMoney | null;
  nextVerifiedObjectProductionTime: MeasuredDuration | null;
  developerHoursPerObject: MeasuredHours | null;
  institutionOperatorHoursPerObject: MeasuredHours | null;
  districtSharedSetupCost: MeasuredMoney | null;
  districtIntegrationCost: MeasuredMoney | null;
  annualOperationsCost: MeasuredMoney | null;
  exclusions: string[];
  notes: string[];
};

function validText(value: string) {
  return value.trim().length > 0;
}

function validMeasuredMoney(value: MeasuredMoney | null) {
  return value === null || (
    Number.isFinite(value.amountRub)
    && value.amountRub > 0
    && validText(value.basis)
    && validText(value.evidenceRef)
  );
}

function validMeasuredDuration(value: MeasuredDuration | null) {
  return value === null || (
    Number.isFinite(value.days)
    && value.days > 0
    && validText(value.basis)
    && validText(value.evidenceRef)
  );
}

function validMeasuredHours(value: MeasuredHours | null) {
  return value === null || (
    Number.isFinite(value.hours)
    && value.hours > 0
    && validText(value.basis)
    && validText(value.evidenceRef)
  );
}

export function validatePilotEconomicsCapture(capture: PilotEconomicsCapture) {
  const blockers: string[] = [];

  if (capture.version !== PILOT_ECONOMICS_CAPTURE_VERSION) blockers.push('version-invalid');
  if (capture.pilotId !== 'varvarka-zaryadye-pilot') blockers.push('pilot-id-invalid');
  if (!validText(capture.capturedAt)) blockers.push('captured-at-missing');
  if (!validText(capture.preparedBy)) blockers.push('prepared-by-missing');

  if (!validMeasuredMoney(capture.nextVerifiedObjectVariableCost)) blockers.push('next-object-variable-cost-invalid');
  if (!validMeasuredDuration(capture.nextVerifiedObjectProductionTime)) blockers.push('next-object-production-time-invalid');
  if (!validMeasuredHours(capture.developerHoursPerObject)) blockers.push('developer-hours-invalid');
  if (!validMeasuredHours(capture.institutionOperatorHoursPerObject)) blockers.push('institution-operator-hours-invalid');
  if (!validMeasuredMoney(capture.districtSharedSetupCost)) blockers.push('district-shared-setup-cost-invalid');
  if (!validMeasuredMoney(capture.districtIntegrationCost)) blockers.push('district-integration-cost-invalid');
  if (!validMeasuredMoney(capture.annualOperationsCost)) blockers.push('annual-operations-cost-invalid');

  const values = [
    capture.nextVerifiedObjectVariableCost,
    capture.nextVerifiedObjectProductionTime,
    capture.developerHoursPerObject,
    capture.institutionOperatorHoursPerObject,
    capture.districtSharedSetupCost,
    capture.districtIntegrationCost,
    capture.annualOperationsCost
  ];
  const measured = values.filter((value) => value !== null).length;

  return {
    valid: blockers.length === 0,
    complete: blockers.length === 0 && measured === 7,
    measured,
    total: 7,
    blockers
  };
}

export function economicsCaptureToInvestmentEvidence(
  capture: PilotEconomicsCapture,
  base: PilotInvestmentEvidence
): PilotInvestmentEvidence {
  const validation = validatePilotEconomicsCapture(capture);
  if (!validation.complete) {
    throw new Error(
      `Pilot economics capture is incomplete: ${validation.blockers.join('; ') || `${validation.measured}/7 measured`}`
    );
  }

  return {
    ...base,
    economics: {
      nextVerifiedObjectVariableCost: capture.nextVerifiedObjectVariableCost,
      nextVerifiedObjectProductionTime: capture.nextVerifiedObjectProductionTime,
      developerHoursPerObject: capture.developerHoursPerObject,
      institutionOperatorHoursPerObject: capture.institutionOperatorHoursPerObject,
      districtSharedSetupCost: capture.districtSharedSetupCost,
      districtIntegrationCost: capture.districtIntegrationCost,
      annualOperationsCost: capture.annualOperationsCost
    }
  };
}

export const emptyPilotEconomicsCapture: PilotEconomicsCapture = {
  version: 1,
  pilotId: 'varvarka-zaryadye-pilot',
  capturedAt: '',
  preparedBy: '',
  nextVerifiedObjectVariableCost: null,
  nextVerifiedObjectProductionTime: null,
  developerHoursPerObject: null,
  institutionOperatorHoursPerObject: null,
  districtSharedSetupCost: null,
  districtIntegrationCost: null,
  annualOperationsCost: null,
  exclusions: [],
  notes: []
};
