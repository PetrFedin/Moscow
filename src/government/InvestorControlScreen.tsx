import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { tr, type AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import { getInvestorControlSnapshot } from './investorControlModel';
import { getPilotDeliveryObligation, type PilotContractSectionId } from './pilotContractAuthority';
import { getPilotBlockerLabel, getPilotObligationCopy } from './pilotContractCopy';
import type { PilotDecisionBlocker } from './pilotInvestmentDecision';
import { getInvestorMvpCopy } from './investorMvpCopy';

function formatRub(value: number, language: AppLanguage) {
  return new Intl.NumberFormat(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ru-RU',
    {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }
  ).format(value);
}

function executionStatus(language: AppLanguage, status: string) {
  if (status === 'VERIFIED PILOT PACK READY') {
    return tr(language, 'ПАКЕТ VERIFIED PILOT ГОТОВ', 'VERIFIED PILOT PACK READY', '已验证试点包已就绪');
  }
  if (status === 'TECHNICAL PILOT PACK READY · EXECUTION NOT PROVEN') {
    return tr(
      language,
      'ТЕХНИЧЕСКИЙ ПАКЕТ ГОТОВ · ИСПОЛНЕНИЕ ЕЩЁ НЕ ДОКАЗАНО',
      'TECHNICAL PILOT PACK READY · EXECUTION NOT PROVEN',
      '技术试点包已就绪 · 实际执行尚未验证'
    );
  }
  if (status === 'INTRO PACK READY · TECHNICAL APPROVAL BLOCKED') {
    return tr(
      language,
      'INTRO PACK ГОТОВ · ТЕХНИЧЕСКОЕ СОГЛАСОВАНИЕ ЗАБЛОКИРОВАНО',
      'INTRO PACK READY · TECHNICAL APPROVAL BLOCKED',
      '介绍材料已就绪 · 技术批准尚未完成'
    );
  }
  return tr(
    language,
    'ДО ПИЛОТА · ФОРМАЛЬНЫЙ ПАКЕТ НЕПОЛНЫЙ',
    'PRE-PILOT · FORMAL PACK INCOMPLETE',
    '试点前阶段 · 正式材料尚不完整'
  );
}

function missingCostLines(language: AppLanguage, labels: string[]) {
  const translated: Record<string, [string, string, string]> = {
    '₽ / следующий verified object': ['₽ / следующий verified object', 'RUB / next verified object', '卢布 / 下一个 verified object'],
    'Lead time / object': ['Lead time / object', 'Lead time / object', '单对象周期'],
    'Developer hours / object': ['Developer hours / object', 'Developer hours / object', '单对象开发工时'],
    'Institution hours / object': ['Institution hours / object', 'Institution hours / object', '单对象机构工时'],
    'Shared setup / district': ['Shared setup / district', 'Shared setup / district', '区域共享初始化'],
    'Integration / district': ['Integration / district', 'Integration / district', '区域集成成本'],
    'Annual operations': ['Annual operations', 'Annual operations', '年度运营成本']
  };

  return labels.map((label) => {
    const item = translated[label];
    return item ? tr(language, item[0], item[1], item[2]) : label;
  });
}

export default function InvestorControlScreen({
  language,
  onOpenContract
}: {
  language: AppLanguage;
  onOpenContract?: (section: PilotContractSectionId, blocker: PilotDecisionBlocker) => void;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const snapshot = useMemo(() => getInvestorControlSnapshot(), []);
  const copy = useMemo(() => getInvestorMvpCopy(language), [language]);
  const measuredKpis = snapshot.cityKpis.filter((item) => item.value !== null).length;
  const localizedExecutionStatus = executionStatus(language, snapshot.pilot.executionStatus);

  const kpiLines = snapshot.cityKpis.map((item) => {
    const title = item.id === 'journey-completion'
      ? tr(language, 'Завершение маршрута', 'Journey completion', '旅程完成率')
      : item.id === 'cultural-reach'
        ? tr(language, 'Охват культурных точек', 'Cultural reach', '文化点位触达')
        : item.id === 'heritage-engagement'
          ? tr(language, 'Вовлечённость в heritage', 'Heritage engagement', '文化遗产互动')
          : item.id === 'provider-handoff'
            ? tr(language, 'Переход к провайдеру', 'Provider handoff', '服务商跳转')
            : item.id === 'continuation'
              ? tr(language, 'Продолжение маршрута', 'Route continuation', '路线延续')
              : tr(language, 'Цикл производства объекта', 'Production cycle / object', '单对象生产周期');

    return item.value
      ? `${title}: ${item.value}`
      : `${title}: ${tr(language, 'измеряется в пилоте', 'measured in pilot', '在试点中测量')}`;
  });

  return (
    <View>
      <View style={styles.executiveHero}>
        <View style={styles.executiveHeroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>EXECUTIVE PROCUREMENT VIEW</Text>
            <Text style={styles.heroTitle}>
              {tr(
                language,
                'Что Москва покупает и что должно быть доказано до масштаба',
                'What Moscow buys and what must be proven before scale',
                '莫斯科购买什么，以及规模化前必须证明什么'
              )}
            </Text>
          </View>
          <View style={[
            styles.stageBadge,
            snapshot.scaleDecision.decisionPackReady && styles.stageBadgeReady
          ]}>
            <Text style={[
              styles.stageBadgeText,
              snapshot.scaleDecision.decisionPackReady && styles.stageBadgeTextReady
            ]}>
              {snapshot.scaleDecision.decisionPackReady
                ? tr(language, 'ГОТОВО К РЕШЕНИЮ ЛПР', 'READY FOR HUMAN DECISION', '可提交决策人')
                : tr(language, 'ЗАБЛОКИРОВАНО', 'BLOCKED', '尚未具备决策条件')}
            </Text>
          </View>
        </View>

        <Text style={styles.heroBody}>
          {tr(
            language,
            'Один экран связывает scope пилота, поставляемые активы, критерии приёмки, фактическую себестоимость, KPI города и решение о следующем этапе.',
            'One screen connects pilot scope, deliverables, acceptance criteria, measured cost basis, city KPIs and the next-stage decision.',
            '一个界面连接试点范围、交付资产、验收标准、实际成本基础、城市 KPI 与下一阶段决策。'
          )}
        </Text>

        <View style={styles.executionStrip}>
          <Text style={styles.executionLabel}>
            {tr(language, 'ТЕКУЩАЯ СТАДИЯ', 'CURRENT STAGE', '当前阶段')}
          </Text>
          <Text style={styles.executionValue}>{localizedExecutionStatus}</Text>
        </View>
      </View>

      <View style={[styles.grid, compact && styles.gridCompact]}>
        <DashboardCard
          compact={compact}
          kicker={tr(language, '01 · ПИЛОТ', '01 · PILOT', '01 · 试点')}
          title={tr(language, 'Варварка — Зарядье', 'Varvarka — Zaryadye', '瓦尔瓦尔卡 — 扎里亚季耶')}
          value="5 / 2"
          valueLabel={tr(language, 'точек / hero objects', 'points / hero objects', '点位 / 核心对象')}
          status={localizedExecutionStatus}
          lines={[
            `${snapshot.pilot.participantRange} ${tr(language, 'supervised sessions', 'supervised sessions', '次受监督体验')}`,
            tr(language, 'Путь: план → день → маршрут → experience → посещение', 'Journey: plan → day → route → experience → visit', '路径：计划 → 当天 → 路线 → 体验 → 到访'),
            tr(language, 'Scope ограничен и пригоден для формальной приёмки', 'Scope is bounded and suitable for formal acceptance', '范围有限，可进行正式验收')
          ]}
        />

        <DashboardCard
          compact={compact}
          kicker={tr(language, '02 · DELIVERABLES', '02 · DELIVERABLES', '02 · 交付成果')}
          title={tr(language, 'Что остаётся у города', 'What remains with the city', '城市最终获得什么')}
          value={String(snapshot.deliverables.scoped)}
          valueLabel={tr(language, 'результатов в MVP scope', 'deliverables in MVP scope', '项 MVP 交付成果')}
          status={snapshot.deliverables.accepted > 0
            ? tr(language, 'ПРИНЯТО', 'ACCEPTED', '已验收')
            : tr(language, 'ПРИЁМКА ПОСЛЕ ПИЛОТА', 'ACCEPTANCE AFTER PILOT', '试点后验收')}
          lines={copy.deliverables.items.map((item) => item.title)}
        />

        <DashboardCard
          compact={compact}
          kicker={tr(language, '03 · ACCEPTANCE', '03 · ACCEPTANCE', '03 · 验收')}
          title={tr(language, 'Доказательства и governance', 'Evidence and governance', '证据与治理')}
          value={`${snapshot.acceptance.proofPassed}/${snapshot.acceptance.proofTotal}`}
          valueLabel={tr(language, 'external proof gates', 'external proof gates', '外部证明关卡')}
          status={`${snapshot.acceptance.formalArtifactsReady}/${snapshot.acceptance.formalArtifactsTotal} ${tr(language, 'formal artifacts ready', 'formal artifacts ready', '正式材料已就绪')}`}
          lines={[
            `${tr(language, 'Physical / visitor / provider proof', 'Physical / visitor / provider proof', '现场 / 游客 / 服务商证明')}: ${snapshot.acceptance.proofPassed}/${snapshot.acceptance.proofTotal}`,
            `${tr(language, 'Governance gates', 'Governance gates', '治理关卡')}: ${snapshot.acceptance.governancePassed}/${snapshot.acceptance.governanceTotal}`,
            tr(language, 'Готовность документов не заменяет реальный pilot evidence', 'Document readiness does not replace real pilot evidence', '文件准备完成并不能替代真实试点证据')
          ]}
        />

        <DashboardCard
          compact={compact}
          kicker={tr(language, '04 · COST BASIS', '04 · COST BASIS', '04 · 成本基础')}
          title={tr(language, 'Сколько будет стоить следующий район', 'What the next district will cost', '下一个区域将花费多少')}
          value={
            snapshot.costBasis.nextDistrictCostRub
              ? `${formatRub(snapshot.costBasis.nextDistrictCostRub.min, language)}–${formatRub(snapshot.costBasis.nextDistrictCostRub.max, language)}`
              : tr(language, 'НЕ ИЗМЕРЕНО', 'NOT MEASURED', '尚未测量')
          }
          valueLabel={
            snapshot.costBasis.nextDistrictCostRub
              ? tr(language, 'арифметика сценария 10–30 объектов', '10–30 object scenario arithmetic', '10–30 个对象情景计算')
              : `${snapshot.costBasis.measured}/${snapshot.costBasis.total} cost inputs`
          }
          status="shared setup + integration + 10–30 × measured verified-object cost"
          lines={
            snapshot.costBasis.missingLabels.length > 0
              ? missingCostLines(language, snapshot.costBasis.missingLabels)
              : [tr(language, 'Все cost inputs имеют basis и evidence reference', 'All cost inputs have basis and evidence reference', '所有成本输入均有依据与证据引用')]
          }
        />

        <DashboardCard
          compact={compact}
          kicker={tr(language, '05 · CITY KPI', '05 · CITY KPI', '05 · 城市 KPI')}
          title={tr(language, 'Что измеряет город', 'What the city measures', '城市测量什么')}
          value={`${measuredKpis}/${snapshot.cityKpis.length}`}
          valueLabel={tr(language, 'KPI с фактическим значением', 'KPIs with measured values', '已有实测值的 KPI')}
          status={tr(
            language,
            'TARGETS НЕ ПРИДУМЫВАЕМ · ЗНАЧЕНИЯ ТОЛЬКО ПО ПИЛОТУ',
            'NO INVENTED TARGETS · VALUES ONLY FROM PILOT',
            '不虚构目标值 · 数值仅来自试点'
          )}
          lines={kpiLines}
        />

        <DashboardCard
          compact={compact}
          kicker={tr(language, '06 · SCALE DECISION', '06 · SCALE DECISION', '06 · 规模化决策')}
          title={tr(language, 'Можно ли покупать следующий этап', 'Can the next stage be purchased', '是否可以采购下一阶段')}
          value={snapshot.scaleDecision.decisionPackReady
            ? tr(language, 'ГОТОВО К РЕШЕНИЮ', 'READY FOR DECISION', '可进入决策')
            : tr(language, 'ЗАБЛОКИРОВАНО', 'BLOCKED', '尚未具备条件')}
          valueLabel={`${snapshot.scaleDecision.blockerCount} ${tr(language, 'блокеров', 'blockers', '个阻塞项')}`}
          status={snapshot.scaleDecision.decisionPackReady
            ? tr(language, 'ПАКЕТ ГОТОВ К РЕШЕНИЮ ЛПР', 'PACK READY FOR HUMAN DECISION', '材料可提交决策人')
            : tr(language, 'МАСШТАБ НЕ ПОКУПАЕТСЯ ДО ЗАКРЫТИЯ GATES', 'DO NOT BUY SCALE BEFORE GATES CLOSE', '关卡未关闭前不采购规模化')}
          lines={[
            `Proof: ${snapshot.scaleDecision.proofReady ? 'READY' : 'BLOCKED'}`,
            `Governance: ${snapshot.scaleDecision.governanceReady ? 'READY' : 'BLOCKED'}`,
            `Economics: ${snapshot.scaleDecision.economicsReady ? 'READY' : 'BLOCKED'}`
          ]}
        />
      </View>

      {snapshot.scaleDecision.blockers.length > 0 && (
        <View style={styles.blockerSection}>
          <Text style={styles.blockerSectionKicker}>
            {tr(language, 'BLOCKERS → ДОГОВОРНЫЕ ОБЯЗАТЕЛЬСТВА', 'BLOCKERS → CONTRACT OBLIGATIONS', '阻塞项 → 合同义务')}
          </Text>
          <Text style={styles.blockerSectionTitle}>
            {tr(
              language,
              'Каждый риск должен иметь владельца, доказательство, пункт приёмки и milestone оплаты',
              'Every risk must have an owner, evidence, acceptance clause and payment milestone',
              '每个风险都必须绑定责任人、证据、验收条款和付款里程碑'
            )}
          </Text>

          <View style={styles.blockerList}>
            {snapshot.scaleDecision.blockers.map((blocker) => {
              const obligation = getPilotDeliveryObligation(blocker);
              if (!obligation) return null;
              const localized = getPilotObligationCopy(language, obligation);
              return (
                <PhysicalPressable
                  key={blocker}
                  style={styles.blockerCard}
                  contentStyle={styles.blockerCardContent}
                  onPress={() => onOpenContract?.(obligation.contractSection, blocker)}
                  accessibilityLabel={`${localized.blocker} · ${localized.responsible}`}
                >
                  <View style={styles.blockerCardTop}>
                    <Text style={styles.blockerCardTitle}>{getPilotBlockerLabel(language, blocker)}</Text>
                    <Text style={styles.blockerArrow}>→</Text>
                  </View>
                  <Text style={styles.blockerMeta}>
                    {tr(language, 'Ответственный', 'Responsible', '责任方')}: {localized.responsible}
                  </Text>
                  <Text style={styles.blockerMeta}>
                    {tr(language, 'Evidence', 'Evidence', '证据')}: {localized.evidence}
                  </Text>
                  <Text style={styles.blockerMeta}>
                    {tr(language, 'Приёмка', 'Acceptance', '验收')}: {localized.acceptanceClause}
                  </Text>
                  <Text style={styles.blockerMeta}>
                    {tr(language, 'Milestone', 'Milestone', '里程碑')}: {localized.paymentMilestone}
                  </Text>
                </PhysicalPressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.nextDecision}>
        <Text style={styles.nextDecisionKicker}>
          {tr(language, 'ОДНО РЕШЕНИЕ ПОСЛЕ ДЕМО', 'ONE DECISION AFTER THE DEMO', '演示后的一个决策')}
        </Text>
        <Text style={styles.nextDecisionText}>{copy.acceptance.nextDecision}</Text>
      </View>
    </View>
  );
}

function DashboardCard({
  compact,
  kicker,
  title,
  value,
  valueLabel,
  status,
  lines
}: {
  compact: boolean;
  kicker: string;
  title: string;
  value: string;
  valueLabel: string;
  status: string;
  lines: readonly string[];
}) {
  return (
    <View style={[styles.card, compact ? styles.cardCompact : styles.cardWide]}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardValueLabel}>{valueLabel}</Text>
      <View style={styles.cardStatus}>
        <Text style={styles.cardStatusText}>{status}</Text>
      </View>
      <View style={styles.lines}>
        {lines.map((line, index) => (
          <View key={`${title}-${index}`} style={styles.line}>
            <Text style={styles.lineIndex}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={styles.lineText}>{line}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  executiveHero: {
    backgroundColor: '#121518',
    borderWidth: 1,
    borderColor: '#393226',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12
  },
  executiveHeroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14
  },
  heroCopy: { flex: 1 },
  kicker: {
    color: '#c8a96a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.45
  },
  heroTitle: {
    color: '#f5efe4',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    marginTop: 8
  },
  heroBody: {
    color: '#aeb3b8',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10
  },
  stageBadge: {
    maxWidth: 180,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#241b1c',
    borderWidth: 1,
    borderColor: '#68474b'
  },
  stageBadgeReady: {
    backgroundColor: '#17231b',
    borderColor: '#4b7056'
  },
  stageBadgeText: {
    color: '#e6b8be',
    fontSize: 8,
    lineHeight: 12,
    fontWeight: '900',
    textAlign: 'center'
  },
  stageBadgeTextReady: { color: '#bce1c5' },
  executionStrip: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#2c3034'
  },
  executionLabel: {
    color: '#777f86',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  executionValue: {
    color: '#d9dde0',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '900',
    marginTop: 5
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  gridCompact: { flexDirection: 'column' },
  card: {
    backgroundColor: '#101316',
    borderWidth: 1,
    borderColor: '#292e33',
    borderRadius: 20,
    padding: 17
  },
  cardWide: {
    width: '49%',
    minHeight: 310
  },
  cardCompact: {
    width: '100%',
    minHeight: 0
  },
  cardTitle: {
    color: '#f1ece3',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    marginTop: 8
  },
  cardValue: {
    color: '#d9bd81',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    marginTop: 14
  },
  cardValueLabel: {
    color: '#92999f',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    marginTop: 2
  },
  cardStatus: {
    marginTop: 13,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#171b1e'
  },
  cardStatusText: {
    color: '#c7ccd0',
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '900'
  },
  lines: { marginTop: 12, gap: 7 },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  lineIndex: {
    width: 20,
    color: '#716550',
    fontSize: 8,
    lineHeight: 15,
    fontWeight: '900'
  },
  lineText: {
    flex: 1,
    color: '#aeb4b9',
    fontSize: 11,
    lineHeight: 16
  },
  blockerSection: {
    marginTop: 12,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#111417',
    borderWidth: 1,
    borderColor: '#34302a'
  },
  blockerSectionKicker: {
    color: '#c8a96a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  blockerSectionTitle: {
    color: '#eee8de',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 7
  },
  blockerList: { gap: 8, marginTop: 14 },
  blockerCard: {
    borderRadius: 16,
    backgroundColor: '#17191b',
    borderWidth: 1,
    borderColor: '#2e3337'
  },
  blockerCardContent: {
    padding: 13
  },
  blockerCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  blockerCardTitle: {
    flex: 1,
    color: '#e8ddd0',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900'
  },
  blockerArrow: {
    color: '#d3b36f',
    fontSize: 17,
    fontWeight: '900'
  },
  blockerMeta: {
    color: '#9fa6ac',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4
  },
  nextDecision: {
    marginTop: 12,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#d3b36f'
  },
  nextDecisionKicker: {
    color: '#594923',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3
  },
  nextDecisionText: {
    color: '#17130c',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '900',
    marginTop: 8
  }
});
