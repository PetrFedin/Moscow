import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  getGovernmentFundingPathState,
  governmentFundingPath,
  type GovernmentFundingStatus
} from './governmentFundingPath';

const statusLabels: Record<GovernmentFundingStatus, string> = {
  'candidate-now': 'КАНДИДАТ СЕЙЧАС',
  'after-pilot': 'ПОСЛЕ PILOT',
  'after-measured-economics': 'ПОСЛЕ ECONOMICS',
  'after-regional-proof': 'ПОСЛЕ REGION PROOF'
};

export default function GovernmentFundingPathPanel() {
  const state = useMemo(() => getGovernmentFundingPathState(), []);
  const unlockedById = new Map(state.mechanisms.map((item) => [item.id, item.unlocked]));

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>FUNDING PATH · НЕ ОДИН БЮДЖЕТ</Text>
      <Text style={styles.title}>{governmentFundingPath.title}</Text>
      <Text style={styles.subtitle}>{governmentFundingPath.subtitle}</Text>

      <View style={styles.principle}>
        <Text style={styles.principleText}>{governmentFundingPath.principle}</Text>
      </View>

      {governmentFundingPath.mechanisms.map((mechanism, index) => {
        const unlocked = unlockedById.get(mechanism.id) === true;
        return (
          <View key={mechanism.id} style={[styles.card, unlocked && styles.cardUnlocked]}>
            <View style={styles.cardTop}>
              <View style={[styles.index, unlocked && styles.indexUnlocked]}>
                <Text style={[styles.indexText, unlocked && styles.indexTextUnlocked]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.cardHeadCopy}>
                <Text style={styles.cardTitle}>{mechanism.title}</Text>
                <Text style={styles.actor}>{mechanism.actor}</Text>
              </View>
              <View style={[styles.badge, unlocked && styles.badgeUnlocked]}>
                <Text style={[styles.badgeText, unlocked && styles.badgeTextUnlocked]}>
                  {unlocked ? 'OPEN' : statusLabels[mechanism.status]}
                </Text>
              </View>
            </View>

            <Text style={styles.purpose}>{mechanism.purpose}</Text>

            <View style={styles.fact}>
              <Text style={styles.factLabel}>ВХОДНОЙ GATE</Text>
              <Text style={styles.factText}>{mechanism.entryGate}</Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>КАК ИСПОЛЬЗУЕМ В MOSCOW</Text>
              <Text style={styles.factText}>{mechanism.projectUse}</Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>ОСНОВАНИЕ / МЕХАНИЗМ</Text>
              <Text style={styles.factText}>{mechanism.officialBasis}</Text>
            </View>

            <View style={styles.boundary}>
              <Text style={styles.boundaryLabel}>НЕ ОБЕЩАЕМ</Text>
              <Text style={styles.boundaryText}>{mechanism.boundary}</Text>
            </View>
          </View>
        );
      })}

      <View style={styles.now}>
        <Text style={styles.nowKicker}>ТЕКУЩИЙ ФОКУС</Text>
        <Text style={styles.nowTitle}>Сначала — bounded Moscow pilot</Text>
        <Text style={styles.nowText}>
          До physical/user proof и measured economics приложение не открывает investment/federal stages как готовый источник финансирования.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 24
  },
  kicker: {
    color: '#b99b69',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  title: {
    marginTop: 6,
    color: '#f4ecdf',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900'
  },
  subtitle: {
    marginTop: 5,
    color: '#9299a2',
    fontSize: 11,
    lineHeight: 17
  },
  principle: {
    marginTop: 12,
    padding: 14,
    borderRadius: 15,
    backgroundColor: '#14171b',
    borderWidth: 1,
    borderColor: '#30353c'
  },
  principleText: {
    color: '#c3c7cd',
    fontSize: 11,
    lineHeight: 17
  },
  card: {
    marginTop: 10,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#121519',
    borderWidth: 1,
    borderColor: '#343941'
  },
  cardUnlocked: {
    backgroundColor: '#161a16',
    borderColor: '#526143'
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9
  },
  index: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#242930',
    alignItems: 'center',
    justifyContent: 'center'
  },
  indexUnlocked: {
    backgroundColor: '#d7bb84'
  },
  indexText: {
    color: '#949aa2',
    fontSize: 9,
    fontWeight: '900'
  },
  indexTextUnlocked: {
    color: '#17130d'
  },
  cardHeadCopy: {
    flex: 1,
    minWidth: 0
  },
  cardTitle: {
    color: '#eee7dc',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900'
  },
  actor: {
    marginTop: 4,
    color: '#ad966f',
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '700'
  },
  badge: {
    borderRadius: 9,
    backgroundColor: '#292d33',
    paddingHorizontal: 7,
    paddingVertical: 5,
    maxWidth: 92
  },
  badgeUnlocked: {
    backgroundColor: '#3a4a31'
  },
  badgeText: {
    color: '#8f949b',
    fontSize: 7,
    lineHeight: 10,
    fontWeight: '900',
    textAlign: 'center'
  },
  badgeTextUnlocked: {
    color: '#cbe0b6'
  },
  purpose: {
    marginTop: 11,
    color: '#c6c9cf',
    fontSize: 11,
    lineHeight: 17
  },
  fact: {
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2d3238'
  },
  factLabel: {
    color: '#777e87',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  factText: {
    marginTop: 4,
    color: '#b8bcc3',
    fontSize: 10,
    lineHeight: 16
  },
  boundary: {
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#1b1314',
    borderWidth: 1,
    borderColor: '#3f2d30'
  },
  boundaryLabel: {
    color: '#b47880',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  boundaryText: {
    marginTop: 4,
    color: '#bca7aa',
    fontSize: 9,
    lineHeight: 14
  },
  now: {
    marginTop: 13,
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#d7bb84'
  },
  nowKicker: {
    color: '#66532f',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1
  },
  nowTitle: {
    marginTop: 5,
    color: '#17130d',
    fontSize: 16,
    fontWeight: '900'
  },
  nowText: {
    marginTop: 6,
    color: '#433721',
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '700'
  }
});
