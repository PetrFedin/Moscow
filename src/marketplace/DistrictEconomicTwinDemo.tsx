import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import {
  demoTwinScenarios,
  districtTwinCopy
} from './districtEconomicTwinDemo.ts';

function pct(value: number | null) {
  if (value === null) return '—';
  return `${Math.round(value * 100)}%`;
}

function num(value: number | null, digits = 1) {
  if (value === null) return '—';
  return value.toFixed(digits);
}

export default function DistrictEconomicTwinDemo({ language }: { language: AppLanguage }) {
  const copy = districtTwinCopy[language];
  const [scenarioId, setScenarioId] = useState(demoTwinScenarios[0]?.id ?? '');
  const scenario =
    demoTwinScenarios.find((item) => item.id === scenarioId) ?? demoTwinScenarios[0];

  if (!scenario) return null;

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

      <View style={styles.tabs}>
        {demoTwinScenarios.map((item) => (
          <PhysicalPressable
            key={item.id}
            style={[styles.tab, item.id === scenario.id && styles.tabActive]}
            contentStyle={styles.tabContent}
            onPress={() => setScenarioId(item.id)}
          >
            <Text style={[styles.tabText, item.id === scenario.id && styles.tabTextActive]}>
              {item.interventions[0]?.label ?? item.id}
            </Text>
          </PhysicalPressable>
        ))}
      </View>

      <View style={styles.assumptionBanner}>
        <Text style={styles.assumptionTitle}>{copy.assumption}</Text>
        <Text style={styles.assumptionText}>
          {scenario.assumptions.id} · v{scenario.assumptions.version} · {scenario.state}
        </Text>
      </View>

      <View style={styles.grid}>
        <Panel title={copy.baseline}>
          <Row label="unmet intent" value={pct(scenario.baseline.unmetIntentRate)} />
          <Row label="supply coverage" value={pct(scenario.baseline.supplyCoverageRatio)} />
          <Row label="fresh supply" value={num(scenario.baseline.averageFreshSupply)} />
          <Row label="provider confirmation" value={pct(scenario.baseline.providerConfirmationRate)} />
          <Row label="confirmed demand" value={pct(scenario.baseline.confirmedDemandRate)} />
          <Row label="footfall index" value={num(scenario.baseline.footfallIndex)} />
          <Row label="partner contribution" value={num(scenario.baseline.partnerGrossContributionRub, 0)} />
        </Panel>

        <Panel title={copy.intervention}>
          {scenario.interventions.map((item) => (
            <View key={item.id} style={styles.interventionCard}>
              <Text style={styles.interventionTitle}>{item.label}</Text>
              <Text style={styles.interventionMeta}>{JSON.stringify(item)}</Text>
            </View>
          ))}
        </Panel>

        <Panel title={copy.expected}>
          <Row label="unmet intent" value={pct(scenario.expected.unmetIntentRate)} />
          <Row label="supply coverage" value={pct(scenario.expected.supplyCoverageRatio)} />
          <Row label="fresh supply" value={num(scenario.expected.freshSupply)} />
          <Row label="provider confirmation" value={pct(scenario.expected.providerConfirmationRate)} />
          <Row label="confirmed demand" value={pct(scenario.expected.confirmedDemandRate)} />
          <Row label="footfall index" value={num(scenario.expected.footfallIndex)} />
          <Row label="partner contribution" value={num(scenario.expected.partnerGrossContributionRub, 0)} />
        </Panel>

        <Panel title={copy.delta}>
          <Row label="unmet intent" value={pct(scenario.deltas.unmetIntentRate)} />
          <Row label="supply coverage" value={pct(scenario.deltas.supplyCoverageRatio)} />
          <Row label="fresh supply" value={num(scenario.deltas.freshSupply)} />
          <Row label="provider confirmation" value={pct(scenario.deltas.providerConfirmationRate)} />
          <Row label="confirmed demand" value={pct(scenario.deltas.confirmedDemandRate)} />
          <Row label="footfall index" value={num(scenario.deltas.footfallIndex)} />
          <Row label="partner contribution" value={num(scenario.deltas.partnerGrossContributionRub, 0)} />
        </Panel>
      </View>

      <View style={styles.verificationBox}>
        <Text style={styles.sectionLabel}>{copy.verification}</Text>
        {scenario.verificationPlan.map((item, index) => (
          <View key={item} style={styles.verificationRow}>
            <Text style={styles.verificationIndex}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={styles.verificationText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>{copy.noCausality}</Text>
      </View>
    </View>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.rows}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, padding: 18, backgroundColor: '#121518', borderWidth: 1, borderColor: '#393226' },
  kicker: { color: '#c8a96a', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#f4eee4', fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 7 },
  body: { color: '#aeb4b9', fontSize: 12, lineHeight: 18, marginTop: 8 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  tab: { minHeight: 38, borderRadius: 12, backgroundColor: '#111417', borderWidth: 1, borderColor: '#2a2f34' },
  tabActive: { backgroundColor: '#d3b36f', borderColor: '#e5c987' },
  tabContent: { paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  tabText: { color: '#aeb4b9', fontSize: 9, fontWeight: '900' },
  tabTextActive: { color: '#17130c' },
  assumptionBanner: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: '#362c12' },
  assumptionTitle: { color: '#f4d98f', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  assumptionText: { color: '#d8c59b', fontSize: 10, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  panel: { minWidth: 220, flexBasis: '48%', flexGrow: 1, padding: 14, borderRadius: 16, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  sectionLabel: { color: '#c8a96a', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  rows: { gap: 7, marginTop: 10 },
  row: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  rowLabel: { color: '#8f969b', fontSize: 9, lineHeight: 14 },
  rowValue: { color: '#e6ded1', fontSize: 10, lineHeight: 14, fontWeight: '900' },
  interventionCard: { padding: 10, borderRadius: 12, backgroundColor: '#171b1e' },
  interventionTitle: { color: '#eee7dd', fontSize: 12, fontWeight: '900' },
  interventionMeta: { color: '#7f878d', fontSize: 8, lineHeight: 13, marginTop: 5 },
  verificationBox: { marginTop: 14, padding: 15, borderRadius: 16, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  verificationRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  verificationIndex: { width: 20, color: '#716550', fontSize: 8, fontWeight: '900' },
  verificationText: { flex: 1, color: '#aeb4b9', fontSize: 10, lineHeight: 15 },
  warningBox: { marginTop: 12, padding: 14, borderRadius: 15, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  warningText: { color: '#d9b6bc', fontSize: 10, lineHeight: 15, fontWeight: '800' }
});
