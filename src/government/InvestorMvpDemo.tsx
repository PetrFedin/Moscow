import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DEFAULT_LANGUAGE, type AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import InvestorControlScreen from './InvestorControlScreen';
import GovernmentOwnerRoute from './GovernmentOwnerRoute';
import PilotBrief from './PilotBrief.tsx';
import type { GovernmentOwnerRouteDestination } from './governmentOwnerRoute.ts';
import PilotContractBuilder from './PilotContractBuilder';
import StakeholderValueScreen from './StakeholderValueScreen';
import PartnerInvestorOperatingScreen from './PartnerInvestorOperatingScreen';
import type { PilotContractSectionId } from './pilotContractAuthority';
import type { PilotDecisionBlocker } from './pilotInvestmentDecision';
import { getInvestorMvpCopy } from './investorMvpCopy';

type Section = 'route' | 'control' | 'product' | 'deliverables' | 'money' | 'acceptance' | 'ecosystem' | 'operations' | 'contract' | 'brief';



export default function InvestorMvpDemo({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<Section>('route');
  const [language, setLanguage] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [meetingMode, setMeetingMode] = useState(false);
  const [routeStepIndex, setRouteStepIndex] = useState(0);
  const [lastEvidenceSection, setLastEvidenceSection] = useState<Section>('control');
  const [contractSection, setContractSection] = useState<PilotContractSectionId>('scope');
  const [focusedBlocker, setFocusedBlocker] = useState<PilotDecisionBlocker | null>(null);
  const copy = useMemo(() => getInvestorMvpCopy(language), [language]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>MOSCOW · INVESTOR MVP</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </View>
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={copy.closeLabel}
          style={styles.close}
          contentStyle={styles.center}
          onPress={onClose}
        >
          <Text style={styles.closeText}>×</Text>
        </PhysicalPressable>
      </View>

      <View style={styles.meetingBar}>
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={meetingMode
            ? (language === 'ru' ? 'Завершить режим встречи' : language === 'en' ? 'Exit meeting mode' : '退出会议模式')
            : (language === 'ru' ? 'Начать встречу' : language === 'en' ? 'Start meeting' : '开始会议')}
          style={[styles.meetingToggle, meetingMode && styles.meetingToggleActive]}
          contentStyle={styles.center}
          onPress={() => {
            setMeetingMode((value) => !value);
            setSection('route');
          }}
        >
          <Text style={[styles.meetingToggleText, meetingMode && styles.meetingToggleTextActive]}>
            {meetingMode
              ? (language === 'ru' ? 'MEETING MODE · ON' : language === 'en' ? 'MEETING MODE · ON' : '会议模式 · 开启')
              : (language === 'ru' ? 'Начать встречу' : language === 'en' ? 'Start meeting' : '开始会议')}
          </Text>
        </PhysicalPressable>

        {meetingMode && section !== 'route' && (
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={language === 'ru' ? 'Вернуться в презентацию' : language === 'en' ? 'Resume presentation' : '返回演示'}
            style={styles.resumeButton}
            contentStyle={styles.center}
            onPress={() => setSection('route')}
          >
            <Text style={styles.resumeButtonText}>
              ← {language === 'ru' ? 'Вернуться к шагу' : language === 'en' ? 'Resume step' : '返回步骤'} {routeStepIndex + 1}
            </Text>
          </PhysicalPressable>
        )}
      </View>

      <View style={styles.languageRow}>
        {(['ru', 'en', 'zh'] as AppLanguage[]).map((item) => (
          <PhysicalPressable
            key={item}
            style={[styles.languageButton, language === item && styles.languageButtonActive]}
            contentStyle={styles.center}
            onPress={() => setLanguage(item)}
            accessibilityLabel={item === 'ru' ? 'Русский' : item === 'en' ? 'English' : '中文'}
          >
            <Text style={[styles.languageText, language === item && styles.languageTextActive]}>
              {item === 'ru' ? 'RU' : item === 'en' ? 'EN' : '中文'}
            </Text>
          </PhysicalPressable>
        ))}
      </View>

      {meetingMode ? (
        <View style={styles.presenterTabs}>
          <PresenterTab
            active={section === 'route'}
            label={language === 'ru' ? 'Route' : language === 'en' ? 'Route' : '路线'}
            onPress={() => setSection('route')}
          />
          <PresenterTab
            active={section !== 'route' && section !== 'brief'}
            label={language === 'ru' ? 'Evidence' : language === 'en' ? 'Evidence' : '证据'}
            onPress={() => setSection(lastEvidenceSection)}
          />
          <PresenterTab
            active={section === 'brief'}
            label={language === 'ru' ? 'Decision' : language === 'en' ? 'Decision' : '决策'}
            onPress={() => setSection('brief')}
          />
        </View>
      ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {(['route','control','product','deliverables','ecosystem','operations','money','acceptance','contract'] as Exclude<Section, 'brief'>[]).map((item) => (
          <PhysicalPressable
            key={item}
            style={[styles.tab, section === item && styles.tabActive]}
            contentStyle={styles.tabContent}
            onPress={() => setSection(item)}
          >
            <Text style={[styles.tabText, section === item && styles.tabTextActive]}>
              {item === 'route'
                ? (language === 'ru' ? 'Маршрут ЛПР' : language === 'en' ? 'Owner Route' : '决策路线')
                : copy.tabs[item]}
            </Text>
          </PhysicalPressable>
        ))}
      </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {section === 'route' && (
          <GovernmentOwnerRoute
            language={language}
            activeStepIndex={routeStepIndex}
            onStepChange={setRouteStepIndex}
            onOpenDestination={(destination: GovernmentOwnerRouteDestination) => {
              setLastEvidenceSection(destination);
              setSection(destination);
            }}
          />
        )}

        {section === 'brief' && (
          <PilotBrief
            language={language}
            onOpenContract={() => {
              setLastEvidenceSection('contract');
              setLastEvidenceSection('contract');
              setSection('contract');
            }}
          />
        )}

        {section === 'control' && (
          <InvestorControlScreen
            language={language}
            onOpenContract={(targetSection, blocker) => {
              setContractSection(targetSection);
              setFocusedBlocker(blocker);
              setSection('contract');
            }}
          />
        )}

        {section === 'ecosystem' && <StakeholderValueScreen language={language} />}

        {section === 'operations' && <PartnerInvestorOperatingScreen language={language} />}

        {section === 'contract' && (
          <PilotContractBuilder
            language={language}
            initialSection={contractSection}
            focusedBlocker={focusedBlocker}
          />
        )}

        {section === 'product' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>{copy.product.sellKicker}</Text>
              <Text style={styles.heroTitle}>{copy.thesis}</Text>
            </View>

            <View style={styles.path}>
              {copy.product.travelerPath.map((item, index) => (
                <View key={item} style={styles.pathRow}>
                  <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
                  <Text style={styles.pathText}>{item}</Text>
                </View>
              ))}
            </View>

            <BlockTitle
              kicker={copy.product.pilotKicker}
              title={copy.product.pilotTitle}
              body={copy.product.pilotBody}
            />
            <BulletList items={copy.product.pilotScope} />

            <BlockTitle
              kicker={copy.product.excludedKicker}
              title={copy.product.excludedTitle}
              body={copy.product.excludedBody}
            />
            <BulletList items={copy.product.notInMvp} muted />
          </>
        )}

        {section === 'deliverables' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>{copy.deliverables.kicker}</Text>
              <Text style={styles.heroTitle}>{copy.deliverables.title}</Text>
            </View>

            {copy.deliverables.items.map((item, index) => (
              <View key={item.title} style={styles.card}>
                <Text style={styles.cardIndex}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
              </View>
            ))}
          </>
        )}

        {section === 'money' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>{copy.money.kicker}</Text>
              <Text style={styles.heroTitle}>{copy.money.title}</Text>
            </View>

            {copy.money.layers.map((item) => (
              <View key={item.id} style={styles.paymentCard}>
                <Text style={styles.paymentTitle}>{item.title}</Text>
                <Text style={styles.paymentLabel}>{copy.money.paysLabel}</Text>
                <Text style={styles.paymentBody}>{item.paysFor}</Text>
                <Text style={styles.paymentLabel}>{copy.money.acceptanceLabel}</Text>
                <Text style={styles.paymentAccept}>{item.acceptedBy}</Text>
              </View>
            ))}

            <BlockTitle
              kicker={copy.money.scaleKicker}
              title={copy.money.scaleTitle}
              body={copy.money.scaleBody}
            />
            <BulletList items={copy.money.scaleFormula} />
          </>
        )}

        {section === 'acceptance' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>{copy.acceptance.kicker}</Text>
              <Text style={styles.heroTitle}>{copy.acceptance.title}</Text>
            </View>

            <BulletList items={copy.acceptance.items} />

            <View style={styles.decision}>
              <Text style={styles.decisionKicker}>{copy.acceptance.nextDecisionKicker}</Text>
              <Text style={styles.decisionText}>{copy.acceptance.nextDecision}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BlockTitle({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <View style={styles.blockTitle}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.blockHeading}>{title}</Text>
      <Text style={styles.blockBody}>{body}</Text>
    </View>
  );
}

function BulletList({ items, muted = false }: { items: readonly string[]; muted?: boolean }) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={item} style={[styles.listRow, muted && styles.listRowMuted]}>
          <Text style={styles.listBullet}>{String(index + 1).padStart(2, '0')}</Text>
          <Text style={[styles.listText, muted && styles.listTextMuted]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function PresenterTab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <PhysicalPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.presenterTab, active && styles.presenterTabActive]}
      contentStyle={styles.center}
      onPress={onPress}
    >
      <Text style={[styles.presenterTabText, active && styles.presenterTabTextActive]}>{label}</Text>
    </PhysicalPressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0d0f' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d31'
  },
  headerCopy: { flex: 1, paddingRight: 12 },
  brand: { color: '#c8a96a', fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  title: { color: '#f6f1e7', fontSize: 25, lineHeight: 29, fontWeight: '900', marginTop: 8 },
  subtitle: { color: '#aeb3b8', fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 760 },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#343940',
    backgroundColor: '#15181b'
  },
  closeText: { color: '#f6f1e7', fontSize: 26, lineHeight: 28 },
  center: { alignItems: 'center', justifyContent: 'center' },
  meetingBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  meetingToggle: { minHeight: 36, borderRadius: 12, backgroundColor: '#15181b', borderWidth: 1, borderColor: '#3b4148' },
  meetingToggleActive: { backgroundColor: '#d3b36f', borderColor: '#e5c987' },
  meetingToggleText: { color: '#c4c9cd', fontSize: 9, fontWeight: '900', paddingHorizontal: 12 },
  meetingToggleTextActive: { color: '#17130c' },
  resumeButton: { minHeight: 36, borderRadius: 12, backgroundColor: '#171411', borderWidth: 1, borderColor: '#665532' },
  resumeButtonText: { color: '#e5d3aa', fontSize: 9, fontWeight: '900', paddingHorizontal: 12 },
  languageRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 10 },
  languageButton: { minWidth: 42, height: 34, borderRadius: 12, backgroundColor: '#121518', borderWidth: 1, borderColor: '#2a2f34' },
  languageButtonActive: { backgroundColor: '#d3b36f', borderColor: '#e5c987' },
  languageText: { color: '#9fa5aa', fontSize: 10, fontWeight: '900' },
  languageTextActive: { color: '#17130c' },
  presenterTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  presenterTab: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: '#15181b', borderWidth: 1, borderColor: '#292e33' },
  presenterTabActive: { backgroundColor: '#d3b36f', borderColor: '#e5c987' },
  presenterTabText: { color: '#aeb3b8', fontSize: 10, fontWeight: '900' },
  presenterTabTextActive: { color: '#15120d' },
  tabs: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: '#15181b',
    borderWidth: 1,
    borderColor: '#292e33'
  },
  tabActive: { backgroundColor: '#d3b36f', borderColor: '#e5c987' },
  tabContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  tabText: { color: '#aeb3b8', fontSize: 11, fontWeight: '900' },
  tabTextActive: { color: '#15120d' },
  content: { width: '100%', maxWidth: 920, alignSelf: 'center', padding: 18, paddingBottom: 60 },
  hero: {
    backgroundColor: '#14171a',
    borderWidth: 1,
    borderColor: '#333941',
    borderRadius: 24,
    padding: 22,
    marginBottom: 18
  },
  kicker: { color: '#c8a96a', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  heroTitle: { color: '#f6f1e7', fontSize: 23, lineHeight: 30, fontWeight: '900', marginTop: 10 },
  path: { gap: 9, marginBottom: 24 },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#101316',
    borderWidth: 1,
    borderColor: '#272c31'
  },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d3b36f',
    alignItems: 'center',
    justifyContent: 'center'
  },
  numberText: { color: '#16120c', fontSize: 11, fontWeight: '900' },
  pathText: { flex: 1, color: '#e3e6e8', fontSize: 14, lineHeight: 21 },
  blockTitle: { marginTop: 12, marginBottom: 10, paddingHorizontal: 2 },
  blockHeading: { color: '#f0ece4', fontSize: 20, lineHeight: 25, fontWeight: '900', marginTop: 8 },
  blockBody: { color: '#9ea4aa', fontSize: 13, lineHeight: 19, marginTop: 7 },
  list: { gap: 8 },
  listRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#111417',
    borderWidth: 1,
    borderColor: '#272b30'
  },
  listRowMuted: { backgroundColor: '#0e1012', borderColor: '#202429' },
  listBullet: { color: '#c8a96a', fontSize: 10, fontWeight: '900', width: 22 },
  listText: { flex: 1, color: '#dce0e3', fontSize: 13, lineHeight: 20 },
  listTextMuted: { color: '#969ca2' },
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#111417',
    borderWidth: 1,
    borderColor: '#2a2f34',
    marginBottom: 10
  },
  cardIndex: { color: '#7c8289', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  cardTitle: { color: '#f3eee5', fontSize: 18, lineHeight: 23, fontWeight: '900', marginTop: 8 },
  cardBody: { color: '#adb3b8', fontSize: 13, lineHeight: 20, marginTop: 8 },
  paymentCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#13171a',
    borderWidth: 1,
    borderColor: '#3a3326',
    marginBottom: 10
  },
  paymentTitle: { color: '#f4ead5', fontSize: 19, lineHeight: 24, fontWeight: '900' },
  paymentLabel: { color: '#c8a96a', fontSize: 8, fontWeight: '900', letterSpacing: 1.4, marginTop: 14 },
  paymentBody: { color: '#d8dcdf', fontSize: 13, lineHeight: 20, marginTop: 6 },
  paymentAccept: { color: '#aeb3b8', fontSize: 12, lineHeight: 19, marginTop: 6 },
  decision: {
    marginTop: 18,
    borderRadius: 22,
    padding: 20,
    backgroundColor: '#d3b36f'
  },
  decisionKicker: { color: '#55451f', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  decisionText: { color: '#17130c', fontSize: 19, lineHeight: 26, fontWeight: '900', marginTop: 8 }
});
