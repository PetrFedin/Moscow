import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import { getInvestorControlSnapshot } from './investorControlModel.ts';

type Copy = {
  kicker: string;
  title: string;
  ask: string;
  scope: string;
  cityProvides: string;
  cityGets: string;
  acceptance: string;
  status: string;
  blockers: string;
  cta: string;
  disclaimer: string;
};

const copy: Record<AppLanguage, Copy> = {
  ru: {
    kicker: 'FIRST PROCUREMENT DECISION',
    title: 'Первый контракт: доказательный пилот Варварка — Зарядье',
    ask: 'ЧТО НУЖНО РЕШИТЬ СЕЙЧАС',
    scope: 'ЧТО ПОКУПАЕТСЯ',
    cityProvides: 'ЧТО НУЖНО ОТ МОСКВЫ',
    cityGets: 'ЧТО ПОЛУЧАЕТ МОСКВА',
    acceptance: 'КАК ПРИНИМАЕТСЯ',
    status: 'ТЕКУЩАЯ ГОТОВНОСТЬ',
    blockers: 'ЧТО ЕЩЁ НЕ ДОКАЗАНО',
    cta: 'Открыть Contract Builder',
    disclaimer: 'Это структура первого закупаемого шага, а не утверждённая закупка, цена или обязательство города.'
  },
  en: {
    kicker: 'FIRST PROCUREMENT DECISION',
    title: 'First contract: evidence pilot for Varvarka — Zaryadye',
    ask: 'DECISION NEEDED NOW',
    scope: 'WHAT IS PURCHASED',
    cityProvides: 'WHAT MOSCOW PROVIDES',
    cityGets: 'WHAT MOSCOW RECEIVES',
    acceptance: 'HOW IT IS ACCEPTED',
    status: 'CURRENT READINESS',
    blockers: 'WHAT IS NOT YET PROVEN',
    cta: 'Open Contract Builder',
    disclaimer: 'This is the structure of the first purchasable step, not an approved procurement, price or city commitment.'
  },
  zh: {
    kicker: 'FIRST PROCUREMENT DECISION',
    title: '首份合同：瓦尔瓦尔卡 — 扎里亚季耶证据型试点',
    ask: '现在需要决定什么',
    scope: '采购内容',
    cityProvides: '莫斯科需要提供什么',
    cityGets: '莫斯科获得什么',
    acceptance: '如何验收',
    status: '当前准备状态',
    blockers: '尚未证明的内容',
    cta: '打开 Contract Builder',
    disclaimer: '这是首个可采购步骤的结构，不代表已批准采购、价格或城市承诺。'
  }
};

