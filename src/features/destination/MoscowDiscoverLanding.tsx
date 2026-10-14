import React from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '../../i18n';
import { tr } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';

/**
 * Photograph: Bestalex, "Moscow. View to Red Square from Zaryadye Park (5).jpg",
 * Wikimedia Commons, CC0 1.0. A solid-colour background remains readable offline.
 * https://commons.wikimedia.org/wiki/File:Moscow._View_to_Red_Square_from_Zaryadye_Park_(5).jpg
 */
export const MOSCOW_CITY_HERO_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Moscow._View_to_Red_Square_from_Zaryadye_Park_%285%29.jpg/960px-Moscow._View_to_Red_Square_from_Zaryadye_Park_%285%29.jpg';

type FeaturedPlace = {
  id: string;
  title: string;
  district: string;
};

type Props = {
  language: AppLanguage;
  savedCount: number;
  visitedCount: number;
  featuredPlaces: FeaturedPlace[];
  onStartTrip: () => void;
  onOpenMap: () => void;
  onOpenWalk: () => void;
  onOpenPlace: (id: string) => void;
  onShowPlanningTools: () => void;
  planningToolsOpen: boolean;
};

export default function MoscowDiscoverLanding({
  language,
  savedCount,
  visitedCount,
  featuredPlaces,
  onStartTrip,
  onOpenMap,
  onOpenWalk,
  onOpenPlace,
  onShowPlanningTools,
  planningToolsOpen
}: Props) {
  return (
    <View style={styles.root}>
      <ImageBackground
        source={{ uri: MOSCOW_CITY_HERO_IMAGE }}
        resizeMode="cover"
        imageStyle={styles.heroImage}
        style={styles.hero}
        accessibilityLabel={tr(language, 'Вид на Красную площадь из парка Зарядье', 'Red Square seen from Zaryadye Park', '从扎里亚季耶公园看红场')}
      >
        <View pointerEvents="none" style={styles.heroShade} />
        <View style={styles.heroTop}>
          <Text style={styles.eyebrow}>MOSCOW / {tr(language, 'ВАШ ГОРОД', 'YOUR CITY', '你的城市')}</Text>
          <Text style={styles.heroWeather}>✦ {tr(language, 'Исследуйте в своём ритме', 'Explore at your own pace', '按自己的节奏探索')}</Text>
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.heroTitle}>
            {tr(language, 'Москва,\nкоторую вы\nзапомните.', 'A Moscow\nto remember.', '一座值得\n铭记的莫斯科。')}
          </Text>
          <Text style={styles.heroSubtitle}>
            {tr(language,
              'Места, прогулки и впечатления — соберите свою историю города.',
              'Places, walks and experiences. Make the city your own.',
              '精选景点、城市漫步与独特体验。')}
          </Text>
          <PhysicalPressable
            accessibilityRole="button"
            accessibilityLabel={tr(language, 'Спланировать поездку', 'Plan my trip', '规划旅行')}
            onPress={onStartTrip}
            style={styles.heroAction}
            contentStyle={styles.heroActionContent}
          >
            <Text style={styles.heroActionText}>{tr(language, 'Спланировать поездку', 'Plan my trip', '规划旅行')}</Text>
            <Text style={styles.heroArrow}>↗</Text>
          </PhysicalPressable>
        </View>
      </ImageBackground>
      <Text style={styles.photoCredit}>© Bestalex / Wikimedia Commons · CC0</Text>

      <View style={styles.sectionHeading}>
        <View style={styles.headingCopy}>
          <Text style={styles.sectionEyebrow}>{tr(language, 'ИДЕИ ДЛЯ ПУТЕШЕСТВИЯ', 'IDEAS FOR YOUR TRIP', '旅行灵感')}</Text>
          <Text style={styles.sectionTitle}>{tr(language, 'Какую Москву откроем?', 'What will you discover?', '探索不同的莫斯科')}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inspirationContent} style={styles.inspirationScroll}>
        <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language, 'Исследовать историю Москвы', 'Discover historic Moscow', '探索莫斯科历史')} onPress={() => featuredPlaces[0] && onOpenPlace(featuredPlaces[0].id)} style={[styles.inspiration, styles.culture]} contentStyle={styles.inspirationInner}>
          <Text style={styles.inspirationIcon}>⌂</Text>
          <View>
            <Text style={styles.inspirationKicker}>{tr(language, 'ОТКРЫТЬ', 'DISCOVER', '发现')}</Text>
            <Text style={styles.inspirationTitle}>{tr(language, 'История и\nархитектура', 'History &\narchitecture', '历史与建筑')}</Text>
          </View>
          <Text style={styles.inspirationArrow}>↗</Text>
        </PhysicalPressable>
        <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language, 'Добавить рестораны и кафе в поездку', 'Plan food and cafes', '安排餐饮')} onPress={onStartTrip} style={[styles.inspiration, styles.food]} contentStyle={styles.inspirationInner}>
          <Text style={styles.inspirationIcon}>◈</Text>
          <View>
            <Text style={styles.inspirationKicker}>{tr(language, 'ПОПРОБОВАТЬ', 'SAVOUR', '品味')}</Text>
            <Text style={styles.inspirationTitle}>{tr(language, 'Еда и\nатмосфера', 'Food &\natmosphere', '美食与氛围')}</Text>
          </View>
          <Text style={styles.inspirationArrow}>↗</Text>
        </PhysicalPressable>
        <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language, 'Открыть маршрут прогулки', 'Open a walking route', '打开步行路线')} onPress={onOpenWalk} style={[styles.inspiration, styles.walk]} contentStyle={styles.inspirationInner}>
          <Text style={styles.inspirationIcon}>✳</Text>
          <View>
            <Text style={styles.inspirationKicker}>{tr(language, 'ПРОГУЛЯТЬСЯ', 'WANDER', '漫步')}</Text>
            <Text style={styles.inspirationTitle}>{tr(language, 'Улицы и\nоткрытия', 'Streets &\ndiscovery', '街巷探索')}</Text>
          </View>
          <Text style={styles.inspirationArrow}>↗</Text>
        </PhysicalPressable>
      </ScrollView>

      <View style={styles.savedPanel}>
        <View style={styles.savedHead}>
          <View>
            <Text style={styles.sectionEyebrow}>{tr(language, 'МОЯ МОСКВА', 'MY MOSCOW', '我的莫斯科')}</Text>
            <Text style={styles.savedTitle}>{tr(language, 'Ваша история города', 'Your city story', '你的城市故事')}</Text>
          </View>
          <Text style={styles.savedSymbol}>✳</Text>
        </View>
        <View style={styles.savedStats}>
          <View style={styles.savedStat}>
            <Text style={styles.savedNumber}>{savedCount}</Text>
            <Text style={styles.savedLabel}>{tr(language, 'в избранном', 'saved places', '收藏')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.savedStat}>
            <Text style={styles.savedNumber}>{visitedCount}</Text>
            <Text style={styles.savedLabel}>{tr(language, 'уже видели', 'seen places', '已到访')}</Text>
          </View>
        </View>
        <PhysicalPressable accessibilityRole="button" accessibilityLabel={tr(language, 'Посмотреть карту Москвы', 'Explore the city map', '查看地图')} onPress={onOpenMap} style={styles.mapAction} contentStyle={styles.mapActionContent}>
          <Text style={styles.mapActionText}>{tr(language, 'Исследовать на карте', 'Explore on the map', '在地图上探索')}</Text>
          <Text style={styles.mapActionArrow}>↗</Text>
        </PhysicalPressable>
      </View>

      {featuredPlaces.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionEyebrow}>{tr(language, 'С ЧЕГО НАЧАТЬ', 'WHERE TO BEGIN', '从这里开始')}</Text>
          <Text style={styles.sectionTitle}>{tr(language, 'Первые открытия', 'First discoveries', '初次探索')}</Text>
          {featuredPlaces.slice(0, 2).map((place, index) => (
            <PhysicalPressable key={place.id} accessibilityRole="button" accessibilityLabel={place.title} onPress={() => onOpenPlace(place.id)} style={styles.featuredCard} contentStyle={styles.featuredContent}>
              <View style={[styles.featuredNumber, index === 1 && styles.featuredNumberAlt]}>
                <Text style={styles.featuredNumberText}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <View style={styles.featuredCopy}>
                <Text style={styles.featuredTitle}>{place.title}</Text>
                <Text style={styles.featuredDistrict}>{place.district}</Text>
              </View>
              <Text style={styles.featuredArrow}>↗</Text>
            </PhysicalPressable>
          ))}
        </View>
      )}

      <PhysicalPressable
        accessibilityRole="button"
        accessibilityLabel={tr(language, 'Открыть все возможности планирования', 'Show all planning tools', '显示全部规划工具')}
        onPress={onShowPlanningTools}
        style={styles.toolsToggle}
        contentStyle={styles.toolsContent}
      >
        <Text style={styles.toolsTitle}>{planningToolsOpen
          ? tr(language, 'Свернуть дополнительные возможности', 'Hide planning tools', '收起规划工具')
          : tr(language, 'Больше маршрутов и возможностей', 'More routes and planning tools', '更多路线与规划工具')}
        </Text>
        <Text style={styles.toolsArrow}>{planningToolsOpen ? '−' : '＋'}</Text>
      </PhysicalPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginBottom: 18 },
  // ImageBackground needs explicit layout dimensions: minHeight alone can leave its internal image a thin strip on Web.
  hero: { height: 420, minHeight: 420, justifyContent: 'space-between', overflow: 'hidden', borderRadius: 30, backgroundColor: '#283e3e', padding: 23 }, 
  heroImage: { borderRadius: 30, width: '100%', height: '100%' },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12,21,23,0.57)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  eyebrow: { color: '#fff5df', fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  heroWeather: { color: '#f4e3be', fontSize: 10, fontWeight: '500', maxWidth: 138, textAlign: 'right' },
  heroBottom: { marginTop: 84 },
  heroTitle: { color: '#fffaf0', fontSize: 40, lineHeight: 43, letterSpacing: -1.6, fontWeight: '700', marginBottom: 13 },
  heroSubtitle: { color: '#f3ebdf', fontSize: 15, lineHeight: 21, maxWidth: 315, marginBottom: 23 },
  heroAction: { borderRadius: 16, backgroundColor: '#f4e8d1', minHeight: 55, maxWidth: 320 },
  heroActionContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  heroActionText: { color: '#202b2b', fontSize: 15, fontWeight: '700' },
  heroArrow: { color: '#202b2b', fontSize: 21, fontWeight: '500' },
  photoCredit: { color: '#8e9795', fontSize: 10, marginTop: 7, textAlign: 'right', marginRight: 6 },
  sectionHeading: { marginTop: 27, marginBottom: 14 },
  headingCopy: { flex: 1 },
  sectionEyebrow: { color: '#b8a27e', fontWeight: '700', fontSize: 10, letterSpacing: 1.25, marginBottom: 7 },
  sectionTitle: { color: '#f4f1e9', fontSize: 24, letterSpacing: -0.4, lineHeight: 29, fontWeight: '700' },
  inspirationScroll: { marginHorizontal: -18 },
  inspirationContent: { paddingHorizontal: 18, paddingBottom: 6, gap: 11 },
  inspiration: { width: 190, minHeight: 210, borderRadius: 23, overflow: 'hidden' },
  inspirationInner: { flex: 1, padding: 17, alignItems: 'flex-start', justifyContent: 'space-between' },
  culture: { backgroundColor: '#70533d' },
  food: { backgroundColor: '#38585a' },
  walk: { backgroundColor: '#626b55' },
  inspirationIcon: { color: '#f8e6ca', fontSize: 34, fontWeight: '400' },
  inspirationKicker: { color: '#d4d6ce', fontSize: 9, letterSpacing: 1.4, fontWeight: '700', marginBottom: 7 },
  inspirationTitle: { color: '#fff8ef', fontSize: 21, lineHeight: 24, fontWeight: '700' },
  inspirationArrow: { color: '#fff1df', fontSize: 22, alignSelf: 'flex-end' },
  savedPanel: { marginTop: 27, backgroundColor: '#1b2525', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: '#35413e' },
  savedHead: { flexDirection: 'row', justifyContent: 'space-between' },
  savedTitle: { color: '#f6f1e8', fontWeight: '700', fontSize: 21, lineHeight: 26 },
  savedSymbol: { fontSize: 32, color: '#e5b981', fontWeight: '400' },
  savedStats: { flexDirection: 'row', marginTop: 20, marginBottom: 17, alignItems: 'center' },
  savedStat: { flex: 1 },
  savedNumber: { color: '#f4e1b9', fontSize: 31, fontWeight: '600' },
  savedLabel: { color: '#adb9b3', fontSize: 12, marginTop: 2 },
  statDivider: { height: 40, width: 1, backgroundColor: '#3b4e47', marginHorizontal: 18 },
  mapAction: { minHeight: 46, backgroundColor: '#31453e', borderRadius: 14 },
  mapActionContent: { paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mapActionText: { color: '#f0e9da', fontSize: 13, fontWeight: '700' },
  mapActionArrow: { color: '#f0e9da', fontSize: 17 },
  featuredSection: { marginTop: 28, marginBottom: 16 },
  featuredCard: { minHeight: 82, marginTop: 11, borderRadius: 18, backgroundColor: '#192122', borderWidth: 1, borderColor: '#2d3838' },
  featuredContent: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12 },
  featuredNumber: { width: 53, height: 53, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#594b3d' },
  featuredNumberAlt: { backgroundColor: '#46605c' },
  featuredNumberText: { color: '#f4ddae', fontSize: 22, fontWeight: '600' },
  featuredCopy: { flex: 1 },
  featuredTitle: { color: '#f2ede4', fontSize: 15, fontWeight: '700' },
  featuredDistrict: { color: '#9ca9a5', marginTop: 5, fontSize: 12 },
  featuredArrow: { color: '#f4e2bd', fontSize: 19 },
  toolsToggle: { minHeight: 56, marginTop: 10, borderRadius: 17, borderWidth: 1, borderColor: '#3a4843' },
  toolsContent: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolsTitle: { fontSize: 13, color: '#e4dfd2', fontWeight: '600', flexShrink: 1 },
  toolsArrow: { fontSize: 20, color: '#e3c497', marginLeft: 8 }
});
