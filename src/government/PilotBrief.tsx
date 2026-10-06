import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import { getInvestorControlSnapshot } from './investorControlModel.ts';

type PilotBriefCopy = {
  kicker: string;
  title: string;
  problem: string;
  scope: string;
  contribution: string;
  deliverables: string;
  acceptance: string;
  blockers: string;
  nextDecision: string;
  openContract: string;
  note: string;
};

const copy: Record<AppLanguage, PilotBriefCopy> = {
  ru: {
    kicker: 'ONE-PAGE PILOT BRIEF',
    title: 'Варварка — Зарядье · первый закупаемый шаг',
    problem: 'ПРОБЛЕМА',
    scope: 'SCOPE',
    contribution: 'ВКЛАД МОСКВЫ',
    deliverables: 'DELIVERABLES',
    acceptance: 'ACCEPTANCE',
    blockers: 'BLOCKERS',
    nextDecision: 'NEXT DECISION',
    openContract: 'Открыть Contract Builder',
    note: 'Brief фиксирует структуру пилота и текущие доказательные пробелы. Это не утверждённая закупка и не цена.'
  },
  en: {
    kicker: 'ONE-PAGE PILOT BRIEF',
    title: 'Varvarka — Zaryadye · first purchasable step',
    problem: 'PROBLEM',
    scope: 'SCOPE',
    contribution: 'MOSCOW CONTRIBUTION',
    deliverables: 'DELIVERABLES',
    acceptance: 'ACCEPTANCE',
    blockers: 'BLOCKERS',
    nextDecision: 'NEXT DECISION',
    openContract: 'Open Contract Builder',
    note: 'The brief fixes pilot structure and current evidence gaps. It is not an approved procurement or price.'
  },
  zh: {
    kicker: 'ONE-PAGE PILOT BRIEF',
    title: '瓦尔瓦尔卡 — 扎里亚季耶 · 首个可采购步骤',
    problem: '问题',
    scope: '范围',
    contribution: '莫斯科投入',
    deliverables: '交付物',
    acceptance: '验收',
    blockers: '阻塞项',
    nextDecision: '下一决策',
    openContract: '打开 Contract Builder',
    note: 'Brief 固定试点结构和当前证据缺口，不代表已批准采购或价格。'
  }
};

export default function PilotBrief({
  language,
  onOpenContract
}: {
  language: AppLanguage;
  onOpenContract: () => void;
}) {
  const snapshot = useMemo(() => getInvestorControlSnapshot(), []);
  const t = copy[language];

  const text = language === 'ru'
    ? {
        problem: 'Туристический день сегодня фрагментирован между планом, билетами, бронированиями, маршрутами и provider truth; городу не хватает единого доказательного контура от намерения до подтверждённого результата.',
        scope: 'Ограниченный пилот Варварка — Зарядье: 5 точек, 2 hero objects, traveler flow, один provider/integration contour, field evidence, visitor evidence и измерение production economics.',
        contribution: 'Назначенные owners, доступ к пилотной площадке, согласованные data/integration boundaries, content review с правообладателями/экспертами и формальный acceptance owner.',
        deliverables: snapshot.deliverables.titles.join(' · '),
        acceptance: 'Proof gates + governance gates + measured economics + formal handover. Demo-прохождение само по себе не считается приёмкой.',
        blockers: snapshot.scaleDecision.blockers.join(' · '),
        nextDecision: snapshot.scaleDecision.nextDecision
      }
    : language === 'en'
      ? {
          problem: 'The traveler day is fragmented across planning, tickets, reservations, routes and provider truth; the city lacks one evidence path from intent to confirmed outcome.',
          scope: 'Bounded Varvarka — Zaryadye pilot: 5 points, 2 hero objects, traveler flow, one provider/integration contour, field evidence, visitor evidence and measured production economics.',
          contribution: 'Named owners, pilot-site access, agreed data/integration boundaries, rights-holder/expert content review and a formal acceptance owner.',
          deliverables: snapshot.deliverables.titles.join(' · '),
          acceptance: 'Proof gates + governance gates + measured economics + formal handover. Demo completion alone is not acceptance.',
          blockers: snapshot.scaleDecision.blockers.join(' · '),
          nextDecision: snapshot.scaleDecision.nextDecision
        }
      : {
          problem: '游客的一天被计划、门票、预订、路线和 provider truth 分散；城市缺少从意图到已确认结果的统一证据链。',
          scope: '有限的瓦尔瓦尔卡 — 扎里亚季耶试点：5 个点位、2 个 hero objects、traveler flow、一个 provider/integration contour、现场证据、游客证据和 production economics 测量。',
          contribution: '指定 owners、试点场地访问、明确的数据/集成边界、权利人/专家内容审核和正式验收负责人。',
          deliverables: snapshot.deliverables.titles.join(' · '),
          acceptance: 'Proof gates + governance gates + measured economics + formal handover。仅完成 demo 不等于验收。',
          blockers: snapshot.scaleDecision.blockers.join(' · '),
          nextDecision: snapshot.scaleDecision.nextDecision
        };

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>{t.kicker}</Text>
      <Text style={styles.title}>{t.title}</Text>

      <BriefRow label={t.problem} text={text.problem} />
      <BriefRow label={t.scope} text={text.scope} />
      <BriefRow label={t.contribution} text={text.contribution} />
      <BriefRow label={t.deliverables} text={text.deliverables} />
      <BriefRow label={t.acceptance} text={text.acceptance} />
      <BriefRow label={t.blockers} text={text.blockers || '—'} warning />
      <BriefRow label={t.nextDecision} text={text.nextDecision} strong />

      <PhysicalPressable
        accessibilityRole="button"
        accessibilityLabel={t.openContract}
        style={styles.cta}
        contentStyle={styles.ctaContent}
        onPress={onOpenContract}
      >
        <Text style={styles.ctaText}>{t.openContract} →</Text>
      </PhysicalPressable>

      <Text style={styles.note}>{t.note}</Text>
    </View>
  );
}

function BriefRow({
  label,
  text,
  warning = false,
  strong = false
}: {
  label: string;
  text: string;
  warning?: boolean;
  strong?: boolean;
}) {
  return (
    <View style={[styles.row, warning && styles.rowWarning, strong && styles.rowStrong]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.text, strong && styles.textStrong]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#121518',
    borderWidth: 1,
    borderColor: '#6b5732'
  },
  kicker: { color: '#c8a96a', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#f4eee4', fontSize: 22, lineHeight: 28, fontWeight: '900', marginTop: 7 },
  row: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  rowWarning: { backgroundColor: '#171416', borderColor: '#4b373a' },
  rowStrong: { backgroundColor: '#171411', borderColor: '#665532' },
  label: { color: '#c8a96a', fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  text: { color: '#d4dadd', fontSize: 11, lineHeight: 17, marginTop: 5 },
  textStrong: { color: '#f0e4cb', fontSize: 13, lineHeight: 19, fontWeight: '900' },
  cta: { marginTop: 12, minHeight: 46, borderRadius: 14, backgroundColor: '#d3b36f' },
  ctaContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  ctaText: { color: '#17130c', fontSize: 11, fontWeight: '900' },
  note: { color: '#7e858b', fontSize: 8, lineHeight: 13, marginTop: 9 }
});
