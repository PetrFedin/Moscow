import {
  evaluateSensorQuality,
  type SensorQualityInput,
  type SensorQualityState
} from './sensorQualityGate.ts';
import type { OnDeviceVisualMatchDecision } from './onDeviceVisualRecognition.ts';

export type FusionCompatibility = 'compatible' | 'incompatible' | 'unknown';

export type FusionPackageContext = {
  state: 'verified-active' | 'missing' | 'unverified';
  packageId?: string;
};

export type VisualSensorFusionStatus =
  | 'confirmed'
  | 'needs-user-confirmation'
  | 'not-sure'
  | 'blocked';

export type VisualSensorFusionDecision = {
  status: VisualSensorFusionStatus;
  confirmationMode: 'automatic' | 'user-assisted' | 'none';
  siteId?: string;
  packageId?: string;
  referenceSetId?: string;
  referenceId?: string;
  visualConfidence?: number;
  sensorState: SensorQualityState;
  locationCompatibility: FusionCompatibility;
  headingCompatibility: FusionCompatibility;
  reason:
    | 'automatic-fusion'
    | 'explicit-user-confirmation'
    | 'visual-needs-confirmation'
    | 'sensor-or-context-degraded'
    | 'visual-not-sure'
    | 'visual-blocked'
    | 'sensor-insufficient'
    | 'active-package-not-verified'
    | 'active-package-mismatch'
    | 'location-incompatible'
    | 'heading-incompatible'
    | 'invalid-visual-candidate';
};

export type VisualSensorFusionInput = {
  visual: OnDeviceVisualMatchDecision;
  sensor: SensorQualityInput;
  locationCompatibility: FusionCompatibility;
  headingCompatibility: FusionCompatibility;
  activePackage: FusionPackageContext;
  userConfirmed?: boolean;
};

function candidateFields(visual: OnDeviceVisualMatchDecision) {
  if (
    !visual.siteId
    || !visual.packageId
    || !visual.referenceSetId
    || !visual.referenceId
    || visual.confidence == null
  ) return null;

  return {
    siteId: visual.siteId,
    packageId: visual.packageId,
    referenceSetId: visual.referenceSetId,
    referenceId: visual.referenceId,
    visualConfidence: visual.confidence
  };
}

export function fuseVisualAndSensorContext(
  input: VisualSensorFusionInput
): VisualSensorFusionDecision {
  const sensor = evaluateSensorQuality(input.sensor);
  const base = {
    confirmationMode: 'none' as const,
    sensorState: sensor.state,
    locationCompatibility: input.locationCompatibility,
    headingCompatibility: input.headingCompatibility
  };

  if (input.visual.status === 'blocked') {
    return {
      ...base,
      status: 'blocked',
      reason: 'visual-blocked'
    };
  }

  if (input.visual.status === 'not-sure') {
    return {
      ...base,
      status: 'not-sure',
      reason: 'visual-not-sure'
    };
  }

  const candidate = candidateFields(input.visual);
  if (!candidate) {
    return {
      ...base,
      status: 'blocked',
      reason: 'invalid-visual-candidate'
    };
  }

  const withCandidate = {
    ...base,
    ...candidate
  };

  if (input.activePackage.state !== 'verified-active' || !input.activePackage.packageId) {
    return {
      ...withCandidate,
      status: 'blocked',
      reason: 'active-package-not-verified'
    };
  }

  if (input.activePackage.packageId !== candidate.packageId) {
    return {
      ...withCandidate,
      status: 'blocked',
      reason: 'active-package-mismatch'
    };
  }

  if (input.locationCompatibility === 'incompatible') {
    return {
      ...withCandidate,
      status: 'blocked',
      reason: 'location-incompatible'
    };
  }

  if (input.headingCompatibility === 'incompatible') {
    return {
      ...withCandidate,
      status: 'blocked',
      reason: 'heading-incompatible'
    };
  }

  if (sensor.state === 'insufficient') {
    return {
      ...withCandidate,
      status: 'blocked',
      reason: 'sensor-insufficient'
    };
  }

  const exactContext = sensor.state === 'precise'
    && input.locationCompatibility === 'compatible'
    && input.headingCompatibility === 'compatible';

  if (input.visual.status === 'strong-candidate' && exactContext) {
    return {
      ...withCandidate,
      confirmationMode: 'automatic',
      status: 'confirmed',
      reason: 'automatic-fusion'
    };
  }

  if (input.userConfirmed === true) {
    return {
      ...withCandidate,
      confirmationMode: 'user-assisted',
      status: 'confirmed',
      reason: 'explicit-user-confirmation'
    };
  }

  return {
    ...withCandidate,
    status: 'needs-user-confirmation',
    reason: input.visual.status === 'needs-user-confirmation'
      ? 'visual-needs-confirmation'
      : 'sensor-or-context-degraded'
  };
}
