export type MarketplaceIntentKind =
  | 'food'
  | 'culture'
  | 'event'
  | 'stay'
  | 'shopping'
  | 'rest'
  | 'family';

export type MarketplaceAvailabilityState =
  | 'available'
  | 'limited'
  | 'unavailable'
  | 'unknown';

export type MarketplaceAvailabilityRequirement =
  | 'live-required'
  | 'discovery-ok';

export type MarketplaceIntent = {
  id: string;
  kind: MarketplaceIntentKind;
  requiredTags: string[];
  preferredTags: string[];
  maximumDistanceMeters: number | null;
  availableMinutes: number | null;
  availabilityRequirement: MarketplaceAvailabilityRequirement;
};

export type MarketplaceCandidate = {
  id: string;
  partnerId: string;
  title: string;
  kind: MarketplaceIntentKind;
  tags: string[];
  distanceMeters: number | null;
  estimatedDurationMinutes: number | null;
  partnerVerified: boolean;
  published: boolean;
  serviceQualityScore: number | null;
  availability: {
    state: MarketplaceAvailabilityState;
    checkedAt: string | null;
    freshnessSlaMinutes: number | null;
    authoritative: boolean;
  };
  sponsor: {
    active: boolean;
    contractRef: string | null;
    disclosureLabel: string | null;
  };
};

export type MarketplaceRankingPolicy = {
  id: string;
  version: string;
  weights: {
    relevance: number;
    timeFit: number;
    distance: number;
    availability: number;
    preference: number;
    serviceQuality: number;
  };
  minimumOrganicScore: number;
  minimumSponsoredOrganicScore: number;
  maximumSponsoredItems: number;
};

export const MARKETPLACE_RANKING_POLICY_V1: MarketplaceRankingPolicy = {
  id: 'moscow-marketplace-neutral-v1',
  version: '1.0.0',
  weights: {
    relevance: 0.3,
    timeFit: 0.2,
    distance: 0.15,
    availability: 0.2,
    preference: 0.1,
    serviceQuality: 0.05
  },
  minimumOrganicScore: 0.35,
  minimumSponsoredOrganicScore: 0.5,
  maximumSponsoredItems: 1
};

export type MarketplaceEligibilityReason =
  | 'eligible'
  | 'partner-not-verified'
  | 'offer-not-published'
  | 'intent-kind-mismatch'
  | 'required-tag-missing'
  | 'distance-out-of-range'
  | 'duration-does-not-fit'
  | 'availability-not-authoritative'
  | 'availability-stale'
  | 'availability-unavailable'
  | 'availability-unknown'
  | 'organic-score-below-threshold';

export type MarketplaceOrganicResult = {
  candidate: MarketplaceCandidate;
  organicScore: number;
  organicRank: number;
  dimensions: {
    relevance: number;
    timeFit: number;
    distance: number;
    availability: number;
    preference: number;
    serviceQuality: number;
  };
  reasons: string[];
};

export type MarketplaceSponsoredResult = {
  candidate: MarketplaceCandidate;
  organicScore: number;
  organicRank: number;
  sponsorContractRef: string;
  disclosureLabel: string;
};

