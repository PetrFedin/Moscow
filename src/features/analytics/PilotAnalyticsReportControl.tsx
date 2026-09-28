import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { tr, type AppLanguage } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';
import { buildPilotAnalyticsReport } from '../../analytics/pilotAnalyticsReport';
import { getLocalTouristAnalyticsOutbox } from '../../analytics/touristAnalytics';

type Report = ReturnType<typeof buildPilotAnalyticsReport>;

export default function PilotAnalyticsReportControl({ language }: { language: AppLanguage }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
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
            <View style={styles.stat}><Text style={styles.value}>{report.sessionCount}</Text><Text style={styles.label}>{tr(language, 'сеансов', 'sessions', '会话')}</Text></View>
            <View style={styles.stat}><Text style={styles.value}>{report.funnel.routeStartSessions}</Text><Text style={styles.label}>{tr(language, 'стартов маршрута', 'route starts', '路线开始')}</Text></View>
            <View style={styles.stat}><Text style={styles.value}>{report.funnel.routeCompleteSessions}</Text><Text style={styles.label}>{tr(language, 'завершений', 'completions', '完成')}</Text></View>
            <View style={styles.stat}><Text style={styles.value}>{completionPercent}</Text><Text style={styles.label}>{tr(language, 'старт → финиш', 'start → finish', '开始 → 完成')}</Text></View>
          </View>
          {report.outboxAtCapacity && (
            <Text style={styles.warning}>
              {tr(language, 'Локальный журнал достиг лимита 400 событий: ранние события могли быть вытеснены.', 'The local 400-event outbox is at capacity: earlier events may have been evicted.', '本地日志已达到400条事件上限，较早事件可能已被移除。')}
            </Text>
          )}
        </>
      )}

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

      <Text style={styles.privacy}>
        {tr(language, 'Ручной экспорт агрегированной сводки доступен в мобильной iOS/Android сборке.', 'Manual aggregate-report sharing is available in the iOS/Android app.', '可在 iOS/Android 应用中手动导出聚合报告。')}
      </Text>
      {error && <Text style={styles.error}>{tr(language, 'Не удалось подготовить локальную сводку.', 'Could not prepare the local report.', '无法生成本地报告。')}</Text>}
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
  warning: { color: '#d2a477', fontSize: 9, lineHeight: 13, marginTop: 9 },
  secondary: { minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: '#454b53', marginTop: 11 },
  secondaryButtonText: { color: '#c9b995', fontSize: 9, fontWeight: '900' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  privacy: { color: '#686e76', fontSize: 8, lineHeight: 12, marginTop: 9 },
  error: { color: '#c58d81', fontSize: 8.5, lineHeight: 12, marginTop: 7 }
});
