import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { citywideCategories, type CitywideCategoryId } from '../../travel/citywideDiscovery';
import type { AppLanguage } from '../../i18n';
import PhysicalPressable from '../../ui/PhysicalPressable';

export default function CitywideDiscoveryCard({
  language,
  onPlan
}: {
  language: AppLanguage;
  onPlan: (categoryId?: CitywideCategoryId) => void;
}) {
  const [selected, setSelected] = useState<CitywideCategoryId | undefined>();

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>MOSCOW CITY PLANNER</Text>
      <Text style={styles.title}>
        {language === 'ru'
          ? 'Соберите свой день в Москве'
          : language === 'zh'
            ? '规划你在莫斯科的一天'
            : 'Build your day in Moscow'}
      </Text>
      <Text style={styles.body}>
        {language === 'ru'
          ? 'Музей утром, выставка после обеда, ресторан перед театром, бар после спектакля — или совсем другой день. План строится вокруг ваших интересов, времени, билетов и броней.'
          : language === 'zh'
            ? '博物馆、展览、餐厅、剧院、酒吧、公园与城市活动可以组合成属于你的行程，并保留门票和预订。'
            : 'Museums, exhibitions, restaurants, theatres, bars, parks and city events can be combined around your time, tickets and reservations.'}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {citywideCategories.map((category) => {
          const active = selected === category.id;
          return (
            <PhysicalPressable
              key={category.id}
              style={[styles.category, active && styles.categoryActive]}
              contentStyle={styles.categoryContent}
              onPress={() => setSelected(active ? undefined : category.id)}
              accessibilityLabel={language === 'ru' ? category.titleRu : category.titleEn}
            >
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                {language === 'ru' ? category.titleRu : category.titleEn}
              </Text>
            </PhysicalPressable>
          );
        })}
      </ScrollView>

      <View style={styles.scenarioGrid}>
        <Scenario
          title={language === 'ru' ? 'У меня 3 часа' : 'I have 3 hours'}
          body={language === 'ru' ? 'Найти лучшее между двумя фиксированными точками.' : 'Fill a window between fixed commitments.'}
        />
        <Scenario
          title={language === 'ru' ? 'Весь день' : 'A full day'}
          body={language === 'ru' ? 'Утро → обед → культура → ужин → вечер.' : 'Morning → lunch → culture → dinner → evening.'}
        />
        <Scenario
          title={language === 'ru' ? 'Уже есть билеты' : 'I already have tickets'}
          body={language === 'ru' ? 'Зафиксировать их и достроить день вокруг.' : 'Lock them and build the day around them.'}
        />
        <Scenario
          title={language === 'ru' ? 'Несколько дней' : 'Several days'}
          body={language === 'ru' ? 'Разнести Москву по дням без повторов.' : 'Spread Moscow across days without repeats.'}
        />
      </View>

      <PhysicalPressable
        style={styles.primary}
        contentStyle={styles.center}
        strong
        onPress={() => onPlan(selected)}
        accessibilityLabel={language === 'ru' ? 'Перейти к планированию Москвы' : 'Plan Moscow'}
      >
        <Text style={styles.primaryText}>
          {language === 'ru'
            ? selected
              ? 'Собрать день по выбранной теме →'
              : 'Начать планировать Москву →'
            : 'Plan Moscow →'}
        </Text>
      </PhysicalPressable>

      <Text style={styles.guardrail}>
        {language === 'ru'
          ? 'Категория задаёт интерес, но не выдумывает расписание, наличие мест или билетов: live-факты должны приходить из подтверждённых источников.'
          : 'A category expresses intent; it never fabricates opening hours, availability or tickets.'}
      </Text>
    </View>
  );
}

function Scenario({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.scenario}>
      <Text style={styles.scenarioTitle}>{title}</Text>
      <Text style={styles.scenarioBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 14,
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#101419',
    borderWidth: 1,
    borderColor: '#2d343c'
  },
  kicker: {
    color: '#c0a26d',
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '900'
  },
  title: {
    marginTop: 7,
    color: '#f8f2e8',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900'
  },
  body: {
    marginTop: 8,
    color: '#aeb4bc',
    fontSize: 12,
    lineHeight: 19
  },
  categories: {
    gap: 8,
    paddingTop: 15,
    paddingBottom: 4
  },
  category: {
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: '#171b20',
    borderWidth: 1,
    borderColor: '#333a42'
  },
  categoryActive: {
    backgroundColor: '#d7bb84',
    borderColor: '#f0d39b'
  },
  categoryContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryText: {
    color: '#aeb4bc',
    fontSize: 10,
    fontWeight: '800'
  },
  categoryTextActive: {
    color: '#17130d'
  },
  scenarioGrid: {
    marginTop: 14,
    gap: 8
  },
  scenario: {
    borderRadius: 15,
    padding: 12,
    backgroundColor: '#0b0f13',
    borderWidth: 1,
    borderColor: '#242b32'
  },
  scenarioTitle: {
    color: '#e8e1d7',
    fontSize: 12,
    fontWeight: '900'
  },
  scenarioBody: {
    marginTop: 4,
    color: '#7f8790',
    fontSize: 10,
    lineHeight: 15
  },
  primary: {
    marginTop: 15,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: '#d7bb84',
    borderWidth: 1,
    borderColor: '#f0d39b'
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryText: {
    color: '#17130d',
    fontSize: 11,
    fontWeight: '900'
  },
  guardrail: {
    marginTop: 10,
    color: '#6f7780',
    fontSize: 9,
    lineHeight: 14
  }
});
