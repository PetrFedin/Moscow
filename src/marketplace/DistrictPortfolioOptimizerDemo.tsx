import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import {
  demoDistrictPortfolio,
  districtPortfolioCopy
} from './districtPortfolioDemo.ts';

function rub(language: AppLanguage, value: number) {
  return new Intl.NumberFormat(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ru-RU',
    { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }
  ).format(value);
}

function pct(value: number | null) {
  if (value === null) return '—';
  return `${Math.round(value * 100)}%`;
}

function num(value: number | null, digits = 1) {
  if (value === null) return '—';
  return value.toFixed(digits);
}

export default function DistrictPortfolioOptimizerDemo({ language }: { language: AppLanguage }) {
  const copy = districtPortfolioCopy[language];
  const portfolio = demoDistrictPortfolio;

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <Metric label={copy.budget} value={rub(language, portfolio.budgetRub)} />
        <Metric label={copy.remaining} value={rub(language, portfolio.budgetRemainingRub)} />
        <Metric label="selected" value={String(portfolio.selected.length)} />
        <Metric label="rejected" value={String(portfolio.rejected.length)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.selected}</Text>
        <View style={styles.list}>
          {portfolio.selected.map((item) => (
            <View key={item.option.id} style={[styles.optionCard, styles.selectedCard]}>
              <View style={styles.topRow}>
                <View style={styles.flex}>
                  <Text style={styles.optionTitle}>
                    #{item.rank} · {item.option.scenario.interventions[0]?.label ?? item.option.id}
                  </Text>
                  <Text style={styles.meta}>
                    {copy.score}={item.score.toFixed(3)}
                    {' · '}
                    {copy.capital}={rub(language, item.option.requiredCapitalRub)}
                    {' · '}
                    {copy.lead}={item.option.implementationDays}d
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>SELECTED</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {copy.confidence}={pct(item.option.evidenceConfidence)}
                {' · '}
                {copy.risk}={pct(item.option.riskPenalty)}
              </Text>
              <Text style={styles.reasons}>
                unmet={item.dimensions.unmetDemandReduction.toFixed(2)}
                {' · '}
                footfall={item.dimensions.footfallImpact.toFixed(2)}
                {' · '}
                confirmed={item.dimensions.confirmedDemandImpact.toFixed(2)}
                {' · '}
                speed={item.dimensions.speed.toFixed(2)}
                {' · '}
                efficiency={item.dimensions.capitalEfficiency.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.rejected}</Text>
        <View style={styles.list}>
          {portfolio.rejected.map((item) => (
            <View key={item.option.id} style={styles.optionCard}>
              <Text style={styles.optionTitle}>
                #{item.rank} · {item.option.scenario.interventions[0]?.label ?? item.option.id}
              </Text>
              <Text style={styles.meta}>
                {copy.score}={item.score.toFixed(3)}
                {' · '}
                {copy.capital}={rub(language, item.option.requiredCapitalRub)}
              </Text>
              <Text style={styles.reasons}>
                {item.blockers.length > 0 ? item.blockers.join(' · ') : 'not selected within current budget/rank'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.impactBox}>
        <Text style={styles.sectionLabel}>{copy.impact}</Text>
        <View style={styles.impactGrid}>
          <Tiny label="unmet intent Δ" value={pct(portfolio.expectedImpact.unmetIntentDelta)} />
          <Tiny label="footfall Δ" value={num(portfolio.expectedImpact.footfallIndexDelta)} />
          <Tiny label="confirmed demand Δ" value={pct(portfolio.expectedImpact.confirmedDemandDelta)} />
          <Tiny label="partner contribution Δ" value={num(portfolio.expectedImpact.partnerGrossContributionDeltaRub, 0)} />
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

function Tiny({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tiny}>
      <Text style={styles.tinyLabel}>{label}</Text>
      <Text style={styles.tinyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, padding: 18, backgroundColor: '#121518', borderWidth: 1, borderColor: '#393226' },
  kicker: { color: '#c8a96a', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#f4eee4', fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 7 },
  body: { color: '#aeb4b9', fontSize: 12, lineHeight: 18, marginTop: 8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metricCard: { minWidth: 160, flexGrow: 1, flexBasis: '22%', backgroundColor: '#101316', borderRadius: 15, padding: 13, borderWidth: 1, borderColor: '#2a2f34' },
  metricLabel: { color: '#858c92', fontSize: 8, fontWeight: '900' },
  metricValue: { color: '#eadab8', fontSize: 18, fontWeight: '900', marginTop: 6 },
  section: { marginTop: 16 },
  sectionLabel: { color: '#c8a96a', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  list: { gap: 8, marginTop: 9 },
  optionCard: { padding: 13, borderRadius: 15, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  selectedCard: { borderColor: '#745f35', backgroundColor: '#16130f' },
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flex: { flex: 1 },
  optionTitle: { color: '#ece6dc', fontSize: 13, lineHeight: 18, fontWeight: '900' },
  meta: { color: '#9da4aa', fontSize: 10, lineHeight: 15, marginTop: 6 },
  reasons: { color: '#777f86', fontSize: 9, lineHeight: 14, marginTop: 5 },
  badge: { borderRadius: 9, backgroundColor: '#362c12', paddingHorizontal: 7, paddingVertical: 4 },
  badgeText: { color: '#f4d98f', fontSize: 7, fontWeight: '900' },
  impactBox: { marginTop: 16, padding: 15, borderRadius: 16, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  impactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  tiny: { minWidth: 125, flexGrow: 1, backgroundColor: '#171b1e', borderRadius: 10, padding: 9 },
  tinyLabel: { color: '#7f878d', fontSize: 7, fontWeight: '900' },
  tinyValue: { color: '#ddd4c3', fontSize: 12, fontWeight: '900', marginTop: 4 },
  ruleBox: { marginTop: 12, padding: 14, borderRadius: 15, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  rule: { color: '#d9b6bc', fontSize: 10, lineHeight: 15, fontWeight: '900' }
});
