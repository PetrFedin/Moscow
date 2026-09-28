import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  getMoscowInvestorReadiness,
  type InvestorFieldStatus
} from './moscowInvestorReadiness';

const statusLabels: Record<InvestorFieldStatus, string> = {
  'evidence-ready': 'EVIDENCE',
  'candidate-needs-confirmation': 'CONFIRM',
  'owner-input-required': 'OWNER INPUT',
  'pilot-evidence-required': 'AFTER PILOT',
  'not-set': 'NOT SET'
};

export default function GovernmentInvestorReadinessPanel() {
  const state = useMemo(() => getMoscowInvestorReadiness(), []);

  const priorityFields = state.fields.filter((field) =>
    [
      'mvp',
      'target-audience',
      'product-configuration',
      'ip',
      'physical-proof',
      'unit-economics',
      'round-size',
      'post-money',
      'use-of-funds',
      'cap-table'
    ].includes(field.id)
  );

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>INVESTOR DATA ROOM · MIK FORM MAPPING</Text>
      <Text style={styles.title}>Что готово для инвестиционной экспертизы</Text>
      <Text style={styles.subtitle}>
        Публичная форма инвестиционной экспертизы используется как checklist подготовки. Она не означает одобрение инвестиций и не задаёт нам оценку или размер раунда.
      </Text>

      <View style={styles.metrics}>
        <Metric value={state.evidenceReadyCount} label="evidence-ready" />
        <Metric value={state.ownerInputRequiredCount} label="owner input" />
        <Metric
          value={state.pilotEvidenceRequiredCount + state.notSetCount}
          label="pilot / not set"
        />
      </View>

      <View style={styles.stateCard}>
        <View>
          <Text style={styles.stateLabel}>FORM PREPARATION</Text>
          <Text style={[
            styles.stateValue,
            state.formPreparationReady && styles.stateValueReady
          ]}>
            {state.formPreparationReady ? 'READY' : 'NOT READY'}
          </Text>
        </View>
        <View>
          <Text style={styles.stateLabel}>INVESTOR REVIEW</Text>
          <Text style={[
            styles.stateValue,
            state.investorReviewReady && styles.stateValueReady
          ]}>
            {state.investorReviewReady ? 'READY' : 'AFTER PROOF'}
          </Text>
        </View>
      </View>

      {priorityFields.map((field) => (
        <View key={field.id} style={styles.field}>
          <View style={styles.fieldTop}>
            <Text style={styles.fieldTitle}>{field.label}</Text>
            <View style={[
              styles.badge,
              field.status === 'evidence-ready' && styles.badgeReady,
              field.status === 'candidate-needs-confirmation' && styles.badgeCandidate
            ]}>
              <Text style={[
                styles.badgeText,
                field.status === 'evidence-ready' && styles.badgeTextReady
              ]}>
                {statusLabels[field.status]}
              </Text>
            </View>
          </View>
          {field.value && <Text style={styles.fieldValue}>{field.value}</Text>}
          <Text style={styles.fieldNote}>{field.note}</Text>
        </View>
      ))}

      <View style={styles.rule}>
        <Text style={styles.ruleKicker}>НЕ ЗАПОЛНЯТЬ ИЗ ВОЗДУХА</Text>
        <Text style={styles.ruleText}>
          Размер раунда, post-money, use of funds, cap table, commitments и предыдущее финансирование должны приходить от собственника и measured scale plan. Репозиторий не выводит их автоматически.
        </Text>
      </View>
    </View>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 18 },
  kicker: {
    color: '#9b84b7',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  title: {
    marginTop: 6,
    color: '#f1ebf6',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900'
  },
  subtitle: {
    marginTop: 6,
    color: '#9b95a2',
    fontSize: 11,
    lineHeight: 17
  },
  metrics: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 7
  },
  metric: {
    flex: 1,
    padding: 10,
    borderRadius: 13,
    backgroundColor: '#15121a',
    borderWidth: 1,
    borderColor: '#332a3d'
  },
  metricValue: {
    color: '#d1b9e6',
    fontSize: 19,
    fontWeight: '900'
  },
  metricLabel: {
    marginTop: 3,
    color: '#776c80',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '700'
  },
  stateCard: {
    marginTop: 9,
    borderRadius: 15,
    backgroundColor: '#111419',
    borderWidth: 1,
    borderColor: '#30353c',
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  stateLabel: {
    color: '#747982',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  stateValue: {
    marginTop: 4,
    color: '#dc9c79',
    fontSize: 11,
    fontWeight: '900'
  },
  stateValueReady: { color: '#a7d0ad' },
  field: {
    marginTop: 8,
    padding: 13,
    borderRadius: 15,
    backgroundColor: '#121519',
    borderWidth: 1,
    borderColor: '#2e3239'
  },
  fieldTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  fieldTitle: {
    flex: 1,
    color: '#e9e5ec',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900'
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#34272b'
  },
  badgeReady: { backgroundColor: '#263b2d' },
  badgeCandidate: { backgroundColor: '#3a3424' },
  badgeText: {
    color: '#d89883',
    fontSize: 7,
    fontWeight: '900'
  },
  badgeTextReady: { color: '#a7d0ad' },
  fieldValue: {
    marginTop: 7,
    color: '#c6b3d7',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800'
  },
  fieldNote: {
    marginTop: 5,
    color: '#9398a0',
    fontSize: 9,
    lineHeight: 14
  },
  rule: {
    marginTop: 10,
    padding: 13,
    borderRadius: 15,
    backgroundColor: '#1a1317',
    borderWidth: 1,
    borderColor: '#482e38'
  },
  ruleKicker: {
    color: '#c18396',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  ruleText: {
    marginTop: 5,
    color: '#bba3ab',
    fontSize: 9,
    lineHeight: 15
  }
});
