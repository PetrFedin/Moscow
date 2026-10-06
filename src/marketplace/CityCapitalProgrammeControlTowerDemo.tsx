import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import {
  capitalProgrammeCopy,
  demoCapitalProgrammeCases,
  demoCapitalProgrammeSnapshot
} from './cityCapitalProgrammeDemo.ts';
import {
  investmentCommitteeWorkspaceState
} from './cityInvestmentCommitteeAuthority.ts';

function rub(language: AppLanguage, value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ru-RU',
    { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }
  ).format(value);
}

function pct(value: number | null) {
  if (value === null) return '—';
  return `${Math.round(value * 100)}%`;
}

export default function CityCapitalProgrammeControlTowerDemo({ language }: { language: AppLanguage }) {
  const copy = capitalProgrammeCopy[language];
  const s = demoCapitalProgrammeSnapshot;

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <Metric label={copy.envelope} value={rub(language, s.authorizedEnvelopeRub)} />
        <Metric label={copy.committed} value={rub(language, s.committedCapitalRub)} />
        <Metric label={copy.actual} value={rub(language, s.actualSpendRub)} />
        <Metric label="UNCOMMITTED" value={rub(language, s.uncommittedEnvelopeRub)} />
        <Metric label={copy.progress} value={pct(s.executionProgressRate)} />
        <Metric label="FORECAST HIT RATE" value={pct(s.forecastAccuracy.directionalHitRate)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PROGRAMME CASES</Text>
        <View style={styles.list}>
          {demoCapitalProgrammeCases.map((item) => {
            const state = investmentCommitteeWorkspaceState(item.workspace);
            const commitment = item.workspace.commitment?.amountRub ?? 0;
            const actual = item.workspace.execution
              .map((m) => m.actualCapitalRub)
              .filter((v): v is number => typeof v === 'number')
              .reduce((sum, v) => sum + v, 0);

            return (
              <View key={item.id} style={styles.caseCard}>
                <View style={styles.topRow}>
                  <View style={styles.flex}>
                    <Text style={styles.caseTitle}>{item.workspace.businessCase.title}</Text>
                    <Text style={styles.meta}>{item.districtId} · {item.priority}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{state}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  committed={rub(language, commitment)}
                  {' · '}
                  actual={rub(language, actual)}
                  {' · '}
                  benefits={item.workspace.benefitsReview?.outcome ?? 'PENDING'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.benefits}</Text>
        <View style={styles.summaryGrid}>
          <Metric label="SUPPORTED" value={String(s.benefitsRealization.supported)} />
          <Metric label="MIXED" value={String(s.benefitsRealization.mixed)} />
          <Metric label="MISSED" value={String(s.benefitsRealization.missed)} />
          <Metric label="INSUFFICIENT" value={String(s.benefitsRealization.insufficient)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.forecast}</Text>
        <View style={styles.summaryGrid}>
          <Metric label="VERIFIED OPTIONS" value={String(s.forecastAccuracy.verifiedOptions)} />
          <Metric label="DIRECTIONALLY VERIFIED" value={String(s.forecastAccuracy.directionallyVerified)} />
          <Metric label="CASES WITH VERIFICATION" value={String(s.forecastAccuracy.casesWithVerification)} />
          <Metric label="HIT RATE" value={pct(s.forecastAccuracy.directionalHitRate)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.underperforming}</Text>
        <View style={styles.list}>
          {s.underperforming.map((item) => (
            <View key={item.caseId} style={styles.warningCard}>
              <Text style={styles.caseTitle}>{item.label}</Text>
              <Text style={styles.meta}>{item.reason}</Text>
              <Text style={styles.meta}>
                committed={rub(language, item.committedCapitalRub)}
                {' · '}
                actual={rub(language, item.actualSpendRub)}
                {' · '}
                unspent committed={rub(language, item.unspentCommittedRub)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.reallocation}</Text>
        <View style={styles.list}>
          {s.reallocationOpportunities.map((item) => (
            <View key={item.id} style={styles.reallocationCard}>
              <Text style={styles.caseTitle}>{item.source}</Text>
              <Text style={styles.meta}>{rub(language, item.amountRub)}</Text>
              <Text style={styles.meta}>{item.state}</Text>
              <Text style={styles.meta}>{item.reason}</Text>
            </View>
          ))}
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
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metricCard: { minWidth: 150, flexGrow: 1, flexBasis: '22%', backgroundColor: '#101316', borderRadius: 15, padding: 13, borderWidth: 1, borderColor: '#2a2f34' },
  metricLabel: { color: '#858c92', fontSize: 8, fontWeight: '900' },
  metricValue: { color: '#eadab8', fontSize: 18, fontWeight: '900', marginTop: 6 },
  section: { marginTop: 16 },
  sectionLabel: { color: '#c8a96a', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  list: { gap: 8, marginTop: 9 },
  caseCard: { padding: 13, borderRadius: 15, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  warningCard: { padding: 13, borderRadius: 15, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  reallocationCard: { padding: 13, borderRadius: 15, backgroundColor: '#15120f', borderWidth: 1, borderColor: '#665532' },
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flex: { flex: 1 },
  caseTitle: { color: '#ece6dc', fontSize: 12, lineHeight: 17, fontWeight: '900' },
  meta: { color: '#92999f', fontSize: 9, lineHeight: 14, marginTop: 5 },
  badge: { borderRadius: 9, backgroundColor: '#202327', paddingHorizontal: 7, paddingVertical: 4 },
  badgeText: { color: '#d7dce0', fontSize: 7, fontWeight: '900' },
  ruleBox: { marginTop: 15, padding: 14, borderRadius: 15, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  rule: { color: '#d9b6bc', fontSize: 10, lineHeight: 15, fontWeight: '900' }
});
