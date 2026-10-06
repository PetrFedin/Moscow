import {
  buildDistrictScaleModel,
  currentPilotInvestmentEvidence,
  getPilotDecisionReadiness,
  type PilotInvestmentEvidence
} from './pilotInvestmentDecision';
import { evaluateGovernmentDeliveryReadiness } from './governmentDeliveryManifest';
import { investorMvpOffer } from './investorMvpOffer';

export type InvestorControlKpi = {
  id: string;
  title: string;
  purpose: string;
  status: 'pilot-measurement-required' | 'measured';
  value: string | null;
};

export type InvestorControlSnapshot = {
  pilot: {
    title: string;
    territory: string;
    points: number;
    heroObjects: number;
    participantRange: string;
    executionStatus: string;
  };
  deliverables: {
    scoped: number;
    accepted: number;
    titles: string[];
  };
  acceptance: {
    proofPassed: number;
    proofTotal: number;
    governancePassed: number;
    governanceTotal: number;
    formalArtifactsReady: number;
    formalArtifactsTotal: number;
  };
  costBasis: {
    measured: number;
    total: number;
    nextDistrictCostRub: { min: number; max: number } | null;
    formula: string;
    missingLabels: string[];
  };
  cityKpis: InvestorControlKpi[];
  scaleDecision: {
    status: 'READY FOR HUMAN DECISION' | 'BLOCKED';
    decisionPackReady: boolean;
    blockerCount: number;
    proofReady: boolean;
    governanceReady: boolean;
    economicsReady: boolean;
    nextDecision: string;
  };
};

const COST_LABELS: Array<{
  key: keyof PilotInvestmentEvidence['economics'];
  label: string;
}> = [
  { key: 'nextVerifiedObjectVariableCost', label: '₽ / следующий verified object' },
  { key: 'nextVerifiedObjectProductionTime', label: 'Lead time / object' },
  { key: 'developerHoursPerObject', label: 'Developer hours / object' },
  { key: 'institutionOperatorHoursPerObject', label: 'Institution hours / object' },
  { key: 'districtSharedSetupCost', label: 'Shared setup / district' },
  { key: 'districtIntegrationCost', label: 'Integration / district' },
  { key: 'annualOperationsCost', label: 'Annual operations' }
];

function countGovernancePassed(evidence: PilotInvestmentEvidence) {
  return [
    evidence.governance.publicationRightsBlockers === 0,
    evidence.governance.securityDataFlowReviewed,
    evidence.governance.ipHandoverReviewed,
    evidence.governance.operationsSlaReviewed
  ].filter(Boolean).length;
}

function currentExecutionStatus(
  delivery: ReturnType<typeof evaluateGovernmentDeliveryReadiness>
) {
  const verifiedPilot = delivery.stages.find((stage) => stage.id === 'verified-pilot-report');
  const technical = delivery.stages.find((stage) => stage.id === 'technical-pilot-approval');
  const intro = delivery.stages.find((stage) => stage.id === 'intro-pack');

  if (verifiedPilot?.ready) return 'VERIFIED PILOT PACK READY';
  if (technical?.ready) return 'TECHNICAL PILOT PACK READY · EXECUTION NOT PROVEN';
  if (intro?.ready) return 'INTRO PACK READY · TECHNICAL APPROVAL BLOCKED';
  return 'PRE-PILOT · FORMAL PACK INCOMPLETE';
}

