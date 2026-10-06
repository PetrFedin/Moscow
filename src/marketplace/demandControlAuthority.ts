import type { MarketplaceIntentKind } from './demandRankingAuthority';

export type DemandSignalEvidenceMode = 'actual' | 'demo';

export type DemandObservation = {
  id: string;
  mode: DemandSignalEvidenceMode;
  districtId: string;
  intentKind: MarketplaceIntentKind;
  timeBucket: 'morning' | 'day' | 'evening' | 'night';
  observedAt: string;
  eligibleSupplyCount: number;
  freshAvailableSupplyCount: number;
  bestOrganicScore: number | null;
  handoffCreated: boolean;
  providerConfirmed: boolean;
  cancelledOrRefunded: boolean;
};

export type PartnerQualityObservation = {
  partnerId: string;
  mode: DemandSignalEvidenceMode;
  districtId: string;
  intentKind: MarketplaceIntentKind;
  observedAt: string;
  feedFresh: boolean;
  providerConfirmed: boolean;
  cancelledOrRefunded: boolean;
  serviceQualityScore: number | null;
};

export type DemandControlPolicy = {
  minimumObservations: number;
  minimumDistinctDays: number;
  watchUnmetIntentRate: number;
  opportunityUnmetIntentRate: number;
  maximumHealthyCoverageRatio: number;
  minimumConfirmedDemandRate: number;
};

export const DEMAND_CONTROL_POLICY_V1: DemandControlPolicy = {
  minimumObservations: 30,
  minimumDistinctDays: 3,
  watchUnmetIntentRate: 0.2,
  opportunityUnmetIntentRate: 0.35,
  maximumHealthyCoverageRatio: 0.7,
  minimumConfirmedDemandRate: 0.1
};

export type DistrictDemandCell = {
  key: string;
  districtId: string;
  intentKind: MarketplaceIntentKind;
  timeBucket: DemandObservation['timeBucket'];
  mode: DemandSignalEvidenceMode;
  observations: number;
  distinctDays: number;
  unmetIntents: number;
  unmetIntentRate: number | null;
  averageEligibleSupply: number | null;
  averageFreshAvailableSupply: number | null;
  supplyCoverageRatio: number | null;
  handoffs: number;
  handoffRate: number | null;
  providerConfirmations: number;
  providerConfirmationRate: number | null;
  cancellationsOrRefunds: number;
  confirmedDemandRate: number | null;
  status: 'INSUFFICIENT' | 'HEALTHY' | 'WATCH' | 'OPPORTUNITY';
  signal:
    | 'not-enough-evidence'
    | 'supply-healthy'
    | 'monitor-demand-gap'
    | 'partner-acquisition-candidate';
};

export type PartnerQualitySnapshot = {
  partnerId: string;
  observations: number;
  freshnessPassRate: number | null;
  providerConfirmationRate: number | null;
  cancellationOrRefundRate: number | null;
  averageServiceQuality: number | null;
  status: 'INSUFFICIENT' | 'HEALTHY' | 'WATCH';
};

export type CityDevelopmentSignal = {
  districtId: string;
  intentKind: MarketplaceIntentKind;
  timeBucket: DemandObservation['timeBucket'];
  mode: DemandSignalEvidenceMode;
  status: 'INSUFFICIENT' | 'WATCH' | 'OPPORTUNITY';
  evidenceSummary: string[];
  nextAction:
    | 'collect-more-evidence'
    | 'review-existing-supply'
    | 'partner-acquisition'
    | 'city-planning-review';
  prohibitedClaim: 'does-not-authorize-investment-or-construction';
};

