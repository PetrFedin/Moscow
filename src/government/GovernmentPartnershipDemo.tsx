import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import PhysicalPressable from '../ui/PhysicalPressable';
import {
  getGovernmentPilotReadiness,
  governmentPilotOffer,
  type GovernmentProofStatus
} from './governmentPilotOffer';
import {
  currentPilotInvestmentEvidence,
  getPilotDecisionReadiness,
  type PilotDecisionBlocker
} from './pilotInvestmentDecision';
import {
  evaluateGovernmentDeliveryReadiness,
  type GovernmentArtifactId
} from './governmentDeliveryManifest';

type Section = 'offer' | 'proof' | 'ask' | 'funding' | 'package' | 'decision' | 'scale';

const sectionLabels: Record<Section, string> = {
  offer: 'Пилот',
  proof: 'Доказательства',
  ask: 'Что нужно',
  funding: 'Финансирование',
  package: 'Пакет',
  decision: 'Решение',
  scale: 'Масштаб'
};

const proofLabels: Record<GovernmentProofStatus, string> = {
  implemented: 'В КОДЕ',
  'external-proof-required': 'НУЖНО ПОЛЕ',
  'partner-access-required': 'НУЖЕН ПАРТНЁР',
  'future-stage': 'ПОСЛЕ МОСКВЫ'
};

const decisionBlockerLabels: Record<PilotDecisionBlocker, string> = {
  'romanov-field-proof-missing': 'Romanov: нет реального field verification',
  'second-object-repeatability-missing': 'Old English Court: не доказана повторяемость второго объекта',
  'visitor-pilot-review-missing': 'Нет review реального visitor pilot 20–50 участников',
  'live-provider-agreement-missing': 'Нет формального live/provider integration agreement',
  'publication-rights-blockers-remain': 'Остаются publication rights blockers',
  'security-data-flow-review-missing': 'Не завершён security / data-flow review',
  'ip-handover-review-missing': 'Не согласована IP / handover модель',
  'operations-sla-review-missing': 'Не согласован operations / SLA контур',
  'next-object-cost-unmeasured': 'Не измерена переменная стоимость следующего verified object',
  'next-object-production-time-unmeasured': 'Не измерен production lead time следующего объекта',
  'developer-hours-unmeasured': 'Не измерены developer hours на один следующий объект',
  'institution-operator-hours-unmeasured': 'Не измерены operator hours учреждения на один объект',
  'district-shared-setup-cost-unmeasured': 'Не измерен shared setup следующего района',
  'district-integration-cost-unmeasured': 'Не измерена интеграция следующего района',
  'annual-operations-cost-unmeasured': 'Не измерена годовая стоимость эксплуатации'
};

const governmentArtifactLabels: Record<GovernmentArtifactId, string> = {
  'city-pilot-demo': 'CITY PILOT demo',
  'pilot-positioning': 'Позиционирование пилота',
  'pilot-methodology': 'Методология пилота',
  'pilot-acceptance': 'Матрица приёмки',
  'funding-scale-playbook': 'Funding / scale playbook',
  'investment-decision-authority': 'Investment decision authority',
  'executive-one-pager': 'Executive one-pager',
  'decision-deck': '10–12 slide decision deck',
  'technical-specification': 'Консолидированное техническое задание',
  'architecture-integration': 'Architecture / integration scheme',
  'security-data-flow': 'Security / data-flow note',
  'ip-rights-handover': 'IP / rights / handover matrix',
  'operations-sla': 'Operations / SLA',
  'cost-scale-model': 'Cost assumptions / scale-up model',
  'final-report-template': 'Final pilot report template'
};

