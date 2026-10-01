import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { currentMoscowIntegrationRoadmap } from '../spatial/integrationMasterPlanGate';

const evidenceLabels: Array<{
  key: keyof typeof currentMoscowIntegrationRoadmap.phase0.evidence;
  title: string;
}> = [
  { key: 'romanovFieldExperience', title: 'Romanov field experience' },
  { key: 'physicalSpatialAccuracy', title: 'Physical spatial accuracy' },
  { key: 'oldEnglishCourtRepeatability', title: 'Old English Court repeatability' },
  { key: 'supervisedUserPilot', title: 'Supervised visitor pilot' },
  { key: 'governmentEvidencePackage', title: 'Government evidence package' }
];

export default function IntegrationMasterPlanGatePanel() {
  const roadmap = currentMoscowIntegrationRoadmap;
  const gate = roadmap.phase0;

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>SPATIAL SCALE LOCK</Text>
        <Text style={styles.title}>
          {gate.status === 'pass'
            ? 'Phase 0 пройдена'
            : 'Масштабирование заблокировано до реального field proof'}
        </Text>
        <Text style={styles.body}>
          Canonical authority: MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.
          Код не может открыть Destination Package v2 и последующие фазы до PASS MOSCOW-INT-00.
        </Text>
      </View>

      <View style={styles.evidence}>
        {evidenceLabels.map(({ key, title }) => {
          const ready = gate.evidence[key];
          return (
            <View key={key} style={styles.evidenceRow}>
              <Text style={[styles.dot, ready && styles.dotReady]}>{ready ? '●' : '○'}</Text>
              <Text style={styles.evidenceTitle}>{title}</Text>
              <Text style={[styles.state, ready && styles.stateReady]}>
                {ready ? 'PROVEN' : 'NOT PROVEN'}
              </Text>
            </View>
          );
        })}
      </View>

      {gate.nextRequiredEvidence.length > 0 && (
        <View style={styles.nextCard}>
          <Text style={styles.nextKicker}>NEXT REQUIRED EVIDENCE</Text>
          {gate.nextRequiredEvidence.map((item, index) => (
            <View key={item} style={styles.nextRow}>
              <Text style={styles.nextIndex}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={styles.nextText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.phases}>
        {roadmap.phases.map((phase) => (
          <View key={phase.id} style={styles.phaseRow}>
            <Text style={styles.phaseId}>{phase.id}</Text>
            <View style={styles.phaseCopy}>
              <Text style={styles.phaseTitle}>{phase.title}</Text>
              <Text style={styles.phaseStatus}>{phase.status.toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.guardrail}>
        <Text style={styles.guardrailTitle}>НЕ СВЯЗЫВАТЬ С PROVIDER PASS</Text>
        <Text style={styles.guardrailBody}>
          YCLIENTS / Live Destination evidence идёт параллельно. Даже реальный booking/provider PASS
          не заменяет Romanov, Old English Court и visitor field proof и не снимает spatial scale lock.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  hero: { gap: 7 },
  kicker: { color: '#b99b69', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#f5efe5', fontSize: 22, lineHeight: 28, fontWeight: '900' },
  body: { color: '#aaa196', fontSize: 12, lineHeight: 18 },
  evidence: { borderWidth: 1, borderColor: '#342e25', borderRadius: 18, overflow: 'hidden' },
  evidenceRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#342e25'
  },
  dot: { color: '#7f7464', fontSize: 13 },
  dotReady: { color: '#d1ad6f' },
  evidenceTitle: { flex: 1, color: '#e6dfd4', fontSize: 12, fontWeight: '700' },
  state: { color: '#8a8175', fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  stateReady: { color: '#d1ad6f' },
  nextCard: { backgroundColor: '#15120e', borderRadius: 18, padding: 14, gap: 8 },
  nextKicker: { color: '#b99b69', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  nextRow: { flexDirection: 'row', gap: 9 },
  nextIndex: { color: '#806f55', fontSize: 10, fontWeight: '900', width: 20 },
  nextText: { color: '#b7afa3', fontSize: 11, lineHeight: 17, flex: 1 },
  phases: { gap: 7 },
  phaseRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#2e2a23',
    borderRadius: 14,
    padding: 11
  },
  phaseId: { color: '#9a8564', fontSize: 9, fontWeight: '900', width: 88 },
  phaseCopy: { flex: 1 },
  phaseTitle: { color: '#d8d1c6', fontSize: 11, fontWeight: '700' },
  phaseStatus: { color: '#776f65', fontSize: 8, fontWeight: '900', letterSpacing: 0.6, marginTop: 3 },
  guardrail: { backgroundColor: '#1a1712', borderRadius: 16, padding: 14 },
  guardrailTitle: { color: '#c5a267', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  guardrailBody: { color: '#9d9588', fontSize: 11, lineHeight: 17, marginTop: 5 }
});
