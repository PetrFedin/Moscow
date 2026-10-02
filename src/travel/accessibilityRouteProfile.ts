export type AccessibilityClaimState = 'verified' | 'unknown' | 'stale' | 'conflicting';

export type AccessibilitySubjectType = 'route' | 'segment' | 'stop' | 'entrance';

export type AccessibilityFeature =
  | 'step-free'
  | 'stairs'
  | 'steep-slope'
  | 'surface'
  | 'entrance-accessibility'
  | 'lift'
  | 'ramp'
  | 'rest-point'
  | 'accessible-toilet'
  | 'temporary-obstruction';

export type AccessibilityClaimValue =
  | 'available'
  | 'not-available'
  | 'present'
  | 'absent'
  | 'smooth'
  | 'uneven'
  | 'unknown';

export type AccessibilityClaim = {
  id: string;
  subjectType: AccessibilitySubjectType;
  subjectId: string;
  feature: AccessibilityFeature;
  state: AccessibilityClaimState;
  value: AccessibilityClaimValue;
  evidenceRefs?: string[];
  sourceRefs?: string[];
  authority?: string;
  verifiedAt?: string;
  validUntil?: string;
  note?: string;
};

export type AccessibilityRouteProfile = {
  schemaVersion: 1;
  id: string;
  routeId: string;
  version: number;
  requiredSubjectIds: string[];
  claims: AccessibilityClaim[];
  publishedAt?: string;
};

export type StepFreeIntent = 'none' | 'preferred' | 'required';

export type StepFreeDecisionStatus =
  | 'not-required'
  | 'verified-step-free'
  | 'verified-barrier'
  | 'needs-accessibility-authority'
  | 'preferred-with-unknowns';

export type StepFreeDecision = {
  status: StepFreeDecisionStatus;
  intent: StepFreeIntent;
  routeId: string;
  verifiedAccessibleSubjectIds: string[];
  verifiedBarrierSubjectIds: string[];
  unknownSubjectIds: string[];
  staleSubjectIds: string[];
  conflictingSubjectIds: string[];
};

function assertIso(value: string, field: string) {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`Invalid ${field}: ${value}`);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function effectiveClaimState(claim: AccessibilityClaim, nowIso: string): AccessibilityClaimState {
  if (claim.state !== 'verified') return claim.state;
  if (!claim.validUntil) return 'verified';
  assertIso(claim.validUntil, 'accessibility validUntil');
  return Date.parse(claim.validUntil) < Date.parse(nowIso) ? 'stale' : 'verified';
}

export function validateAccessibilityClaim(claim: AccessibilityClaim) {
  if (!claim.id.trim()) throw new Error('Accessibility claim id is required');
  if (!claim.subjectId.trim()) throw new Error('Accessibility subject id is required');

  if (claim.state === 'unknown') {
    if (claim.value !== 'unknown') {
      throw new Error('Unknown accessibility claim must use unknown value');
    }
    return;
  }

  const evidenceRefs = claim.evidenceRefs?.filter(Boolean) ?? [];
  const sourceRefs = claim.sourceRefs?.filter(Boolean) ?? [];

  if (evidenceRefs.length === 0 && sourceRefs.length === 0) {
    throw new Error('Non-unknown accessibility claim requires evidence/source reference');
  }
  if (!claim.authority?.trim()) {
    throw new Error('Non-unknown accessibility claim requires authority');
  }
  if (!claim.verifiedAt) {
    throw new Error('Non-unknown accessibility claim requires verifiedAt');
  }
  assertIso(claim.verifiedAt, 'accessibility verifiedAt');

  if (claim.validUntil) {
    assertIso(claim.validUntil, 'accessibility validUntil');
    if (Date.parse(claim.validUntil) < Date.parse(claim.verifiedAt)) {
      throw new Error('Accessibility validUntil cannot precede verifiedAt');
    }
  }

  if (claim.state === 'conflicting' && evidenceRefs.length + sourceRefs.length < 2) {
    throw new Error('Conflicting accessibility claim requires at least two evidence/source references');
  }

  if (claim.value === 'unknown') {
    throw new Error('Non-unknown accessibility claim cannot use unknown value');
  }
}

