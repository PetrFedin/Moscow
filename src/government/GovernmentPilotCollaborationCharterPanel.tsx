import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  getGovernmentPilotCharterReadiness,
  governmentPilotCollaborationCharter
} from './governmentPilotCollaborationCharter';

export default function GovernmentPilotCollaborationCharterPanel() {
  const readiness = useMemo(() => getGovernmentPilotCharterReadiness(), []);

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>COLLABORATION CHARTER · WORKING MODEL</Text>
        <Text style={styles.title}>{governmentPilotCollaborationCharter.title}</Text>
        <Text style={styles.subtitle}>{governmentPilotCollaborationCharter.subtitle}</Text>
        <View style={styles.boundary}>
          <Text style={styles.boundaryText}>
            {governmentPilotCollaborationCharter.legalBoundary}
          </Text>
        </View>
        <View style={styles.currentGate}>
          <Text style={styles.currentGateLabel}>ТЕКУЩИЙ GATE</Text>
          <Text style={styles.currentGateValue}>SCOPE / OWNER / SITE</Text>
          <Text style={styles.currentGateBody}>
            Working model готов в репозитории, но city owner и pilot site ещё не подтверждены внешней стороной.
          </Text>
        </View>
      </View>

      <View style={styles.columns}>
        <Contribution
          kicker="МЫ ПРИНОСИМ"
          items={governmentPilotCollaborationCharter.projectProvides}
        />
        <Contribution
          kicker="МОСКВА / ПАРТНЁРЫ ДАЮТ"
          items={governmentPilotCollaborationCharter.cityOrPartnersProvide}
        />
        <Contribution
          kicker="СОВМЕСТНО РЕШАЕМ"
          items={governmentPilotCollaborationCharter.sharedDecisions}
        />
      </View>

      <Text style={styles.sectionKicker}>РОЛИ · AUTHORITY НЕ СМЕШИВАТЬ</Text>
      {governmentPilotCollaborationCharter.roles.map((role) => (
        <View key={role.id} style={styles.roleCard}>
          <Text style={styles.roleTitle}>{role.title}</Text>
          {role.responsibility.map((item) => (
            <Text key={item} style={styles.roleText}>• {item}</Text>
          ))}
          <View style={styles.roleBoundary}>
            <Text style={styles.roleBoundaryLabel}>НЕ ПРЕДПОЛАГАЕМ</Text>
            <Text style={styles.roleBoundaryText}>{role.mustNotBeAssumed}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionKicker}>ПУТЬ СОТРУДНИЧЕСТВА · 5 GATES</Text>
      {governmentPilotCollaborationCharter.phases.map((phase, index) => {
        const active = phase.id === readiness.currentGate;
        return (
          <View key={phase.id} style={[styles.phaseCard, active && styles.phaseCardActive]}>
            <View style={styles.phaseTop}>
              <View style={[styles.phaseIndex, active && styles.phaseIndexActive]}>
                <Text style={[styles.phaseIndexText, active && styles.phaseIndexTextActive]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.phaseCopy}>
                <Text style={styles.phaseTitle}>{phase.title}</Text>
                <Text style={styles.phasePurpose}>{phase.purpose}</Text>
              </View>
              <View style={[styles.phaseStatus, active && styles.phaseStatusActive]}>
                <Text style={[styles.phaseStatusText, active && styles.phaseStatusTextActive]}>
                  {active ? 'NOW' : index === 0 ? 'OPEN' : 'GATED'}
                </Text>
              </View>
            </View>

            <View style={styles.phaseSection}>
              <Text style={styles.phaseLabel}>НУЖНО НА ВХОДЕ</Text>
              {phase.requiredInputs.map((item) => (
                <Text key={item} style={styles.phaseItem}>• {item}</Text>
              ))}
            </View>

            <View style={styles.phaseSection}>
              <Text style={styles.phaseLabel}>ЧТО ДОЛЖНО ПОЯВИТЬСЯ</Text>
              {phase.outputs.map((item) => (
                <Text key={item} style={styles.phaseItem}>• {item}</Text>
              ))}
            </View>

            <View style={styles.gate}>
              <Text style={styles.gateLabel}>GATE</Text>
              <Text style={styles.gateText}>{phase.gate}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Contribution({ kicker, items }: { kicker: string; items: string[] }) {
  return (
    <View style={styles.contribution}>
      <Text style={styles.contributionKicker}>{kicker}</Text>
      {items.map((item, index) => (
        <View key={item} style={styles.contributionRow}>
          <Text style={styles.contributionIndex}>
            {String(index + 1).padStart(2, '0')}
          </Text>
          <Text style={styles.contributionText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 22 },
  hero: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#11171b',
    borderWidth: 1,
    borderColor: '#2f4650'
  },
  kicker: {
    color: '#80a7b5',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  title: {
    marginTop: 6,
    color: '#eef6f7',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900'
  },
  subtitle: {
    marginTop: 5,
    color: '#9eaeb4',
    fontSize: 11,
    lineHeight: 17
  },
  boundary: {
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#171215',
    borderWidth: 1,
    borderColor: '#493139'
  },
  boundaryText: {
    color: '#b9a2a7',
    fontSize: 9,
    lineHeight: 15
  },
  currentGate: {
    marginTop: 12,
    padding: 13,
    borderRadius: 13,
    backgroundColor: '#d7bb84'
  },
  currentGateLabel: {
    color: '#6a5631',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  currentGateValue: {
    marginTop: 5,
    color: '#17130d',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900'
  },
  currentGateBody: {
    marginTop: 5,
    color: '#463820',
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '700'
  },
  columns: { marginTop: 10, gap: 9 },
  contribution: {
    padding: 14,
    borderRadius: 17,
    backgroundColor: '#13171b',
    borderWidth: 1,
    borderColor: '#2d3238'
  },
  contributionKicker: {
    color: '#b59b70',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1
  },
  contributionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 9
  },
  contributionIndex: {
    width: 22,
    color: '#6f624b',
    fontSize: 8,
    fontWeight: '900'
  },
  contributionText: {
    flex: 1,
    color: '#c0c4ca',
    fontSize: 10,
    lineHeight: 16
  },
  sectionKicker: {
    marginTop: 20,
    marginBottom: 8,
    color: '#8f7854',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  roleCard: {
    marginBottom: 9,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#121519',
    borderWidth: 1,
    borderColor: '#2c3137'
  },
  roleTitle: {
    color: '#ece7de',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900'
  },
  roleText: {
    marginTop: 5,
    color: '#aeb3ba',
    fontSize: 9,
    lineHeight: 15
  },
  roleBoundary: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#33363a'
  },
  roleBoundaryLabel: {
    color: '#a47769',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  roleBoundaryText: {
    marginTop: 4,
    color: '#9d8987',
    fontSize: 8,
    lineHeight: 13
  },
  phaseCard: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#141518',
    borderWidth: 1,
    borderColor: '#34373c'
  },
  phaseCardActive: {
    backgroundColor: '#171a14',
    borderColor: '#5d593d'
  },
  phaseTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9
  },
  phaseIndex: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#282c31',
    alignItems: 'center',
    justifyContent: 'center'
  },
  phaseIndexActive: { backgroundColor: '#d7bb84' },
  phaseIndexText: { color: '#999ea5', fontSize: 9, fontWeight: '900' },
  phaseIndexTextActive: { color: '#17130d' },
  phaseCopy: { flex: 1, minWidth: 0 },
  phaseTitle: {
    color: '#efe9df',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900'
  },
  phasePurpose: {
    marginTop: 4,
    color: '#969ca4',
    fontSize: 9,
    lineHeight: 14
  },
  phaseStatus: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#292d32'
  },
  phaseStatusActive: { backgroundColor: '#4f4930' },
  phaseStatusText: { color: '#878d94', fontSize: 7, fontWeight: '900' },
  phaseStatusTextActive: { color: '#e9d199' },
  phaseSection: {
    marginTop: 11,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2e3237'
  },
  phaseLabel: {
    color: '#737a82',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  phaseItem: {
    marginTop: 4,
    color: '#b5b9bf',
    fontSize: 9,
    lineHeight: 14
  },
  gate: {
    marginTop: 11,
    padding: 10,
    borderRadius: 11,
    backgroundColor: '#0e1114'
  },
  gateLabel: {
    color: '#a18a60',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  gateText: {
    marginTop: 4,
    color: '#c3beb5',
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '700'
  }
});
