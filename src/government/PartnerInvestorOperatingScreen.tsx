import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { tr, type AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import PartnerConsoleDemo from './PartnerConsoleDemo';
import InvestorPortfolioView from './InvestorPortfolioView';
import {
  buildInvestorOperatingSnapshot,
  currentCommercialOperatingEvidence,
  partnerOperatingStages
} from './partnerInvestorOperatingModel';

type Mode = 'partner' | 'investor';

function formatRub(language: AppLanguage, value: number | null) {
  if (value === null) return tr(language, 'НЕ ИЗМЕРЕНО', 'NOT MEASURED', '尚未测量');
  return new Intl.NumberFormat(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ru-RU',
    { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }
  ).format(value);
}

function formatPercent(language: AppLanguage, value: number | null) {
  if (value === null) return tr(language, 'НЕ ИЗМЕРЕНО', 'NOT MEASURED', '尚未测量');
  return new Intl.NumberFormat(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ru-RU',
    { style: 'percent', maximumFractionDigits: 1 }
  ).format(value);
}

export default function PartnerInvestorOperatingScreen({ language }: { language: AppLanguage }) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [mode, setMode] = useState<Mode>('partner');
  const snapshot = useMemo(
    () => buildInvestorOperatingSnapshot(currentCommercialOperatingEvidence),
    []
  );

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>PARTNER & INVESTOR OPERATING LAYER</Text>
        <Text style={styles.heroTitle}>
          {tr(
            language,
            'Как пользовательский маршрут превращается в проверяемую коммерческую операцию',
            'How a traveler journey becomes an auditable commercial operation',
            '游客旅程如何转化为可审计的商业运营'
          )}
        </Text>
        <Text style={styles.heroBody}>
          {tr(
            language,
            'Ни handoff, ни клик, ни показ не считаются выручкой сами по себе. Денежный контур возникает только после договорной authority, provider confirmation, attribution и evidence-backed ledger.',
            'A handoff, click or impression is not revenue by itself. The money layer exists only after contractual authority, provider confirmation, attribution and an evidence-backed ledger.',
            '跳转、点击或曝光本身都不算收入。只有在合同授权、服务商确认、归因以及有证据支持的台账之后，才形成收入层。'
          )}
        </Text>
      </View>

      <View style={styles.modeRow}>
        <PhysicalPressable
          style={[styles.modeButton, mode === 'partner' && styles.modeButtonActive]}
          contentStyle={styles.center}
          onPress={() => setMode('partner')}
          accessibilityLabel={tr(language, 'Операции партнёров', 'Partner operations', '合作伙伴运营')}
        >
          <Text style={[styles.modeText, mode === 'partner' && styles.modeTextActive]}>
            {tr(language, 'Партнёры', 'Partners', '合作伙伴')}
          </Text>
        </PhysicalPressable>
        <PhysicalPressable
          style={[styles.modeButton, mode === 'investor' && styles.modeButtonActive]}
          contentStyle={styles.center}
          onPress={() => setMode('investor')}
          accessibilityLabel={tr(language, 'Операции инвестора', 'Investor operations', '投资者运营')}
        >
          <Text style={[styles.modeText, mode === 'investor' && styles.modeTextActive]}>
            {tr(language, 'Инвестор', 'Investor', '投资者')}
          </Text>
        </PhysicalPressable>
      </View>

      {mode === 'partner' ? (
        <View>
          <PartnerConsoleDemo language={language} />
          <View style={styles.stageList}>
          {partnerOperatingStages.map((stage, index) => (
            <View key={stage.id} style={styles.stageCard}>
              <View style={styles.stageNumber}>
                <Text style={styles.stageNumberText}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <View style={styles.stageCopy}>
                <Text style={styles.stageTitle}>{stage.title}</Text>
                <Text style={styles.stageTruth}>
                  {language === 'ru'
                    ? stage.truth
                    : language === 'en'
                      ? [
                          'Legal entity, category, contacts, verification and commercial authority.',
                          'Availability is live only with an authoritative feed + freshness SLA + evidence.',
                          'An offer cannot change heritage truth or secretly buy editorial ranking.',
                          'The transition is recorded as a handoff and is not yet a sale.',
                          'Transaction state exists only after authoritative provider confirmation.',
                          'Attribution exists only with a signed commercial agreement + provider-confirmed eligible state.',
                          'Revenue is recognised only with contractRef, evidenceRefs and an allowed charging model.',
                          'Settlement eligibility requires acceptance; attribution revenue also requires provider reconciliation.'
                        ][index]
                      : [
                          '法人主体、类别、联系人、验证和商业授权。',
                          '只有具备权威 feed + freshness SLA + 证据时，库存才可标记为 live。',
                          'Offer 不得改变文化遗产事实，也不得秘密购买编辑排序。',
                          '跳转只记录为 handoff，此时还不是销售。',
                          '只有在权威服务商确认后，交易状态才成立。',
                          '只有签署商业协议且服务商确认状态符合条件时，才可创建归因。',
                          '只有包含 contractRef、evidenceRefs 和允许的计费模型时，才可确认收入。',
                          '结算资格需要验收；归因收入还必须有服务商对账证据。'
                        ][index]}
                </Text>
              </View>
            </View>
          ))}

            <View style={styles.currentState}>
            <Text style={styles.currentStateKicker}>
              {tr(language, 'ТЕКУЩЕЕ СОСТОЯНИЕ', 'CURRENT STATE', '当前状态')}
            </Text>
            <Text style={styles.currentStateTitle}>
              {tr(
                language,
                'Коммерческие партнёры и транзакционная выручка ещё не подтверждены',
                'Commercial partners and transaction revenue are not yet proven',
                '商业合作伙伴和交易收入尚未得到验证'
              )}
            </Text>
            <Text style={styles.currentStateBody}>
              {tr(
                language,
                'В operating evidence сейчас нет подписанных партнёрских договоров, provider-confirmed attributions или revenue ledger entries. Поэтому MVP не показывает их как существующий бизнес.',
                'Operating evidence currently contains no signed partner contracts, provider-confirmed attributions or revenue-ledger entries, so the MVP does not present them as an existing business.',
                '当前 operating evidence 中没有已签署的合作伙伴合同、服务商确认归因或收入台账，因此 MVP 不会把这些展示为已经存在的业务。'
              )}
            </Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          <InvestorPortfolioView language={language} />
          <View style={[styles.metricGrid, compact && styles.metricGridCompact]}>
            <MetricCard
              label={tr(language, 'Подписанные коммерческие контракты', 'Signed commercial contracts', '已签商业合同')}
              value={String(snapshot.signedCommercialContracts)}
            />
            <MetricCard
              label={tr(language, 'Активные recurring contracts', 'Active recurring contracts', '有效 recurring contracts')}
              value={String(snapshot.activeRecurringContracts)}
            />
            <MetricCard label="MRR" value={formatRub(language, snapshot.mrrRub)} />
            <MetricCard label="ARR" value={formatRub(language, snapshot.arrRub)} />
            <MetricCard
              label={tr(language, 'Признанная выручка', 'Recognised revenue', '已确认收入')}
              value={formatRub(language, snapshot.recognizedRevenueRub)}
            />
            <MetricCard
              label={tr(language, 'Gross contribution', 'Gross contribution', '毛贡献')}
              value={formatRub(language, snapshot.grossContributionRub)}
            />
            <MetricCard
              label={tr(language, 'Gross contribution margin', 'Gross contribution margin', '毛贡献率')}
              value={formatPercent(language, snapshot.grossContributionMargin)}
            />
            <MetricCard
              label={tr(language, 'Partner retention', 'Partner retention', '合作伙伴留存')}
              value={formatPercent(language, snapshot.partnerRetentionRate)}
            />
            <MetricCard
              label={tr(language, 'Marginal cost / district object', 'Marginal cost / district object', '区域单对象边际成本')}
              value={formatRub(language, snapshot.districtMarginalCostRub)}
            />
            <MetricCard
              label={tr(language, 'Проверенные внешние регионы', 'Verified external regions', '已验证外部地区')}
              value={String(snapshot.verifiedExternalRegions)}
            />
            <MetricCard
              label={tr(language, 'Revenue ledger entries', 'Revenue ledger entries', '收入台账条目')}
              value={String(snapshot.revenueLedgerEntries)}
            />
            <MetricCard
              label={tr(language, 'Settlement eligible', 'Settlement eligible', '可结算条目')}
              value={String(snapshot.settlementEligibleEntries)}
            />
          </View>

          <View style={styles.investorRule}>
            <Text style={styles.currentStateKicker}>
              {tr(language, 'ИНВЕСТИЦИОННОЕ ПРАВИЛО', 'INVESTOR RULE', '投资规则')}
            </Text>
            <Text style={styles.currentStateTitle}>
              {tr(
                language,
                'MRR, ARR и contribution показываются только из фактических договоров и ledger',
                'MRR, ARR and contribution are shown only from actual contracts and ledger',
                'MRR、ARR 与 contribution 只来自真实合同和台账'
              )}
            </Text>
            <Text style={styles.currentStateBody}>
              {tr(
                language,
                'Retention остаётся НЕ ИЗМЕРЕНО, пока нет достаточного периода и когорты партнёров. Regional replication остаётся нулевой, пока нет принятого внешнего reference.',
                'Retention stays NOT MEASURED until there is a sufficient partner cohort and time window. Regional replication stays at zero until an external reference is accepted.',
                '在没有足够合作伙伴 cohort 和观察周期前，留存保持“尚未测量”。在外部 reference 被验收前，区域复制保持为零。'
              )}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#121518',
    borderWidth: 1,
    borderColor: '#393226'
  },
  kicker: {
    color: '#c8a96a',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 1.35
  },
  heroTitle: {
    color: '#f4eee4',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    marginTop: 8
  },
  heroBody: {
    color: '#aeb4b9',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9
  },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  modeButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#111417',
    borderWidth: 1,
    borderColor: '#2a2f34'
  },
  modeButtonActive: { backgroundColor: '#d3b36f', borderColor: '#e5c987' },
  modeText: { color: '#aeb3b8', fontSize: 11, fontWeight: '900' },
  modeTextActive: { color: '#17130c' },
  center: { alignItems: 'center', justifyContent: 'center' },
  stageList: { gap: 8, marginTop: 12 },
  stageCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#101316',
    borderWidth: 1,
    borderColor: '#2a2f34'
  },
  stageNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1b1f22',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stageNumberText: { color: '#d3b36f', fontSize: 9, fontWeight: '900' },
  stageCopy: { flex: 1 },
  stageTitle: { color: '#eee9df', fontSize: 14, lineHeight: 19, fontWeight: '900' },
  stageTruth: { color: '#aeb4b9', fontSize: 11, lineHeight: 17, marginTop: 5 },
  currentState: {
    marginTop: 4,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#171416',
    borderWidth: 1,
    borderColor: '#4b373a'
  },
  currentStateKicker: {
    color: '#c8a96a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1
  },
  currentStateTitle: {
    color: '#eee7dc',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 7
  },
  currentStateBody: {
    color: '#aaafb3',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12
  },
  metricGridCompact: { flexDirection: 'column' },
  metricCard: {
    width: '32%',
    minWidth: 180,
    flexGrow: 1,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#101316',
    borderWidth: 1,
    borderColor: '#2a2f34'
  },
  metricLabel: {
    color: '#8e959a',
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '900'
  },
  metricValue: {
    color: '#e8d6ae',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    marginTop: 8
  },
  investorRule: {
    marginTop: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#15120f',
    borderWidth: 1,
    borderColor: '#665532'
  }
});
