import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import PhysicalPressable from '../ui/PhysicalPressable';
import {
  currentMoscowPilotApplicationReadiness,
  evaluateMoscowPilotApplicationReadiness,
  type MoscowPilotApplicationFieldGroup,
  type MoscowPilotApplicationFieldStatus
} from './moscowPilotApplicationReadiness';

const statusLabels: Record<MoscowPilotApplicationFieldStatus, string> = {
  ready: 'ГОТОВО',
  'project-draft': 'НУЖНО ПОДТВЕРДИТЬ',
  'applicant-input-required': 'ДАННЫЕ ЗАЯВИТЕЛЯ',
  'external-confirmation-required': 'НУЖНА МОСКВА',
  'legal-review-required': 'НУЖЕН ЮРИСТ',
  'missing-artifact': 'НЕТ АРТЕФАКТА'
};

const groupLabels: Record<MoscowPilotApplicationFieldGroup, string> = {
  applicant: 'Заявитель',
  eligibility: 'Eligibility / legal',
  solution: 'Решение',
  commercial: 'Коммерциализация',
  comparison: 'Аналоги и сравнение',
  pilot: 'Пилот',
  attachments: 'Приложения'
};

const statusStyleKey: Record<MoscowPilotApplicationFieldStatus, keyof typeof styles> = {
  ready: 'badgeReady',
  'project-draft': 'badgeDraft',
  'applicant-input-required': 'badgeApplicant',
  'external-confirmation-required': 'badgeExternal',
  'legal-review-required': 'badgeLegal',
  'missing-artifact': 'badgeMissing'
};

