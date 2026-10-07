import assert from 'node:assert/strict';
import test from 'node:test';

import {
  citywideCategories,
  filterCityExperiences,
  getCitywideCategoryCounts
} from '../src/travel/citywideDiscovery.ts';
import type { DestinationPackage } from '../src/travel/destinationPackage.ts';

const pkg: DestinationPackage = {
  schemaVersion: 1,
  id: 'moscow-city-test',
  version: 1,
  destination: {
    id: 'moscow',
    scope: 'city',
    titleRu: 'Москва',
    titleEn: 'Moscow',
    titleZh: '莫斯科',
    countryCode: 'RU'
  },
  publisher: 'test',
  primaryLanguage: 'ru',
  languages: ['ru', 'en', 'zh'],
  sources: [
    {
      id: 'source',
      owner: 'test',
      title: 'Synthetic test source',
      url: 'https://example.com/source',
      accessedAt: '2026-10-07',
      rights: 'official-reference'
    }
  ],
  nodes: [
    {
      id: 'museum',
      kind: 'museum',
      titleRu: 'Музей',
      titleEn: 'Museum',
      titleZh: '博物馆',
      latitude: 55.75,
      longitude: 37.61,
      district: 'ЦАО',
      indoorOutdoor: 'indoor',
      priceBand: 'mid',
      audience: ['solo', 'family'],
      tags: ['искусство'],
      sourceIds: ['source']
    },
    {
      id: 'restaurant',
      kind: 'restaurant',
      titleRu: 'Ресторан',
      titleEn: 'Restaurant',
      titleZh: '餐厅',
      latitude: 55.76,
      longitude: 37.62,
      district: 'ЦАО',
      indoorOutdoor: 'indoor',
      priceBand: 'premium',
      audience: ['couple', 'business'],
      tags: ['ужин'],
      sourceIds: ['source'],
      booking: {
        mode: 'external-provider',
        provider: 'test-provider',
        action: 'reserve',
        url: 'https://example.com/reserve'
      }
    },
    {
      id: 'theatre',
      kind: 'theatre',
      titleRu: 'Театр',
      titleEn: 'Theatre',
      titleZh: '剧院',
      latitude: 55.77,
      longitude: 37.63,
      district: 'ЦАО',
      indoorOutdoor: 'indoor',
      priceBand: 'premium',
      audience: ['couple', 'friends'],
      tags: ['вечер'],
      sourceIds: ['source']
    },
    {
      id: 'park',
      kind: 'park',
      titleRu: 'Парк',
      titleEn: 'Park',
      titleZh: '公园',
      latitude: 55.78,
      longitude: 37.64,
      district: 'ЗАО',
      indoorOutdoor: 'outdoor',
      priceBand: 'free',
      audience: ['family', 'friends'],
      tags: ['прогулка'],
      sourceIds: ['source']
    }
  ],
  routes: [],
  commercialPlacements: [],
  offlineEligible: true
};

test('citywide categories cover broad Moscow planning intents', () => {
  const ids = new Set(citywideCategories.map((category) => category.id));
  for (const required of ['culture', 'history', 'food', 'night', 'events', 'parks', 'shopping', 'family']) {
    assert.equal(ids.has(required as never), true);
  }
});

test('citywide discovery filters museums, restaurants, theatres and parks independently of heritage proof', () => {
  assert.deepEqual(
    filterCityExperiences(pkg, { categoryIds: ['culture'] }).map((node) => node.id).sort(),
    ['museum', 'theatre']
  );
  assert.deepEqual(
    filterCityExperiences(pkg, { categoryIds: ['food'], bookableOnly: true }).map((node) => node.id),
    ['restaurant']
  );
  assert.deepEqual(
    filterCityExperiences(pkg, { categoryIds: ['parks'], indoorOutdoor: 'outdoor' }).map((node) => node.id),
    ['park']
  );
});

test('citywide discovery can constrain district, price, audience and tags without fabricating availability', () => {
  assert.deepEqual(
    filterCityExperiences(pkg, {
      district: 'ЦАО',
      priceBands: ['premium'],
      audience: 'couple'
    }).map((node) => node.id).sort(),
    ['restaurant', 'theatre']
  );

  assert.deepEqual(
    filterCityExperiences(pkg, { tags: ['ужин'] }).map((node) => node.id),
    ['restaurant']
  );
});

test('category counts derive only from actual destination nodes', () => {
  const counts = getCitywideCategoryCounts(pkg);
  assert.equal(counts.culture, 2);
  assert.equal(counts.food, 1);
  assert.equal(counts.parks, 1);
  assert.equal(counts.shopping, 0);
});
