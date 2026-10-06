import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getInvestorControlSnapshot } from './investorControlModel';

function formatRub(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value);
}

export default function InvestorControlScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const snapshot = useMemo(() => getInvestorControlSnapshot(), []);
  const measuredKpis = snapshot.cityKpis.filter((item) => item.value !== null).length;

  return (
    <View>
      <View style={styles.executiveHero}>
        <View style={styles.executiveHeroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>EXECUTIVE PROCUREMENT VIEW</Text>
            <Text style={styles.heroTitle}>Что Москва покупает и что должно быть доказано до масштаба</Text>
          </View>
          <View style={[
            styles.stageBadge,
            snapshot.scaleDecision.decisionPackReady && styles.stageBadgeReady
          ]}>
            <Text style={[
              styles.stageBadgeText,
              snapshot.scaleDecision.decisionPackReady && styles.stageBadgeTextReady
            ]}>
              {snapshot.scaleDecision.status}
            </Text>
          </View>
        </View>

        <Text style={styles.heroBody}>
          Один экран связывает scope пилота, поставляемые активы, критерии приёмки, фактическую себестоимость, KPI города и решение о следующем этапе.
        </Text>

        <View style={styles.executionStrip}>
          <Text style={styles.executionLabel}>ТЕКУЩАЯ СТАДИЯ</Text>
          <Text style={styles.executionValue}>{snapshot.pilot.executionStatus}</Text>
        </View>
      </View>

      <View style={[styles.grid, compact && styles.gridCompact]}>
        <DashboardCard
          compact={compact}
          kicker="01 · ПИЛОТ"
          title={snapshot.pilot.territory}
          value="5 / 2"
          valueLabel="точек / hero objects"
          status={snapshot.pilot.executionStatus}
          lines={[
            `${snapshot.pilot.participantRange} supervised sessions`,
            'Traveler path: план → день → маршрут → experience → посещение',
            'Scope ограничен и пригоден для формальной приёмки'
          ]}
        />

        <DashboardCard
          compact={compact}
          kicker="02 · DELIVERABLES"
          title="Что остаётся у города"
          value={String(snapshot.deliverables.scoped)}
          valueLabel="результатов в MVP scope"
          status={snapshot.deliverables.accepted > 0 ? 'ACCEPTED' : 'ПРИЁМКА ПОСЛЕ ПИЛОТА'}
          lines={snapshot.deliverables.titles}
        />

        <DashboardCard
          compact={compact}
          kicker="03 · ACCEPTANCE"
          title="Доказательства и governance"
          value={`${snapshot.acceptance.proofPassed}/${snapshot.acceptance.proofTotal}`}
          valueLabel="external proof gates"
          status={`${snapshot.acceptance.formalArtifactsReady}/${snapshot.acceptance.formalArtifactsTotal} formal artifacts ready`}
          lines={[
            `Physical / visitor / provider proof: ${snapshot.acceptance.proofPassed}/${snapshot.acceptance.proofTotal}`,
            `Governance gates: ${snapshot.acceptance.governancePassed}/${snapshot.acceptance.governanceTotal}`,
            'Формальная готовность документов не заменяет реальный pilot evidence'
          ]}
        />

        <DashboardCard
          compact={compact}
          kicker="04 · COST BASIS"
          title="Сколько будет стоить следующий район"
          value={
            snapshot.costBasis.nextDistrictCostRub
              ? `${formatRub(snapshot.costBasis.nextDistrictCostRub.min)}–${formatRub(snapshot.costBasis.nextDistrictCostRub.max)}`
              : 'НЕ ИЗМЕРЕНО'
          }
          valueLabel={
            snapshot.costBasis.nextDistrictCostRub
              ? 'арифметика сценария 10–30 объектов'
              : `${snapshot.costBasis.measured}/${snapshot.costBasis.total} cost inputs`
          }
          status={snapshot.costBasis.formula}
          lines={
            snapshot.costBasis.missingLabels.length > 0
              ? snapshot.costBasis.missingLabels
              : ['Все обязательные cost inputs имеют basis и evidence reference']
          }
        />

        <DashboardCard
          compact={compact}
          kicker="05 · CITY KPI"
          title="Что измеряет город"
          value={`${measuredKpis}/${snapshot.cityKpis.length}`}
          valueLabel="KPI с фактическим значением"
          status="TARGETS НЕ ПРИДУМЫВАЕМ · ЗНАЧЕНИЯ ТОЛЬКО ПО ПИЛОТУ"
          lines={snapshot.cityKpis.map((item) =>
            item.value ? `${item.title}: ${item.value}` : `${item.title}: измеряется в пилоте`
          )}
        />

        <DashboardCard
          compact={compact}
          kicker="06 · SCALE DECISION"
          title="Можно ли покупать следующий этап"
          value={snapshot.scaleDecision.status}
          valueLabel={`${snapshot.scaleDecision.blockerCount} blockers`}
          status={
            snapshot.scaleDecision.decisionPackReady
              ? 'ПАКЕТ ГОТОВ К РЕШЕНИЮ ЛПР'
              : 'МАСШТАБ НЕ ДОЛЖЕН ПОКУПАТЬСЯ ДО ЗАКРЫТИЯ GATES'
          }
          lines={[
            `Proof: ${snapshot.scaleDecision.proofReady ? 'READY' : 'BLOCKED'}`,
            `Governance: ${snapshot.scaleDecision.governanceReady ? 'READY' : 'BLOCKED'}`,
            `Economics: ${snapshot.scaleDecision.economicsReady ? 'READY' : 'BLOCKED'}`
          ]}
        />
      </View>

      <View style={styles.nextDecision}>
        <Text style={styles.nextDecisionKicker}>ОДНО РЕШЕНИЕ ПОСЛЕ ДЕМО</Text>
        <Text style={styles.nextDecisionText}>{snapshot.scaleDecision.nextDecision}</Text>
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
