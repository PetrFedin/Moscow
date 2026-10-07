import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import {
  revenueEngines,
  stakeholderValues,
  valueFlywheel,
  type RevenueEngineId,
  type StakeholderId
} from './stakeholderValueModel';
import {
  ecosystemUi,
  getRevenueCopy,
  getStakeholderCopy
} from './stakeholderValueCopy';

const stakeholderOrder: StakeholderId[] = [
  'traveler',
  'city',
  'heritage',
  'commercial-partner',
  'integration-partner',
  'financial-investor'
];

const revenueOrder: RevenueEngineId[] = [
  'government-pilot',
  'platform-license',
  'district-production',
  'partner-console',
  'provider-attribution',
  'sponsored-experience',
  'destination-intelligence',
  'regional-license',
  'api-sdk'
];

export default function StakeholderValueScreen({ language }: { language: AppLanguage }) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const ui = ecosystemUi[language];
  const [selected, setSelected] = useState<StakeholderId>('traveler');

  const stakeholder = useMemo(
    () => stakeholderValues.find((item) => item.id === selected) ?? stakeholderValues[0],
    [selected]
  );
  const stakeholderCopy = getStakeholderCopy(language, selected);

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{ui.kicker}</Text>
        <Text style={styles.heroTitle}>{ui.title}</Text>
        <Text style={styles.heroBody}>{ui.body}</Text>
      </View>

      <View style={styles.selector}>
        {stakeholderOrder.map((id) => {
          const copy = getStakeholderCopy(language, id);
          return (
            <PhysicalPressable
              key={id}
              style={[styles.selectorButton, selected === id && styles.selectorButtonActive]}
              contentStyle={styles.selectorButtonContent}
              onPress={() => setSelected(id)}
              accessibilityLabel={copy.title}
            >
              <Text style={[styles.selectorText, selected === id && styles.selectorTextActive]}>
                {copy.title}
              </Text>
            </PhysicalPressable>
          );
        })}
      </View>

      {stakeholder && (
        <View style={styles.stakeholderCard}>
          <Text style={styles.stakeholderTitle}>{stakeholderCopy.title}</Text>
          <Text style={styles.promise}>{stakeholderCopy.promise}</Text>

          <View style={[styles.valueGrid, compact && styles.valueGridCompact]}>
            <ValueColumn title={ui.now} items={stakeholderCopy.now} />
            <ValueColumn title={ui.later} items={stakeholderCopy.later} />
          </View>

          <View style={styles.exchangeBox}>
            <Text style={styles.exchangeLabel}>{ui.exchange}</Text>
            <Text style={styles.exchangeText}>{stakeholderCopy.exchange}</Text>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.kicker}>{ui.revenueTitle.toUpperCase()}</Text>
        <Text style={styles.sectionTitle}>{ui.revenueTitle}</Text>
        <Text style={styles.sectionBody}>{ui.revenueBody}</Text>
      </View>

      <View style={[styles.revenueGrid, compact && styles.revenueGridCompact]}>
        {revenueOrder.map((id) => {
          const engine = revenueEngines.find((item) => item.id === id);
          if (!engine) return null;
          const copy = getRevenueCopy(language, id);
          const maturityLabel =
            engine.maturity === 'mvp'
              ? ui.mvp
              : engine.maturity === 'post-pilot'
                ? ui.postPilot
                : ui.scale;

          return (
            <View key={id} style={[styles.revenueCard, compact && styles.revenueCardCompact]}>
              <View style={styles.revenueTop}>
                <Text style={styles.revenueTitle}>{copy.title}</Text>
                <View style={styles.maturityBadge}>
                  <Text style={styles.maturityText}>{maturityLabel}</Text>
                </View>
              </View>

              <Metric label={ui.payer} value={copy.payer} />
              <Metric label={ui.basis} value={copy.basis} />
              <Metric label={ui.unlock} value={copy.unlock} />
            </View>
          );
        })}
      </View>

      <View style={styles.flywheelBox}>
        <Text style={styles.kicker}>
          {language === 'ru' ? 'VALUE FLYWHEEL' : language === 'en' ? 'VALUE FLYWHEEL' : '价值飞轮'}
        </Text>
        <Text style={styles.flywheelTitle}>
          {language === 'ru'
            ? 'Почему платформа становится сильнее по мере масштабирования'
            : language === 'en'
              ? 'Why the platform can become stronger as it scales'
              : '为什么平台在规模化过程中可以变得更强'}
        </Text>
        <View style={styles.flywheelSteps}>
          {valueFlywheel.map((item, index) => (
            <View key={item} style={styles.flywheelRow}>
              <View style={styles.flywheelNumber}>
                <Text style={styles.flywheelNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.flywheelText}>
                {language === 'ru'
                  ? item
                  : language === 'en'
                    ? [
                        'More verified city content → a more useful traveler journey.',
                        'More useful journeys → more privacy-safe aggregate demand evidence.',
                        'More demand evidence → higher value for Partner Console and city intelligence.',
                        'More authoritative partners → more real inventory and fewer dead ends.',
                        'More provider coverage → higher product utility and repeat use.',
                        'Standardised Studio / adapters / destination packages → lower marginal effort for the next district.',
                        'No step requires selling personal data or replacing editorial truth with paid ranking.'
                      ][index]
                    : [
                        '更多经核验城市内容 → 更有用的游客旅程。',
                        '更多有效旅程 → 更多隐私安全的聚合需求证据。',
                        '更多需求证据 → Partner Console 与城市智能价值更高。',
                        '更多权威合作伙伴 → 更多真实库存、更少无效终点。',
                        '更高服务商覆盖 → 更高产品效用与重复使用。',
                        '标准化 Studio / adapters / destination packages → 降低下一个区域的边际投入。',
                        '任何一步都不需要出售个人数据或用付费排名替代编辑事实。'
                      ][index]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.investorBox}>
        <Text style={styles.kicker}>{ui.investorTitle.toUpperCase()}</Text>
        <Text style={styles.investorTitle}>{ui.investorTitle}</Text>
        <View style={styles.investorPoints}>
          {ui.investorPoints.map((item, index) => (
            <View key={item} style={styles.pointRow}>
              <Text style={styles.pointNumber}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={styles.pointText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function ValueColumn({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <View style={styles.valueColumn}>
      <Text style={styles.valueColumnTitle}>{title}</Text>
      <View style={styles.valueItems}>
        {items.map((item, index) => (
          <View key={item} style={styles.pointRow}>
            <Text style={styles.pointNumber}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={styles.pointText}>{item}</Text>
          </View>
        ))}
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
  selector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  selectorButton: {
    borderRadius: 14,
    backgroundColor: '#111417',
    borderWidth: 1,
    borderColor: '#2a2f34',
    minHeight: 40
  },
  selectorButtonActive: {
    backgroundColor: '#d3b36f',
    borderColor: '#e5c987'
  },
  selectorButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  selectorText: {
    color: '#aeb4b9',
    fontSize: 10,
    fontWeight: '900'
  },
  selectorTextActive: { color: '#17130c' },
  stakeholderCard: {
    marginTop: 12,
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#101316',
    borderWidth: 1,
    borderColor: '#2a2f34'
  },
  stakeholderTitle: {
    color: '#f1ece3',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900'
  },
  promise: {
    color: '#d3b36f',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
    marginTop: 8
  },
  valueGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16
  },
  valueGridCompact: { flexDirection: 'column' },
  valueColumn: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#15191c'
  },
  valueColumnTitle: {
    color: '#c8a96a',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 1.1
  },
  valueItems: { gap: 8, marginTop: 10 },
  pointRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  pointNumber: {
    width: 20,
    color: '#716550',
    fontSize: 8,
    lineHeight: 15,
    fontWeight: '900'
  },
  pointText: {
    flex: 1,
    color: '#cbd0d4',
    fontSize: 11,
    lineHeight: 17
  },
  exchangeBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#17140f',
    borderWidth: 1,
    borderColor: '#4d412b'
  },
  exchangeLabel: {
    color: '#c8a96a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1
  },
  exchangeText: {
    color: '#e0d5c2',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6
  },
  sectionHeader: { marginTop: 24, marginBottom: 10 },
  sectionTitle: {
    color: '#f1ece3',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 6
  },
  sectionBody: {
    color: '#9fa6ac',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6
  },
  revenueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  revenueGridCompact: { flexDirection: 'column' },
  revenueCard: {
    width: '49%',
    borderRadius: 18,
    padding: 15,
    backgroundColor: '#111417',
    borderWidth: 1,
    borderColor: '#2b3035'
  },
  revenueCardCompact: { width: '100%' },
  revenueTop: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  revenueTitle: {
    flex: 1,
    color: '#eee8de',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900'
  },
  maturityBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#201c16'
  },
  maturityText: {
    color: '#d3b36f',
    fontSize: 7,
    fontWeight: '900'
  },
  metric: { marginTop: 12 },
  metricLabel: {
    color: '#777f86',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1
  },
  metricValue: {
    color: '#c9ced2',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4
  },
  flywheelBox: {
    marginTop: 14,
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#101316',
    borderWidth: 1,
    borderColor: '#2f3438'
  },
  flywheelTitle: {
    color: '#f1ece3',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
    marginTop: 7
  },
  flywheelSteps: { gap: 9, marginTop: 14 },
  flywheelRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flywheelNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d3b36f',
    alignItems: 'center',
    justifyContent: 'center'
  },
  flywheelNumberText: {
    color: '#17130c',
    fontSize: 9,
    fontWeight: '900'
  },
  flywheelText: {
    flex: 1,
    color: '#b7bdc1',
    fontSize: 11,
    lineHeight: 17
  },
  investorBox: {
    marginTop: 14,
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#15120f',
    borderWidth: 1,
    borderColor: '#665532'
  },
  investorTitle: {
    color: '#f1e5cf',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    marginTop: 7
  },
  investorPoints: { gap: 8, marginTop: 13 }
});
