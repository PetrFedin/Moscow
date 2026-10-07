import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import {
  cityOpportunityCopy,
  demoCityOpportunityCase
} from './cityOpportunityDemo';

function pct(value: number | null) {
  if (value === null) return '—';
  return `${Math.round(value * 100)}%`;
}

function num(value: number | null, digits = 2) {
  if (value === null) return '—';
  return value.toFixed(digits);
}

export default function CityOpportunityEngineDemo({ language }: { language: AppLanguage }) {
  const copy = cityOpportunityCopy[language];
  const opportunity = demoCityOpportunityCase;
  const selected = opportunity.shortlist.find(
    (item) => item.prospect.id === opportunity.selectedProspectId
  );

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.brief}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {opportunity.brief.districtId} · {opportunity.brief.intentKind} · {opportunity.brief.timeBucket}
          </Text>
          <Text style={styles.meta}>
            baseline obs={opportunity.brief.baselineObservations}
            {' · '}
            days={opportunity.brief.baselineDistinctDays}
            {' · '}
            unmet={pct(opportunity.brief.baselineUnmetIntentRate)}
            {' · '}
            coverage={pct(opportunity.brief.baselineSupplyCoverageRatio)}
          </Text>
          <Text style={styles.meta}>
            minFreshSupplyUnits={opportunity.brief.requirement.minimumFreshSupplyUnits}
            {' · '}
            authoritativeAvailability=true
            {' · '}
            providerConfirmation=true
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.shortlist}</Text>
        <Text style={styles.note}>{copy.paidNeutral}</Text>
        <View style={styles.list}>
          {opportunity.shortlist.map((item) => (
            <View
              key={item.prospect.id}
              style={[
                styles.card,
                item.prospect.id === opportunity.selectedProspectId && styles.selectedCard
              ]}
            >
              <View style={styles.topRow}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{item.prospect.displayName}</Text>
                  <Text style={styles.meta}>
                    rank #{item.rank} · score={item.score.toFixed(3)}
                  </Text>
                </View>
                {item.prospect.id === opportunity.selectedProspectId && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedText}>{copy.selected}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.meta}>
                paidBudget={item.prospect.paidPromotionBudgetRub ?? 0}
                {' · '}
                lead={item.prospect.onboardingLeadDays ?? '—'}d
                {' · '}
                freshSupply=+{item.prospect.expectedFreshSupplyUnits}
              </Text>

              <Text style={styles.reasons}>{item.reasons.join(' · ')}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.impact}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {selected?.prospect.displayName ?? '—'}
          </Text>
          <Text style={styles.meta}>
            baseline fresh supply={num(opportunity.expectedImpact?.baselineFreshSupply ?? null)}
            {' · '}
            modelled added={opportunity.expectedImpact?.modelledAddedFreshSupply ?? '—'}
            {' · '}
            modelled after={num(opportunity.expectedImpact?.modelledFreshSupplyAfter ?? null)}
          </Text>
          <Text style={styles.warning}>
            {opportunity.expectedImpact?.impactState ?? '—'} · {opportunity.expectedImpact?.prohibitedClaim ?? '—'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.measurement}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            status={opportunity.status}
          </Text>
          <Text style={styles.meta}>
            before unmet={pct(opportunity.measurement?.baseline.unmetIntentRate ?? null)}
            {' · '}
            after unmet={pct(opportunity.measurement?.postOnboarding?.unmetIntentRate ?? null)}
          </Text>
          <Text style={styles.meta}>
            before coverage={pct(opportunity.measurement?.baseline.supplyCoverageRatio ?? null)}
            {' · '}
            after coverage={pct(opportunity.measurement?.postOnboarding?.supplyCoverageRatio ?? null)}
          </Text>
          <Text style={styles.meta}>
            unmet delta={pct(opportunity.measurement?.observedUnmetIntentDelta ?? null)}
            {' · '}
            coverage delta={pct(opportunity.measurement?.observedSupplyCoverageDelta ?? null)}
          </Text>
        </View>
      </View>

      <View style={styles.outcome}>
        <Text style={styles.sectionLabel}>{copy.outcome}</Text>
        <Text style={styles.outcomeTitle}>
          {opportunity.measurement?.outcome ?? 'INSUFFICIENT'}
        </Text>
        <Text style={styles.outcomeBody}>{copy.causality}</Text>
        <Text style={styles.outcomeMeta}>
          causality={opportunity.measurement?.attributionCausality ?? 'not-established'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#121518',
    borderWidth: 1,
    borderColor: '#393226'
  },
  kicker: {
    color: '#c8a96a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  title: {
    color: '#f4eee4',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 7
  },
  body: {
    color: '#aeb4b9',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8
  },
  section: { marginTop: 14 },
  sectionLabel: {
    color: '#c8a96a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1
  },
  list: { gap: 8, marginTop: 9 },
  note: {
    color: '#8e969c',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6
  },
  card: {
    marginTop: 8,
    padding: 13,
    borderRadius: 15,
    backgroundColor: '#101316',
    borderWidth: 1,
    borderColor: '#2a2f34'
  },
  selectedCard: {
    borderColor: '#745f35',
    backgroundColor: '#16130f'
  },
  topRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  flex: { flex: 1 },
  cardTitle: {
    color: '#ece6dc',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900'
  },
  meta: {
    color: '#9da4aa',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6
  },
  reasons: {
    color: '#777f86',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 5
  },
  selectedBadge: {
    borderRadius: 9,
    backgroundColor: '#362c12',
    paddingHorizontal: 7,
    paddingVertical: 4
  },
  selectedText: {
    color: '#f4d98f',
    fontSize: 7,
    fontWeight: '900'
  },
  warning: {
    color: '#c29ba1',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 7
  },
  outcome: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#15120f',
    borderWidth: 1,
    borderColor: '#665532'
  },
  outcomeTitle: {
    color: '#ead7b0',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 7
  },
  outcomeBody: {
    color: '#b6aa98',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7
  },
  outcomeMeta: {
    color: '#897f70',
    fontSize: 8,
    lineHeight: 13,
    marginTop: 5
  }
});
