import type { MarketplaceIntentKind } from './demandRankingAuthority.ts';
import { DEMAND_CONTROL_POLICY_V1 } from './demandControlAuthority.ts';
import type { DemandSignalEvidenceMode, DistrictDemandCell } from './demandControlAuthority.ts';

export type TwinAssumptionProvenance = 'measured' | 'demo-assumption';

export type DistrictTwinBaseline = {
  id: string;
  mode: DemandSignalEvidenceMode;
  districtId: string;
  intentKind: MarketplaceIntentKind;
  timeBucket: DistrictDemandCell['timeBucket'];
  sourceCellKey: string;
  observations: number;
  distinctDays: number;
  unmetIntentRate: number | null;
  supplyCoverageRatio: number | null;
  averageFreshSupply: number | null;
  providerConfirmationRate: number | null;
  confirmedDemandRate: number | null;
  footfallIndex: number | null;
  partnerGrossContributionRub: number | null;
};

export type DistrictTwinIntervention =
  | {
      id: string;
      type: 'add-supply';
      label: string;
      addedFreshSupplyUnits: number;
    }
  | {
      id: string;
      type: 'extend-hours';
      label: string;
      addedServiceHours: number;
      equivalentFreshSupplyUnits: number;
    }
  | {
      id: string;
      type: 'evening-route';
      label: string;
      expectedDemandRedistributionShare: number;
      expectedFootfallIndexDelta: number;
    }
  | {
      id: string;
      type: 'ticket-provider';
      label: string;
      expectedProviderConfirmationDelta: number;
    };

export type DistrictTwinAssumptionSet = {
  id: string;
  version: string;
  provenance: TwinAssumptionProvenance;
  calibratedAt: string | null;
  evidenceRefs: string[];
  unmetReductionPerCoveragePoint: number;
  confirmedDemandLiftPerProviderConfirmationPoint: number;
  grossContributionRubPerConfirmedDemandIndexPoint: number | null;
};

export type DistrictTwinScenarioInput = {
  id: string;
  baseline: DistrictTwinBaseline;
  interventions: DistrictTwinIntervention[];
  assumptions: DistrictTwinAssumptionSet;
};

export type DistrictTwinScenarioResult = {
  id: string;
  state: 'BLOCKED_NOT_CALIBRATED' | 'MODELLED_DEMO' | 'MODELLED_CALIBRATED';
  baseline: DistrictTwinBaseline;
  interventions: DistrictTwinIntervention[];
  assumptions: DistrictTwinAssumptionSet;
  expected: {
    freshSupply: number | null;
    supplyCoverageRatio: number | null;
    unmetIntentRate: number | null;
    providerConfirmationRate: number | null;
    confirmedDemandRate: number | null;
    footfallIndex: number | null;
    partnerGrossContributionRub: number | null;
  };
  deltas: {
    freshSupply: number | null;
    supplyCoverageRatio: number | null;
    unmetIntentRate: number | null;
    providerConfirmationRate: number | null;
    confirmedDemandRate: number | null;
    footfallIndex: number | null;
    partnerGrossContributionRub: number | null;
  };
  claims: {
    actualOutcome: false;
    investmentDecision: false;
    causalityEstablished: false;
  };
  verificationPlan: string[];
};

