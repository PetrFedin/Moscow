import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { buildGovernmentPartnerDataRoom } from './governmentPartnerDataRoom';

export default function GovernmentPartnerDataRoomPanel() {
  const room = useMemo(() => buildGovernmentPartnerDataRoom(), []);

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>PARTNER / INVESTOR DATA ROOM</Text>
        <Text style={styles.title}>Что можно отправлять и защищать уже сейчас</Text>
        <Text style={styles.body}>
          Один и тот же проект выглядит по-разному для первой городской встречи,
          technical approval, инвестора и федерального масштаба. Статус пакета
          берётся из Government Delivery Manifest — вручную зелёным его сделать нельзя.
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summary}>
            <Text style={styles.summaryValue}>{room.currentSendablePackages.length}</Text>
            <Text style={styles.summaryLabel}>пакета READY</Text>
          </View>
          <View style={styles.summary}>
            <Text style={styles.summaryValue}>{room.blockedPackages.length}</Text>
            <Text style={styles.summaryLabel}>пакета BLOCKED</Text>
          </View>
        </View>
      </View>

      {room.packages.map((pkg, index) => (
        <View key={pkg.id} style={[styles.card, pkg.ready && styles.cardReady]}>
          <View style={styles.cardTop}>
            <View style={[styles.number, pkg.ready && styles.numberReady]}>
              <Text style={[styles.numberText, pkg.ready && styles.numberTextReady]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{pkg.title}</Text>
              <Text style={styles.cardCount}>
                {pkg.readyArtifactCount}/{pkg.totalArtifactCount} artifacts ready
              </Text>
            </View>
            <View style={[styles.badge, pkg.ready && styles.badgeReady]}>
              <Text style={[styles.badgeText, pkg.ready && styles.badgeTextReady]}>
                {pkg.ready ? 'READY' : 'BLOCKED'}
              </Text>
            </View>
          </View>

          <View style={styles.decision}>
            <Text style={styles.label}>РЕШЕНИЕ, КОТОРОЕ ЗАЩИЩАЕМ</Text>
            <Text style={styles.decisionText}>{pkg.decision}</Text>
          </View>

          <View style={styles.artifacts}>
            <Text style={styles.label}>КОМПЛЕКТ</Text>
            {pkg.artifacts.map((artifact) => (
              <View key={artifact.id} style={styles.artifactRow}>
                <Text style={[
                  styles.artifactStatus,
                  artifact.status === 'ready' && styles.artifactStatusReady
                ]}>
                  {artifact.status === 'ready' ? '●' : '○'}
                </Text>
                <View style={styles.artifactCopy}>
                  <Text style={styles.artifactTitle}>{artifact.title}</Text>
                  <Text style={styles.artifactMeta}>
                    {artifact.status.toUpperCase()} · {artifact.refs.length} refs
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {!pkg.ready && (
            <View style={styles.blockers}>
              <Text style={styles.blockerLabel}>ПОЧЕМУ ПОКА BLOCKED</Text>
              {pkg.artifactBlockers.map((blocker) => (
                <Text key={`artifact:${blocker}`} style={styles.blockerText}>
                  • artifact: {blocker}
                </Text>
              ))}
              {pkg.evidenceBlockers.slice(0, 6).map((blocker) => (
                <Text key={`evidence:${blocker}`} style={styles.blockerText}>
                  • evidence: {blocker}
                </Text>
              ))}
              {pkg.evidenceBlockers.length > 6 && (
                <Text style={styles.blockerMore}>
                  + ещё {pkg.evidenceBlockers.length - 6} evidence blockers
                </Text>
              )}
            </View>
          )}

          <View style={styles.boundary}>
            <Text style={styles.boundaryLabel}>НЕ ПЕРЕПУТАТЬ</Text>
            <Text style={styles.boundaryText}>{pkg.doNotClaim}</Text>
          </View>
        </View>
      ))}

      <View style={styles.next}>
        <Text style={styles.nextKicker}>ПЕРВАЯ ВСТРЕЧА · CURRENT SENDABLE</Text>
        <Text style={styles.nextTitle}>Intro + technical pack уже можно защищать</Text>
        <Text style={styles.nextText}>{room.firstMeetingGoal}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 20 },
  hero: {
    borderRadius: 21,
    padding: 17,
    backgroundColor: '#10171b',
    borderWidth: 1,
    borderColor: '#31434c'
  },
  kicker: {
    color: '#82a8b5',
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: '900'
  },
  title: {
    marginTop: 6,
    color: '#eef6f7',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900'
  },
  body: {
    marginTop: 7,
    color: '#9faeb3',
    fontSize: 11,
    lineHeight: 17
  },
  summaryRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8
  },
  summary: {
    flex: 1,
    padding: 11,
    borderRadius: 13,
    backgroundColor: '#0a1013',
    borderWidth: 1,
    borderColor: '#28363c'
  },
  summaryValue: {
    color: '#bdd6dc',
    fontSize: 21,
    fontWeight: '900'
  },
  summaryLabel: {
    color: '#72858c',
    fontSize: 8,
    marginTop: 3,
    fontWeight: '800'
  },
  card: {
    marginTop: 10,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#141518',
    borderWidth: 1,
    borderColor: '#3b3031'
  },
  cardReady: {
    backgroundColor: '#121914',
    borderColor: '#3b5943'
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9
  },
  number: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#2b292b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  numberReady: { backgroundColor: '#d7bb84' },
  numberText: { color: '#a4a0a3', fontSize: 9, fontWeight: '900' },
  numberTextReady: { color: '#17130d' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: {
    color: '#eee9e1',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900'
  },
  cardCount: {
    marginTop: 4,
    color: '#858a91',
    fontSize: 8,
    fontWeight: '800'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#432b2b'
  },
  badgeReady: { backgroundColor: '#24412d' },
  badgeText: { color: '#dda0a0', fontSize: 8, fontWeight: '900' },
  badgeTextReady: { color: '#a7d1ae' },
  decision: {
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#0d1013'
  },
  label: {
    color: '#7e858e',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  decisionText: {
    marginTop: 5,
    color: '#c9cdd2',
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '700'
  },
  artifacts: {
    marginTop: 12
  },
  artifactRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2d31'
  },
  artifactStatus: {
    color: '#a37070',
    fontSize: 10,
    width: 12
  },
  artifactStatusReady: { color: '#7ca987' },
  artifactCopy: { flex: 1 },
  artifactTitle: {
    color: '#c5c8cc',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700'
  },
  artifactMeta: {
    marginTop: 2,
    color: '#696f76',
    fontSize: 7,
    lineHeight: 10,
    fontWeight: '800'
  },
  blockers: {
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#1a1213',
    borderWidth: 1,
    borderColor: '#3f2d30'
  },
  blockerLabel: {
    color: '#b57d82',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  blockerText: {
    color: '#b9a7aa',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4
  },
  blockerMore: {
    color: '#d09980',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 5
  },
  boundary: {
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#34373a'
  },
  boundaryLabel: {
    color: '#9b8767',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  boundaryText: {
    marginTop: 4,
    color: '#9f9a92',
    fontSize: 9,
    lineHeight: 14
  },
  next: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#d7bb84'
  },
  nextKicker: {
    color: '#66532f',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1
  },
  nextTitle: {
    marginTop: 5,
    color: '#17130d',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900'
  },
  nextText: {
    marginTop: 6,
    color: '#41341f',
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '700'
  }
});
