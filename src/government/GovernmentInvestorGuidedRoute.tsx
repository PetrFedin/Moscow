import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import PhysicalPressable from '../ui/PhysicalPressable';
import GovernmentFundingPathPanel from './GovernmentFundingPathPanel';
import {
  getGovernmentInvestorRouteState,
  governmentInvestorRoute
} from './governmentInvestorRoute';

export default function GovernmentInvestorGuidedRoute({
  onExit,
  onClose
}: {
  onExit: () => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const state = useMemo(() => getGovernmentInvestorRouteState(), []);
  const step = governmentInvestorRoute.steps[index]!;
  const last = index === governmentInvestorRoute.steps.length - 1;
  const progress = ((index + 1) / governmentInvestorRoute.steps.length) * 100;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.top}>
        <View style={styles.topCopy}>
          <Text style={styles.eyebrow}>GOVERNMENT / INVESTOR ROUTE</Text>
          <Text style={styles.topTitle}>{governmentInvestorRoute.title}</Text>
          <Text style={styles.topMeta}>
            {governmentInvestorRoute.durationMinutes} минут · шаг {index + 1}/{governmentInvestorRoute.steps.length}
          </Text>
        </View>
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть маршрут сотрудничества"
          style={styles.close}
          contentStyle={styles.center}
          onPress={onClose}
        >
          <Text style={styles.closeText}>×</Text>
        </PhysicalPressable>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.minuteRow}>
          <Text style={styles.minute}>{step.minute}</Text>
          <Text style={styles.stepId}>{String(index + 1).padStart(2, '0')}</Text>
        </View>

        <Text style={styles.title}>{step.title}</Text>
        <View style={styles.questionCard}>
          <Text style={styles.questionKicker}>ВОПРОС РУКОВОДИТЕЛЯ</Text>
          <Text style={styles.question}>{step.question}</Text>
        </View>

        <Text style={styles.body}>{step.body}</Text>

        {step.id === 'proof' && (
          <View style={styles.readinessCard}>
            <View style={styles.readinessMetric}>
              <Text style={styles.readinessValue}>
                {state.implementedProofItems}/{state.totalProofItems}
              </Text>
              <Text style={styles.readinessLabel}>software proof items</Text>
            </View>
            <View style={styles.readinessMetric}>
              <Text style={styles.readinessValue}>{state.blockerCount}</Text>
              <Text style={styles.readinessLabel}>decision blockers</Text>
            </View>
            <View style={styles.readinessMetric}>
              <Text style={[
                styles.readinessState,
                state.decisionPackReady && styles.readinessStateReady
              ]}>
                {state.decisionPackReady ? 'READY' : 'NOT READY'}
              </Text>
              <Text style={styles.readinessLabel}>investment pack</Text>
            </View>
          </View>
        )}

        {step.id === 'funding' && <GovernmentFundingPathPanel />}

        {step.id === 'city-ask' && (
          <View style={styles.stakeholderWrap}>
            <Text style={styles.cardKicker}>КАРТА СТОРОН · НЕ ОДИН «ГОРОД»</Text>
            {governmentInvestorRoute.stakeholderMap.map((stakeholder) => (
              <View key={stakeholder.id} style={styles.stakeholderCard}>
                <View style={styles.stakeholderHeader}>
                  <Text style={styles.stakeholderRole}>{stakeholder.role}</Text>
                  <Text style={styles.stakeholderContour}>{stakeholder.candidateContour}</Text>
                </View>
                <Text style={styles.stakeholderResponsibility}>{stakeholder.responsibility}</Text>
                <Text style={styles.stakeholderCaveat}>{stakeholder.caveat}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.evidenceCard}>
          <Text style={styles.cardKicker}>ЧТО ПОКАЗАТЬ НА ЭТОМ ШАГЕ</Text>
          {step.evidence.map((item, itemIndex) => (
            <View key={item} style={styles.evidenceRow}>
              <Text style={styles.evidenceIndex}>
                {String(itemIndex + 1).padStart(2, '0')}
              </Text>
              <Text style={styles.evidenceText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.decisionCard}>
          <Text style={styles.cardKicker}>РЕШЕНИЕ ЭТОГО ШАГА</Text>
          <Text style={styles.decisionText}>{step.decision}</Text>
        </View>

        {index === 0 && (
          <View style={styles.ruleCard}>
            <Text style={styles.ruleKicker}>ПЕРВАЯ ВСТРЕЧА</Text>
            <Text style={styles.ruleTitle}>Просим не инвестиции во всё сразу</Text>
            <Text style={styles.ruleText}>{governmentInvestorRoute.firstMeetingGoal}</Text>
            <Text style={styles.ruleWarning}>{governmentInvestorRoute.firstMeetingDoNotAsk}</Text>
          </View>
        )}

        {last && (
          <>
            <View style={styles.finalHero}>
              <Text style={styles.finalKicker}>ОДИН СЛЕДУЮЩИЙ ШАГ</Text>
              <Text style={styles.finalTitle}>Согласовать подготовку пилота</Text>
              <Text style={styles.finalText}>{governmentInvestorRoute.cityNextAction}</Text>
            </View>

            <View style={styles.pathCard}>
              <Path
                label="МОСКВА"
                when="СЕЙЧАС"
                text={governmentInvestorRoute.cityNextAction}
              />
              <Path
                label="ИНВЕСТОР"
                when="ПОСЛЕ PROOF"
                text={governmentInvestorRoute.investorNextAction}
              />
              <Path
                label="ФЕДЕРАЦИЯ"
                when="ПОСЛЕ REGION PROOF"
                text={governmentInvestorRoute.federalNextAction}
              />
            </View>

            <View style={styles.guardrail}>
              <Text style={styles.guardrailTitle}>Что приложение не обещает</Text>
              <Text style={styles.guardrailText}>
                Бюджет, закупка, инвестиция или федеральная поддержка не считаются одобренными до отдельного решения соответствующей стороны.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={index === 0 ? 'Вернуться к обзору городского пилота' : 'Предыдущий шаг'}
          style={styles.secondaryButton}
          contentStyle={styles.center}
          onPress={() => index === 0 ? onExit() : setIndex(index - 1)}
        >
          <Text style={styles.secondaryText}>{index === 0 ? '← Обзор' : '← Назад'}</Text>
        </PhysicalPressable>

        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={last ? 'Завершить маршрут сотрудничества' : 'Следующий шаг маршрута'}
          style={styles.primaryButton}
          contentStyle={styles.center}
          strong
          onPress={() => last ? onExit() : setIndex(index + 1)}
        >
          <Text style={styles.primaryText}>{last ? 'Завершить' : 'Дальше →'}</Text>
        </PhysicalPressable>
      </View>
    </SafeAreaView>
  );
}

function Path({ label, when, text }: { label: string; when: string; text: string }) {
  return (
    <View style={styles.path}>
      <View style={styles.pathHeader}>
        <Text style={styles.pathLabel}>{label}</Text>
        <Text style={styles.pathWhen}>{when}</Text>
      </View>
      <Text style={styles.pathText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0c0f'
  },
  top: {
    minHeight: 88,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#28231b',
    backgroundColor: '#111418',
    flexDirection: 'row',
    alignItems: 'center'
  },
  topCopy: { flex: 1, paddingRight: 12 },
  eyebrow: {
    color: '#b79b68',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 1.3
  },
  topTitle: {
    marginTop: 4,
    color: '#f5efe6',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800'
  },
  topMeta: {
    marginTop: 4,
    color: '#8e959e',
    fontSize: 10,
    lineHeight: 14
  },
  close: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#3c4148',
    backgroundColor: '#171b20'
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#f5efe6', fontSize: 25, lineHeight: 27 },
  progressTrack: {
    height: 3,
    backgroundColor: '#211d17'
  },
  progressFill: {
    height: 3,
    backgroundColor: '#d7bb84'
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28
  },
  minuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  minute: {
    color: '#d7bb84',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  stepId: {
    color: '#595f67',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900'
  },
  title: {
    marginTop: 8,
    color: '#fff8ec',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900'
  },
  questionCard: {
    marginTop: 18,
    borderLeftWidth: 3,
    borderLeftColor: '#d7bb84',
    paddingLeft: 14,
    paddingVertical: 4
  },
  questionKicker: {
    color: '#8d7958',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  question: {
    marginTop: 5,
    color: '#e6dccd',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700'
  },
  body: {
    marginTop: 22,
    color: '#c3c8cf',
    fontSize: 14,
    lineHeight: 22
  },
  readinessCard: {
    marginTop: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#343941',
    backgroundColor: '#13171c',
    padding: 14,
    flexDirection: 'row',
    gap: 8
  },
  readinessMetric: {
    flex: 1,
    minHeight: 76,
    borderRadius: 13,
    backgroundColor: '#0d1014',
    padding: 10,
    justifyContent: 'center'
  },
  readinessValue: {
    color: '#f4d596',
    fontSize: 20,
    fontWeight: '900'
  },
  readinessState: {
    color: '#df9e7f',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900'
  },
  readinessStateReady: { color: '#b5d79f' },
  readinessLabel: {
    marginTop: 4,
    color: '#727983',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '700'
  },
  stakeholderWrap: {
    marginTop: 24
  },
  stakeholderCard: {
    marginTop: 9,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#11161a',
    borderWidth: 1,
    borderColor: '#2b3a40'
  },
  stakeholderHeader: {
    gap: 5
  },
  stakeholderRole: {
    color: '#e8f0f2',
    fontSize: 13,
    fontWeight: '900'
  },
  stakeholderContour: {
    color: '#8fb0ba',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '800'
  },
  stakeholderResponsibility: {
    marginTop: 8,
    color: '#c0c9cd',
    fontSize: 11,
    lineHeight: 17
  },
  stakeholderCaveat: {
    marginTop: 7,
    color: '#877f77',
    fontSize: 9,
    lineHeight: 14
  },
  evidenceCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#121519',
    borderWidth: 1,
    borderColor: '#2d3239'
  },
  cardKicker: {
    color: '#8f7954',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  evidenceRow: {
    flexDirection: 'row',
    gap: 11,
    paddingTop: 13
  },
  evidenceIndex: {
    color: '#6c604a',
    fontSize: 9,
    fontWeight: '900',
    width: 22
  },
  evidenceText: {
    flex: 1,
    color: '#d4d7dc',
    fontSize: 12,
    lineHeight: 18
  },
  decisionCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#1b1812',
    borderWidth: 1,
    borderColor: '#5d4f36'
  },
  decisionText: {
    marginTop: 7,
    color: '#f4e3c4',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800'
  },
  ruleCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#0f1518',
    borderWidth: 1,
    borderColor: '#26414c'
  },
  ruleKicker: {
    color: '#7b9ba7',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1
  },
  ruleTitle: {
    marginTop: 7,
    color: '#e7f3f7',
    fontSize: 15,
    fontWeight: '900'
  },
  ruleText: {
    marginTop: 8,
    color: '#b9cdd4',
    fontSize: 12,
    lineHeight: 18
  },
  ruleWarning: {
    marginTop: 9,
    color: '#aa8a7c',
    fontSize: 10,
    lineHeight: 15
  },
  finalHero: {
    marginTop: 22,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#d7bb84'
  },
  finalKicker: {
    color: '#66532f',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  finalTitle: {
    marginTop: 7,
    color: '#17130d',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900'
  },
  finalText: {
    marginTop: 8,
    color: '#342b1c',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700'
  },
  pathCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#30353c',
    overflow: 'hidden'
  },
  path: {
    padding: 15,
    backgroundColor: '#121519',
    borderBottomWidth: 1,
    borderBottomColor: '#252a30'
  },
  pathHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  pathLabel: {
    color: '#e7d3ac',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  pathWhen: {
    color: '#6f7680',
    fontSize: 8,
    fontWeight: '900'
  },
  pathText: {
    marginTop: 7,
    color: '#c8cbd0',
    fontSize: 11,
    lineHeight: 17
  },
  guardrail: {
    marginTop: 14,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#181214',
    borderWidth: 1,
    borderColor: '#4a2f34'
  },
  guardrailTitle: {
    color: '#e4bdc4',
    fontSize: 11,
    fontWeight: '900'
  },
  guardrailText: {
    marginTop: 6,
    color: '#b99da3',
    fontSize: 10,
    lineHeight: 15
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#262a30',
    backgroundColor: '#101318',
    flexDirection: 'row',
    gap: 10
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#3a4047',
    backgroundColor: '#171b20'
  },
  primaryButton: {
    flex: 1.4,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: '#d7bb84',
    borderWidth: 1,
    borderColor: '#f0d39b'
  },
  secondaryText: {
    color: '#c2c7ce',
    fontSize: 11,
    fontWeight: '800'
  },
  primaryText: {
    color: '#17130d',
    fontSize: 11,
    fontWeight: '900'
  }
});
