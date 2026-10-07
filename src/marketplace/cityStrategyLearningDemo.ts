import type { AppLanguage } from '../i18n';
import {
  analyzeForecastError,
  buildLearningSegments,
  nextCycleConfidence,
  proposeCalibrationUpdate,
  acceptCalibrationProposal,
  learningPolicyFromAcceptedCalibration,
  activateLearningPolicy,
  type ForecastLearningRecord,
  type ActualOutcomeRecord
} from './cityStrategyLearningAuthority.ts';
import { demoTwinAssumptions } from './districtEconomicTwinDemo.ts';

function forecast(
  id: string,
  archetype: ForecastLearningRecord['archetype'],
  districtContext: ForecastLearningRecord['districtContext'],
  districtId: string,
  expectedUnmet: number,
  expectedCoverage: number,
  expectedConfirmed: number,
  expectedFootfall: number | null
): ForecastLearningRecord {
  return {
    id,
    mode: 'demo',
    scenarioId: `scenario:${id}`,
    policyId: 'moscow-district-twin-policy',
    policyVersion: '1.0.0',
    assumptionSetId: demoTwinAssumptions.id,
    assumptionVersion: demoTwinAssumptions.version,
    archetype,
    districtId,
    districtContext,
    forecastAt: '2026-09-01T00:00:00+03:00',
    expected: {
      unmetIntentDelta: expectedUnmet,
      supplyCoverageDelta: expectedCoverage,
      providerConfirmationDelta: archetype === 'ticket-provider' ? 0.12 : 0,
      confirmedDemandDelta: expectedConfirmed,
      footfallIndexDelta: expectedFootfall
    }
  };
}

function outcome(
  id: string,
  forecastRecordId: string,
  observedUnmet: number,
  observedCoverage: number,
  observedConfirmed: number,
  observedFootfall: number | null
): ActualOutcomeRecord {
  return {
    id,
    forecastRecordId,
    mode: 'demo',
    verifiedAt: '2026-10-01T00:00:00+03:00',
    evidenceRefs: [`DEMO-OUTCOME-${id}`],
    sufficientEvidence: true,
    observed: {
      unmetIntentDelta: observedUnmet,
      supplyCoverageDelta: observedCoverage,
      providerConfirmationDelta: forecastRecordId.includes('ticket') ? 0.08 : 0,
      confirmedDemandDelta: observedConfirmed,
      footfallIndexDelta: observedFootfall
    }
  };
}

export const demoLearningForecasts: ForecastLearningRecord[] = [
  forecast('food-1','add-supply','heritage-core','varvarka-zaryadye',-0.22,0.35,0.04,3),
  forecast('food-2','add-supply','heritage-core','varvarka-zaryadye',-0.20,0.30,0.04,2),
  forecast('food-3','add-supply','heritage-core','varvarka-zaryadye',-0.18,0.28,0.03,2),
  forecast('museum-1','extend-hours','museum-quarter','museum-quarter',-0.08,0.16,0.02,4),
  forecast('museum-2','extend-hours','museum-quarter','museum-quarter',-0.09,0.18,0.02,5),
  forecast('museum-3','extend-hours','museum-quarter','museum-quarter',-0.07,0.15,0.02,4),
  forecast('ticket-1','ticket-provider','museum-quarter','museum-quarter',-0.01,0,0.06,null),
  forecast('ticket-2','ticket-provider','museum-quarter','museum-quarter',-0.01,0,0.06,null)
];

export const demoLearningOutcomes: ActualOutcomeRecord[] = [
  outcome('food-1','food-1',-0.12,0.22,0.03,2),
  outcome('food-2','food-2',-0.11,0.20,0.03,1),
  outcome('food-3','food-3',-0.10,0.18,0.02,1),
  outcome('museum-1','museum-1',-0.07,0.15,0.02,4),
  outcome('museum-2','museum-2',-0.08,0.16,0.02,4),
  outcome('museum-3','museum-3',-0.06,0.14,0.02,3),
  outcome('ticket-1','ticket-1',-0.01,0,0.04,null),
  outcome('ticket-2','ticket-2',-0.01,0,0.05,null)
];

export const demoLearningErrors = demoLearningForecasts.map((item) => {
  const actual = demoLearningOutcomes.find((outcomeItem) => outcomeItem.forecastRecordId === item.id)!;
  return analyzeForecastError({ forecast: item, outcome: actual });
});