export function getInvestorControlSnapshot(
  evidence: PilotInvestmentEvidence = currentPilotInvestmentEvidence
): InvestorControlSnapshot {
  const decision = getPilotDecisionReadiness(evidence);
  const delivery = evaluateGovernmentDeliveryReadiness({ investmentEvidence: evidence });

  const proofPassed = Object.values(evidence.proof).filter(Boolean).length;
  const economicsEntries = COST_LABELS.map((item) => ({
    ...item,
    value: evidence.economics[item.key]
  }));
  const economicsMeasured = economicsEntries.filter((item) => item.value !== null).length;
  const missingLabels = economicsEntries
    .filter((item) => item.value === null)
    .map((item) => item.label);

  let nextDistrictCostRub: { min: number; max: number } | null = null;
  if (decision.economicsReady) {
    const min = buildDistrictScaleModel(evidence, 10);
    const max = buildDistrictScaleModel(evidence, 30);
    nextDistrictCostRub = {
      min: min.initialDistrictDeliveryCostRub,
      max: max.initialDistrictDeliveryCostRub
    };
  }

  const cityKpis: InvestorControlKpi[] = [
    {
      id: 'journey-completion',
      title: 'Journey completion',
      purpose: 'Доля начавших городской сценарий, завершивших согласованный pilot journey.',
      status: 'pilot-measurement-required',
      value: null
    },
    {
      id: 'cultural-reach',
      title: 'Cultural reach',
      purpose: 'Количество реально посещённых / подтверждённых культурных точек в рамках пилотного пути.',
      status: 'pilot-measurement-required',
      value: null
    },
    {
      id: 'heritage-engagement',
      title: 'Heritage engagement',
      purpose: 'Использование исторического слоя: история, аудио и spatial experience там, где он допущен.',
      status: 'pilot-measurement-required',
      value: null
    },
    {
      id: 'provider-handoff',
      title: 'Provider handoff',
      purpose: 'Переходы к согласованным билетным / booking / city-provider действиям без ложного подтверждения транзакции.',
      status: 'pilot-measurement-required',
      value: null
    },
    {
      id: 'continuation',
      title: 'Route continuation',
      purpose: 'Продолжение маршрута / следующего дня после первого завершённого сценария.',
      status: 'pilot-measurement-required',
      value: null
    },
    {
      id: 'production-cycle',
      title: 'Production cycle / object',
      purpose: 'Фактический lead time следующего verified heritage object как показатель масштабируемости.',
      status: evidence.economics.nextVerifiedObjectProductionTime ? 'measured' : 'pilot-measurement-required',
      value: evidence.economics.nextVerifiedObjectProductionTime
        ? `${evidence.economics.nextVerifiedObjectProductionTime.days} дней`
        : null
    }
  ];

  return {
    pilot: {
      title: 'Доказательный пилот',
      territory: 'Варварка — Зарядье',
      points: 5,
      heroObjects: 2,
      participantRange: '20–50',
      executionStatus: currentExecutionStatus(delivery)
    },
    deliverables: {
      scoped: investorMvpOffer.cityDeliverables.length,
      accepted: delivery.stages.find((stage) => stage.id === 'verified-pilot-report')?.ready
        ? investorMvpOffer.cityDeliverables.length
        : 0,
      titles: investorMvpOffer.cityDeliverables.map((item) => item.title)
    },
    acceptance: {
      proofPassed,
      proofTotal: Object.keys(evidence.proof).length,
      governancePassed: countGovernancePassed(evidence),
      governanceTotal: 4,
      formalArtifactsReady: delivery.readyArtifactCount,
      formalArtifactsTotal:
        delivery.readyArtifactCount + delivery.draftArtifactCount + delivery.missingArtifactCount
    },
    costBasis: {
      measured: economicsMeasured,
      total: economicsEntries.length,
      nextDistrictCostRub,
      formula: 'shared setup + integration + 10–30 × measured verified-object cost',
      missingLabels
    },
    cityKpis,
    scaleDecision: {
      status: decision.decisionPackReady ? 'READY FOR HUMAN DECISION' : 'BLOCKED',
      decisionPackReady: decision.decisionPackReady,
      blockerCount: decision.blockers.length,
      proofReady: decision.proofReady,
      governanceReady: decision.governanceReady,
      economicsReady: decision.economicsReady,
      nextDecision: investorMvpOffer.firstDecision
    }
  };
}
