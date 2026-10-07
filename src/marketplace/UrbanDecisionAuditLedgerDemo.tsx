import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import {
  demoUrbanAuditIntegrity,
  demoUrbanAuditLedger,
  demoUrbanDecisionCompleteness,
  demoUrbanDecisionReplay,
  urbanAuditCopy
} from './urbanDecisionAuditDemo.ts';

function rub(language: AppLanguage, value: number) {
  return new Intl.NumberFormat(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ru-RU',
    { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }
  ).format(value);
}

export default function UrbanDecisionAuditLedgerDemo({ language }: { language: AppLanguage }) {
  const copy = urbanAuditCopy[language];

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <Metric label={copy.integrity} value={demoUrbanAuditIntegrity.valid ? 'VALID' : 'BROKEN'} />
        <Metric label="EVENTS" value={String(demoUrbanAuditIntegrity.eventCount)} />
        <Metric label={copy.completeness} value={demoUrbanDecisionCompleteness.complete ? 'COMPLETE' : 'INCOMPLETE'} />
        <Metric label="COMMITTED CAPITAL" value={rub(language, demoUrbanDecisionReplay.committedCapitalRub)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.replay}</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{demoUrbanDecisionReplay.decisionId}</Text>
          <Text style={styles.meta}>latestState={demoUrbanDecisionReplay.latestState ?? '—'}</Text>
          <Text style={styles.meta}>
            models={demoUrbanDecisionReplay.modelVersions.map((item) => `${item.modelId}@${item.version}`).join(', ')}
          </Text>
          <Text style={styles.meta}>policies={demoUrbanDecisionReplay.policyVersions.join(', ')}</Text>
          <Text style={styles.meta}>scenarios={demoUrbanDecisionReplay.scenarioIds.join(', ')}</Text>
          <Text style={styles.meta}>approvals={demoUrbanDecisionReplay.approvalRefs.length}</Text>
          <Text style={styles.meta}>executionEvidence={demoUrbanDecisionReplay.executionEvidenceRefs.length}</Text>
          <Text style={styles.meta}>outcomes={demoUrbanDecisionReplay.outcomeRefs.length}</Text>
          <Text style={styles.meta}>learning={demoUrbanDecisionReplay.learningRefs.length}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.timeline}</Text>
        <View style={styles.list}>
          {demoUrbanAuditLedger.events.map((event) => (
            <View key={event.eventId} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.cardTitle}>
                  {String(event.sequence).padStart(2, '0')} · {event.eventType}
                </Text>
                <Text style={styles.badge}>{event.payload.state}</Text>
              </View>
              <Text style={styles.meta}>{event.occurredAt}</Text>
              <Text style={styles.meta}>{event.actor.actorId}{event.actor.role ? ` · ${event.actor.role}` : ''}</Text>
              <Text style={styles.meta}>{event.payload.summary}</Text>
              <Text style={styles.hash}>hash={event.eventHash} · prev={event.previousHash ?? 'GENESIS'}</Text>
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
  card: { marginTop: 8, padding: 13, borderRadius: 15, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTitle: { flex: 1, color: '#ece6dc', fontSize: 12, lineHeight: 17, fontWeight: '900' },
  badge: { color: '#d3b36f', fontSize: 8, fontWeight: '900' },
  meta: { color: '#92999f', fontSize: 9, lineHeight: 14, marginTop: 5 },
  hash: { color: '#6f777d', fontSize: 8, lineHeight: 13, marginTop: 6 },
  ruleBox: { marginTop: 15, padding: 14, borderRadius: 15, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  rule: { color: '#d9b6bc', fontSize: 10, lineHeight: 15, fontWeight: '900' }
});
