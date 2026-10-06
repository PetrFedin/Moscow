import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import {
  demoRebalancingDecisionPack,
  strategyRebalancingCopy
} from './cityStrategyRebalancingDemo.ts';

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

export default function CityStrategyRebalancingBoardDemo({ language }: { language: AppLanguage }) {
  const copy = strategyRebalancingCopy[language];
  const pack = demoRebalancingDecisionPack;

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <Metric label={copy.available} value={rub(language, pack.immediatelyAvailableCapitalRub)} />
        <Metric label={copy.blocked} value={rub(language, pack.blockedPotentialCapitalRub)} />
        <Metric label="FORECAST HIT RATE" value={pct(pack.programmePerformance.forecastHitRate)} />
        <Metric label="MIXED BENEFITS" value={String(pack.programmePerformance.benefitsMixed)} />
      </View>

      <Section title={copy.priorities}>
        {pack.priorities.map((priority) => (
          <View key={priority.id} style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.cardTitle}>{priority.label}</Text>
              <Text style={styles.badgeText}>{pct(priority.weight)}</Text>
            </View>
            <Text style={styles.meta}>
              {priority.strategicTheme}
              {' · '}
              {priority.districtIds.join(', ')}
            </Text>
            <Text style={styles.meta}>{priority.evidenceRef ?? '—'}</Text>
          </View>
        ))}
      </Section>

      <Section title={copy.decommitment}>
        {pack.underperformanceReviews.map((review) => {
          const proposal = pack.decommitmentProposals.find((item) => item.caseId === review.caseId);
          return (
            <View key={review.id} style={styles.warningCard}>
              <Text style={styles.cardTitle}>{review.caseId}</Text>
              <Text style={styles.meta}>
                {review.reason} · {review.conclusion} · {review.status}
              </Text>
              <Text style={styles.meta}>
                proposed={rub(language, review.recommendedDecommitmentRub)}
              </Text>
              <Text style={styles.meta}>
                proposalState={proposal?.state ?? 'NONE'}
                {' · '}
                authority={proposal?.authorityRef ?? '—'}
              </Text>
            </View>
          );
        })}
      </Section>

      <Section title={copy.sources}>
        {pack.fundingSources.map((source) => (
          <View key={source.id} style={source.availableNow ? styles.card : styles.warningCard}>
            <View style={styles.topRow}>
              <Text style={styles.cardTitle}>{source.sourceType}</Text>
              <Text style={styles.badgeText}>
                {source.availableNow ? 'AVAILABLE' : 'BLOCKED'}
              </Text>
            </View>
            <Text style={styles.meta}>{rub(language, source.amountRub)}</Text>
            <Text style={styles.meta}>
              case={source.caseId ?? 'programme'}
              {' · '}
              authority={source.authorityRef ?? '—'}
            </Text>
          </View>
        ))}
      </Section>

      <Section title={copy.candidates}>
        {pack.candidateShortlist.map((item) => (
          <View key={item.candidate.id} style={item.eligible ? styles.card : styles.warningCard}>
            <View style={styles.topRow}>
              <Text style={styles.cardTitle}>
                #{item.rank} · {item.candidate.label}
              </Text>
              <Text style={styles.badgeText}>
                {item.eligible ? 'ELIGIBLE' : 'BLOCKED'}
              </Text>
            </View>
            <Text style={styles.meta}>
              score={item.score.toFixed(3)}
              {' · '}
              capital={rub(language, item.candidate.requiredCapitalRub)}
              {' · '}
              confidence={pct(item.candidate.evidenceConfidence)}
            </Text>
            <Text style={styles.meta}>
              priorityFit={item.priorityFit.toFixed(2)}
              {' · '}
              efficiency={item.capitalEfficiency.toFixed(2)}
            </Text>
            {item.blockers.length > 0 && (
              <Text style={styles.blockers}>{item.blockers.join(' · ')}</Text>
            )}
          </View>
        ))}
      </Section>

      <Section title={copy.recommendations}>
        {pack.recommendedAllocations.length === 0 ? (
          <Text style={styles.empty}>No allocation recommendation fits the currently available envelope.</Text>
        ) : (
          pack.recommendedAllocations.map((item) => {
            const candidate = pack.candidateShortlist.find(
              (candidateItem) => candidateItem.candidate.id === item.candidateId
            );
            return (
              <View key={item.candidateId} style={styles.recommendCard}>
                <Text style={styles.cardTitle}>
                  {candidate?.candidate.label ?? item.candidateId}
                </Text>
                <Text style={styles.recommendValue}>{rub(language, item.amountRub)}</Text>
              </View>
            );
          })
        )}
        <View style={styles.balanceCard}>
          <Text style={styles.meta}>unallocated available</Text>
          <Text style={styles.recommendValue}>{rub(language, pack.unallocatedAvailableRub)}</Text>
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
  recommendCard: { padding: 13, borderRadius: 15, backgroundColor: '#15120f', borderWidth: 1, borderColor: '#665532' },
  balanceCard: { padding: 13, borderRadius: 15, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTitle: { flex: 1, color: '#ece6dc', fontSize: 12, lineHeight: 17, fontWeight: '900' },
  badgeText: { color: '#d3b36f', fontSize: 8, fontWeight: '900' },
  meta: { color: '#92999f', fontSize: 9, lineHeight: 14, marginTop: 5 },
  blockers: { color: '#c89aa1', fontSize: 9, lineHeight: 14, marginTop: 6 },
  recommendValue: { color: '#eadab8', fontSize: 16, fontWeight: '900', marginTop: 6 },
  empty: { color: '#92999f', fontSize: 10, lineHeight: 15 },
  ruleBox: { marginTop: 15, padding: 14, borderRadius: 15, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  rule: { color: '#d9b6bc', fontSize: 10, lineHeight: 15, fontWeight: '900' }
});