export type MarketplaceRankingOutput = {
  policyId: string;
  policyVersion: string;
  generatedAt: string;
  organic: MarketplaceOrganicResult[];
  sponsored: MarketplaceSponsoredResult[];
  excluded: Array<{
    candidateId: string;
    reason: MarketplaceEligibilityReason;
  }>;
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function minutesBetween(earlier: string, later: string) {
  const a = new Date(earlier).getTime();
  const b = new Date(later).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return (b - a) / 60000;
}

function availabilityFresh(
  candidate: MarketplaceCandidate,
  now: string
) {
  const availability = candidate.availability;
  if (!availability.authoritative) return false;
  if (!availability.checkedAt) return false;
  if (
    availability.freshnessSlaMinutes === null
    || !Number.isFinite(availability.freshnessSlaMinutes)
    || availability.freshnessSlaMinutes <= 0
  ) return false;

  const ageMinutes = minutesBetween(availability.checkedAt, now);
  return ageMinutes !== null && ageMinutes <= availability.freshnessSlaMinutes;
}

export function evaluateMarketplaceEligibility(
  intent: MarketplaceIntent,
  candidate: MarketplaceCandidate,
  now: string
): MarketplaceEligibilityReason {
  if (!candidate.partnerVerified) return 'partner-not-verified';
  if (!candidate.published) return 'offer-not-published';
  if (candidate.kind !== intent.kind) return 'intent-kind-mismatch';

  for (const tag of intent.requiredTags) {
    if (!candidate.tags.includes(tag)) return 'required-tag-missing';
  }

  if (
    intent.maximumDistanceMeters !== null
    && (
      candidate.distanceMeters === null
      || candidate.distanceMeters > intent.maximumDistanceMeters
    )
  ) {
    return 'distance-out-of-range';
  }

  if (
    intent.availableMinutes !== null
    && (
      candidate.estimatedDurationMinutes === null
      || candidate.estimatedDurationMinutes > intent.availableMinutes
    )
  ) {
    return 'duration-does-not-fit';
  }

  if (intent.availabilityRequirement === 'live-required') {
    if (!candidate.availability.authoritative) {
      return 'availability-not-authoritative';
    }
    if (!availabilityFresh(candidate, now)) {
      return 'availability-stale';
    }
    if (candidate.availability.state === 'unavailable') {
      return 'availability-unavailable';
    }
    if (candidate.availability.state === 'unknown') {
      return 'availability-unknown';
    }
  }

  return 'eligible';
}

function relevanceScore(intent: MarketplaceIntent, candidate: MarketplaceCandidate) {
  const required =
    intent.requiredTags.length === 0
      ? 1
      : intent.requiredTags.filter((tag) => candidate.tags.includes(tag)).length
        / intent.requiredTags.length;

  const preferred =
    intent.preferredTags.length === 0
      ? 1
      : intent.preferredTags.filter((tag) => candidate.tags.includes(tag)).length
        / intent.preferredTags.length;

  return clamp01(required * 0.7 + preferred * 0.3);
}

function timeFitScore(intent: MarketplaceIntent, candidate: MarketplaceCandidate) {
  if (intent.availableMinutes === null) return 1;
  if (candidate.estimatedDurationMinutes === null) return 0;

  const slack = intent.availableMinutes - candidate.estimatedDurationMinutes;
  if (slack < 0) return 0;

  const denominator = Math.max(intent.availableMinutes, 1);
  return clamp01(1 - slack / denominator * 0.35);
}

function distanceScore(intent: MarketplaceIntent, candidate: MarketplaceCandidate) {
  if (candidate.distanceMeters === null) return 0;
  if (intent.maximumDistanceMeters === null) {
    return clamp01(1 / (1 + candidate.distanceMeters / 1000));
  }

  if (intent.maximumDistanceMeters <= 0) return 0;
  return clamp01(1 - candidate.distanceMeters / intent.maximumDistanceMeters);
}

function availabilityScore(candidate: MarketplaceCandidate, now: string) {
  if (!candidate.availability.authoritative) return 0.2;
  if (!availabilityFresh(candidate, now)) return 0.25;

  if (candidate.availability.state === 'available') return 1;
  if (candidate.availability.state === 'limited') return 0.7;
  if (candidate.availability.state === 'unavailable') return 0;
  return 0.3;
}

function preferenceScore(intent: MarketplaceIntent, candidate: MarketplaceCandidate) {
  if (intent.preferredTags.length === 0) return 1;
  const matches = intent.preferredTags.filter((tag) => candidate.tags.includes(tag)).length;
  return clamp01(matches / intent.preferredTags.length);
}

function serviceQualityScore(candidate: MarketplaceCandidate) {
  return candidate.serviceQualityScore === null
    ? 0.5
    : clamp01(candidate.serviceQualityScore);
}

function weightedScore(
  policy: MarketplaceRankingPolicy,
  dimensions: MarketplaceOrganicResult['dimensions']
) {
  return (
    dimensions.relevance * policy.weights.relevance
    + dimensions.timeFit * policy.weights.timeFit
    + dimensions.distance * policy.weights.distance
    + dimensions.availability * policy.weights.availability
    + dimensions.preference * policy.weights.preference
    + dimensions.serviceQuality * policy.weights.serviceQuality
  );
}

export function validateMarketplaceRankingPolicy(policy: MarketplaceRankingPolicy) {
  const weights = Object.values(policy.weights);
  const weightSum = weights.reduce((sum, value) => sum + value, 0);

  const blockers: string[] = [];
  if (weights.some((value) => !Number.isFinite(value) || value < 0)) {
    blockers.push('invalid-weight');
  }
  if (Math.abs(weightSum - 1) > 0.000001) {
    blockers.push('weights-must-sum-to-one');
  }
  if (
    !Number.isFinite(policy.minimumOrganicScore)
    || policy.minimumOrganicScore < 0
    || policy.minimumOrganicScore > 1
  ) {
    blockers.push('invalid-minimum-organic-score');
  }
  if (
    !Number.isFinite(policy.minimumSponsoredOrganicScore)
    || policy.minimumSponsoredOrganicScore < policy.minimumOrganicScore
    || policy.minimumSponsoredOrganicScore > 1
  ) {
    blockers.push('invalid-sponsored-threshold');
  }
  if (
    !Number.isInteger(policy.maximumSponsoredItems)
    || policy.maximumSponsoredItems < 0
  ) {
    blockers.push('invalid-sponsored-limit');
  }

  return { valid: blockers.length === 0, blockers };
}

export function rankMarketplaceCandidates({
  intent,
  candidates,
  now,
  policy = MARKETPLACE_RANKING_POLICY_V1
}: {
  intent: MarketplaceIntent;
  candidates: MarketplaceCandidate[];
  now: string;
  policy?: MarketplaceRankingPolicy;
}): MarketplaceRankingOutput {
  const policyValidation = validateMarketplaceRankingPolicy(policy);
  if (!policyValidation.valid) {
    throw new Error(`invalid-marketplace-policy:${policyValidation.blockers.join(',')}`);
  }

  const excluded: MarketplaceRankingOutput['excluded'] = [];
  const scored: Array<Omit<MarketplaceOrganicResult, 'organicRank'>> = [];

  for (const candidate of candidates) {
    const eligibility = evaluateMarketplaceEligibility(intent, candidate, now);
    if (eligibility !== 'eligible') {
      excluded.push({ candidateId: candidate.id, reason: eligibility });
      continue;
    }

    const dimensions = {
      relevance: relevanceScore(intent, candidate),
      timeFit: timeFitScore(intent, candidate),
      distance: distanceScore(intent, candidate),
      availability: availabilityScore(candidate, now),
      preference: preferenceScore(intent, candidate),
      serviceQuality: serviceQualityScore(candidate)
    };

    const organicScore = weightedScore(policy, dimensions);
    if (organicScore < policy.minimumOrganicScore) {
      excluded.push({ candidateId: candidate.id, reason: 'organic-score-below-threshold' });
      continue;
    }

    scored.push({
      candidate,
      organicScore,
      dimensions,
      reasons: [
        `relevance=${dimensions.relevance.toFixed(3)}`,
        `timeFit=${dimensions.timeFit.toFixed(3)}`,
        `distance=${dimensions.distance.toFixed(3)}`,
        `availability=${dimensions.availability.toFixed(3)}`,
        `preference=${dimensions.preference.toFixed(3)}`,
        `serviceQuality=${dimensions.serviceQuality.toFixed(3)}`
      ]
    });
  }

  scored.sort((a, b) => {
    if (b.organicScore !== a.organicScore) return b.organicScore - a.organicScore;
    return a.candidate.id.localeCompare(b.candidate.id);
  });

  const organic: MarketplaceOrganicResult[] = scored.map((item, index) => ({
    ...item,
    organicRank: index + 1
  }));

  const sponsored: MarketplaceSponsoredResult[] = organic
    .filter((item) =>
      item.candidate.sponsor.active
      && item.organicScore >= policy.minimumSponsoredOrganicScore
      && Boolean(item.candidate.sponsor.contractRef?.trim())
      && Boolean(item.candidate.sponsor.disclosureLabel?.trim())
    )
    .slice(0, policy.maximumSponsoredItems)
    .map((item) => ({
      candidate: item.candidate,
      organicScore: item.organicScore,
      organicRank: item.organicRank,
      sponsorContractRef: item.candidate.sponsor.contractRef!,
      disclosureLabel: item.candidate.sponsor.disclosureLabel!
    }));

  return {
    policyId: policy.id,
    policyVersion: policy.version,
    generatedAt: now,
    organic,
    sponsored,
    excluded
  };
}

export function marketplaceRankingIsSponsorNeutral(output: MarketplaceRankingOutput) {
  const organicOrder = output.organic.map((item) => item.candidate.id);
  const sponsoredIds = new Set(output.sponsored.map((item) => item.candidate.id));

  return output.organic.every((item, index) => {
    if (!sponsoredIds.has(item.candidate.id)) return true;
    return organicOrder[index] === item.candidate.id;
  });
}
