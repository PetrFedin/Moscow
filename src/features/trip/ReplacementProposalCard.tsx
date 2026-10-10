import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import type {
  DayReplacementProposal,
  DayReplacementProposalSet
} from '../../travel/dayReplacementProposal';
import PhysicalPressable from '../../ui/PhysicalPressable';

function time(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  }).format(new Date(value));
}

function routeLabel(
  language: AppLanguage,
  route: DayReplacementProposal['inboundRoute'] | undefined
) {
  if (!route) return tr(language, 'не требуется', 'not required', '无需');
  if (route.status === 'unknown') return tr(language, 'не подтверждён', 'unverified', '未验证');
  if (route.status === 'impossible') return tr(language, 'невозможен', 'impossible', '不可行');
  return `${route.status.toUpperCase()} · ${route.requiredTravelMinutes ?? '—'} ${tr(language, 'мин', 'min', '分钟')}`;
}

function admissionLabel(language: AppLanguage, admission: DayReplacementProposal['admission']) {
  switch (admission) {
    case 'executable':
      return tr(language, 'EXECUTABLE', 'EXECUTABLE', '可执行');
    case 'routing-unverified':
      return tr(language, 'ROUTING UNVERIFIED', 'ROUTING UNVERIFIED', '路线未验证');
    case 'routing-impossible':
      return tr(language, 'ROUTING IMPOSSIBLE', 'ROUTING IMPOSSIBLE', '路线不可行');
  }
}

