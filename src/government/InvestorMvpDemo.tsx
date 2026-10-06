import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import PhysicalPressable from '../ui/PhysicalPressable';
import { investorMvpOffer } from './investorMvpOffer';

type Section = 'product' | 'deliverables' | 'money' | 'acceptance';

const labels: Record<Section, string> = {
  product: 'Продукт',
  deliverables: 'Город получает',
  money: 'За что платит',
  acceptance: 'Приёмка'
};

export default function InvestorMvpDemo({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<Section>('product');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>MOSCOW · INVESTOR MVP</Text>
          <Text style={styles.title}>{investorMvpOffer.title}</Text>
          <Text style={styles.subtitle}>{investorMvpOffer.subtitle}</Text>
        </View>
        <PhysicalPressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть investor MVP"
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
        {(Object.keys(labels) as Section[]).map((item) => (
          <PhysicalPressable
            key={item}
            style={[styles.tab, section === item && styles.tabActive]}
            contentStyle={styles.tabContent}
            onPress={() => setSection(item)}
          >
            <Text style={[styles.tabText, section === item && styles.tabTextActive]}>
              {labels[item]}
            </Text>
          </PhysicalPressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {section === 'product' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>ЧТО МЫ ПРОДАЁМ</Text>
              <Text style={styles.heroTitle}>{investorMvpOffer.thesis}</Text>
            </View>

            <View style={styles.path}>
              {investorMvpOffer.travelerPath.map((item, index) => (
                <View key={item} style={styles.pathRow}>
                  <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
                  <Text style={styles.pathText}>{item}</Text>
                </View>
              ))}
            </View>

            <BlockTitle
              kicker="PILOT SCOPE"
              title="Варварка — Зарядье"
              body="Небольшой, проверяемый контур, на котором можно измерить ценность, стоимость и повторяемость."
            />
            <BulletList items={investorMvpOffer.pilotScope} />

            <BlockTitle
              kicker="НЕ В MVP"
              title="Что сознательно не покупаем сейчас"
              body="Всё, что не помогает доказать туристический путь, production economics или городскую эксплуатацию, остаётся за пределами первого контракта."
            />
            <BulletList items={investorMvpOffer.notInMvp} muted />
          </>
        )}

        {section === 'deliverables' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>ПОСТАВЛЯЕМЫЙ РЕЗУЛЬТАТ</Text>
              <Text style={styles.heroTitle}>Город получает не презентацию, а работающий набор активов.</Text>
            </View>

            {investorMvpOffer.cityDeliverables.map((item, index) => (
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
              <Text style={styles.kicker}>КОММЕРЧЕСКАЯ ЛОГИКА</Text>
              <Text style={styles.heroTitle}>Платёж привязан к поставляемому слою и его приёмке.</Text>
            </View>

            {investorMvpOffer.paymentLayers.map((item) => (
              <View key={item.id} style={styles.paymentCard}>
                <Text style={styles.paymentTitle}>{item.title}</Text>
                <Text style={styles.paymentLabel}>ЗА ЧТО ПЛАТИТ ГОРОД</Text>
                <Text style={styles.paymentBody}>{item.paysFor}</Text>
                <Text style={styles.paymentLabel}>КАК ПРИНИМАЕТСЯ</Text>
                <Text style={styles.paymentAccept}>{item.acceptedBy}</Text>
              </View>
            ))}

            <BlockTitle
              kicker="ФОРМУЛА МАСШТАБА"
              title="Цена следующего этапа строится из измеренных компонент"
              body="Никаких выдуманных TAM/ROI вместо себестоимости и фактического production evidence."
            />
            <BulletList items={investorMvpOffer.scaleFormula} />
          </>
        )}

        {section === 'acceptance' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>КРИТЕРИИ ПРИЁМКИ</Text>
              <Text style={styles.heroTitle}>Пилот должен закрыть неопределённости, а не создать ещё одну демонстрацию.</Text>
            </View>

            <BulletList items={investorMvpOffer.acceptance} />

            <View style={styles.decision}>
              <Text style={styles.decisionKicker}>СЛЕДУЮЩЕЕ РЕШЕНИЕ</Text>
              <Text style={styles.decisionText}>{investorMvpOffer.firstDecision}</Text>
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
