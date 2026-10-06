import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import CityOpportunityEngineDemo from './CityOpportunityEngineDemo';
import DistrictEconomicTwinDemo from './DistrictEconomicTwinDemo';
import DistrictPortfolioOptimizerDemo from './DistrictPortfolioOptimizerDemo';
import CityInvestmentCommitteeWorkspaceDemo from './CityInvestmentCommitteeWorkspaceDemo';
import CityCapitalProgrammeControlTowerDemo from './CityCapitalProgrammeControlTowerDemo';
import {
  actualDemandCells,
  demandControlCopy,
  demoDemandCells,
  demoDevelopmentSignals,
  demoPartnerQuality
} from './demandControlDemo';

type Mode = 'actual' | 'demo';

function pct(value: number | null) {
  if (value === null) return '—';
  return `${Math.round(value * 100)}%`;
}

function num(value: number | null, digits = 1) {
  if (value === null) return '—';
  return value.toFixed(digits);
}

export default function DemandMarketplaceControlTower({ language }: { language: AppLanguage }) {
  const copy = demandControlCopy[language];
  const [mode, setMode] = useState<Mode>('actual');

  const cells = mode === 'actual' ? actualDemandCells : demoDemandCells;
  const opportunities = useMemo(
    () => cells.filter((cell) => cell.status === 'OPPORTUNITY'),
    [cells]
  );
  const watch = useMemo(
    () => cells.filter((cell) => cell.status === 'WATCH'),
    [cells]
  );

  return (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>{copy.kicker}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.body}>{copy.body}</Text>
          </View>

          <View style={styles.modeRow}>
            {(['actual', 'demo'] as Mode[]).map((item) => (
              <PhysicalPressable
                key={item}
                style={[styles.modeButton, mode === item && styles.modeButtonActive]}
                contentStyle={styles.center}
                onPress={() => setMode(item)}
              >
                <Text style={[styles.modeText, mode === item && styles.modeTextActive]}>
                  {item === 'actual' ? copy.actual : copy.demo}
                </Text>
              </PhysicalPressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <Metric label={copy.demandGaps} value={String(opportunities.length + watch.length)} />
        <Metric label={copy.districtOpportunity} value={String(opportunities.length)} />
        <Metric label={copy.partnerQuality} value={mode === 'demo' ? String(demoPartnerQuality.length) : '0'} />
        <Metric
          label={copy.unmetIntent}
          value={
            cells.length === 0
              ? '—'
              : pct(
                  cells.reduce((sum, cell) => sum + (cell.unmetIntentRate ?? 0), 0) / cells.length
                )
          }
        />
      </View>

      {cells.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>{copy.noActual}</Text>
          <Text style={styles.emptyMeta}>{copy.prohibited}</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{copy.citySignal}</Text>
            <View style={styles.list}>
              {cells.map((cell) => (
                <View key={cell.key} style={styles.signalCard}>
                  <View style={styles.signalTop}>
                    <View style={styles.signalCopy}>
                      <Text style={styles.signalTitle}>
                        {cell.districtId} · {cell.intentKind} · {cell.timeBucket}
                      </Text>
                      <Text style={styles.signalMeta}>
                        {cell.observations} obs · {cell.distinctDays} days
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      cell.status === 'OPPORTUNITY' && styles.statusOpportunity,
                      cell.status === 'WATCH' && styles.statusWatch,
                      cell.status === 'HEALTHY' && styles.statusHealthy
                    ]}>
                      <Text style={styles.statusText}>{cell.status}</Text>
                    </View>
                  </View>

                  <View style={styles.metricsRow}>
                    <TinyMetric label={copy.unmetIntent} value={pct(cell.unmetIntentRate)} />
                    <TinyMetric label={copy.supplyCoverage} value={pct(cell.supplyCoverageRatio)} />
                    <TinyMetric label={copy.conversion} value={pct(cell.providerConfirmationRate)} />
                    <TinyMetric label="confirmed demand" value={pct(cell.confirmedDemandRate)} />
                  </View>

                  <Text style={styles.signalFoot}>
                    avg eligible supply={num(cell.averageEligibleSupply)}
                    {' · '}
                    avg fresh supply={num(cell.averageFreshAvailableSupply)}
                    {' · '}
                    signal={cell.signal}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {mode === 'demo' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{copy.partnerQuality}</Text>
                <View style={styles.list}>
                  {demoPartnerQuality.map((partner) => (
                    <View key={partner.partnerId} style={styles.signalCard}>
                      <View style={styles.signalTop}>
                        <Text style={styles.signalTitle}>{partner.partnerId}</Text>
                        <View style={[
                          styles.statusBadge,
                          partner.status === 'HEALTHY' ? styles.statusHealthy : styles.statusWatch
                        ]}>
                          <Text style={styles.statusText}>{partner.status}</Text>
                        </View>
                      </View>
                      <View style={styles.metricsRow}>
                        <TinyMetric label="freshness" value={pct(partner.freshnessPassRate)} />
                        <TinyMetric label="confirmation" value={pct(partner.providerConfirmationRate)} />
                        <TinyMetric label="reversal" value={pct(partner.cancellationOrRefundRate)} />
                        <TinyMetric label="quality" value={num(partner.averageServiceQuality, 2)} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{copy.acquisition}</Text>
                <View style={styles.list}>
                  {demoDevelopmentSignals.map((signal) => (
                    <View key={`${signal.districtId}-${signal.intentKind}-${signal.timeBucket}`} style={styles.actionCard}>
                      <Text style={styles.signalTitle}>
                        {signal.districtId} · {signal.intentKind} · {signal.timeBucket}
                      </Text>
                      <Text style={styles.actionValue}>{signal.nextAction}</Text>
                      <Text style={styles.signalMeta}>{signal.evidenceSummary.join(' · ')}</Text>
                      <Text style={styles.prohibited}>{signal.prohibitedClaim}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </>
      )}

      {mode === 'demo' && (
        <>
          <View style={styles.opportunityEngine}>
            <CityOpportunityEngineDemo language={language} />
          </View>
          <View style={styles.opportunityEngine}>
            <DistrictEconomicTwinDemo language={language} />
          </View>
          <View style={styles.opportunityEngine}>
            <DistrictPortfolioOptimizerDemo language={language} />
          </View>
          <View style={styles.opportunityEngine}>
            <CityInvestmentCommitteeWorkspaceDemo language={language} />
          </View>
          <View style={styles.opportunityEngine}>
            <CityCapitalProgrammeControlTowerDemo language={language} />
          </View>
        </>
      )}

      <View style={styles.ruleBox}>
        <Text style={styles.ruleTitle}>
          {language === 'ru'
            ? 'Opportunity ≠ инвестиционное решение'
            : language === 'en'
              ? 'Opportunity ≠ investment decision'
              : 'Opportunity ≠ 投资决定'}
        </Text>
        <Text style={styles.ruleBody}>
          {copy.prohibited}
        </Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function TinyMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tinyMetric}>
      <Text style={styles.tinyLabel}>{label}</Text>
      <Text style={styles.tinyValue}>{value}</Text>
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
  modeRow: { flexDirection: 'row', gap: 6 },
  modeButton: { minWidth: 62, height: 34, borderRadius: 11, backgroundColor: '#171b1e', borderWidth: 1, borderColor: '#2f3438' },
  modeButtonActive: { backgroundColor: '#d3b36f', borderColor: '#e5c987' },
  center: { alignItems: 'center', justifyContent: 'center' },
  modeText: { color: '#9da4a9', fontSize: 8, fontWeight: '900' },
  modeTextActive: { color: '#17130c' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metricCard: { minWidth: 150, flexGrow: 1, flexBasis: '22%', backgroundColor: '#101316', borderRadius: 15, padding: 13, borderWidth: 1, borderColor: '#2a2f34' },
  metricLabel: { color: '#858c92', fontSize: 8, fontWeight: '900' },
  metricValue: { color: '#eadab8', fontSize: 18, fontWeight: '900', marginTop: 6 },
  emptyBox: { marginTop: 12, padding: 18, borderRadius: 18, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  emptyTitle: { color: '#ebd5d8', fontSize: 16, lineHeight: 22, fontWeight: '900' },
  emptyMeta: { color: '#aa979a', fontSize: 10, lineHeight: 15, marginTop: 7 },
  section: { marginTop: 18 },
  sectionTitle: { color: '#f0ebe2', fontSize: 18, lineHeight: 24, fontWeight: '900' },
  list: { gap: 8, marginTop: 10 },
  signalCard: { padding: 14, borderRadius: 16, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  signalTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  signalCopy: { flex: 1 },
  signalTitle: { color: '#ebe5dc', fontSize: 12, lineHeight: 17, fontWeight: '900' },
  signalMeta: { color: '#8e969c', fontSize: 9, lineHeight: 14, marginTop: 4 },
  statusBadge: { borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: '#202327' },
  statusOpportunity: { backgroundColor: '#3b2e13' },
  statusWatch: { backgroundColor: '#30251d' },
  statusHealthy: { backgroundColor: '#17281c' },
  statusText: { color: '#d7dce0', fontSize: 7, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  tinyMetric: { minWidth: 110, flexGrow: 1, backgroundColor: '#171b1e', borderRadius: 10, padding: 9 },
  tinyLabel: { color: '#7f878d', fontSize: 7, fontWeight: '900' },
  tinyValue: { color: '#ddd4c3', fontSize: 12, fontWeight: '900', marginTop: 4 },
  signalFoot: { color: '#7f878d', fontSize: 8, lineHeight: 13, marginTop: 9 },
  actionCard: { padding: 14, borderRadius: 16, backgroundColor: '#15120f', borderWidth: 1, borderColor: '#665532' },
  actionValue: { color: '#d3b36f', fontSize: 12, lineHeight: 17, fontWeight: '900', marginTop: 6 },
  prohibited: { color: '#b98e95', fontSize: 8, lineHeight: 13, marginTop: 8 },
  opportunityEngine: { marginTop: 18 },
  ruleBox: { marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: '#171416', borderWidth: 1, borderColor: '#4b373a' },
  ruleTitle: { color: '#efdcdf', fontSize: 15, fontWeight: '900' },
  ruleBody: { color: '#aa979a', fontSize: 10, lineHeight: 15, marginTop: 6 }
});
