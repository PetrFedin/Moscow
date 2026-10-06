import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import PhysicalPressable from '../ui/PhysicalPressable';
import {
  getGovernmentOwnerRouteCopy,
  governmentOwnerRouteDurationSeconds,
  type GovernmentOwnerRouteDestination
} from './governmentOwnerRoute.ts';

function formatDuration(seconds: number, language: AppLanguage) {
  const minutes = Math.ceil(seconds / 60);
  if (language === 'zh') return `${minutes} 分钟`;
  if (language === 'en') return `${minutes} min`;
  return `${minutes} мин`;
}

export default function GovernmentOwnerRoute({
  language,
  onOpenDestination
}: {
  language: AppLanguage;
  onOpenDestination: (destination: GovernmentOwnerRouteDestination) => void;
}) {
  const copy = useMemo(() => getGovernmentOwnerRouteCopy(language), [language]);
  const [index, setIndex] = useState(0);
  const step = copy.steps[index]!;
  const totalSeconds = governmentOwnerRouteDurationSeconds();
  const elapsedSeconds = copy.steps
    .slice(0, index)
    .reduce((sum, item) => sum + item.durationSeconds, 0);
  const progress = (index + 1) / copy.steps.length;

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>{copy.durationLabel}</Text>
            <Text style={styles.metaValue}>{formatDuration(totalSeconds, language)}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>{copy.progressLabel}</Text>
            <Text style={styles.metaValue}>{index + 1} / {copy.steps.length}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>ELAPSED</Text>
            <Text style={styles.metaValue}>{formatDuration(elapsedSeconds, language)}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      <View style={styles.stepCard}>
        <View style={styles.stepTop}>
          <View style={styles.stepCopy}>
            <Text style={styles.stepKicker}>{step.kicker}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{formatDuration(step.durationSeconds, language)}</Text>
          </View>
        </View>

        <Block label={copy.executiveQuestionLabel} text={step.executiveQuestion} strong />
        <Block label={copy.answerLabel} text={step.answer} />

        <View style={styles.valueGrid}>
          <ValueCard label={copy.cityValueLabel} text={step.cityValue} />
          <ValueCard label={copy.travelerValueLabel} text={step.travelerValue} />
          <ValueCard label={copy.partnerValueLabel} text={step.partnerValue} />
        </View>

        <View style={styles.proofBox}>
          <Text style={styles.proofLabel}>{copy.proofLabel}</Text>
          <Text style={styles.proofText}>{step.proof}</Text>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={copy.openEvidenceLabel}
            style={styles.proofButton}
            contentStyle={styles.proofButtonContent}
            onPress={() => onOpenDestination(step.destination)}
          >
            <Text style={styles.proofButtonText}>{copy.openEvidenceLabel} →</Text>
          </PhysicalPressable>
        </View>
      </View>

      <View style={styles.navigation}>
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={copy.previousLabel}
          style={[styles.navButton, index === 0 && styles.navButtonDisabled]}
          contentStyle={styles.navButtonContent}
          onPress={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
        >
          <Text style={styles.navButtonText}>← {copy.previousLabel}</Text>
        </PhysicalPressable>

        <View style={styles.dotRow}>
          {copy.steps.map((item, dotIndex) => (
            <PhysicalPressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${copy.progressLabel} ${dotIndex + 1}`}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
              contentStyle={styles.dotContent}
              onPress={() => setIndex(dotIndex)}
            >
              <Text style={styles.dotText}>{dotIndex + 1}</Text>
            </PhysicalPressable>
          ))}
        </View>

        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel={index === copy.steps.length - 1 ? copy.finishLabel : copy.nextLabel}
          style={styles.navPrimary}
          contentStyle={styles.navButtonContent}
          onPress={() => {
            if (index === copy.steps.length - 1) {
              onOpenDestination('acceptance');
              return;
            }
            setIndex((value) => Math.min(copy.steps.length - 1, value + 1));
          }}
        >
          <Text style={styles.navPrimaryText}>
            {index === copy.steps.length - 1 ? copy.finishLabel : copy.nextLabel} →
          </Text>
        </PhysicalPressable>
      </View>

      <View style={styles.finalDecision}>
        <Text style={styles.finalKicker}>{copy.finalDecisionTitle}</Text>
        <Text style={styles.finalText}>{copy.finalDecisionBody}</Text>
      </View>
    </View>
  );
}

function Block({ label, text, strong = false }: { label: string; text: string; strong?: boolean }) {
  return (
    <View style={[styles.block, strong && styles.blockStrong]}>
      <Text style={styles.blockLabel}>{label}</Text>
      <Text style={[styles.blockText, strong && styles.blockTextStrong]}>{text}</Text>
    </View>
  );
}

function ValueCard({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.valueCard}>
      <Text style={styles.valueLabel}>{label}</Text>
      <Text style={styles.valueText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: '#121518',
    borderWidth: 1,
    borderColor: '#393226'
  },
  kicker: { color: '#c8a96a', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#f5efe4', fontSize: 24, lineHeight: 31, fontWeight: '900', marginTop: 8 },
  subtitle: { color: '#aeb3b8', fontSize: 13, lineHeight: 20, marginTop: 9 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  metaCard: { minWidth: 120, flexGrow: 1, padding: 11, borderRadius: 13, backgroundColor: '#171b1e' },
  metaLabel: { color: '#7f878d', fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  metaValue: { color: '#e6dcc8', fontSize: 15, fontWeight: '900', marginTop: 4 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: '#252a2e', marginTop: 14, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: '#d3b36f' },

  stepCard: { marginTop: 14, borderRadius: 22, padding: 18, backgroundColor: '#101316', borderWidth: 1, borderColor: '#2a2f34' },
  stepTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepCopy: { flex: 1 },
  stepKicker: { color: '#c8a96a', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  stepTitle: { color: '#f1ebe1', fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 7 },
  timeBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#2b2417' },
  timeBadgeText: { color: '#ead39c', fontSize: 8, fontWeight: '900' },

  block: { marginTop: 12, padding: 14, borderRadius: 15, backgroundColor: '#171b1e' },
  blockStrong: { backgroundColor: '#171411', borderWidth: 1, borderColor: '#4f4127' },
  blockLabel: { color: '#8e969c', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  blockText: { color: '#d5dade', fontSize: 13, lineHeight: 20, marginTop: 6 },
  blockTextStrong: { color: '#f1e6d1', fontSize: 15, lineHeight: 22, fontWeight: '800' },

  valueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  valueCard: { minWidth: 210, flexBasis: '31%', flexGrow: 1, padding: 13, borderRadius: 15, backgroundColor: '#111417', borderWidth: 1, borderColor: '#272c31' },
  valueLabel: { color: '#c8a96a', fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  valueText: { color: '#bdc3c8', fontSize: 11, lineHeight: 17, marginTop: 6 },

  proofBox: { marginTop: 12, borderRadius: 16, padding: 14, backgroundColor: '#15120f', borderWidth: 1, borderColor: '#665532' },
  proofLabel: { color: '#c8a96a', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  proofText: { color: '#d7ccba', fontSize: 11, lineHeight: 17, marginTop: 6 },
  proofButton: { marginTop: 10, minHeight: 40, borderRadius: 12, backgroundColor: '#d3b36f' },
  proofButtonContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  proofButtonText: { color: '#17130c', fontSize: 10, fontWeight: '900' },

  navigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  navButton: { minHeight: 42, borderRadius: 13, backgroundColor: '#15181b', borderWidth: 1, borderColor: '#2a2f34' },
  navButtonDisabled: { opacity: 0.4 },
  navButtonContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  navButtonText: { color: '#c5cacf', fontSize: 10, fontWeight: '900' },
  navPrimary: { minHeight: 42, borderRadius: 13, backgroundColor: '#d3b36f' },
  navPrimaryText: { color: '#17130c', fontSize: 10, fontWeight: '900' },
  dotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1, justifyContent: 'center' },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#171b1e', borderWidth: 1, borderColor: '#2a2f34' },
  dotActive: { backgroundColor: '#d3b36f', borderColor: '#e5c987' },
  dotContent: { alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#9da4a9', fontSize: 8, fontWeight: '900' },

  finalDecision: { marginTop: 16, borderRadius: 18, padding: 17, backgroundColor: '#d3b36f' },
  finalKicker: { color: '#55451f', fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  finalText: { color: '#17130c', fontSize: 15, lineHeight: 22, fontWeight: '900', marginTop: 7 }
});
