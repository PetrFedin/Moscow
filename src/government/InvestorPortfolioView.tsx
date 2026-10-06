import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { tr, type AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import {
  currentCommercialOperatingEvidence
} from './partnerInvestorOperatingModel';
import {
  demoCommercialOperatingEvidence,
  demoScenarioDisclaimer
} from './partnerConsoleSandbox';
import {
  buildInvestorPortfolioSnapshot,
  portfolioLabels,
  type PortfolioMode
} from './investorPortfolioModel';

function rub(language: AppLanguage, value: number | null) {
  if (value === null) return tr(language, 'НЕ ИЗМЕРЕНО', 'NOT MEASURED', '尚未测量');
  return new Intl.NumberFormat(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ru-RU',
    { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }
  ).format(value);
}

function pct(language: AppLanguage, value: number | null) {
  if (value === null) return tr(language, 'НЕ ИЗМЕРЕНО', 'NOT MEASURED', '尚未测量');
  return new Intl.NumberFormat(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ru-RU',
    { style: 'percent', maximumFractionDigits: 1 }
  ).format(value);
}

export default function InvestorPortfolioView({ language }: { language: AppLanguage }) {
  const [mode, setMode] = useState<PortfolioMode>('actual');
  const evidence =
    mode === 'actual' ? currentCommercialOperatingEvidence : demoCommercialOperatingEvidence;

  const snapshot = useMemo(
    () => buildInvestorPortfolioSnapshot(evidence, mode),
    [evidence, mode]
  );

  const totalRevenue = snapshot.totalRecognizedRevenueRub ?? 0;

  return (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>INVESTOR PORTFOLIO VIEW</Text>
            <Text style={styles.title}>
              {tr(
                language,
                'Как меняется revenue mix по мере взросления платформы',
                'How revenue mix evolves as the platform matures',
                '平台成熟过程中收入结构如何变化'
              )}
            </Text>
          </View>

          <View style={styles.modeToggle}>
            {(['actual', 'demo'] as PortfolioMode[]).map((item) => (
              <PhysicalPressable
                key={item}
                style={[styles.modeButton, mode === item && styles.modeButtonActive]}
                contentStyle={styles.center}
                onPress={() => setMode(item)}
                accessibilityLabel={
                  item === 'actual'
                    ? tr(language, 'Фактические данные', 'Actual data', '实际数据')
                    : tr(language, 'Демо сценарий', 'Demo scenario', '演示场景')
                }
              >
                <Text style={[styles.modeText, mode === item && styles.modeTextActive]}>
                  {item === 'actual' ? 'ACTUAL' : 'DEMO'}
                </Text>
              </PhysicalPressable>
            ))}
          </View>
        </View>

        <Text style={styles.body}>
          {mode === 'actual'
            ? tr(
                language,
                'Только данные, подтверждённые operating evidence. Нулевые и неизвестные показатели не заполняются предположениями.',
                'Only operating-evidence-backed data. Zero and unknown metrics are never filled with assumptions.',
                '仅展示 operating evidence 支持的数据。零值和未知指标不会用假设填充。'
              )
            : demoScenarioDisclaimer[language]}
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <Metric label={tr(language, 'Recognised revenue', 'Recognised revenue', '已确认收入')} value={rub(language, snapshot.totalRecognizedRevenueRub)} />
        <Metric label={tr(language, 'Recurring MRR', 'Recurring MRR', 'Recurring MRR')} value={rub(language, snapshot.totalRecurringRevenueRub)} />
        <Metric label={tr(language, 'Signed contracts', 'Signed contracts', '已签合同')} value={String(snapshot.signedCommercialContracts)} />
        <Metric label={tr(language, 'Gross contribution', 'Gross contribution', '毛贡献')} value={rub(language, snapshot.grossContributionRub)} />
        <Metric label={tr(language, 'Gross contribution margin', 'Gross contribution margin', '毛贡献率')} value={pct(language, snapshot.grossContributionMargin)} />
        <Metric label={tr(language, 'Partner retention', 'Partner retention', '合作伙伴留存')} value={pct(language, snapshot.partnerRetentionRate)} />
        <Metric label={tr(language, 'District marginal cost', 'District marginal cost', '区域边际成本')} value={rub(language, snapshot.districtMarginalCostRub)} />
        <Metric label={tr(language, 'Verified regions', 'Verified regions', '已验证地区')} value={String(snapshot.verifiedExternalRegions)} />
      </View>

      <View style={styles.mixSection}>
        <Text style={styles.kicker}>
          {tr(language, 'REVENUE MIX', 'REVENUE MIX', '收入结构')}
        </Text>
        <Text style={styles.mixTitle}>
          {tr(
            language,
            'От разового production к повторяемой платформенной выручке',
            'From one-off production toward repeatable platform revenue',
            '从一次性制作收入走向可重复的平台收入'
          )}
        </Text>

        <View style={styles.mixList}>
          {snapshot.revenueMix.map((bucket) => {
            const amount = bucket.actualRevenueRub;
            const share =
              amount !== null && totalRevenue > 0
                ? amount / totalRevenue
                : null;

            return (
              <View key={bucket.id} style={styles.mixCard}>
                <View style={styles.mixTop}>
                  <Text style={styles.mixName}>{portfolioLabels[bucket.id][language]}</Text>
                  <View style={[
                    styles.evidenceBadge,
                    bucket.evidenceState === 'actual' && styles.evidenceBadgeActual,
                    bucket.evidenceState === 'modelled' && styles.evidenceBadgeModelled
                  ]}>
                    <Text style={styles.evidenceText}>
                      {bucket.evidenceState === 'actual'
                        ? 'ACTUAL'
                        : bucket.evidenceState === 'modelled'
                          ? 'DEMO'
                          : 'NO DATA'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.mixValue}>{rub(language, amount)}</Text>
                <Text style={styles.mixMeta}>
                  {tr(language, 'Зрелость', 'Maturity', '成熟度')}: {bucket.maturity}
                  {' · '}
                  {tr(language, 'Доля', 'Share', '占比')}: {share === null ? '—' : pct(language, share)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.ruleBox}>
        <Text style={styles.kicker}>
          {tr(language, 'INVESTOR DISCIPLINE', 'INVESTOR DISCIPLINE', '投资纪律')}
        </Text>
        <Text style={styles.ruleTitle}>
          {tr(
            language,
            'Demo показывает механику, Actual — только доказанный бизнес',
            'Demo shows mechanics; Actual shows only proven business',
            'Demo 展示机制；Actual 仅展示已验证业务'
          )}
        </Text>
        <Text style={styles.ruleBody}>
          {tr(
            language,
            'Ни один synthetic contract, demo transaction или моделируемая выручка не переносится в Actual Portfolio. Переключатель существует именно для сохранения этой границы.',
            'No synthetic contract, demo transaction or modelled revenue is carried into Actual Portfolio. The switch exists specifically to preserve that boundary.',
            '任何合成合同、演示交易或模拟收入都不会进入 Actual Portfolio。该切换器正是用于保持这条边界。'
          )}
        </Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#121518', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#393226' },
  heroTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  heroCopy: { flex: 1 },
  kicker: { color: '#c8a96a', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#f4eee4', fontSize: 22, lineHeight: 28, fontWeight: '900', marginTop: 7 },
  body: { color: '#aeb4b9', fontSize: 12, lineHeight: 18, marginTop: 8 },
  modeToggle: { flexDirection: 'row', gap: 5 },
  modeButton: { minWidth: 58, height: 34, borderRadius: 11, backgroundColor: '#171b1e', borderWidth: 1, borderColor: '#2e3337' },
  modeButtonActive: { backgroundColor: '#d3b36f', borderColor: '#e5c987' },
  center: { alignItems: 'center', justifyContent: 'center' },
  modeText: { color: '#9da4a9', fontSize: 8, fontWeight: '900' },
  modeTextActive: { color: '#17130c' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metric: { minWidth: 160, flexGrow: 1, flexBasis: '22%', backgroundColor: '#101316', borderRadius: 15, padding: 13, borderWidth: 1, borderColor: '#2a2f34' },
  metricLabel: { color: '#858c92', fontSize: 8, fontWeight: '900' },
  metricValue: { color: '#eadab8', fontSize: 18, lineHeight: 23, fontWeight: '900', marginTop: 6 },
  mixSection: { marginTop: 18 },
  mixTitle: { color: '#f0ebe2', fontSize: 19, lineHeight: 25, fontWeight: '900', marginTop: 6 },
  mixList: { gap: 8, marginTop: 12 },
  mixCard: { backgroundColor: '#101316', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2a2f34' },
  mixTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mixName: { flex: 1, color: '#e8e2d9', fontSize: 13, fontWeight: '900' },
  evidenceBadge: { backgroundColor: '#202327', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 },
  evidenceBadgeActual: { backgroundColor: '#1a281d' },
  evidenceBadgeModelled: { backgroundColor: '#362c12' },
  evidenceText: { color: '#c9ced2', fontSize: 7, fontWeight: '900' },
  mixValue: { color: '#d3b36f', fontSize: 18, fontWeight: '900', marginTop: 8 },
  mixMeta: { color: '#8d949a', fontSize: 9, lineHeight: 14, marginTop: 4 },
  ruleBox: { marginTop: 14, backgroundColor: '#15120f', borderRadius: 20, padding: 17, borderWidth: 1, borderColor: '#665532' },
  ruleTitle: { color: '#f0e4cd', fontSize: 17, lineHeight: 23, fontWeight: '900', marginTop: 7 },
  ruleBody: { color: '#b6aa98', fontSize: 11, lineHeight: 17, marginTop: 7 }
});