export default function ReplacementProposalCard({
  sets,
  language,
  onAccept
}: {
  sets: DayReplacementProposalSet[];
  language: AppLanguage;
  onAccept: (proposal: DayReplacementProposal) => void;
}) {
  if (sets.length === 0) return null;

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>SOURCE-BACKED REPLACEMENT · V1</Text>
      <Text style={styles.title}>
        {tr(language, 'Проверяем замену, не ломая остальной день', 'Verify a replacement without breaking the rest of the day', '在不破坏当天其他安排的前提下验证替代方案')}
      </Text>
      <Text style={styles.body}>
        {tr(
          language,
          'Кандидат появляется только из актуального источника. Принятие доступно только после проверки требуемых перемещений и сохранения фиксированных билетов/броней.',
          'A candidate comes only from current source truth. Acceptance is enabled only after required travel legs are verified and fixed tickets/reservations remain exact.',
          '候选项只来自当前来源事实。只有验证必要路线并保持固定门票/预订不变后，才能确认替换。'
        )}
      </Text>

      {sets.map((set) => (
        <View key={set.disruptionId} style={styles.set}>
          {set.proposals.length === 0 ? (
            <Text style={styles.blocked}>
              {set.blocker === 'affected-item-fixed'
                ? tr(language, 'Затронутый пункт сам является фиксированным обязательством — этот flow его не переписывает.', 'The affected item is itself a fixed commitment; this flow will not rewrite it.', '受影响项目本身是固定承诺，此流程不会改写它。')
                : tr(language, 'Пока нет source-backed кандидата для безопасной замены.', 'No source-backed replacement candidate is available yet.', '目前没有可安全替换的有来源候选项。')}
            </Text>
          ) : set.proposals.map((proposal) => (
            <View key={proposal.id} style={styles.proposal}>
              <View style={styles.header}>
                <View style={styles.copy}>
                  <Text style={styles.status}>{admissionLabel(language, proposal.admission)}</Text>
                  <Text style={styles.name}>{proposal.candidate.title}</Text>
                  <Text style={styles.meta}>
                    {time(proposal.proposedStartAt)}–{time(proposal.proposedEndAt)}
                    {' · '}
                    {proposal.candidate.kind}
                  </Text>
                </View>
                <View style={proposal.admission === 'executable' ? styles.goodPill : styles.warnPill}>
                  <Text style={proposal.admission === 'executable' ? styles.goodText : styles.warnText}>
                    {proposal.admission === 'executable' ? 'SOURCE + ROUTE' : 'SOURCE ONLY'}
                  </Text>
                </View>
              </View>

              <Text style={styles.source}>
                {proposal.candidate.providerName} · {proposal.candidate.observedAt}
              </Text>

              <View style={styles.routes}>
                <Text style={styles.routeLine}>
                  IN · {routeLabel(language, proposal.inboundRoute)}
                </Text>
                <Text style={styles.routeLine}>
                  OUT · {routeLabel(language, proposal.outboundRoute)}
                </Text>
              </View>

              <View style={styles.actions}>
                <PhysicalPressable
                  style={styles.secondary}
                  contentStyle={styles.center}
                  onPress={() => Linking.openURL(proposal.candidate.sourceUrl).catch(() => undefined)}
                >
                  <Text style={styles.secondaryText}>
                    {tr(language, 'Источник', 'Source', '来源')}
                  </Text>
                </PhysicalPressable>

                {proposal.admission === 'executable' ? (
                  <PhysicalPressable
                    style={styles.accept}
                    contentStyle={styles.center}
                    onPress={() => onAccept(proposal)}
                  >
                    <Text style={styles.acceptText}>
                      {tr(language, 'Принять замену', 'Accept replacement', '确认替换')}
                    </Text>
                  </PhysicalPressable>
                ) : (
                  <View style={styles.disabled}>
                    <Text style={styles.disabledText}>
                      {proposal.admission === 'routing-impossible'
                        ? tr(language, 'Не помещается до следующего обязательства', 'Does not fit before the next commitment', '无法在下一个固定安排前完成')
                        : tr(language, 'Нужна проверка маршрута', 'Route verification required', '需要验证路线')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#394a42',
    backgroundColor: '#101713',
    padding: 14,
    marginBottom: 14
  },
  kicker: { color: '#99b8a7', fontSize: 7.5, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#edf1ed', fontSize: 16, lineHeight: 21, fontWeight: '900', marginTop: 5 },
  body: { color: '#8f9f96', fontSize: 8.5, lineHeight: 13, marginTop: 5 },
  set: { marginTop: 10 },
  blocked: { color: '#b89a75', fontSize: 8.5, lineHeight: 13 },
  proposal: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2b3d34',
    backgroundColor: '#151f19',
    padding: 11,
    marginTop: 8
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  copy: { flex: 1, minWidth: 0 },
  status: { color: '#9fc7ad', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5 },
  name: { color: '#eef1ee', fontSize: 14, lineHeight: 18, fontWeight: '900', marginTop: 3 },
  meta: { color: '#7f9187', fontSize: 8, marginTop: 3 },
  goodPill: { borderRadius: 9, backgroundColor: '#1d3a2a', paddingHorizontal: 7, paddingVertical: 5 },
  warnPill: { borderRadius: 9, backgroundColor: '#3c3020', paddingHorizontal: 7, paddingVertical: 5 },
  goodText: { color: '#9ed0ae', fontSize: 6.5, fontWeight: '900' },
  warnText: { color: '#d1b27f', fontSize: 6.5, fontWeight: '900' },
  source: { color: '#819188', fontSize: 8, lineHeight: 12, marginTop: 8 },
  routes: { borderTopWidth: 1, borderTopColor: '#29372f', marginTop: 8, paddingTop: 7 },
  routeLine: { color: '#a5b2aa', fontSize: 8, lineHeight: 12, marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  secondary: { minHeight: 34, borderRadius: 10, borderWidth: 1, borderColor: '#45564d' },
  secondaryText: { color: '#a5b6ad', fontSize: 7.5, fontWeight: '900' },
  accept: { minHeight: 34, borderRadius: 10, backgroundColor: '#d8dfd8' },
  acceptText: { color: '#152019', fontSize: 7.5, fontWeight: '900' },
  disabled: { minHeight: 34, borderRadius: 10, borderWidth: 1, borderColor: '#554937', paddingHorizontal: 10, justifyContent: 'center' },
  disabledText: { color: '#b49d79', fontSize: 7.5, fontWeight: '800' }
});