function safeRate(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function dayOf(value: string) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function buildCell(
  observations: DemandObservation[],
  policy: DemandControlPolicy
): DistrictDemandCell {
  const first = observations[0];
  if (!first) {
    throw new Error('demand-cell-empty');
  }

  const distinctDays = new Set(
    observations
      .map((item) => dayOf(item.observedAt))
      .filter((item): item is string => Boolean(item))
  ).size;

  const unmetIntents = observations.filter(
    (item) => item.freshAvailableSupplyCount <= 0
  ).length;

  const handoffs = observations.filter((item) => item.handoffCreated).length;
  const confirmations = observations.filter(
    (item) => item.providerConfirmed
  ).length;
  const cancellations = observations.filter(
    (item) => item.cancelledOrRefunded
  ).length;

  const averageEligibleSupply = average(
    observations.map((item) => Math.max(0, item.eligibleSupplyCount))
  );
  const averageFreshAvailableSupply = average(
    observations.map((item) => Math.max(0, item.freshAvailableSupplyCount))
  );

  const supplyCoverageRatio =
    averageEligibleSupply === null
    || averageEligibleSupply <= 0
    || averageFreshAvailableSupply === null
      ? null
      : Math.min(1, averageFreshAvailableSupply / averageEligibleSupply);

  const unmetIntentRate = safeRate(unmetIntents, observations.length);
  const handoffRate = safeRate(handoffs, observations.length);
  const providerConfirmationRate = safeRate(confirmations, handoffs);
  const confirmedDemandRate = safeRate(confirmations, observations.length);

  const enoughEvidence =
    observations.length >= policy.minimumObservations
    && distinctDays >= policy.minimumDistinctDays;

  let status: DistrictDemandCell['status'] = 'INSUFFICIENT';
  let signal: DistrictDemandCell['signal'] = 'not-enough-evidence';

  if (enoughEvidence) {
    const unmet = unmetIntentRate ?? 0;
    const confirmedDemand = confirmedDemandRate ?? 0;
    const lowCoverage =
      supplyCoverageRatio === null
      || supplyCoverageRatio < policy.maximumHealthyCoverageRatio;

    if (
      unmet >= policy.opportunityUnmetIntentRate
      && lowCoverage
      && confirmedDemand >= policy.minimumConfirmedDemandRate
    ) {
      status = 'OPPORTUNITY';
      signal = 'partner-acquisition-candidate';
    } else if (
      unmet >= policy.watchUnmetIntentRate
      || lowCoverage
    ) {
      status = 'WATCH';
      signal = 'monitor-demand-gap';
    } else {
      status = 'HEALTHY';
      signal = 'supply-healthy';
    }
  }

  return {
    key: [
      first.mode,
      first.districtId,
      first.intentKind,
      first.timeBucket
    ].join(':'),
    districtId: first.districtId,
    intentKind: first.intentKind,
    timeBucket: first.timeBucket,
    mode: first.mode,
    observations: observations.length,
    distinctDays,
    unmetIntents,
    unmetIntentRate,
    averageEligibleSupply,
    averageFreshAvailableSupply,
    supplyCoverageRatio,
    handoffs,
    handoffRate,
    providerConfirmations: confirmations,
    providerConfirmationRate,
    cancellationsOrRefunds: cancellations,
    confirmedDemandRate,
    status,
    signal
  };
}

export function buildDemandControlCells({
  observations,
  mode,
  policy = DEMAND_CONTROL_POLICY_V1
}: {
  observations: DemandObservation[];
  mode: DemandSignalEvidenceMode;
  policy?: DemandControlPolicy;
}) {
  const filtered = observations.filter((item) => item.mode === mode);
  const groups = new Map<string, DemandObservation[]>();

  for (const item of filtered) {
    const key = [item.districtId, item.intentKind, item.timeBucket].join(':');
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((items) => buildCell(items, policy))
    .sort((a, b) => {
      const priority = { OPPORTUNITY: 3, WATCH: 2, HEALTHY: 1, INSUFFICIENT: 0 };
      const statusDelta = priority[b.status] - priority[a.status];
      if (statusDelta !== 0) return statusDelta;
      return b.observations - a.observations;
    });
}

export function buildPartnerQualitySnapshots({
  observations,
  mode
}: {
  observations: PartnerQualityObservation[];
  mode: DemandSignalEvidenceMode;
}): PartnerQualitySnapshot[] {
  const groups = new Map<string, PartnerQualityObservation[]>();

  for (const item of observations.filter((entry) => entry.mode === mode)) {
    const group = groups.get(item.partnerId) ?? [];
    group.push(item);
    groups.set(item.partnerId, group);
  }

  return [...groups.entries()].map(([partnerId, items]) => {
    const freshnessPassRate = safeRate(
      items.filter((item) => item.feedFresh).length,
      items.length
    );
    const providerConfirmationRate = safeRate(
      items.filter((item) => item.providerConfirmed).length,
      items.length
    );
    const cancellationOrRefundRate = safeRate(
      items.filter((item) => item.cancelledOrRefunded).length,
      items.length
    );
    const serviceScores = items
      .map((item) => item.serviceQualityScore)
      .filter((item): item is number => item !== null && Number.isFinite(item));
    const averageServiceQuality = average(serviceScores);

    let status: PartnerQualitySnapshot['status'] = 'INSUFFICIENT';
    if (items.length >= 10) {
      const freshness = freshnessPassRate ?? 0;
      const confirmations = providerConfirmationRate ?? 0;
      const reversals = cancellationOrRefundRate ?? 0;

      status =
        freshness >= 0.9
        && confirmations >= 0.5
        && reversals <= 0.15
          ? 'HEALTHY'
          : 'WATCH';
    }

    return {
      partnerId,
      observations: items.length,
      freshnessPassRate,
      providerConfirmationRate,
      cancellationOrRefundRate,
      averageServiceQuality,
      status
    };
  });
}

export function buildCityDevelopmentSignal(
  cell: DistrictDemandCell
): CityDevelopmentSignal {
  if (cell.status === 'INSUFFICIENT') {
    return {
      districtId: cell.districtId,
      intentKind: cell.intentKind,
      timeBucket: cell.timeBucket,
      mode: cell.mode,
      status: 'INSUFFICIENT',
      evidenceSummary: [
        `observations=${cell.observations}`,
        `distinctDays=${cell.distinctDays}`
      ],
      nextAction: 'collect-more-evidence',
      prohibitedClaim: 'does-not-authorize-investment-or-construction'
    };
  }

  if (cell.status === 'OPPORTUNITY') {
    return {
      districtId: cell.districtId,
      intentKind: cell.intentKind,
      timeBucket: cell.timeBucket,
      mode: cell.mode,
      status: 'OPPORTUNITY',
      evidenceSummary: [
        `unmetIntentRate=${cell.unmetIntentRate?.toFixed(3) ?? 'n/a'}`,
        `supplyCoverageRatio=${cell.supplyCoverageRatio?.toFixed(3) ?? 'n/a'}`,
        `confirmedDemandRate=${cell.confirmedDemandRate?.toFixed(3) ?? 'n/a'}`,
        `observations=${cell.observations}`
      ],
      nextAction: 'partner-acquisition',
      prohibitedClaim: 'does-not-authorize-investment-or-construction'
    };
  }

  if (cell.status === 'WATCH') {
    return {
      districtId: cell.districtId,
      intentKind: cell.intentKind,
      timeBucket: cell.timeBucket,
      mode: cell.mode,
      status: 'WATCH',
      evidenceSummary: [
        `unmetIntentRate=${cell.unmetIntentRate?.toFixed(3) ?? 'n/a'}`,
        `supplyCoverageRatio=${cell.supplyCoverageRatio?.toFixed(3) ?? 'n/a'}`,
        `observations=${cell.observations}`
      ],
      nextAction: 'review-existing-supply',
      prohibitedClaim: 'does-not-authorize-investment-or-construction'
    };
  }

  return {
    districtId: cell.districtId,
    intentKind: cell.intentKind,
    timeBucket: cell.timeBucket,
    mode: cell.mode,
    status: 'WATCH',
    evidenceSummary: [
      'supply currently appears healthy',
      `observations=${cell.observations}`
    ],
    nextAction: 'city-planning-review',
    prohibitedClaim: 'does-not-authorize-investment-or-construction'
  };
}

export function demandControlHasEnoughEvidenceForOpportunity(
  cell: DistrictDemandCell
) {
  return cell.status === 'OPPORTUNITY'
    && cell.observations >= DEMAND_CONTROL_POLICY_V1.minimumObservations
    && cell.distinctDays >= DEMAND_CONTROL_POLICY_V1.minimumDistinctDays
    && cell.mode === 'actual';
}
