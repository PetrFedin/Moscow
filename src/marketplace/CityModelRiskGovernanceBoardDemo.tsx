import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import {
  demoChallengerEvaluation,
  demoModelDriftSignals,
  demoModelInventory,
  demoModelRiskBoard,
  demoModelSegmentWeaknesses,
  demoPromotionGate,
  demoRollbackProposal,
  modelRiskCopy
} from './cityModelRiskDemo.ts';

function pct(value: number | null) {
  if (value === null) return '—';
  return `${Math.round(value * 100)}%`;
}

function num(value: number | null, digits = 3) {
  if (value === null) return '—';
  return value.toFixed(digits);
}

export default function CityModelRiskGovernanceBoardDemo({ language }: { language: AppLanguage }) {
  const copy = modelRiskCopy[language];
  const board = demoModelRiskBoard;

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <Metric label="ACTIVE MODELS" value={String(board.summary.activeModels)} />
        <Metric label="HIGH/CRITICAL DRIFT" value={String(board.summary.highOrCriticalDrift)} />
        <Metric label="WEAK SEGMENTS" value={String(board.summary.weakSegments)} />
        <Metric label="CHALLENGERS WINNING" value={String(board.summary.challengersWinning)} />
        <Metric label="PROMOTION READY" value={String(board.summary.promotionReady)} />
        <Metric label="ROLLBACK REVIEW" value={String(board.summary.rollbackUnderReview)} />
      </View>

      <Section title={copy.inventory}>
        {demoModelInventory.map((model) => (
          <View key={model.id} style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.cardTitle}>{model.modelName}</Text>
              <Text style={styles.badge}>{model.status}</Text>
            </View>
            <Text style={styles.meta}>
              {model.modelType} · {model.riskTier}
            </Text>
            <Text style={styles.meta}>
              production={model.currentProductionVersion ?? '—'}
              {' · '}
              challenger={model.challengerVersion ?? '—'}
            </Text>
            <Text style={styles.meta}>{model.ownerRole}</Text>
          </View>
        ))}
      </Section>

      <Section title={copy.lineage}>
        {board.lineage.map((item) => (
          <View key={`${item.modelId}-${item.version}-${item.state}`} style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.modelId} · v{item.version}
            </Text>
            <Text style={styles.meta}>
              state={item.state}
              {' · '}
              predecessor={item.predecessorVersion ?? '—'}
            </Text>
            <Text style={styles.meta}>
              acceptance={item.acceptanceRef ?? '—'}
              {' · '}
              activation={item.activationRef ?? '—'}
            </Text>
          </View>
        ))}
      </Section>

      <Section title={copy.drift}>
        {demoModelDriftSignals.map((signal) => {
          const weakness = demoModelSegmentWeaknesses.find(
            (item) => item.segmentKey === signal.segmentKey
          );
          return (
            <View
              key={signal.segmentKey}
              style={[
                styles.card,
                (signal.severity === 'HIGH' || signal.severity === 'CRITICAL') && styles.warningCard
              ]}
            >
              <View style={styles.topRow}>
                <Text style={styles.cardTitle}>{signal.segmentKey}</Text>
                <Text style={styles.badge}>
                  {signal.signal} · {signal.severity}
                </Text>
              </View>
              <Text style={styles.meta}>
                hitRate={pct(signal.currentDirectionalHitRate)}
                {' · '}
                baseline={pct(signal.baselineDirectionalHitRate)}
              </Text>
              <Text style={styles.meta}>
                MAE={num(signal.currentMeanAbsoluteError)}
                {' · '}
                baselineMAE={num(signal.baselineMeanAbsoluteError)}
              </Text>
              <Text style={styles.meta}>
                weakness={weakness?.weakness ?? 'NONE'}
                {' · '}
                confidenceAdjustment={num(signal.confidenceAdjustment)}
              </Text>
            </View>
          );
        })}
      </Section>

      <Section title={copy.challenger}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {demoChallengerEvaluation.incumbentVersion}
            {' → '}
            {demoChallengerEvaluation.challengerVersion}
          </Text>
          <Text style={styles.meta}>
            outcome={demoChallengerEvaluation.outcome}
            {' · '}
            sample={demoChallengerEvaluation.sampleSize}
          </Text>
          <Text style={styles.meta}>
            directional:
            {' '}
            {pct(demoChallengerEvaluation.incumbentDirectionalHitRate)}
            {' → '}
            {pct(demoChallengerEvaluation.challengerDirectionalHitRate)}
          </Text>
          <Text style={styles.meta}>
            MAE:
            {' '}
            {num(demoChallengerEvaluation.incumbentMeanAbsoluteError)}
            {' → '}
            {num(demoChallengerEvaluation.challengerMeanAbsoluteError)}
          </Text>
          <Text style={styles.meta}>
            regressions={demoChallengerEvaluation.segmentRegressionCount}
            {' · '}
            improvements={demoChallengerEvaluation.segmentImprovementCount}
            {' · '}
            risk={demoChallengerEvaluation.regressionRisk}
          </Text>
        </View>
      </Section>

      <Section title={copy.promotion}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {demoPromotionGate.challengerVersion}
          </Text>
          <Text style={styles.meta}>state={demoPromotionGate.state}</Text>
          <Text style={styles.meta}>
            approvals={demoPromotionGate.requiredApprovals.length}
            {' · '}
            rollbackPlan={demoPromotionGate.rollbackPlanRef ?? '—'}
            {' · '}
            monitoringPlan={demoPromotionGate.monitoringPlanRef ?? '—'}
          </Text>
          {demoPromotionGate.blockers.length > 0 && (
            <Text style={styles.blockers}>{demoPromotionGate.blockers.join(' · ')}</Text>
          )}
        </View>
      </Section>

      <Section title={copy.rollback}>
        <View style={styles.warningCard}>
          <Text style={styles.cardTitle}>
            {demoRollbackProposal.currentVersion}
            {' → '}
            {demoRollbackProposal.rollbackTargetVersion}
          </Text>
          <Text style={styles.meta}>
            reason={demoRollbackProposal.reason}
            {' · '}
            state={demoRollbackProposal.state}
          </Text>
          <Text style={styles.meta}>
            evidence={demoRollbackProposal.evidenceRefs.join(', ')}
          </Text>
        </View>
      </Section>

      <View style={styles.ruleBox}>
        <Text style={styles.rule}>{copy.rule}</Text>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, padding: 18, backgroundColor: '#121518', borderWidth: 1, borderColor: '#393226' },
  kicker: { color: '#c8a96a', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#f4eee4', fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 7 },
  body: { color: '#aeb4b9', fontSize: 12, lineHeight: 18, marginTop: 8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metricCard: { minWidth: 150, flexGrow: 1, flexBasis: '22%', backgroundColor: '#101316', borderRadius: 15, padding: 13, borderWidth: 1, borderColor: '#2a2f34' },
  metricLabel: { color: '#858c92', fontSize: 8, fontWeight: '900' },
  metricValue: { color: '#eadab8', fontSize: 18, fontWeight: '900', marginTop: 6 },
  section: { marginTop: 16 },
  sectionLabel: { color: '#c8a96a', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  list: { gap: 8, marginTop: 9 },
  card: { padding: 13, borderRadius: 15, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  warningCard: { padding: 13, borderRadius: 15, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTitle: { flex: 1, color: '#ece6dc', fontSize: 12, lineHeight: 17, fontWeight: '900' },
  badge: { color: '#d3b36f', fontSize: 8, fontWeight: '900' },
  meta: { color: '#92999f', fontSize: 9, lineHeight: 14, marginTop: 5 },
  blockers: { color: '#c89aa1', fontSize: 9, lineHeight: 14, marginTop: 6 },
  ruleBox: { marginTop: 15, padding: 14, borderRadius: 15, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  rule: { color: '#d9b6bc', fontSize: 10, lineHeight: 15, fontWeight: '900' }
});