export const demoLearningSegments = buildLearningSegments(
  demoLearningErrors,
  'demo'
);

const draftCalibration = proposeCalibrationUpdate({
  id: 'demo-calibration-proposal-v1-1',
  mode: 'demo',
  sourcePolicyVersion: '1.0.0',
  proposedPolicyVersion: '1.1.0',
  sourceAssumptions: {
    ...demoTwinAssumptions,
    provenance: 'measured',
    calibratedAt: '2026-09-01T00:00:00+03:00',
    evidenceRefs: ['DEMO-CALIBRATION-BASELINE']
  },
  errors: demoLearningErrors,
  segments: demoLearningSegments,
  createdAt: '2026-10-06T15:00:00+03:00'
});

export const demoAcceptedCalibration = acceptCalibrationProposal({
  proposal: draftCalibration,
  reviewRef: 'DEMO-MODEL-REVIEW-001',
  acceptanceRef: 'DEMO-MODEL-ACCEPTANCE-001',
  holdoutEvaluationRef: 'DEMO-HOLDOUT-EVALUATION-001',
  holdoutDirectionalHitRate: 0.75
});

export const demoAcceptedLearningPolicy = learningPolicyFromAcceptedCalibration({
  id: 'moscow-learning-policy-v1-1',
  proposal: demoAcceptedCalibration,
  acceptedAt: '2026-10-06T15:30:00+03:00'
});

export const demoActiveLearningPolicy = activateLearningPolicy({
  acceptedPolicy: demoAcceptedLearningPolicy,
  activationRef: 'DEMO-POLICY-ACTIVATION-001'
});

export const demoNextCycleConfidence = {
  addSupplyHeritageCore: nextCycleConfidence({
    baseConfidence: 0.75,
    archetype: 'add-supply',
    districtContext: 'heritage-core',
    segments: demoLearningSegments
  }),
  extendHoursMuseumQuarter: nextCycleConfidence({
    baseConfidence: 0.75,
    archetype: 'extend-hours',
    districtContext: 'museum-quarter',
    segments: demoLearningSegments
  }),
  ticketProviderMuseumQuarter: nextCycleConfidence({
    baseConfidence: 0.75,
    archetype: 'ticket-provider',
    districtContext: 'museum-quarter',
    segments: demoLearningSegments
  })
};

export const strategyLearningCopy = {
  ru: {
    kicker: 'CITY STRATEGY LEARNING LOOP · DEMO',
    title: 'Система учится на ошибках прогнозов, но не меняет production policy сама',
    body: 'Forecast history и actual outcomes агрегируются по intervention archetype × district context. Систематическая ошибка снижает next-cycle confidence; новая calibration требует review, holdout validation, acceptance и отдельной activation.',
    history: 'FORECAST HISTORY',
    segments: 'LEARNING SEGMENTS',
    calibration: 'CALIBRATION PROPOSAL',
    policy: 'POLICY VERSION',
    confidence: 'NEXT-CYCLE CONFIDENCE',
    rule: 'NO AUTO-LEARNING IN PRODUCTION · acceptance + activation required'
  },
  en: {
    kicker: 'CITY STRATEGY LEARNING LOOP · DEMO',
    title: 'The system learns from forecast errors without changing production policy by itself',
    body: 'Forecast history and actual outcomes are aggregated by intervention archetype × district context. Systematic error lowers next-cycle confidence; new calibration requires review, holdout validation, acceptance and separate activation.',
    history: 'FORECAST HISTORY',
    segments: 'LEARNING SEGMENTS',
    calibration: 'CALIBRATION PROPOSAL',
    policy: 'POLICY VERSION',
    confidence: 'NEXT-CYCLE CONFIDENCE',
    rule: 'NO AUTO-LEARNING IN PRODUCTION · acceptance + activation required'
  },
  zh: {
    kicker: 'CITY STRATEGY LEARNING LOOP · 演示',
    title: '系统从预测误差中学习，但不会自行修改生产策略',
    body: 'Forecast history 与 actual outcomes 按 intervention archetype × district context 聚合。系统性误差会降低下一周期置信度；新的 calibration 必须经过 review、holdout validation、acceptance 和单独 activation。',
    history: '预测历史',
    segments: '学习分组',
    calibration: '校准提案',
    policy: '策略版本',
    confidence: '下一周期置信度',
    rule: '生产环境禁止自动学习 · 必须经过验收与激活'
  }
} as const satisfies Record<AppLanguage, Record<string,string>>;
