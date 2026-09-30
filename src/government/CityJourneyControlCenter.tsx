import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  currentMoscowLiveOutcome,
  type LiveDestinationOutcomeSnapshot
} from './liveDestinationOutcomeAuthority';

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function stateLabel(snapshot: LiveDestinationOutcomeSnapshot) {
  if (snapshot.providerState === 'not-connected') return 'PROVIDER НЕ ПОДКЛЮЧЁН';
  if (snapshot.providerState === 'connected-no-fresh-entities') return 'НЕТ СВЕЖИХ LIVE-ДАННЫХ';
  return 'LIVE AUTHORITY АКТИВНА';
}

export default function CityJourneyControlCenter({
  snapshot = currentMoscowLiveOutcome
}: {
  snapshot?: LiveDestinationOutcomeSnapshot;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>CITY JOURNEY CONTROL CENTER</Text>
        <Text style={styles.title}>История → live-город → booking handoff → подтверждённый outcome</Text>
        <Text style={styles.body}>
          Control Center отделяет то, что контролирует приложение, от того, что может подтвердить
          только городской или партнёрский provider.
        </Text>
      </View>

      <View style={styles.statusGrid}>
        <Status
          label="LIVE PROVIDER"
          value={stateLabel(snapshot)}
          ready={snapshot.providerState === 'live'}
        />
        <Status
          label="FRESH ENTITIES"
          value={String(snapshot.freshEntityCount)}
          ready={snapshot.freshEntityCount > 0}
        />
        <Status
          label="BOOKING"
          value={
            snapshot.bookingState === 'provider-confirmed'
              ? 'PROVIDER CONFIRMED'
              : snapshot.bookingState === 'handoff-only'
                ? 'HANDOFF ONLY'
                : 'НЕ ПОДТВЕРЖДЕНО'
          }
          ready={snapshot.bookingState === 'provider-confirmed'}
        />
      </View>

      <View style={styles.flow}>
        {[
          ['1', 'Heritage', 'Published route / spatial proof'],
          ['2', 'Live destination', 'Только fresh provider projection'],
          ['3', 'Handoff', 'Открытие booking URL ≠ успешная бронь'],
          ['4', 'Outcome', 'Success только по provider receipt evidence']
        ].map(([n, title, body]) => (
          <View key={n} style={styles.flowRow}>
            <View style={styles.number}><Text style={styles.numberText}>{n}</Text></View>
            <View style={styles.flowCopy}>
              <Text style={styles.flowTitle}>{title}</Text>
              <Text style={styles.flowBody}>{body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.runtimeCard}>
        <Text style={styles.sectionKicker}>DESTINATION JOURNEY RUNTIME</Text>
        <Text style={styles.runtimeTitle}>planned → verified → executing → replanned → executed</Text>
        <Text style={styles.runtimeBody}>
          Если provider закрывает объект, отменяет событие или evidence протухает, текущий день
          переходит в replan-required. Замена принимается только с новым routing proof.
        </Text>
        <View style={styles.runtimeSteps}>
          {['Утро', 'Heritage + AR', 'Музей', 'Обед', 'Событие', 'Вечер'].map((step) => (
            <View key={step} style={styles.runtimeStep}>
              <Text style={styles.runtimeStepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionKicker}>MEASURED OUTCOME</Text>
      {snapshot.metrics.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>ПОКА НЕТ ИЗМЕРЕННЫХ LIVE OUTCOME</Text>
          <Text style={styles.emptyBody}>
            Это правильное состояние до formal provider feed и evidence. Мы не подставляем
            demo-рестораны, fictitious availability или «успешные брони».
          </Text>
        </View>
      ) : (
        <View style={styles.metrics}>
          {snapshot.metrics.map((metric) => (
            <View key={metric.id} style={styles.metric}>
              <Text style={styles.metricValue}>{pct(metric.rate)}</Text>
              <Text style={styles.metricTitle}>{metric.id}</Text>
              <Text style={styles.metricBody}>
                {metric.numerator}/{metric.denominator} · {metric.basis}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.blockers}>
        <Text style={styles.sectionKicker}>CURRENT GATES</Text>
        {snapshot.blockers.map((blocker) => (
          <View key={blocker} style={styles.blockerRow}>
            <Text style={styles.blockerMark}>◇</Text>
            <Text style={styles.blockerText}>{blocker}</Text>
          </View>
        ))}
      </View>

      <View style={styles.guardrail}>
        <Text style={styles.guardrailTitle}>FAIL-CLOSED RULE</Text>
        <Text style={styles.guardrailBody}>
          Freshness, availability, booking success, revenue и citywide impact не выводятся
          косвенно. Каждый слой должен иметь собственную authority и собственный evidence.
        </Text>
      </View>
    </View>
  );
}

function Status({ label, value, ready }: { label: string; value: string; ready: boolean }) {
  return (
    <View style={[styles.status, ready && styles.statusReady]}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, ready && styles.statusValueReady]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  hero: { gap: 7 },
  kicker: { color: '#b99b69', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#f5efe5', fontSize: 26, lineHeight: 31, fontWeight: '900' },
  body: { color: '#bdb4a7', fontSize: 14, lineHeight: 21 },
  statusGrid: { gap: 9 },
  status: { borderWidth: 1, borderColor: '#473d2d', borderRadius: 16, padding: 14, backgroundColor: '#13110d' },
  statusReady: { borderColor: '#78684a' },
  statusLabel: { color: '#827764', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  statusValue: { color: '#a49b8e', fontSize: 15, fontWeight: '900', marginTop: 4 },
  statusValueReady: { color: '#f0c77c' },
  flow: { gap: 0, borderWidth: 1, borderColor: '#302b22', borderRadius: 18, overflow: 'hidden' },
  flowRow: { flexDirection: 'row', gap: 11, padding: 14, borderBottomWidth: 1, borderBottomColor: '#302b22' },
  number: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#211c14', alignItems: 'center', justifyContent: 'center' },
  numberText: { color: '#d3b177', fontWeight: '900' },
  flowCopy: { flex: 1 },
  flowTitle: { color: '#eee8de', fontSize: 14, fontWeight: '800' },
  flowBody: { color: '#978f83', fontSize: 11, lineHeight: 17, marginTop: 3 },
  sectionKicker: { color: '#9b896e', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  empty: { borderRadius: 18, backgroundColor: '#18140f', padding: 16 },
  emptyTitle: { color: '#d1b278', fontSize: 13, fontWeight: '900' },
  emptyBody: { color: '#9c9488', fontSize: 12, lineHeight: 18, marginTop: 6 },
  metrics: { gap: 9 },
  metric: { borderWidth: 1, borderColor: '#3d3528', borderRadius: 16, padding: 14 },
  metricValue: { color: '#f5efe5', fontSize: 26, fontWeight: '900' },
  metricTitle: { color: '#e0d8cb', fontSize: 12, fontWeight: '800', marginTop: 2 },
  metricBody: { color: '#8f877c', fontSize: 10, lineHeight: 15, marginTop: 4 },
  blockers: { gap: 7 },
  blockerRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  blockerMark: { color: '#8e7652' },
  blockerText: { color: '#aaa195', fontSize: 11, lineHeight: 16, flex: 1 },
  runtimeCard: { borderWidth: 1, borderColor: '#4b402f', borderRadius: 18, padding: 15, backgroundColor: '#14110d', gap: 7 },
  runtimeTitle: { color: '#f0e8dc', fontSize: 16, fontWeight: '900' },
  runtimeBody: { color: '#9f978b', fontSize: 11, lineHeight: 17 },
  runtimeSteps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  runtimeStep: { borderRadius: 12, backgroundColor: '#211c14', paddingHorizontal: 9, paddingVertical: 6 },
  runtimeStepText: { color: '#c9ab77', fontSize: 9, fontWeight: '800' },
  guardrail: { backgroundColor: '#1a1712', borderRadius: 16, padding: 14 },
  guardrailTitle: { color: '#c8a66e', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  guardrailBody: { color: '#9e9588', fontSize: 11, lineHeight: 17, marginTop: 5 }
});
