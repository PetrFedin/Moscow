import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import {
  demoExecutionCapital,
  demoInvestmentCommitteeState,
  demoInvestmentCommitteeWorkspace,
  investmentCommitteeCopy
} from './cityInvestmentCommitteeDemo.ts';

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

export default function CityInvestmentCommitteeWorkspaceDemo({ language }: { language: AppLanguage }) {
  const copy = investmentCommitteeCopy[language];
  const workspace = demoInvestmentCommitteeWorkspace;
  const bc = workspace.businessCase;

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        <View style={styles.stateBadge}>
          <Text style={styles.stateText}>{demoInvestmentCommitteeState}</Text>
        </View>
      </View>

      <Section title={copy.businessCase}>
        <Row label="case" value={bc.title} />
        <Row label="district" value={bc.districtId} />
        <Row label="portfolio" value={bc.portfolioId} />
        <Row label="requested capital" value={rub(language, bc.requestedCapitalRub)} />
        <Row label="expected unmet Δ" value={pct(bc.expectedBenefits.unmetIntentDelta)} />
        <Row label="expected confirmed demand Δ" value={pct(bc.expectedBenefits.confirmedDemandDelta)} />
      </Section>

      <Section title={copy.ownership}>
        <Row label="executive sponsor" value={bc.executiveSponsor ?? '—'} />
        <Row label="business owner" value={bc.businessOwner ?? '—'} />
      </Section>

      <Section title={copy.budget}>
        {bc.budgetSources.map((source, index) => (
          <View key={`${source.type}-${index}`} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{source.type}</Text>
            <Text style={styles.meta}>{rub(language, source.amountRub)}</Text>
            <Text style={styles.meta}>{source.authorityRef ?? '—'}</Text>
          </View>
        ))}
      </Section>

      <Section title={copy.procurement}>
        <Row label="status" value={bc.procurementPath.status} />
        <Row label="route" value={bc.procurementPath.routeLabel ?? '—'} />
        <Row label="review" value={bc.procurementPath.reviewRef ?? '—'} />
        <Row label="approved by" value={bc.procurementPath.approvedByRole ?? '—'} />
      </Section>

      <Section title={copy.evidence}>
        {bc.evidencePackage.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.topRow}>
              <Text style={styles.itemTitle}>{item.evidenceClass}</Text>
              <Text style={styles.status}>{item.accepted ? 'ACCEPTED' : 'PENDING'}</Text>
            </View>
            <Text style={styles.meta}>{item.evidenceRef ?? '—'}</Text>
          </View>
        ))}
      </Section>

      <Section title={copy.approvals}>
        {workspace.approvals.map((stage) => (
          <View key={stage.id} style={styles.itemCard}>
            <View style={styles.topRow}>
              <Text style={styles.itemTitle}>
                {String(stage.order).padStart(2, '0')} · {stage.label}
              </Text>
              <Text style={styles.status}>{stage.status}</Text>
            </View>
            <Text style={styles.meta}>{stage.role}</Text>
            <Text style={styles.meta}>{stage.decisionRef ?? '—'}</Text>
          </View>
        ))}
      </Section>

      <Section title={copy.capital}>
        <Row label="committed" value={rub(language, demoExecutionCapital.committedRub)} />
        <Row label="planned" value={rub(language, demoExecutionCapital.plannedRub)} />
        <Row label="actual" value={rub(language, demoExecutionCapital.actualRub)} />
        <Row label="plan within commitment" value={String(demoExecutionCapital.planWithinCommitment)} />
        <Row label="actual within commitment" value={String(demoExecutionCapital.actualWithinCommitment)} />
      </Section>

      <Section title={copy.execution}>
        {workspace.execution.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.topRow}>
              <Text style={styles.itemTitle}>{item.label}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.meta}>
              planned={rub(language, item.plannedCapitalRub)} · actual={rub(language, item.actualCapitalRub)}
            </Text>
            <Text style={styles.meta}>{item.acceptanceRef ?? '—'}</Text>
          </View>
        ))}
      </Section>

      <Section title={copy.benefits}>
        <Row label="verification" value={workspace.portfolioVerification?.conclusion ?? '—'} />
        <Row label="benefits outcome" value={workspace.benefitsReview?.outcome ?? '—'} />
        <Row label="unmet forecast error" value={pct(workspace.benefitsReview?.comparison.unmetIntentForecastError ?? null)} />
        <Row label="confirmed demand forecast error" value={pct(workspace.benefitsReview?.comparison.confirmedDemandForecastError ?? null)} />
        <Row label="causality" value={workspace.benefitsReview?.causality ?? 'not-established'} />
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
      <View style={styles.sectionBody}>{children}</View>
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
  stateBadge: { alignSelf: 'flex-start', marginTop: 10, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#1a281d' },
  stateText: { color: '#bde2c5', fontSize: 8, fontWeight: '900' },
  section: { marginTop: 15 },
  sectionLabel: { color: '#c8a96a', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  sectionBody: { gap: 8, marginTop: 8 },
  row: { padding: 11, borderRadius: 12, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  rowLabel: { color: '#81898f', fontSize: 8, fontWeight: '900' },
  rowValue: { color: '#e7e1d8', fontSize: 11, lineHeight: 16, marginTop: 4, fontWeight: '800' },
  itemCard: { padding: 12, borderRadius: 13, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  itemTitle: { flex: 1, color: '#ece6dc', fontSize: 12, lineHeight: 17, fontWeight: '900' },
  status: { color: '#d3b36f', fontSize: 8, fontWeight: '900' },
  meta: { color: '#92999f', fontSize: 9, lineHeight: 14, marginTop: 5 },
  ruleBox: { marginTop: 15, padding: 14, borderRadius: 15, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  rule: { color: '#d9b6bc', fontSize: 10, lineHeight: 15, fontWeight: '900' }
});