export type DistrictTwinVerification = {
  scenarioId: string;
  mode: DemandSignalEvidenceMode;
  postBaseline: DistrictTwinBaseline | null;
  enoughEvidence: boolean;
  forecastError: {
    unmetIntentRate: number | null;
    supplyCoverageRatio: number | null;
    providerConfirmationRate: number | null;
    confirmedDemandRate: number | null;
    footfallIndex: number | null;
  };
  result: 'INSUFFICIENT' | 'VERIFIED_DIRECTIONALLY' | 'MISSED_DIRECTION';
  causality: 'not-established';
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function finiteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function baselineFromDemandCell({
  id,
  cell,
  footfallIndex = null,
  partnerGrossContributionRub = null
}: {
  id: string;
  cell: DistrictDemandCell;
  footfallIndex?: number | null;
  partnerGrossContributionRub?: number | null;
}): DistrictTwinBaseline {
  return {
    id,
    mode: cell.mode,
    districtId: cell.districtId,
    intentKind: cell.intentKind,
    timeBucket: cell.timeBucket,
    sourceCellKey: cell.key,
    observations: cell.observations,
    distinctDays: cell.distinctDays,
    unmetIntentRate: cell.unmetIntentRate,
    supplyCoverageRatio: cell.supplyCoverageRatio,
    averageFreshSupply: cell.averageFreshAvailableSupply,
    providerConfirmationRate: cell.providerConfirmationRate,
    confirmedDemandRate: cell.confirmedDemandRate,
    footfallIndex,
    partnerGrossContributionRub
  };
}

export function validateTwinAssumptions(assumptions: DistrictTwinAssumptionSet) {
  const blockers: string[] = [];

  if (!finiteNonNegative(assumptions.unmetReductionPerCoveragePoint)) {
    blockers.push('invalid-unmet-reduction-coefficient');
  }
  if (!finiteNonNegative(assumptions.confirmedDemandLiftPerProviderConfirmationPoint)) {
    blockers.push('invalid-confirmed-demand-coefficient');
  }
  if (
    assumptions.grossContributionRubPerConfirmedDemandIndexPoint !== null
    && !finiteNonNegative(assumptions.grossContributionRubPerConfirmedDemandIndexPoint)
  ) {
    blockers.push('invalid-gross-contribution-coefficient');
  }

  if (assumptions.provenance === 'measured') {
    if (!assumptions.calibratedAt) blockers.push('measured-calibration-time-missing');
    if (assumptions.evidenceRefs.length === 0) blockers.push('measured-evidence-missing');
  }

  return { valid: blockers.length === 0, blockers };
}

export function twinScenarioCanRun(input: DistrictTwinScenarioInput) {
  const validation = validateTwinAssumptions(input.assumptions);
  if (!validation.valid) {
    return { allowed: false, reason: 'invalid-assumptions' as const, blockers: validation.blockers };
  }

  if (
    input.baseline.mode === 'actual'
    && input.assumptions.provenance !== 'measured'
  ) {
    return {
      allowed: false,
      reason: 'actual-scenario-requires-measured-calibration' as const,
      blockers: []
    };
  }

  return { allowed: true, reason: 'ready' as const, blockers: [] };
}

function deltaOrNull(after: number | null, before: number | null) {
  if (after === null || before === null) return null;
  return after - before;
}

export function simulateDistrictTwin(
  input: DistrictTwinScenarioInput
): DistrictTwinScenarioResult {
  const gate = twinScenarioCanRun(input);

  if (!gate.allowed) {
    return {
      id: input.id,
      state: 'BLOCKED_NOT_CALIBRATED',
      baseline: input.baseline,
      interventions: input.interventions,
      assumptions: input.assumptions,
      expected: {
        freshSupply: null,
        supplyCoverageRatio: null,
        unmetIntentRate: null,
        providerConfirmationRate: null,
        confirmedDemandRate: null,
        footfallIndex: null,
        partnerGrossContributionRub: null
      },
      deltas: {
        freshSupply: null,
        supplyCoverageRatio: null,
        unmetIntentRate: null,
        providerConfirmationRate: null,
        confirmedDemandRate: null,
        footfallIndex: null,
        partnerGrossContributionRub: null
      },
      claims: {
        actualOutcome: false,
        investmentDecision: false,
        causalityEstablished: false
      },
      verificationPlan: [
        'Calibrate scenario coefficients from accepted actual evidence before production forecasting.'
      ]
    };
  }

  let addedFreshSupply = 0;
  let expectedProviderConfirmationDelta = 0;
  let expectedDemandRedistributionShare = 0;
  let expectedFootfallIndexDelta = 0;

  for (const intervention of input.interventions) {
    if (intervention.type === 'add-supply') {
      addedFreshSupply += Math.max(0, intervention.addedFreshSupplyUnits);
    } else if (intervention.type === 'extend-hours') {
      addedFreshSupply += Math.max(0, intervention.equivalentFreshSupplyUnits);
    } else if (intervention.type === 'evening-route') {
      expectedDemandRedistributionShare += clamp01(
        intervention.expectedDemandRedistributionShare
      );
      expectedFootfallIndexDelta += intervention.expectedFootfallIndexDelta;
    } else if (intervention.type === 'ticket-provider') {
      expectedProviderConfirmationDelta += intervention.expectedProviderConfirmationDelta;
    }
  }

  const baselineFreshSupply = input.baseline.averageFreshSupply;
  const expectedFreshSupply =
    baselineFreshSupply === null
      ? null
      : Math.max(0, baselineFreshSupply + addedFreshSupply);

  const baselineCoverage = input.baseline.supplyCoverageRatio;
  const coverageDelta =
    baselineCoverage === null
      ? null
      : Math.min(
          1 - baselineCoverage,
          addedFreshSupply <= 0
            ? 0
            : addedFreshSupply / Math.max(1, (baselineFreshSupply ?? 0) + addedFreshSupply)
        );
  const expectedCoverage =
    baselineCoverage === null || coverageDelta === null
      ? null
      : clamp01(baselineCoverage + coverageDelta);

  const expectedUnmet =
    input.baseline.unmetIntentRate === null || coverageDelta === null
      ? null
      : clamp01(
          input.baseline.unmetIntentRate
          - coverageDelta * input.assumptions.unmetReductionPerCoveragePoint
          + expectedDemandRedistributionShare * 0.1
        );

  const expectedProviderConfirmation =
    input.baseline.providerConfirmationRate === null
      ? null
      : clamp01(
          input.baseline.providerConfirmationRate
          + expectedProviderConfirmationDelta
        );

  const providerConfirmationDelta =
    expectedProviderConfirmation === null
    || input.baseline.providerConfirmationRate === null
      ? null
      : expectedProviderConfirmation - input.baseline.providerConfirmationRate;

  const expectedConfirmedDemand =
    input.baseline.confirmedDemandRate === null
      ? null
      : clamp01(
          input.baseline.confirmedDemandRate
          + (providerConfirmationDelta ?? 0)
            * input.assumptions.confirmedDemandLiftPerProviderConfirmationPoint
          + expectedDemandRedistributionShare * 0.05
        );

  const expectedFootfall =
    input.baseline.footfallIndex === null
      ? null
      : Math.max(0, input.baseline.footfallIndex + expectedFootfallIndexDelta);

  const confirmedDemandDelta =
    expectedConfirmedDemand === null
    || input.baseline.confirmedDemandRate === null
      ? null
      : expectedConfirmedDemand - input.baseline.confirmedDemandRate;

  const expectedContribution =
    input.baseline.partnerGrossContributionRub === null
    || input.assumptions.grossContributionRubPerConfirmedDemandIndexPoint === null
    || confirmedDemandDelta === null
      ? null
      : Math.max(
          0,
          input.baseline.partnerGrossContributionRub
          + confirmedDemandDelta
            * 100
            * input.assumptions.grossContributionRubPerConfirmedDemandIndexPoint
        );

  return {
    id: input.id,
    state:
      input.assumptions.provenance === 'measured'
        ? 'MODELLED_CALIBRATED'
        : 'MODELLED_DEMO',
    baseline: input.baseline,
    interventions: input.interventions,
    assumptions: input.assumptions,
    expected: {
      freshSupply: expectedFreshSupply,
      supplyCoverageRatio: expectedCoverage,
      unmetIntentRate: expectedUnmet,
      providerConfirmationRate: expectedProviderConfirmation,
      confirmedDemandRate: expectedConfirmedDemand,
      footfallIndex: expectedFootfall,
      partnerGrossContributionRub: expectedContribution
    },
    deltas: {
      freshSupply: deltaOrNull(expectedFreshSupply, input.baseline.averageFreshSupply),
      supplyCoverageRatio: deltaOrNull(expectedCoverage, input.baseline.supplyCoverageRatio),
      unmetIntentRate: deltaOrNull(expectedUnmet, input.baseline.unmetIntentRate),
      providerConfirmationRate: providerConfirmationDelta,
      confirmedDemandRate: confirmedDemandDelta,
      footfallIndex: deltaOrNull(expectedFootfall, input.baseline.footfallIndex),
      partnerGrossContributionRub: deltaOrNull(
        expectedContribution,
        input.baseline.partnerGrossContributionRub
      )
    },
    claims: {
      actualOutcome: false,
      investmentDecision: false,
      causalityEstablished: false
    },
    verificationPlan: [
      'Freeze baseline window and scenario version before intervention.',
      'Record exact intervention activation time and scope.',
      'Collect post-launch observations using the same demand-cell definitions.',
      'Require the same minimum sample and distinct-day thresholds as Demand Control.',
      'Compare forecast direction and error; do not infer causality from before/after alone.'
    ]
  };
}

function sameDirection(
  predictedDelta: number | null,
  observedDelta: number | null
) {
  if (predictedDelta === null || observedDelta === null) return null;
  if (predictedDelta === 0) return Math.abs(observedDelta) < 0.000001;
  return Math.sign(predictedDelta) === Math.sign(observedDelta);
}

export function verifyDistrictTwinScenario({
  scenario,
  postBaseline
}: {
  scenario: DistrictTwinScenarioResult;
  postBaseline: DistrictTwinBaseline | null;
}): DistrictTwinVerification {
  const enoughEvidence =
    postBaseline !== null
    && postBaseline.observations >= DEMAND_CONTROL_POLICY_V1.minimumObservations
    && postBaseline.distinctDays >= DEMAND_CONTROL_POLICY_V1.minimumDistinctDays;

  if (!enoughEvidence || !postBaseline) {
    return {
      scenarioId: scenario.id,
      mode: scenario.baseline.mode,
      postBaseline,
      enoughEvidence: false,
      forecastError: {
        unmetIntentRate: null,
        supplyCoverageRatio: null,
        providerConfirmationRate: null,
        confirmedDemandRate: null,
        footfallIndex: null
      },
      result: 'INSUFFICIENT',
      causality: 'not-established'
    };
  }

  const forecastError = {
    unmetIntentRate:
      scenario.expected.unmetIntentRate === null || postBaseline.unmetIntentRate === null
        ? null
        : postBaseline.unmetIntentRate - scenario.expected.unmetIntentRate,
    supplyCoverageRatio:
      scenario.expected.supplyCoverageRatio === null || postBaseline.supplyCoverageRatio === null
        ? null
        : postBaseline.supplyCoverageRatio - scenario.expected.supplyCoverageRatio,
    providerConfirmationRate:
      scenario.expected.providerConfirmationRate === null
      || postBaseline.providerConfirmationRate === null
        ? null
        : postBaseline.providerConfirmationRate - scenario.expected.providerConfirmationRate,
    confirmedDemandRate:
      scenario.expected.confirmedDemandRate === null
      || postBaseline.confirmedDemandRate === null
        ? null
        : postBaseline.confirmedDemandRate - scenario.expected.confirmedDemandRate,
    footfallIndex:
      scenario.expected.footfallIndex === null || postBaseline.footfallIndex === null
        ? null
        : postBaseline.footfallIndex - scenario.expected.footfallIndex
  };

  const directionChecks = [
    sameDirection(
      scenario.deltas.unmetIntentRate,
      postBaseline.unmetIntentRate === null || scenario.baseline.unmetIntentRate === null
        ? null
        : postBaseline.unmetIntentRate - scenario.baseline.unmetIntentRate
    ),
    sameDirection(
      scenario.deltas.supplyCoverageRatio,
      postBaseline.supplyCoverageRatio === null || scenario.baseline.supplyCoverageRatio === null
        ? null
        : postBaseline.supplyCoverageRatio - scenario.baseline.supplyCoverageRatio
    ),
    sameDirection(
      scenario.deltas.providerConfirmationRate,
      postBaseline.providerConfirmationRate === null
      || scenario.baseline.providerConfirmationRate === null
        ? null
        : postBaseline.providerConfirmationRate - scenario.baseline.providerConfirmationRate
    )
  ].filter((item): item is boolean => item !== null);

  const directionPass =
    directionChecks.length > 0 && directionChecks.every(Boolean);

  return {
    scenarioId: scenario.id,
    mode: scenario.baseline.mode,
    postBaseline,
    enoughEvidence: true,
    forecastError,
    result: directionPass ? 'VERIFIED_DIRECTIONALLY' : 'MISSED_DIRECTION',
    causality: 'not-established'
  };
}
