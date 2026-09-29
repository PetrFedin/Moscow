import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  currentPilotOutcomeSnapshot,
  type PilotOutcomeSnapshot
} from './pilotOutcomeAuthority';

function percent(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

export default function PilotOutcomeEvidencePanel({
  snapshot = currentPilotOutcomeSnapshot
}: {
  snapshot?: PilotOutcomeSnapshot;
}) {
  const measured = snapshot.status === 'measured';

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>PILOT OUTCOME AUTHORITY</Text>
      <Text style={styles.title}>Что реально дал пилот посетителю и городу</Text>
      <Text style={styles.body}>
        Блок принимает только reviewed evidence supervised-пилота. До полевого пакета
        outcome не подменяется демонстрационными цифрами.
      </Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>СТАТУС</Text>
        <Text style={styles.statusValue}>
          {measured ? 'ИЗМЕРЕНО ПО EVIDENCE' : 'НЕ ИЗМЕРЕНО'}
        </Text>
        <Text style={styles.statusBody}>
          {measured
            ? `Study ${snapshot.studyId} · ${snapshot.participantSlots} participant slots`
            : 'Нужен завершённый Varvarka supervised pilot 20–50 участников и reviewed evidence reference.'}
        </Text>
      </View>

      {measured ? (
        <View style={styles.metrics}>
          {snapshot.metrics.map((metric) => (
            <View key={metric.id} style={styles.metric}>
              <Text style={styles.metricValue}>{percent(metric.rate)}</Text>
              <Text style={styles.metricTitle}>{metric.label}</Text>
              <Text style={styles.metricBasis}>
                {metric.numerator}/{metric.denominator} · {metric.basis}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.pending}>
          {[
            'Завершение маршрута',
            'Запрос «что дальше»',
            'Добровольное использование AR',
            'Сигнал продолжения после прогулки'
          ].map((item) => (
            <View key={item} style={styles.pendingRow}>
              <Text style={styles.pendingMark}>—</Text>
              <Text style={styles.pendingText}>{item}</Text>
              <Text style={styles.pendingValue}>НЕ ИЗМЕРЕНО</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.guardrail}>
        <Text style={styles.guardrailTitle}>ГРАНИЦЫ ИНТЕРПРЕТАЦИИ</Text>
        <Text style={styles.guardrailText}>
          Это usability/product proof, а не репрезентативный опрос Москвы, causal impact study
          или основание переносить проценты на весь туристический поток.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  kicker: { color: '#b99b69', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#f5efe5', fontSize: 24, lineHeight: 29, fontWeight: '800' },
  body: { color: '#bdb4a7', fontSize: 14, lineHeight: 21 },
  statusCard: { borderWidth: 1, borderColor: '#4f442f', borderRadius: 20, backgroundColor: '#15120d', padding: 16, gap: 6 },
  statusLabel: { color: '#8f8069', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  statusValue: { color: '#f0c77c', fontSize: 20, fontWeight: '900' },
  statusBody: { color: '#bdb4a7', fontSize: 12, lineHeight: 18 },
  metrics: { gap: 10 },
  metric: { borderWidth: 1, borderColor: '#3c3529', borderRadius: 18, padding: 15, backgroundColor: '#11100d' },
  metricValue: { color: '#f5efe5', fontSize: 28, fontWeight: '900' },
  metricTitle: { color: '#f5efe5', fontSize: 14, fontWeight: '700', marginTop: 2 },
  metricBasis: { color: '#8f8679', fontSize: 11, lineHeight: 16, marginTop: 5 },
  pending: { gap: 8 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: '#2b2822', paddingVertical: 10 },
  pendingMark: { color: '#8f8069', width: 12 },
  pendingText: { color: '#d8d1c6', fontSize: 13, flex: 1 },
  pendingValue: { color: '#8f8069', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  guardrail: { borderRadius: 16, backgroundColor: '#1b1711', padding: 14 },
  guardrailTitle: { color: '#b99b69', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  guardrailText: { color: '#9f9689', fontSize: 11, lineHeight: 17, marginTop: 5 }
});
