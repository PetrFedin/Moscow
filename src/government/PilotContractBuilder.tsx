import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import { getPilotContractCopy, getPilotObligationCopy } from './pilotContractCopy';
import type { PilotContractSectionId } from './pilotContractAuthority';
import { getPilotDeliveryObligation } from './pilotContractAuthority';
import type { PilotDecisionBlocker } from './pilotInvestmentDecision';

export default function PilotContractBuilder({
  language,
  initialSection = 'scope',
  focusedBlocker = null
}: {
  language: AppLanguage;
  initialSection?: PilotContractSectionId;
  focusedBlocker?: PilotDecisionBlocker | null;
}) {
  const copy = getPilotContractCopy(language);
  const [section, setSection] = useState<PilotContractSectionId>(initialSection);
  const obligation = useMemo(
    () => focusedBlocker ? getPilotDeliveryObligation(focusedBlocker) : null,
    [focusedBlocker]
  );
  const obligationCopy = useMemo(
    () => obligation ? getPilotObligationCopy(language, obligation) : null,
    [language, obligation]
  );

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);
  const active = copy.sections.find((item) => item.id === section) ?? copy.sections[0];

  return (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>{copy.kicker}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.body}>{copy.body}</Text>
          </View>
          <View style={styles.draftBadge}>
            <Text style={styles.draftBadgeText}>{copy.statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        {copy.sections.map((item) => (
          <PhysicalPressable
            key={item.id}
            style={[styles.tab, section === item.id && styles.tabActive]}
            contentStyle={styles.tabContent}
            onPress={() => setSection(item.id)}
            accessibilityLabel={item.title}
          >
            <Text style={[styles.tabText, section === item.id && styles.tabTextActive]}>
              {item.title}
            </Text>
          </PhysicalPressable>
        ))}
      </View>

      {obligation && obligationCopy && (
        <View style={styles.focusCard}>
          <Text style={styles.focusKicker}>{copy.focused.kicker}</Text>
          <Text style={styles.focusLabel}>{copy.focused.blockerLabel}</Text>
          <Text style={styles.focusValue}>{obligationCopy.blocker}</Text>

          <View style={styles.focusGrid}>
            <View style={styles.focusCell}>
              <Text style={styles.focusLabel}>{copy.focused.responsibleLabel}</Text>
              <Text style={styles.focusCellValue}>{obligationCopy.responsible}</Text>
            </View>
            <View style={styles.focusCell}>
              <Text style={styles.focusLabel}>{copy.focused.evidenceLabel}</Text>
              <Text style={styles.focusCellValue}>{obligationCopy.evidence}</Text>
            </View>
            <View style={styles.focusCell}>
              <Text style={styles.focusLabel}>{copy.focused.acceptanceLabel}</Text>
              <Text style={styles.focusCellValue}>{obligationCopy.acceptanceClause}</Text>
            </View>
            <View style={styles.focusCell}>
              <Text style={styles.focusLabel}>{copy.focused.paymentLabel}</Text>
              <Text style={styles.focusCellValue}>{obligationCopy.paymentMilestone}</Text>
            </View>
          </View>
        </View>
      )}

      {active && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionKicker}>{active.title.toUpperCase()}</Text>
          <Text style={styles.sectionSummary}>{active.summary}</Text>

          <View style={styles.items}>
            {active.items.map((item, index) => (
              <View key={item} style={styles.itemRow}>
                <Text style={styles.itemNumber}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.boundary}>
        <Text style={styles.boundaryTitle}>{copy.legalBoundaryTitle}</Text>
        <Text style={styles.boundaryText}>{copy.legalBoundaryBody}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#13171a',
    borderWidth: 1,
    borderColor: '#3a3327'
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14
  },
  heroCopy: { flex: 1 },
  kicker: {
    color: '#c8a96a',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 1.4
  },
  title: {
    color: '#f4eee4',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    marginTop: 8
  },
  body: {
    color: '#aeb4b9',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9
  },
  draftBadge: {
    maxWidth: 155,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#201c16',
    borderWidth: 1,
    borderColor: '#695b3e'
  },
  draftBadgeText: {
    color: '#d9c18b',
    fontSize: 8,
    lineHeight: 12,
    fontWeight: '900',
    textAlign: 'center'
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 12
  },
  tab: {
    minHeight: 38,
    borderRadius: 13,
    backgroundColor: '#111417',
    borderWidth: 1,
    borderColor: '#2a2f34'
  },
  tabActive: {
    backgroundColor: '#d3b36f',
    borderColor: '#e5c987'
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11
  },
  tabText: {
    color: '#aeb3b8',
    fontSize: 10,
    fontWeight: '900'
  },
  tabTextActive: { color: '#17130c' },
  sectionCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#101316',
    borderWidth: 1,
    borderColor: '#2b3035'
  },
  sectionKicker: {
    color: '#c8a96a',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 1.25
  },
  sectionSummary: {
    color: '#ede8df',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    marginTop: 8
  },
  items: {
    gap: 8,
    marginTop: 16
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#15191c'
  },
  itemNumber: {
    width: 22,
    color: '#75674f',
    fontSize: 9,
    lineHeight: 16,
    fontWeight: '900'
  },
  itemText: {
    flex: 1,
    color: '#cbd0d4',
    fontSize: 12,
    lineHeight: 18
  },
  focusCard: {
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 20,
    padding: 17,
    backgroundColor: '#16130f',
    borderWidth: 1,
    borderColor: '#765f35'
  },
  focusKicker: {
    color: '#d3b36f',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.35
  },
  focusLabel: {
    color: '#897c67',
    fontSize: 8,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 1.05,
    marginTop: 10
  },
  focusValue: {
    color: '#f2e7d1',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 4
  },
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  focusCell: {
    minWidth: 180,
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: '#101316',
    borderRadius: 14,
    padding: 11
  },
  focusCellValue: {
    color: '#d6dade',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    marginTop: 4
  },
  boundary: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#171416',
    borderWidth: 1,
    borderColor: '#453437'
  },
  boundaryTitle: {
    color: '#e0b6bc',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  boundaryText: {
    color: '#b9a7aa',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7
  }
});
