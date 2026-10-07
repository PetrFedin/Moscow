import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import {
  demoAcceptedCalibration,
  demoActiveLearningPolicy,
  demoLearningErrors,
  demoLearningSegments,
  demoLearningForecasts,
  demoNextCycleConfidence,
  strategyLearningCopy
} from './cityStrategyLearningDemo.ts';

function pct(value: number | null) {
  if (value === null) return '—';
  return `${Math.round(value * 100)}%`;
}

function num(value: number | null, digits = 3) {
  if (value === null) return '—';
  return value.toFixed(digits);
}

export default function CityStrategyLearningLoopDemo({ language }: { language: AppLanguage }) {
  const copy = strategyLearningCopy[language];

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.history}</Text>
        <View style={styles.summaryGrid}>
          <Metric label="FORECASTS" value={String(demoLearningForecasts.length)} />
          <Metric label="ERROR RECORDS" value={String(demoLearningErrors.length)} />
          <Metric label="SEGMENTS" value={String(demoLearningSegments.length)} />
          <Metric label="ACTIVE POLICY" value={demoActiveLearningPolicy.version} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.segments}</Text>
        <View style={styles.list}>
          {demoLearningSegments.map((segment) => (
            <View key={segment.key} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.cardTitle}>{segment.key}</Text>
                <Text style={styles.badge}>{segment.systematicBias}</Text>
              </View>
              <Text style={styles.meta}>
                records={segment.records}
                {' · '}
                sufficient={segment.sufficientRecords}
                {' · '}
                hitRate={pct(segment.directionalHitRate)}
              </Text>
              <Text style={styles.meta}>
                MAE={num(segment.meanAbsoluteError)}
                {' · '}
                confidenceAdjustment={num(segment.confidenceAdjustment)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.calibration}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {demoAcceptedCalibration.sourcePolicyVersion} → {demoAcceptedCalibration.proposedPolicyVersion}
          </Text>
          <Text style={styles.meta}>state={demoAcceptedCalibration.state}</Text>
          <Text style={styles.meta}>
            unmet coefficient:
            {' '}
            {demoAcceptedCalibration.sourceAssumptions.unmetReductionPerCoveragePoint.toFixed(3)}
            {' → '}
            {demoAcceptedCalibration.proposedAssumptions.unmetReductionPerCoveragePoint.toFixed(3)}
          </Text>
          <Text style={styles.meta}>
            confirmed-demand coefficient:
            {' '}
            {demoAcceptedCalibration.sourceAssumptions.confirmedDemandLiftPerProviderConfirmationPoint.toFixed(3)}
            {' → '}
            {demoAcceptedCalibration.proposedAssumptions.confirmedDemandLiftPerProviderConfirmationPoint.toFixed(3)}
          </Text>
          <Text style={styles.meta}>
            holdout directional hit rate={pct(demoAcceptedCalibration.holdoutDirectionalHitRate)}
          </Text>
          <Text style={styles.meta}>{demoAcceptedCalibration.acceptanceRef ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.policy}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {demoActiveLearningPolicy.id} · v{demoActiveLearningPolicy.version}
          </Text>
          <Text style={styles.meta}>status={demoActiveLearningPolicy.status}</Text>
          <Text style={styles.meta}>predecessor={demoActiveLearningPolicy.predecessorVersion ?? '—'}</Text>
          <Text style={styles.meta}>
            evidence refs={demoActiveLearningPolicy.evidenceRefs.length}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.confidence}</Text>
        <View style={styles.summaryGrid}>
          <Metric label="ADD SUPPLY · HERITAGE CORE" value={pct(demoNextCycleConfidence.addSupplyHeritageCore)} />
          <Metric label="EXTEND HOURS · MUSEUM" value={pct(demoNextCycleConfidence.extendHoursMuseumQuarter)} />
          <Metric label="TICKET PROVIDER · MUSEUM" value={pct(demoNextCycleConfidence.ticketProviderMuseumQuarter)} />
        </View>
      </View>

      <View style={styles.ruleBox}>
        <Text style={styles.rule}>{copy.rule}</Text>
      </View>
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
  section: { marginTop: 16 },
  sectionLabel: { color: '#c8a96a', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metricCard: { minWidth: 150, flexGrow: 1, flexBasis: '22%', backgroundColor: '#101316', borderRadius: 15, padding: 13, borderWidth: 1, borderColor: '#2a2f34' },
  metricLabel: { color: '#858c92', fontSize: 8, fontWeight: '900' },
  metricValue: { color: '#eadab8', fontSize: 18, fontWeight: '900', marginTop: 6 },
  list: { gap: 8, marginTop: 9 },
  card: { padding: 13, borderRadius: 15, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTitle: { flex: 1, color: '#ece6dc', fontSize: 12, lineHeight: 17, fontWeight: '900' },
  badge: { color: '#d3b36f', fontSize: 8, fontWeight: '900' },
  meta: { color: '#92999f', fontSize: 9, lineHeight: 14, marginTop: 5 },
  ruleBox: { marginTop: 15, padding: 14, borderRadius: 15, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  rule: { color: '#d9b6bc', fontSize: 10, lineHeight: 15, fontWeight: '900' }
});