export function validateAccessibilityRouteProfile(profile: AccessibilityRouteProfile) {
  if (profile.schemaVersion !== 1) throw new Error('Unsupported accessibility profile schema');
  if (!profile.id.trim()) throw new Error('Accessibility profile id is required');
  if (!profile.routeId.trim()) throw new Error('Accessibility route id is required');
  if (!Number.isInteger(profile.version) || profile.version < 1) {
    throw new Error('Accessibility profile version must be a positive integer');
  }
  if (profile.requiredSubjectIds.length === 0) {
    throw new Error('Accessibility profile requires at least one required subject');
  }
  if (unique(profile.requiredSubjectIds).length !== profile.requiredSubjectIds.length) {
    throw new Error('Accessibility required subject ids must be unique');
  }

  const ids = new Set<string>();
  for (const claim of profile.claims) {
    validateAccessibilityClaim(claim);
    if (ids.has(claim.id)) throw new Error(`Duplicate accessibility claim id: ${claim.id}`);
    ids.add(claim.id);
  }
}

function selectStepFreeClaim(
  profile: AccessibilityRouteProfile,
  subjectId: string
): AccessibilityClaim | undefined {
  const claims = profile.claims.filter(
    (claim) => claim.subjectId === subjectId && claim.feature === 'step-free'
  );
  if (claims.length === 0) return undefined;
  if (claims.length > 1) {
    const verified = claims.filter((claim) => claim.state === 'verified');
    if (verified.length === 1) return verified[0];
    return {
      id: `synthetic-conflict:${subjectId}`,
      subjectType: claims[0]!.subjectType,
      subjectId,
      feature: 'step-free',
      state: 'conflicting',
      value: 'unknown',
      evidenceRefs: claims.flatMap((claim) => claim.evidenceRefs ?? []),
      sourceRefs: claims.flatMap((claim) => claim.sourceRefs ?? []),
      authority: 'multiple-claims',
      verifiedAt: (() => {
        const values = claims.map((claim) => claim.verifiedAt).filter((value): value is string => Boolean(value)).sort();
        return values[values.length - 1];
      })()
    };
  }
  return claims[0];
}

export function evaluateStepFreeRoute(input: {
  profile: AccessibilityRouteProfile;
  intent: StepFreeIntent;
  nowIso: string;
}): StepFreeDecision {
  validateAccessibilityRouteProfile(input.profile);
  assertIso(input.nowIso, 'accessibility evaluation time');

  if (input.intent === 'none') {
    return {
      status: 'not-required',
      intent: input.intent,
      routeId: input.profile.routeId,
      verifiedAccessibleSubjectIds: [],
      verifiedBarrierSubjectIds: [],
      unknownSubjectIds: [],
      staleSubjectIds: [],
      conflictingSubjectIds: []
    };
  }

  const verifiedAccessibleSubjectIds: string[] = [];
  const verifiedBarrierSubjectIds: string[] = [];
  const unknownSubjectIds: string[] = [];
  const staleSubjectIds: string[] = [];
  const conflictingSubjectIds: string[] = [];

  for (const subjectId of input.profile.requiredSubjectIds) {
    const claim = selectStepFreeClaim(input.profile, subjectId);
    if (!claim || claim.state === 'unknown') {
      unknownSubjectIds.push(subjectId);
      continue;
    }

    const state = effectiveClaimState(claim, input.nowIso);
    if (state === 'stale') {
      staleSubjectIds.push(subjectId);
      continue;
    }
    if (state === 'conflicting') {
      conflictingSubjectIds.push(subjectId);
      continue;
    }

    if (claim.value === 'available') {
      verifiedAccessibleSubjectIds.push(subjectId);
    } else if (claim.value === 'not-available') {
      verifiedBarrierSubjectIds.push(subjectId);
    } else {
      unknownSubjectIds.push(subjectId);
    }
  }

  let status: StepFreeDecisionStatus;
  if (verifiedBarrierSubjectIds.length > 0) {
    status = 'verified-barrier';
  } else if (
    unknownSubjectIds.length > 0
    || staleSubjectIds.length > 0
    || conflictingSubjectIds.length > 0
  ) {
    status = input.intent === 'required'
      ? 'needs-accessibility-authority'
      : 'preferred-with-unknowns';
  } else {
    status = 'verified-step-free';
  }

  return {
    status,
    intent: input.intent,
    routeId: input.profile.routeId,
    verifiedAccessibleSubjectIds,
    verifiedBarrierSubjectIds,
    unknownSubjectIds,
    staleSubjectIds,
    conflictingSubjectIds
  };
}
