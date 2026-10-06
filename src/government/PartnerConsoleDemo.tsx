import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { tr, type AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import {
  buildInvestorOperatingSnapshot
} from './partnerInvestorOperatingModel';
import {
  demoCommercialOperatingEvidence,
  demoScenarioDisclaimer,
  partnerConsoleSandboxProfile
} from './partnerConsoleSandbox';

type PartnerTab =
  | 'profile'
  | 'inventory'
  | 'offers'
  | 'availability'
  | 'campaign'
  | 'handoffs'
  | 'transactions'
  | 'revenue'
  | 'settlement';

const tabs: PartnerTab[] = [
  'profile',
  'inventory',
  'offers',
  'availability',
  'campaign',
  'handoffs',
  'transactions',
  'revenue',
  'settlement'
];

export default function PartnerConsoleDemo({ language }: { language: AppLanguage }) {
  const [tab, setTab] = useState<PartnerTab>('profile');
  const snapshot = useMemo(
    () => buildInvestorOperatingSnapshot(demoCommercialOperatingEvidence),
    []
  );
  const profile = partnerConsoleSandboxProfile;

  const labels: Record<PartnerTab, string> = {
    profile: tr(language, 'Профиль', 'Profile', '资料'),
    inventory: tr(language, 'Инвентарь', 'Inventory', '库存'),
    offers: tr(language, 'Офферы', 'Offers', '优惠'),
    availability: tr(language, 'Доступность', 'Availability', '可用性'),
    campaign: tr(language, 'Кампания', 'Campaign', '活动'),
    handoffs: 'Handoffs',
    transactions: tr(language, 'Транзакции', 'Transactions', '交易'),
    revenue: tr(language, 'Выручка', 'Revenue', '收入'),
    settlement: tr(language, 'Сверка', 'Settlement', '结算')
  };

  return (
    <View>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{demoScenarioDisclaimer[language]}</Text>
      </View>

      <View style={styles.headerCard}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>PARTNER CONSOLE · SANDBOX</Text>
          <Text style={styles.title}>{profile.displayName}</Text>
          <Text style={styles.body}>
            {tr(
              language,
              'Показываем механику полного партнёрского цикла без попытки выдать synthetic demo за существующий коммерческий контракт.',
              'Shows the full partner lifecycle without presenting synthetic demo data as an existing commercial contract.',
              '展示完整合作伙伴生命周期，但不会把合成演示数据冒充为真实商业合同。'
            )}
          </Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>
            {tr(language, 'VERIFIED DEMO', 'VERIFIED DEMO', '已验证演示')}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {tabs.map((item) => (
          <PhysicalPressable
            key={item}
            style={[styles.tab, tab === item && styles.tabActive]}
            contentStyle={styles.tabContent}
            onPress={() => setTab(item)}
          >
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>
              {labels[item]}
            </Text>
          </PhysicalPressable>
        ))}
      </View>

      <View style={styles.panel}>
        {tab === 'profile' && (
          <InfoRows
            rows={[
              [tr(language, 'Категория', 'Category', '类别'), profile.categoryLabel],
              [tr(language, 'Юрлицо', 'Legal entity', '法人主体'), profile.partner.legalName],
              [tr(language, 'Договор', 'Contract', '合同'), profile.partner.agreement.contractRef ?? '—'],
              [tr(language, 'Модель', 'Commercial model', '商业模式'), profile.partner.agreement.model],
              [tr(language, 'Feed', 'Feed', '数据源'), profile.partner.feed.status]
            ]}
          />
        )}

        {tab === 'inventory' && (
          <CardList
            items={profile.inventory.map((item) => ({
              title: item.title,
              meta: `${item.inventoryType} · ${item.availabilityState} · ${item.authoritative ? 'authoritative' : 'manual'}`
            }))}
          />
        )}

        {tab === 'offers' && (
          <CardList
            items={profile.offers.map((item) => ({
              title: item.title,
              meta: `${item.status} · ${item.placementRule}`
            }))}
          />
        )}

        {tab === 'availability' && (
          <InfoRows
            rows={[
              [tr(language, 'Feed status', 'Feed status', '数据源状态'), profile.partner.feed.status],
              [tr(language, 'Freshness SLA', 'Freshness SLA', '新鲜度 SLA'), `${profile.partner.feed.freshnessSlaMinutes ?? '—'} min`],
              [tr(language, 'Последний sync', 'Last sync', '最后同步'), profile.partner.feed.lastAuthoritativeSyncAt ?? '—'],
              [tr(language, 'Evidence', 'Evidence', '证据'), profile.partner.feed.evidenceRef ?? '—']
            ]}
          />
        )}

        {tab === 'campaign' && (
          <InfoRows
            rows={[
              [tr(language, 'Кампания', 'Campaign', '活动'), profile.campaign.title],
              [tr(language, 'Статус', 'Status', '状态'), profile.campaign.status],
              [tr(language, 'Контекст показа', 'Placement context', '展示上下文'), profile.campaign.targetContext]
            ]}
          />
        )}

        {tab === 'handoffs' && (
          <CardList
            items={demoCommercialOperatingEvidence.handoffs.map((item) => ({
              title: item.id,
              meta: `${item.occurredAt} · ${item.offerId ?? 'no-offer'} · ${item.consentScope}`
            }))}
          />
        )}

        {tab === 'transactions' && (
          <CardList
            items={demoCommercialOperatingEvidence.confirmations.map((item) => ({
              title: item.providerTransactionRef,
              meta: `${item.terminalState} · ${item.confirmedAt} · ${item.evidenceRef}`
            }))}
          />
        )}

        {tab === 'revenue' && (
          <>
            <View style={styles.metrics}>
              <Metric label={tr(language, 'Recognised revenue', 'Recognised revenue', '已确认收入')} value={String(snapshot.recognizedRevenueRub ?? 0)} />
              <Metric label={tr(language, 'Gross contribution', 'Gross contribution', '毛贡献')} value={String(snapshot.grossContributionRub ?? 0)} />
              <Metric label={tr(language, 'Ledger entries', 'Ledger entries', '台账条目')} value={String(snapshot.revenueLedgerEntries)} />
            </View>
            <CardList
              items={demoCommercialOperatingEvidence.ledger.map((item) => ({
                title: `${item.id} · ₽${item.amountRub}`,
                meta: `${item.revenueType} · ${item.contractRef} · ${item.settlementState}`
              }))}
            />
          </>
        )}

        {tab === 'settlement' && (
          <CardList
            items={demoCommercialOperatingEvidence.settlements.map((item) => ({
              title: item.ledgerEntryId,
              meta: `acceptance=${item.acceptanceRef ?? '—'} · reconciliation=${item.providerReconciliationRef ?? '—'} · paid=${item.paidRef ?? 'not-paid'}`
            }))}
          />
        )}
      </View>
    </View>
  );
}

function InfoRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <View style={styles.rows}>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function CardList({ items }: { items: Array<{ title: string; meta: string }> }) {
  return (
    <View style={styles.rows}>
      {items.map((item) => (
        <View key={item.title} style={styles.itemCard}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemMeta}>{item.meta}</Text>
        </View>
      ))}
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
  banner: { backgroundColor: '#362c12', borderRadius: 14, padding: 12, marginBottom: 12 },
  bannerText: { color: '#f4d98f', fontSize: 10, lineHeight: 15, fontWeight: '900' },
  headerCard: { flexDirection: 'row', gap: 12, backgroundColor: '#121518', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#393226' },
  headerCopy: { flex: 1 },
  kicker: { color: '#c8a96a', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#f4eee4', fontSize: 22, lineHeight: 28, fontWeight: '900', marginTop: 7 },
  body: { color: '#aeb4b9', fontSize: 12, lineHeight: 18, marginTop: 7 },
  verifiedBadge: { alignSelf: 'flex-start', backgroundColor: '#1a281d', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  verifiedText: { color: '#bde2c5', fontSize: 8, fontWeight: '900' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  tab: { minHeight: 36, borderRadius: 12, backgroundColor: '#111417', borderWidth: 1, borderColor: '#2a2f34' },
  tabActive: { backgroundColor: '#d3b36f', borderColor: '#e5c987' },
  tabContent: { paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  tabText: { color: '#aeb4b9', fontSize: 9, fontWeight: '900' },
  tabTextActive: { color: '#17130c' },
  panel: { marginTop: 12, backgroundColor: '#101316', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#2a2f34' },
  rows: { gap: 8 },
  row: { padding: 12, backgroundColor: '#15191c', borderRadius: 13 },
  rowLabel: { color: '#7f878d', fontSize: 8, fontWeight: '900' },
  rowValue: { color: '#dce0e3', fontSize: 11, lineHeight: 16, marginTop: 4 },
  itemCard: { padding: 12, backgroundColor: '#15191c', borderRadius: 13 },
  itemTitle: { color: '#ece6dd', fontSize: 12, fontWeight: '900' },
  itemMeta: { color: '#9fa6ac', fontSize: 10, lineHeight: 15, marginTop: 5 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  metric: { minWidth: 150, flexGrow: 1, backgroundColor: '#171b1e', borderRadius: 12, padding: 11 },
  metricLabel: { color: '#858c92', fontSize: 8, fontWeight: '900' },
  metricValue: { color: '#e8d6ae', fontSize: 18, fontWeight: '900', marginTop: 5 }
});
