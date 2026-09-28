import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, Text, View } from 'react-native';
import { tr, type AppLanguage } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import {
  buildPilotAnalyticsReport,
  serializePilotAnalyticsReport
} from '../../analytics/pilotAnalyticsReport';
import { getLocalTouristAnalyticsOutbox } from '../../analytics/touristAnalytics';

type Report = ReturnType<typeof buildPilotAnalyticsReport>;

export default function PilotAnalyticsReportControl({ language }: { language: AppLanguage }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const records = await getLocalTouristAnalyticsOutbox();
      setReport(buildPilotAnalyticsReport(records));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const share = async () => {
    setSharing(true);
    setError(false);
    try {
      const records = await getLocalTouristAnalyticsOutbox();
      const current = buildPilotAnalyticsReport(records);
      setReport(current);
      await Share.share({
        title: tr(language, 'Агрегированная сводка пилота Moscow', 'Moscow pilot aggregate report', '莫斯科试点聚合报告'),
        message: serializePilotAnalyticsReport(records)
      });
    } catch {
      setError(true);
    } finally {
      setSharing(false);
    }
  };

  const completionPercent = report?.funnel.routeCompleteRateFromRouteStart == null
    ? '—'
    : `${Math.round(report.funnel.routeCompleteRateFromRouteStart * 100)}%`;

  return (
    <View style={styles.card} accessibilityLabel={tr(language, 'Пилотные данные на этом устройстве', 'Pilot data on this device', '本设备上的试点数据')}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{tr(language, 'ПИЛОТ · ТОЛЬКО ЭТО УСТРОЙСТВО', 'PILOT · THIS DEVICE ONLY', '试点 · 仅此设备')}</Text>
          <Text style={styles.title}>{tr(language, 'Агрегированная сводка прохождения', 'Aggregate journey report', '聚合行程报告')}</Text>
          <Text style={styles.body}>
            {tr(language, 'Локальные события сводятся без координат, истории GPS, идентификатора устройства и персональных данных.', 'Local events are aggregated without coordinates, GPS history, device identity or personal data.', '本地事件会被聚合，不包含坐标、GPS历史、设备标识或个人数据。')}
          </Text>
        </View>
        {loading && <ActivityIndicator color="#d7bb84" />}
      </View>

      {report && (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.value}>{report.sessionCount}</Text>
              <Text style={styles.label}>{tr(language, 'сеансов', 'sessions', '会话')}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.value}>{report.funnel.routeStartSessions}</Text>
              <Text style={styles.label}>{tr(language, 'стартов маршрута', 'route starts', '路线开始')}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.value}>{report.funnel.routeCompleteSessions}</Text>
              <Text style={styles.label}>{tr(language, 'завершений', 'completions', '完成')}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.value}>{completionPercent}</Text>
              <Text style={styles.label}>{tr(language, 'старт → финиш', 'start → finish', '开始 → 完成')}</Text>
            </View>
          </View>

          <View style={styles.secondaryStats}>
            <Text style={styles.secondaryText}>
              {tr(language, 'Физическое приближение', 'Physical arrivals', '到达地点')} · {report.engagement.physicalArrivalSessions}
            </Text>
            <Text style={styles.secondaryText}>
              {tr(language, 'Аудио завершено', 'Audio completed', '音频完成')} · {report.engagement.audioCompleteSessions}
            </Text>
            <Text style={styles.secondaryText}>
              {tr(language, 'Машина времени', 'Time Machine', '时光机')} · {report.engagement.timeMachineSessions}
            </Text>
          </View>

          {report.outboxAtCapacity && (
            <Text style={styles.warning}>
              {tr(language, 'Локальный журнал достиг лимита 400 событий: ранние события могли быть вытеснены, поэтому сводка может быть неполной.', 'The local 400-event outbox is at capacity: earlier events may have been evicted, so the report may be incomplete.', '本地日志已达到400条事件上限，较早事件可能已被移除，因此报告可能不完整。')}
            </Text>
          )}
        </>
      )}

      <View style={styles.actions}>
        <PhysicalPressable
          style={styles.secondary}
          contentStyle={styles.center}
          hapticEvent="none"
          onPress={() => { void refresh(); }}
          disabled={loading}
          accessibilityLabel={tr(language, 'Обновить пилотную сводку', 'Refresh pilot report', '刷新试点报告')}
        >
          <Text style={styles.secondaryButtonText}>{tr(language, 'Обновить', 'Refresh', '刷新')}</Text>
        </PhysicalPressable>
        <PhysicalPressable
          style={styles.primary}
          contentStyle={styles.center}
          strong
          onPress={() => { void share(); }}
          disabled={loading || sharing || !report}
          accessibilityLabel={tr(language, 'Поделиться агрегированной сводкой', 'Share aggregate report', '分享聚合报告')}
        >
          <Text style={styles.primaryText}>
            {sharing ? tr(language, 'Готовим…', 'Preparing…', '正在准备…') : tr(language, 'Поделиться сводкой', 'Share report', '分享报告')}
          </Text>
        </PhysicalPressable>
      </View>

      <Text style={styles.privacy}>
        {tr(language, 'Экспорт создаётся только по нажатию и содержит агрегаты, а не сырые события или идентификаторы сеансов.', 'Export happens only after your tap and contains aggregates, not raw events or session identifiers.', '只有在你主动点击后才会生成导出内容，且仅包含聚合数据，不含原始事件或会话标识。')}
      </Text>
      {error && (
        <Text style={styles.error}>
          {tr(language, 'Не удалось подготовить локальную сводку.', 'Could not prepare the local report.', '无法生成本地报告。')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, borderColor: '#343941', backgroundColor: '#111418', padding: 15, marginBottom: 14 },
  top: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  copy: { flex: 1, minWidth: 0 },
  kicker: { color: '#b99b69', fontSize: 8, letterSpacing: 1.15, fontWeight: '900' },
  title: { color: '#f2ede4', fontSize: 15, fontWeight: '900', marginTop: 4 },
  body: { color: '#8f949c', fontSize: 9.5, lineHeight: 14, marginTop: 5 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  stat: { width: '48%', borderRadius: 13, backgroundColor: '#181b20', paddingVertical: 9, paddingHorizontal: 9 },
  value: { color: '#e7c98f', fontSize: 18, fontWeight: '900' },
  label: { color: '#858b93', fontSize: 8, lineHeight: 11, marginTop: 2 },
  secondaryStats: { gap: 4, marginTop: 10 },
  secondaryText: { color: '#a4a8ae', fontSize: 9, lineHeight: 13 },
  warning: { color: '#d2a477', fontSize: 9, lineHeight: 13, marginTop: 9 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primary: { flex: 1.4, minHeight: 44, borderRadius: 13, backgroundColor: '#d7bb84' },
  primaryText: { color: '#17130d', fontSize: 9, fontWeight: '900', textAlign: 'center' },
  secondary: { flex: 0.8, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#454b53' },
  secondaryButtonText: { color: '#c9b995', fontSize: 9, fontWeight: '900' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  privacy: { color: '#686e76', fontSize: 8, lineHeight: 12, marginTop: 9 },
  error: { color: '#c58d81', fontSize: 8.5, lineHeight: 12, marginTop: 7 }
});