export default function MoscowPilotApplicationReadinessPanel() {
  const readiness = useMemo(
    () => evaluateMoscowPilotApplicationReadiness(),
    []
  );
  const [expandedGroup, setExpandedGroup] =
    useState<MoscowPilotApplicationFieldGroup | null>('applicant');

  const groups = (
    Object.keys(groupLabels) as MoscowPilotApplicationFieldGroup[]
  ).map((group) => ({
    group,
    fields: readiness.fields.filter((field) => field.group === group)
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.kicker}>I.MOSCOW · APPLICATION READINESS</Text>
        <Text style={styles.title}>{currentMoscowPilotApplicationReadiness.title}</Text>
        <Text style={styles.body}>
          Что уже можно перенести в заявку, а что нельзя заполнять без заявителя, юриста или внешнего подтверждения.
        </Text>

        <View style={styles.metrics}>
          <Metric value={readiness.readyFields} label="готово" />
          <Metric
            value={readiness.byStatus['applicant-input-required']}
            label="данные заявителя"
          />
          <Metric
            value={readiness.byStatus['legal-review-required']}
            label="legal"
          />
          <Metric
            value={readiness.byStatus['external-confirmation-required']}
            label="Москва"
          />
        </View>

        <View style={[
          styles.overallBadge,
          readiness.submissionReady && styles.overallBadgeReady
        ]}>
          <Text style={[
            styles.overallBadgeText,
            readiness.submissionReady && styles.overallBadgeTextReady
          ]}>
            {readiness.submissionReady
              ? 'SUBMISSION READY'
              : `BLOCKED · ${readiness.blockers.length} ПОЛЕЙ`}
          </Text>
        </View>
      </View>

      <View style={styles.nextAction}>
        <Text style={styles.nextActionLabel}>СЛЕДУЮЩАЯ РАБОЧАЯ СЕССИЯ</Text>
        <Text style={styles.nextActionText}>{readiness.nextAction}</Text>
      </View>

      {groups.map(({ group, fields }) => {
        const open = expandedGroup === group;
        const readyCount = fields.filter((field) => field.status === 'ready').length;

        return (
          <View key={group} style={styles.groupCard}>
            <PhysicalPressable
              accessibilityRole="button"
              accessibilityLabel={`${open ? 'Скрыть' : 'Показать'} раздел заявки ${groupLabels[group]}`}
              style={styles.groupButton}
              contentStyle={styles.groupButtonContent}
              onPress={() => setExpandedGroup(open ? null : group)}
            >
              <View style={styles.groupCopy}>
                <Text style={styles.groupTitle}>{groupLabels[group]}</Text>
                <Text style={styles.groupMeta}>
                  {readyCount}/{fields.length} ready
                </Text>
              </View>
              <Text style={styles.chevron}>{open ? '−' : '+'}</Text>
            </PhysicalPressable>

            {open && (
              <View style={styles.fields}>
                {fields.map((field) => (
                  <View key={field.id} style={styles.fieldCard}>
                    <View style={styles.fieldTop}>
                      <Text style={styles.fieldTitle}>{field.title}</Text>
                      <View style={[
                        styles.badge,
                        styles[statusStyleKey[field.status]]
                      ]}>
                        <Text style={styles.badgeText}>
                          {statusLabels[field.status]}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.fieldValue}>{field.currentValue}</Text>

                    {field.status !== 'ready' && (
                      <View style={styles.actionBox}>
                        <Text style={styles.actionLabel}>ЧТО СДЕЛАТЬ</Text>
                        <Text style={styles.actionText}>{field.requiredAction}</Text>
                      </View>
                    )}

                    <Text style={styles.authority}>
                      Authority: {field.authority}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.guardrail}>
        <Text style={styles.guardrailTitle}>Важно</Text>
        <Text style={styles.guardrailText}>
          Эта панель не присваивает статус участника пилота и не подтверждает eligibility юридического лица. Она только не даёт нам подать неполную заявку как готовую.
        </Text>
      </View>
    </View>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 18 },
  header: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#11171a',
    borderWidth: 1,
    borderColor: '#304149'
  },
  kicker: {
    color: '#89a9b1',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  title: {
    marginTop: 6,
    color: '#edf5f6',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900'
  },
  body: {
    marginTop: 7,
    color: '#a4b0b4',
    fontSize: 11,
    lineHeight: 17
  },
  metrics: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 6
  },
  metric: {
    flex: 1,
    minHeight: 62,
    borderRadius: 13,
    padding: 9,
    backgroundColor: '#0b1013',
    borderWidth: 1,
    borderColor: '#25343a'
  },
  metricValue: {
    color: '#d4e4e7',
    fontSize: 18,
    fontWeight: '900'
  },
  metricLabel: {
    marginTop: 3,
    color: '#718187',
    fontSize: 7,
    lineHeight: 10,
    fontWeight: '800'
  },
  overallBadge: {
    alignSelf: 'flex-start',
    marginTop: 13,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#482d26'
  },
  overallBadgeReady: { backgroundColor: '#223a2b' },
  overallBadgeText: {
    color: '#e1a27d',
    fontSize: 8,
    fontWeight: '900'
  },
  overallBadgeTextReady: { color: '#a2cea9' },
  nextAction: {
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#1c1912',
    borderWidth: 1,
    borderColor: '#594b31'
  },
  nextActionLabel: {
    color: '#a88b58',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1
  },
  nextActionText: {
    marginTop: 6,
    color: '#e1d3b8',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700'
  },
  groupCard: {
    marginTop: 9,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2b3036',
    backgroundColor: '#12161a'
  },
  groupButton: { minHeight: 54 },
  groupButtonContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  groupCopy: { flex: 1 },
  groupTitle: {
    color: '#ece8e0',
    fontSize: 13,
    fontWeight: '900'
  },
  groupMeta: {
    marginTop: 3,
    color: '#777e86',
    fontSize: 8,
    fontWeight: '800'
  },
  chevron: {
    color: '#d4b979',
    fontSize: 22,
    fontWeight: '700'
  },
  fields: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a3036'
  },
  fieldCard: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#252a30'
  },
  fieldTop: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start'
  },
  fieldTitle: {
    flex: 1,
    color: '#e8e4dd',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800'
  },
  fieldValue: {
    marginTop: 7,
    color: '#a9adb4',
    fontSize: 10,
    lineHeight: 16
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: '#343941'
  },
  badgeReady: { backgroundColor: '#22382a' },
  badgeDraft: { backgroundColor: '#413723' },
  badgeApplicant: { backgroundColor: '#3c3048' },
  badgeExternal: { backgroundColor: '#25394a' },
  badgeLegal: { backgroundColor: '#493032' },
  badgeMissing: { backgroundColor: '#512d25' },
  badgeText: {
    color: '#ebe2d5',
    fontSize: 6.5,
    fontWeight: '900'
  },
  actionBox: {
    marginTop: 9,
    borderRadius: 11,
    padding: 10,
    backgroundColor: '#0d1013'
  },
  actionLabel: {
    color: '#937b56',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.9
  },
  actionText: {
    marginTop: 4,
    color: '#c2c5ca',
    fontSize: 9,
    lineHeight: 14
  },
  authority: {
    marginTop: 8,
    color: '#697078',
    fontSize: 8,
    lineHeight: 12
  },
  guardrail: {
    marginTop: 10,
    borderRadius: 15,
    padding: 13,
    backgroundColor: '#181214',
    borderWidth: 1,
    borderColor: '#493035'
  },
  guardrailTitle: {
    color: '#e4bcc4',
    fontSize: 10,
    fontWeight: '900'
  },
  guardrailText: {
    marginTop: 5,
    color: '#b3989e',
    fontSize: 9,
    lineHeight: 14
  }
});
