import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppLanguage } from '../i18n';
import {
  demoMarketplaceIntent,
  demoMarketplaceRanking,
  marketplaceDemoCopy
} from './demandRankingDemo';

export default function MarketplaceDemandDemo({ language }: { language: AppLanguage }) {
  const copy = marketplaceDemoCopy[language];

  return (
    <View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{copy.kicker}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

      <View style={styles.intentBox}>
        <Text style={styles.sectionLabel}>{copy.intent}</Text>
        <Text style={styles.intentTitle}>{demoMarketplaceIntent.kind}</Text>
        <Text style={styles.intentMeta}>
          required={demoMarketplaceIntent.requiredTags.join(', ')}
          {' · '}
          preferred={demoMarketplaceIntent.preferredTags.join(', ')}
          {' · '}
          maxDistance={demoMarketplaceIntent.maximumDistanceMeters}m
          {' · '}
          freeWindow={demoMarketplaceIntent.availableMinutes}m
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.organic}</Text>
        <View style={styles.list}>
          {demoMarketplaceRanking.organic.map((item) => (
            <View key={item.candidate.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.cardTitle}>{item.candidate.title}</Text>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{item.organicRank}</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {copy.score}: {item.organicScore.toFixed(3)}
                {' · '}
                {item.candidate.distanceMeters}m
                {' · '}
                {item.candidate.availability.state}
              </Text>
              <Text style={styles.reasons}>{item.reasons.join(' · ')}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.sponsored}</Text>
        <View style={styles.list}>
          {demoMarketplaceRanking.sponsored.length === 0 ? (
            <Text style={styles.empty}>{copy.noSponsored}</Text>
          ) : (
            demoMarketplaceRanking.sponsored.map((item) => (
              <View key={item.candidate.id} style={[styles.card, styles.sponsoredCard]}>
                <View style={styles.topRow}>
                  <Text style={styles.cardTitle}>{item.candidate.title}</Text>
                  <View style={styles.sponsoredBadge}>
                    <Text style={styles.sponsoredText}>{item.disclosureLabel}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {copy.rank}: #{item.organicRank}
                  {' · '}
                  {copy.score}: {item.organicScore.toFixed(3)}
                </Text>
                <Text style={styles.reasons}>
                  sponsorContract={item.sponsorContractRef}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{copy.excluded}</Text>
        <View style={styles.list}>
          {demoMarketplaceRanking.excluded.map((item) => (
            <View key={item.candidateId} style={styles.excludedCard}>
              <Text style={styles.excludedTitle}>{item.candidateId}</Text>
              <Text style={styles.meta}>{item.reason}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.policyBox}>
        <Text style={styles.sectionLabel}>{copy.policy}</Text>
        <Text style={styles.policyText}>
          {demoMarketplaceRanking.policyId} · v{demoMarketplaceRanking.policyVersion}
        </Text>
        <Text style={styles.policyText}>
          sponsorship ≠ organic boost · maxSponsored=1
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#121518',
    borderWidth: 1,
    borderColor: '#393226'
  },
  kicker: {
    color: '#c8a96a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  title: {
    color: '#f4eee4',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 7
  },
  body: {
    color: '#aeb4b9',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8
  },
  intentBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#15191c'
  },
  section: { marginTop: 14 },
  sectionLabel: {
    color: '#c8a96a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1
  },
  intentTitle: {
    color: '#eee8de',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 5
  },
  intentMeta: {
    color: '#949ba1',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5
  },
  list: { gap: 8, marginTop: 9 },
  card: {
    padding: 13,
    borderRadius: 15,
    backgroundColor: '#101316',
    borderWidth: 1,
    borderColor: '#2a2f34'
  },
  sponsoredCard: {
    borderColor: '#745f35',
    backgroundColor: '#16130f'
  },
  topRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start'
  },
  cardTitle: {
    flex: 1,
    color: '#ece6dc',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900'
  },
  rankBadge: {
    minWidth: 34,
    borderRadius: 10,
    backgroundColor: '#1c2124',
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  rankText: {
    color: '#d3b36f',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center'
  },
  sponsoredBadge: {
    borderRadius: 9,
    backgroundColor: '#362c12',
    paddingHorizontal: 7,
    paddingVertical: 4
  },
  sponsoredText: {
    color: '#f4d98f',
    fontSize: 7,
    fontWeight: '900'
  },
  meta: {
    color: '#9da4aa',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6
  },
  reasons: {
    color: '#7f878d',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 5
  },
  excludedCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#171416',
    borderWidth: 1,
    borderColor: '#4b373a'
  },
  excludedTitle: {
    color: '#e4c0c5',
    fontSize: 11,
    fontWeight: '900'
  },
  empty: {
    color: '#8f969b',
    fontSize: 11,
    lineHeight: 16
  },
  policyBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#15120f',
    borderWidth: 1,
    borderColor: '#665532'
  },
  policyText: {
    color: '#d9c9ab',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5
  }
});
