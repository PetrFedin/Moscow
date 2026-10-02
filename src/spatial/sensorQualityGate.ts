export type SensorQualityState = 'precise' | 'degraded' | 'insufficient';

export type SensorQualityInput = {
  arAvailable: boolean;
  arTracking: 'normal' | 'limited' | 'unavailable' | 'unknown';
  modelState: 'ready' | 'loading' | 'failed';
  packageState: 'ready' | 'missing' | 'unverified';
  orientationAvailable: boolean;
  locationPermission: 'granted' | 'denied' | 'unknown';
  locationAccuracyMeters?: number | null;
  headingAccuracyLevel?: 0 | 1 | 2 | 3 | null;
};

export type SensorQualityResult = {
  state: SensorQualityState;
  precisePlacementAllowed: boolean;
  manualAlignmentAllowed: boolean;
  fallbackRequired: boolean;
  reasons: string[];
};

const PRECISE_LOCATION_ACCURACY_METERS = 20;
const PRECISE_HEADING_LEVEL = 2;

export function evaluateSensorQuality(input: SensorQualityInput): SensorQualityResult {
  const hardBlockers: string[] = [];
  const degradations: string[] = [];

  if (!input.arAvailable) hardBlockers.push('ar-runtime-unavailable');
  if (input.modelState === 'failed') hardBlockers.push('model-load-failed');
  if (input.modelState === 'loading') hardBlockers.push('model-not-ready');
  if (input.packageState === 'missing') hardBlockers.push('destination-package-missing');
  if (input.packageState === 'unverified') hardBlockers.push('destination-package-unverified');
  if (input.arTracking === 'unavailable' || input.arTracking === 'unknown') {
    hardBlockers.push('ar-tracking-not-ready');
  }

  if (!input.orientationAvailable) degradations.push('orientation-not-confirmed');
  if (input.arTracking === 'limited') degradations.push('ar-tracking-limited');

  if (input.locationPermission !== 'granted') {
    degradations.push(
      input.locationPermission === 'denied'
        ? 'location-permission-denied'
        : 'location-permission-not-checked'
    );
  } else if (
    input.locationAccuracyMeters == null
    || !Number.isFinite(input.locationAccuracyMeters)
  ) {
    degradations.push('location-accuracy-unknown');
  } else if (input.locationAccuracyMeters > PRECISE_LOCATION_ACCURACY_METERS) {
    degradations.push('location-accuracy-degraded');
  }

  if (input.headingAccuracyLevel == null) {
    degradations.push('heading-accuracy-unknown');
  } else if (input.headingAccuracyLevel < PRECISE_HEADING_LEVEL) {
    degradations.push('heading-accuracy-degraded');
  }

  const reasons = [...new Set([...hardBlockers, ...degradations])];

  if (hardBlockers.length > 0) {
    return {
      state: 'insufficient',
      precisePlacementAllowed: false,
      manualAlignmentAllowed: false,
      fallbackRequired: true,
      reasons
    };
  }

  if (degradations.length > 0) {
    return {
      state: 'degraded',
      precisePlacementAllowed: false,
      manualAlignmentAllowed: true,
      fallbackRequired: false,
      reasons
    };
  }

  return {
    state: 'precise',
    precisePlacementAllowed: true,
    manualAlignmentAllowed: true,
    fallbackRequired: false,
    reasons: []
  };
}