export default function PilotProcurementDecisionCard({
  language,
  onOpenContract
}: {
  language: AppLanguage;
  onOpenContract: () => void;
}) {
  const snapshot = useMemo(() => getInvestorControlSnapshot(), []);
  const t = copy[language];
  const blocked = !snapshot.scaleDecision.decisionPackReady;

  const rows = language === 'ru'
    ? {
        ask: 'Назначить business owner, pilot owner, data/integration owner и согласовать рабочую сессию по scope + acceptance + правовой форме.',
        scope: 'Ограниченный pilot Варварка — Зарядье: 5 точек, 2 hero objects, traveler flow, один provider/integration contour, field/visitor evidence и измерение production economics.',
        cityProvides: 'Доступ к пилотной площадке и профильным владельцам, согласованные data/integration boundaries, правообладателей/экспертов для content review и формальный acceptance owner.',
        cityGets: 'Reference client, district package, Heritage Studio/Control Center workflows, integration contracts, evidence pack и Go/No-Go основание для следующего этапа.',
        acceptance: 'Только по заранее согласованным proof gates, governance gates, measured cost inputs и формальному handover. Demo readiness не заменяет field evidence.'
      }
    : language === 'en'
      ? {
          ask: 'Nominate the business owner, pilot owner and data/integration owner, then agree a working session on scope + acceptance + legal form.',
          scope: 'Bounded Varvarka — Zaryadye pilot: 5 points, 2 hero objects, traveler flow, one provider/integration contour, field/visitor evidence and measured production economics.',
          cityProvides: 'Pilot-site access and responsible owners, agreed data/integration boundaries, rights-holders/experts for content review, and a formal acceptance owner.',
          cityGets: 'Reference client, district package, Heritage Studio/Control Center workflows, integration contracts, evidence pack and a Go/No-Go basis for the next stage.',
          acceptance: 'Only against agreed proof gates, governance gates, measured cost inputs and formal handover. Demo readiness never substitutes for field evidence.'
        }
      : {
          ask: '指定 business owner、pilot owner、data/integration owner，并就 scope + acceptance + 法律形式召开工作会议。',
          scope: '有限的瓦尔瓦尔卡 — 扎里亚季耶试点：5 个点位、2 个 hero objects、traveler flow、一个 provider/integration contour、现场/游客证据和 production economics 测量。',
          cityProvides: '试点场地和责任人、明确的数据/集成边界、用于内容审核的权利人/专家，以及正式验收负责人。',
          cityGets: 'Reference client、district package、Heritage Studio/Control Center workflow、integration contracts、evidence pack 和下一阶段 Go/No-Go 依据。',
          acceptance: '仅按事先确认的 proof gates、governance gates、measured cost inputs 和正式 handover 验收。Demo readiness 不替代真实现场证据。'
        };

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>{t.kicker}</Text>
      <Text style={styles.title}>{t.title}</Text>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, blocked ? styles.statusBlocked : styles.statusReady]}>
          <Text style={styles.statusText}>
            {blocked
              ? (language === 'ru' ? 'PRE-PILOT · BLOCKED' : language === 'en' ? 'PRE-PILOT · BLOCKED' : '试点前 · 尚未就绪')
              : (language === 'ru' ? 'READY FOR HUMAN DECISION' : language === 'en' ? 'READY FOR HUMAN DECISION' : '可提交人工决策')}
          </Text>
        </View>
        <Text style={styles.statusMeta}>
          {t.status}: {snapshot.pilot.executionStatus}
        </Text>
      </View>

      <DecisionRow label={t.ask} text={rows.ask} />
      <DecisionRow label={t.scope} text={rows.scope} />
      <DecisionRow label={t.cityProvides} text={rows.cityProvides} />
      <DecisionRow label={t.cityGets} text={rows.cityGets} />
      <DecisionRow label={t.acceptance} text={rows.acceptance} />

      <View style={styles.blockers}>
        <Text style={styles.blockersLabel}>{t.blockers}</Text>
        <Text style={styles.blockersValue}>{snapshot.scaleDecision.blockerCount}</Text>
        <Text style={styles.blockersMeta}>
          Proof: {snapshot.scaleDecision.proofReady ? 'READY' : 'BLOCKED'}
          {' · '}
          Governance: {snapshot.scaleDecision.governanceReady ? 'READY' : 'BLOCKED'}
          {' · '}
          Economics: {snapshot.scaleDecision.economicsReady ? 'READY' : 'BLOCKED'}
        </Text>
      </View>

      <PhysicalPressable
        accessibilityRole="button"
        accessibilityLabel={t.cta}
        style={styles.cta}
        contentStyle={styles.ctaContent}
        onPress={onOpenContract}
      >
        <Text style={styles.ctaText}>{t.cta} →</Text>
      </PhysicalPressable>

      <Text style={styles.disclaimer}>{t.disclaimer}</Text>
    </View>
  );
}

function DecisionRow({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 16,
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#121518',
    borderWidth: 1,
    borderColor: '#6b5732'
  },
  kicker: { color: '#c8a96a', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#f4eee4', fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 7 },
  statusRow: { marginTop: 12, gap: 7 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  statusBlocked: { backgroundColor: '#321f21' },
  statusReady: { backgroundColor: '#19281d' },
  statusText: { color: '#ead7d9', fontSize: 8, fontWeight: '900' },
  statusMeta: { color: '#899197', fontSize: 9, lineHeight: 14 },
  row: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  rowLabel: { color: '#c8a96a', fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  rowText: { color: '#d5dade', fontSize: 11, lineHeight: 17, marginTop: 5 },
  blockers: { marginTop: 10, padding: 13, borderRadius: 14, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  blockersLabel: { color: '#d5a9af', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  blockersValue: { color: '#f3d7db', fontSize: 24, fontWeight: '900', marginTop: 5 },
  blockersMeta: { color: '#ad9397', fontSize: 9, lineHeight: 14, marginTop: 4 },
  cta: { marginTop: 12, minHeight: 46, borderRadius: 14, backgroundColor: '#d3b36f' },
  ctaContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  ctaText: { color: '#17130c', fontSize: 11, fontWeight: '900' },
  disclaimer: { color: '#7e858b', fontSize: 8, lineHeight: 13, marginTop: 9 }
});