const economicsMetrics = [
  {
    title: '₽ / verified object',
    body: 'Фактическая переменная стоимость следующего объекта: 3D + research + rights + survey + verification.'
  },
  {
    title: 'Lead time / object',
    body: 'Календарное время от approved brief до accepted PublishedSpatialPackage.'
  },
  {
    title: 'Developer hours / object',
    body: 'Сколько разработки действительно требуется после появления Studio и generic pipeline.'
  },
  {
    title: 'Institution hours / object',
    body: 'Сколько работы редактора, историка, rights reviewer и publisher остаётся на стороне учреждения.'
  },
  {
    title: 'Shared setup / district',
    body: 'Разовая стоимость настройки района, governance, content authority и production workflow.'
  },
  {
    title: 'Integration / district',
    body: 'Фактическая стоимость подключения map / RUSSPASS / provider / deployment contour.'
  },
  {
    title: 'Annual operations',
    body: 'Hosting, support, monitoring, content operations, SLA и provider maintenance за год.'
  }
] as const;

export default function GovernmentPartnershipDemo({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<Section>('offer');
  const readiness = useMemo(() => getGovernmentPilotReadiness(), []);
  const decisionReadiness = useMemo(
    () => getPilotDecisionReadiness(currentPilotInvestmentEvidence),
    []
  );
  const deliveryReadiness = useMemo(
    () => evaluateGovernmentDeliveryReadiness(),
    []
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>MOSCOW · CITY PILOT</Text>
          <Text style={styles.title}>{governmentPilotOffer.title}</Text>
          <Text style={styles.subtitle}>{governmentPilotOffer.subtitle}</Text>
        </View>
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть сценарий для города"
          style={styles.close}
          contentStyle={styles.center}
          onPress={onClose}
        >
          <Text style={styles.closeText}>×</Text>
        </PhysicalPressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {(Object.keys(sectionLabels) as Section[]).map((item) => (
          <PhysicalPressable
            key={item}
            style={[styles.tab, section === item && styles.tabActive]}
            contentStyle={styles.tabContent}
            onPress={() => setSection(item)}
          >
            <Text style={[styles.tabText, section === item && styles.tabTextActive]}>
              {sectionLabels[item]}
            </Text>
          </PhysicalPressable>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {section === 'offer' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>ПРЕДМЕТ СОТРУДНИЧЕСТВА</Text>
              <Text style={styles.heroTitle}>{governmentPilotOffer.positioning}</Text>
            </View>

            <View style={styles.metrics}>
              <Metric value="5" label="точек маршрута" />
              <Metric value="2" label="spatial objects" />
              <Metric value="20–50" label="участников пилота" />
            </View>

            <SectionTitle
              kicker="ПЕРВЫЙ ЭТАП"
              title={governmentPilotOffer.pilot.name}
              body={governmentPilotOffer.pilot.territory}
            />
            <BulletCard items={governmentPilotOffer.pilot.scope} />

            <SectionTitle
              kicker="ЧТО ОСТАЁТСЯ У ГОРОДА"
              title="Результат — не презентация"
              body="Пилот должен оставить воспроизводимый стандарт, evidence и механизм следующего района."
            />
            <BulletCard items={governmentPilotOffer.pilot.outputs} />

            <SectionTitle
              kicker="ЗАЧЕМ ГОРОДУ"
              title="Повторно используемая цифровая инфраструктура"
              body="Один проверяемый объект и один production workflow должны работать в нескольких городских каналах."
            />
            <BulletCard items={governmentPilotOffer.cityValue} />
          </>
        )}

        {section === 'proof' && (
          <>
            <View style={styles.readiness}>
              <Text style={styles.kicker}>READINESS</Text>
              <Text style={styles.readinessValue}>{readiness.implemented}/{readiness.total}</Text>
              <Text style={styles.readinessLabel}>контуров уже реализованы в software authority</Text>
              <Text style={styles.readinessWarning}>
                Пилот ещё не доказан: остаются физические, пользовательские и partner-access gates.
              </Text>
            </View>

            {governmentPilotOffer.proof.map((item) => (
              <View key={item.id} style={styles.proofCard}>
                <View style={styles.proofTop}>
                  <Text style={styles.proofTitle}>{item.title}</Text>
                  <View style={[
                    styles.statusBadge,
                    item.status === 'implemented' && styles.statusImplemented,
                    item.status === 'external-proof-required' && styles.statusExternal,
                    item.status === 'partner-access-required' && styles.statusPartner
                  ]}>
                    <Text style={styles.statusText}>{proofLabels[item.status]}</Text>
                  </View>
                </View>
                <Text style={styles.proofEvidence}>{item.evidence}</Text>
                <View style={styles.nextGate}>
                  <Text style={styles.nextGateLabel}>СЛЕДУЮЩИЙ GATE</Text>
                  <Text style={styles.nextGateText}>{item.nextGate}</Text>
                </View>
              </View>
            ))}

            <SectionTitle
              kicker="КРАСНЫЕ ЛИНИИ"
              title="Что мы не обещаем до доказательства"
              body="Это повышает доверие к пилоту и облегчает формальную приёмку."
            />
            <BulletCard items={governmentPilotOffer.guardrails} />
          </>
        )}

        {section === 'ask' && (
          <>
            <SectionTitle
              kicker="ЧТО НУЖНО ОТ МОСКВЫ"
              title="Не “дайте денег на приложение”"
              body="Нужны конкретные ресурсы, доступы и формальный контур пилота."
            />
            <NumberedCard items={governmentPilotOffer.cityAsk} />

            <View style={styles.statement}>
              <Text style={styles.statementKicker}>ФОРМУЛА ПЕРВОЙ ВСТРЕЧИ</Text>
              <Text style={styles.statementText}>
                «Предлагаем на Варварке проверить городской стандарт цифрового исторического объекта и туристического пути. Мы приходим с работающим software-контуром; от города нужны площадка, профильные эксперты, интеграционный доступ и согласованный механизм пилота. Решение о внедрении и финансировании масштабирования принимается только по результатам evidence.»
              </Text>
            </View>
          </>
        )}

        {section === 'funding' && (
          <>
            <SectionTitle
              kicker="ДЕНЬГИ И ДОГОВОР"
              title="Четыре разных контура — не смешивать"
              body="Пилот, внедрение, венчурное финансирование и федеральная поддержка имеют разные основания."
            />

            {governmentPilotOffer.fundingTracks.map((track) => (
              <View key={track.id} style={styles.trackCard}>
                <View style={styles.trackHeader}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackStatus}>
                    {track.status === 'candidate-route' ? 'ВХОД' : 'ПОСЛЕ PILOT'}
                  </Text>
                </View>
                <Text style={styles.trackRole}>{track.role}</Text>
                <Text style={styles.trackNote}>{track.note}</Text>
              </View>
            ))}

            <SectionTitle
              kicker="КОММЕРЧЕСКАЯ МОДЕЛЬ"
              title="Платформа + production + integration"
              body="Цены не придумываем до измерения фактической себестоимости второго объекта."
            />
            <BulletCard items={governmentPilotOffer.commercialModel} />
          </>
        )}

        {section === 'package' && (
          <>
            <View style={styles.packageHero}>
              <Text style={styles.kicker}>GOVERNMENT DELIVERY MANIFEST</Text>
              <Text style={styles.packageTitle}>С чем мы реально готовы идти к городу</Text>
              <Text style={styles.packageBody}>
                Готовность разделена по стадии переговоров. Красивый demo не заменяет technical approval, а technical approval не означает, что пилот уже доказан.
              </Text>
              <View style={styles.packageCounts}>
                <PackageCount value={deliveryReadiness.readyArtifactCount} label="готово" />
                <PackageCount value={deliveryReadiness.draftArtifactCount} label="draft" />
                <PackageCount value={deliveryReadiness.missingArtifactCount} label="нет" />
              </View>
            </View>

            <SectionTitle
              kicker="СТАДИИ"
              title="Разные gates для разных решений"
              body="Можно проводить demo раньше physical proof, но нельзя выдавать intro/demo readiness за готовность к внедрению или инвестициям."
            />

            {deliveryReadiness.stages.map((stage, index) => (
              <View key={stage.id} style={styles.deliveryStage}>
                <View style={styles.deliveryStageTop}>
                  <View style={styles.deliveryStageNumber}>
                    <Text style={styles.deliveryStageNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.deliveryStageCopy}>
                    <Text style={styles.deliveryStageTitle}>{stage.title}</Text>
                    <Text style={styles.deliveryStageNote}>{stage.note}</Text>
                  </View>
                  <View style={[
                    styles.deliveryBadge,
                    stage.ready && styles.deliveryBadgeReady
                  ]}>
                    <Text style={[
                      styles.deliveryBadgeText,
                      stage.ready && styles.deliveryBadgeTextReady
                    ]}>
                      {stage.ready ? 'READY' : 'BLOCKED'}
                    </Text>
                  </View>
                </View>

                {stage.artifactBlockers.length > 0 && (
                  <View style={styles.deliveryBlock}>
                    <Text style={styles.deliveryBlockTitle}>НЕТ FORMAL ARTIFACTS</Text>
                    {stage.artifactBlockers.map((artifact) => (
                      <Text key={artifact} style={styles.deliveryBlockText}>
                        • {governmentArtifactLabels[artifact]}
                      </Text>
                    ))}
                  </View>
                )}

                {stage.evidenceBlockers.length > 0 && (
                  <View style={styles.deliveryBlock}>
                    <Text style={styles.deliveryBlockTitle}>НЕТ EVIDENCE</Text>
                    {stage.evidenceBlockers.slice(0, 6).map((blocker) => (
                      <Text key={blocker} style={styles.deliveryBlockText}>
                        • {blocker}
                      </Text>
                    ))}
                    {stage.evidenceBlockers.length > 6 && (
                      <Text style={styles.deliveryBlockMore}>
                        + ещё {stage.evidenceBlockers.length - 6}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}

            <SectionTitle
              kicker="FORMAL ARTIFACTS"
              title="Что ещё надо упаковать"
              body="Эти документы не меняют truth state технологии, но нужны для buyer / IT / legal / procurement review."
            />

            {deliveryReadiness.artifacts
              .filter((artifact) => artifact.status !== 'ready')
              .map((artifact) => (
                <View key={artifact.id} style={styles.artifactCard}>
                  <View style={styles.artifactTop}>
                    <Text style={styles.artifactTitle}>{artifact.title}</Text>
                    <Text style={[
                      styles.artifactStatus,
                      artifact.status === 'draft' && styles.artifactStatusDraft
                    ]}>
                      {artifact.status === 'draft' ? 'DRAFT' : 'MISSING'}
                    </Text>
                  </View>
                  <Text style={styles.artifactNote}>{artifact.note}</Text>
                </View>
              ))}
          </>
        )}

        {section === 'decision' && (
          <>
            <View style={styles.decisionHero}>
              <Text style={styles.kicker}>INVESTMENT / SCALE DECISION</Text>
              <Text style={styles.decisionTitle}>
                {decisionReadiness.decisionPackReady
                  ? 'Evidence pack готов к инвестиционному рассмотрению'
                  : 'Инвестиционный пакет ещё не готов'}
              </Text>
              <Text style={styles.decisionBody}>
                Система не принимает инвестиционное решение за город или инвестора. Она только проверяет, достаточно ли доказательств и измеренной экономики для содержательного решения.
              </Text>
            </View>

            <View style={styles.decisionStatusRow}>
              <DecisionStatus
                label="PROOF"
                ready={decisionReadiness.proofReady}
                readyText="Собран"
                blockedText="Не закрыт"
              />
              <DecisionStatus
                label="GOVERNANCE"
                ready={decisionReadiness.governanceReady}
                readyText="Согласован"
                blockedText="Не закрыт"
              />
              <DecisionStatus
                label="ECONOMICS"
                ready={decisionReadiness.economicsReady}
                readyText="Измерена"
                blockedText="НЕ ИЗМЕРЕНО"
              />
            </View>

            <SectionTitle
              kicker="ЧТО БЛОКИРУЕТ РЕШЕНИЕ СЕЙЧАС"
              title="Никаких зелёных статусов вручную"
              body="Каждый пункт исчезает только после появления соответствующего evidence."
            />
            <View style={styles.blockerCard}>
              {decisionReadiness.blockers.map((blocker, index) => (
                <View key={blocker} style={styles.blockerRow}>
                  <Text style={styles.blockerIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={styles.blockerText}>{decisionBlockerLabels[blocker]}</Text>
                </View>
              ))}
            </View>

            <SectionTitle
              kicker="ЧТО ДОЛЖЕН ИЗМЕРИТЬ ПИЛОТ"
              title="Экономика, которую можно защищать перед инвестором"
              body="После реального Old English Court production и эксплуатации мы подставляем измеренные значения, а не benchmark из воздуха."
            />
            {economicsMetrics.map((metric) => (
              <View key={metric.title} style={styles.economicCard}>
                <View style={styles.economicTop}>
                  <Text style={styles.economicTitle}>{metric.title}</Text>
                  <Text style={styles.unmeasured}>НЕ ИЗМЕРЕНО</Text>
                </View>
                <Text style={styles.economicBody}>{metric.body}</Text>
              </View>
            ))}

            <View style={styles.decisionRule}>
              <Text style={styles.statementKicker}>ПОСЛЕ PILOT</Text>
              <Text style={styles.decisionRuleTitle}>Что становится возможно посчитать</Text>
              <Text style={styles.decisionRuleText}>
                Verified object unit cost → district setup + N объектов + integration → annual operations. Модель может дать арифметику следующего района, но не будет автоматически придумывать ROI, турпоток, выручку, параллельность производства или государственное финансирование.
              </Text>
            </View>
          </>
        )}

        {section === 'scale' && (
          <>
            <SectionTitle
              kicker="МАСШТАБИРОВАНИЕ"
              title="Москва → регион → федеральный слой"
              body="Федеральный narrative появляется только после доказанной Москвы."
            />

            {governmentPilotOffer.scale.map((stage, index) => (
              <View key={stage.id} style={styles.scaleRow}>
                <View style={styles.scaleRail}>
                  <View style={styles.scaleDot}><Text style={styles.scaleDotText}>{index + 1}</Text></View>
                  {index < governmentPilotOffer.scale.length - 1 && <View style={styles.scaleLine} />}
                </View>
                <View style={styles.scaleCard}>
                  <Text style={styles.scaleTitle}>{stage.title}</Text>
                  <Text style={styles.scaleOutcome}>{stage.outcome}</Text>
                  <Text style={styles.scaleGate}>Gate: {stage.gate}</Text>
                </View>
              </View>
            ))}

            <View style={styles.federal}>
              <Text style={styles.federalKicker}>FEDERAL ENDGAME</Text>
              <Text style={styles.federalTitle}>Не “московское приложение для всей России”</Text>
              <Text style={styles.federalBody}>
                Предложение федеральному уровню — стандарт подключения регионов, verified heritage infrastructure и journey/orchestration layer, совместимый с региональными и федеральными туристическими каналами.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DecisionStatus({
  label,
  ready,
  readyText,
  blockedText
}: {
  label: string;
  ready: boolean;
  readyText: string;
  blockedText: string;
}) {
  return (
    <View style={[styles.decisionStatus, ready && styles.decisionStatusReady]}>
      <Text style={styles.decisionStatusLabel}>{label}</Text>
      <Text style={[styles.decisionStatusValue, ready && styles.decisionStatusValueReady]}>
        {ready ? readyText : blockedText}
      </Text>
    </View>
  );
}

function PackageCount({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.packageCount}>
      <Text style={styles.packageCountValue}>{value}</Text>
      <Text style={styles.packageCountLabel}>{label}</Text>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({
  kicker,
  title,
  body
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

function BulletCard({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletCard}>
      {items.map((item, index) => (
        <View key={item} style={styles.bulletRow}>
          <Text style={styles.bulletIndex}>{String(index + 1).padStart(2, '0')}</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function NumberedCard({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletCard}>
      {items.map((item, index) => (
        <View key={item} style={styles.askRow}>
          <View style={styles.askNumber}><Text style={styles.askNumberText}>{index + 1}</Text></View>
          <Text style={styles.askText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080a0c' },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2b3036'
  },
  headerCopy: { flex: 1, minWidth: 0, paddingRight: 12 },
  brand: { color: '#b79a68', fontSize: 9, letterSpacing: 1.8, fontWeight: '900' },
  title: { color: '#fff7e8', fontSize: 24, lineHeight: 29, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#92969f', fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 520 },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#171b20',
    borderWidth: 1,
    borderColor: '#30353c'
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#efe7da', fontSize: 25, lineHeight: 27 },
  tabs: { paddingHorizontal: 14, paddingVertical: 10, gap: 7 },
  tab: {
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: '#121519',
    borderWidth: 1,
    borderColor: '#292e34'
  },
  tabActive: { backgroundColor: '#d7bb84', borderColor: '#f0d39b' },
  tabContent: { paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  tabText: { color: '#92969e', fontSize: 10, fontWeight: '900' },
  tabTextActive: { color: '#17130d' },
  content: { padding: 18, paddingBottom: 48 },
  hero: {
    borderRadius: 26,
    padding: 22,
    backgroundColor: '#15191e',
    borderWidth: 1,
    borderColor: '#343941'
  },
  kicker: { color: '#b99b69', fontSize: 9, letterSpacing: 1.5, fontWeight: '900', marginBottom: 8 },
  heroTitle: { color: '#f7f0e4', fontSize: 23, lineHeight: 31, fontWeight: '800' },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metric: { flex: 1, borderRadius: 17, padding: 13, backgroundColor: '#111419', borderWidth: 1, borderColor: '#292e34' },
  metricValue: { color: '#e5c68b', fontSize: 22, fontWeight: '900' },
  metricLabel: { color: '#8d9199', fontSize: 9, lineHeight: 13, marginTop: 4 },
  sectionTitleWrap: { marginTop: 25, marginBottom: 10 },
  sectionTitle: { color: '#f6f0e6', fontSize: 21, lineHeight: 27, fontWeight: '900' },
  sectionBody: { color: '#9ea2aa', fontSize: 13, lineHeight: 20, marginTop: 6 },
  bulletCard: { borderRadius: 20, backgroundColor: '#13171b', borderWidth: 1, borderColor: '#292e34', paddingHorizontal: 15 },
  bulletRow: { flexDirection: 'row', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2a2f35' },
  bulletIndex: { color: '#a98e60', fontSize: 9, fontWeight: '900', width: 32, paddingTop: 3 },
  bulletText: { flex: 1, color: '#c6c9ce', fontSize: 13, lineHeight: 19 },
  readiness: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#15191e',
    borderWidth: 1,
    borderColor: '#3a3f46',
    marginBottom: 14
  },
  readinessValue: { color: '#e6c78b', fontSize: 40, fontWeight: '900' },
  readinessLabel: { color: '#c4c6ca', fontSize: 13, lineHeight: 19, marginTop: 3 },
  readinessWarning: { color: '#d0a66d', fontSize: 11, lineHeight: 17, marginTop: 12 },
  proofCard: { borderRadius: 19, backgroundColor: '#12161a', borderWidth: 1, borderColor: '#292e34', padding: 16, marginBottom: 10 },
  proofTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  proofTitle: { flex: 1, color: '#f0ece4', fontSize: 15, lineHeight: 20, fontWeight: '900' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#333840' },
  statusImplemented: { backgroundColor: '#24362d' },
  statusExternal: { backgroundColor: '#4a3522' },
  statusPartner: { backgroundColor: '#31304a' },
  statusText: { color: '#e8dfd0', fontSize: 8, fontWeight: '900' },
  proofEvidence: { color: '#aeb2b9', fontSize: 12, lineHeight: 18, marginTop: 10 },
  nextGate: { marginTop: 12, borderRadius: 13, backgroundColor: '#0d1013', padding: 12 },
  nextGateLabel: { color: '#987e55', fontSize: 8, letterSpacing: 1.2, fontWeight: '900' },
  nextGateText: { color: '#d7d2c8', fontSize: 11, lineHeight: 17, marginTop: 5 },
  askRow: { flexDirection: 'row', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2a2f35' },
  askNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#242a30', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  askNumberText: { color: '#e0bd7b', fontSize: 10, fontWeight: '900' },
  askText: { flex: 1, color: '#c7cad0', fontSize: 13, lineHeight: 19, paddingTop: 4 },
  statement: { marginTop: 18, borderRadius: 22, padding: 20, backgroundColor: '#d7bb84' },
  statementKicker: { color: '#6f5a31', fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  statementText: { color: '#17130d', fontSize: 16, lineHeight: 24, fontWeight: '800', marginTop: 8 },
  trackCard: { borderRadius: 19, backgroundColor: '#13171b', borderWidth: 1, borderColor: '#292e34', padding: 16, marginBottom: 10 },
  trackHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  trackTitle: { flex: 1, color: '#f1ece2', fontSize: 15, fontWeight: '900' },
  trackStatus: { color: '#c6a86f', fontSize: 8, fontWeight: '900' },
  trackRole: { color: '#d0b57f', fontSize: 11, lineHeight: 17, marginTop: 8, fontWeight: '800' },
  trackNote: { color: '#9ea2aa', fontSize: 12, lineHeight: 18, marginTop: 5 },
  scaleRow: { flexDirection: 'row', alignItems: 'stretch' },
  scaleRail: { width: 42, alignItems: 'center' },
  scaleDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#d7bb84', alignItems: 'center', justifyContent: 'center' },
  scaleDotText: { color: '#17130d', fontSize: 10, fontWeight: '900' },
  scaleLine: { flex: 1, width: 1, minHeight: 70, backgroundColor: '#51462f' },
  scaleCard: { flex: 1, borderRadius: 18, backgroundColor: '#13171b', borderWidth: 1, borderColor: '#292e34', padding: 15, marginBottom: 12 },
  scaleTitle: { color: '#f1ece3', fontSize: 15, fontWeight: '900' },
  scaleOutcome: { color: '#b7bac0', fontSize: 12, lineHeight: 18, marginTop: 6 },
  scaleGate: { color: '#a88d60', fontSize: 10, lineHeight: 15, marginTop: 8, fontWeight: '800' },
  packageHero: { borderRadius: 24, padding: 20, backgroundColor: '#11171a', borderWidth: 1, borderColor: '#304148' },
  packageTitle: { color: '#edf4f5', fontSize: 23, lineHeight: 30, fontWeight: '900' },
  packageBody: { color: '#a5b0b4', fontSize: 12, lineHeight: 19, marginTop: 8 },
  packageCounts: { flexDirection: 'row', gap: 7, marginTop: 15 },
  packageCount: { flex: 1, borderRadius: 14, backgroundColor: '#0b1013', padding: 11, borderWidth: 1, borderColor: '#26333a' },
  packageCountValue: { color: '#c8d9dc', fontSize: 21, fontWeight: '900' },
  packageCountLabel: { color: '#718087', fontSize: 9, marginTop: 3, fontWeight: '800' },
  deliveryStage: { borderRadius: 19, backgroundColor: '#13171b', borderWidth: 1, borderColor: '#292e34', padding: 15, marginBottom: 10 },
  deliveryStageTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  deliveryStageNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#242a30', alignItems: 'center', justifyContent: 'center' },
  deliveryStageNumberText: { color: '#d9b878', fontSize: 10, fontWeight: '900' },
  deliveryStageCopy: { flex: 1, minWidth: 0 },
  deliveryStageTitle: { color: '#f0ece4', fontSize: 14, fontWeight: '900' },
  deliveryStageNote: { color: '#999ea6', fontSize: 11, lineHeight: 17, marginTop: 5 },
  deliveryBadge: { borderRadius: 9, backgroundColor: '#422b25', paddingHorizontal: 8, paddingVertical: 5 },
  deliveryBadgeReady: { backgroundColor: '#21382a' },
  deliveryBadgeText: { color: '#e0a17c', fontSize: 8, fontWeight: '900' },
  deliveryBadgeTextReady: { color: '#9bcca7' },
  deliveryBlock: { marginTop: 11, borderRadius: 12, backgroundColor: '#0d1013', padding: 11 },
  deliveryBlockTitle: { color: '#8c7657', fontSize: 8, letterSpacing: 1, fontWeight: '900', marginBottom: 5 },
  deliveryBlockText: { color: '#b8bbc0', fontSize: 10, lineHeight: 16 },
  deliveryBlockMore: { color: '#c2976d', fontSize: 9, fontWeight: '900', marginTop: 5 },
  artifactCard: { borderRadius: 17, backgroundColor: '#13171b', borderWidth: 1, borderColor: '#292e34', padding: 14, marginBottom: 8 },
  artifactTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  artifactTitle: { flex: 1, color: '#ece8e0', fontSize: 13, fontWeight: '900' },
  artifactStatus: { color: '#db9571', fontSize: 8, fontWeight: '900' },
  artifactStatusDraft: { color: '#d3b06f' },
  artifactNote: { color: '#979ba3', fontSize: 10, lineHeight: 16, marginTop: 6 },
  decisionHero: { borderRadius: 24, padding: 20, backgroundColor: '#15191e', borderWidth: 1, borderColor: '#443a29' },
  decisionTitle: { color: '#f7efe1', fontSize: 23, lineHeight: 30, fontWeight: '900' },
  decisionBody: { color: '#aaaeb5', fontSize: 12, lineHeight: 19, marginTop: 9 },
  decisionStatusRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  decisionStatus: { flex: 1, minHeight: 76, borderRadius: 16, backgroundColor: '#1b1715', borderWidth: 1, borderColor: '#46352c', padding: 11 },
  decisionStatusReady: { backgroundColor: '#17231d', borderColor: '#31503c' },
  decisionStatusLabel: { color: '#8d8176', fontSize: 8, letterSpacing: 1, fontWeight: '900' },
  decisionStatusValue: { color: '#e1ad77', fontSize: 11, lineHeight: 15, fontWeight: '900', marginTop: 8 },
  decisionStatusValueReady: { color: '#9fc9aa' },
  blockerCard: { borderRadius: 20, backgroundColor: '#12161a', borderWidth: 1, borderColor: '#2b3036', paddingHorizontal: 15 },
  blockerRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2a2f35' },
  blockerIndex: { width: 30, color: '#bd865e', fontSize: 9, fontWeight: '900', paddingTop: 3 },
  blockerText: { flex: 1, color: '#c5c7cc', fontSize: 12, lineHeight: 18 },
  economicCard: { borderRadius: 18, backgroundColor: '#13171b', borderWidth: 1, borderColor: '#292e34', padding: 15, marginBottom: 9 },
  economicTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  economicTitle: { flex: 1, color: '#f0ebe2', fontSize: 14, fontWeight: '900' },
  unmeasured: { color: '#d59b68', fontSize: 8, fontWeight: '900' },
  economicBody: { color: '#9fa3aa', fontSize: 11, lineHeight: 17, marginTop: 7 },
  decisionRule: { marginTop: 18, borderRadius: 21, padding: 18, backgroundColor: '#18151d', borderWidth: 1, borderColor: '#443b4c' },
  decisionRuleTitle: { color: '#efe8f2', fontSize: 17, fontWeight: '900', marginTop: 3 },
  decisionRuleText: { color: '#b4abb9', fontSize: 12, lineHeight: 19, marginTop: 7 },
  federal: { marginTop: 12, borderRadius: 23, padding: 20, backgroundColor: '#17131f', borderWidth: 1, borderColor: '#473a58' },
  federalKicker: { color: '#b59aca', fontSize: 9, letterSpacing: 1.4, fontWeight: '900' },
  federalTitle: { color: '#f5eef9', fontSize: 19, lineHeight: 25, fontWeight: '900', marginTop: 6 },
  federalBody: { color: '#bdb2c7', fontSize: 12, lineHeight: 19, marginTop: 8 }
});
