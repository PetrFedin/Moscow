import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertDestinationPackageCanPublish,
  getDestinationCapabilities,
  parseDestinationPackage,
  serializeDestinationPackage,
  validateDestinationPackage,
  type DestinationPackage
} from '../src/travel/destinationPackage.ts';
import {
  moscowVarvarkaDestinationPackage,
  moscowVarvarkaDestinationPackageValidation
} from '../src/travel/moscowDestinationPackage.ts';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

test('Moscow Varvarka is a valid first generic DestinationPackage', () => {
  assert.equal(moscowVarvarkaDestinationPackageValidation.valid, true);
  assert.equal(moscowVarvarkaDestinationPackageValidation.publishable, true);
  assert.equal(moscowVarvarkaDestinationPackage.destination.countryCode, 'RU');
  assert.equal(moscowVarvarkaDestinationPackage.primaryLanguage, 'ru');
  assert.deepEqual(moscowVarvarkaDestinationPackage.languages, ['ru', 'en', 'zh']);
  assert.equal(moscowVarvarkaDestinationPackage.nodes.length, 5);
  assert.equal(moscowVarvarkaDestinationPackage.routes.length, 1);
  assert.equal(moscowVarvarkaDestinationPackage.commercialPlacements.length, 0);

  const capabilities = getDestinationCapabilities(moscowVarvarkaDestinationPackage);
  assert.equal(capabilities.history, true);
  assert.equal(capabilities.routes, true);
  assert.equal(capabilities.food, false);
  assert.equal(capabilities.stays, false);
  assert.equal(capabilities.events, false);
  assert.equal(capabilities.booking, false);
  assert.equal(capabilities.sponsoredPlacements, false);
});

test('a second Russian region can use the same contract without Moscow-specific fields', () => {
  const region: DestinationPackage = {
    schemaVersion: 1,
    id: 'ru-test-region-v1',
    version: 1,
    destination: {
      id: 'test-region',
      scope: 'region',
      titleRu: 'Тестовый регион',
      titleEn: 'Test Region',
      titleZh: '测试地区',
      federalSubjectCode: '00',
      countryCode: 'RU'
    },
    publisher: 'Regional DMO',
    primaryLanguage: 'ru',
    publishedAt: '2026-09-26T12:00:00.000Z',
    languages: ['ru', 'en', 'zh'],
    sources: [
      {
        id: 'official-tourism-source',
        owner: 'Regional DMO',
        title: 'Официальная карточка объекта',
        url: 'https://example.org/place',
        accessedAt: '2026-09-26',
        rights: 'official-reference'
      },
      {
        id: 'partner-food-source',
        owner: 'Restaurant Partner',
        title: 'Карточка ресторана',
        url: 'https://example.org/food',
        accessedAt: '2026-09-26',
        rights: 'partner-provided'
      }
    ],
    nodes: [
      {
        id: 'heritage-1',
        kind: 'heritage',
        titleRu: 'Исторический объект',
        titleEn: 'Heritage Site',
        titleZh: '历史景点',
        latitude: 55,
        longitude: 40,
        durationMinutes: 30,
        tags: ['история'],
        sourceIds: ['official-tourism-source'],
        heritagePackageId: 'regional-spatial-package-v1'
      },
      {
        id: 'food-1',
        kind: 'food',
        titleRu: 'Где поесть',
        titleEn: 'Where to Eat',
        titleZh: '用餐地点',
        latitude: 55.001,
        longitude: 40.001,
        durationMinutes: 60,
        tags: ['еда'],
        sourceIds: ['partner-food-source'],
        booking: {
          mode: 'partner-deep-link',
          provider: 'Restaurant Partner',
          action: 'reserve',
          url: 'https://example.org/food/reserve'
        }
      }
    ],
    routes: [
      {
        id: 'day-1',
        titleRu: 'Первый день',
        titleEn: 'Day One',
        titleZh: '第一天',
        nodeIds: ['heritage-1', 'food-1'],
        estimatedMinutes: 120,
        themes: ['история', 'еда'],
        source: 'official'
      }
    ],
    commercialPlacements: [],
    offlineEligible: true
  };

  const validation = validateDestinationPackage(region);
  assert.equal(validation.valid, true);
  assert.equal(validation.publishable, true);

  const capabilities = getDestinationCapabilities(region);
  assert.equal(capabilities.history, true);
  assert.equal(capabilities.food, true);
  assert.equal(capabilities.booking, true);
});

test('partner booking must be attributable and HTTPS', () => {
  const pkg = clone(moscowVarvarkaDestinationPackage);
  pkg.nodes[0]!.booking = {
    mode: 'partner-deep-link',
    provider: '',
    action: 'buy-ticket',
    url: 'http://insecure.example.org/ticket'
  };

  const validation = validateDestinationPackage(pkg);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes(`booking-provider-missing:${pkg.nodes[0]!.id}`));
  assert.ok(validation.blockers.includes(`booking-url-not-https:${pkg.nodes[0]!.id}`));
});

test('sponsored placement is structurally separate and must be explicitly disclosed', () => {
  const pkg = clone(moscowVarvarkaDestinationPackage);
  pkg.commercialPlacements = [
    {
      id: 'sponsor-1',
      sponsorName: 'Example Partner',
      entityIds: ['romanov-chambers'],
      surfaces: ['route'],
      disclosureRu: '',
      startsAt: '2026-10-02',
      endsAt: '2026-10-01'
    }
  ];

  const validation = validateDestinationPackage(pkg);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes('commercial-disclosure-ru-missing:sponsor-1'));
  assert.ok(validation.blockers.includes('commercial-dates-invalid:sponsor-1'));
});

test('commercial placement cannot point to a phantom restaurant or route', () => {
  const pkg = clone(moscowVarvarkaDestinationPackage);
  pkg.commercialPlacements = [
    {
      id: 'sponsor-phantom',
      sponsorName: 'Example Partner',
      entityIds: ['restaurant-that-does-not-exist'],
      surfaces: ['food'],
      disclosureRu: 'Партнёрский материал'
    }
  ];

  const validation = validateDestinationPackage(pkg);
  assert.equal(validation.valid, false);
  assert.ok(validation.blockers.includes(
    'commercial-entity-not-found:sponsor-phantom:restaurant-that-does-not-exist'
  ));
});

test('unresolved content rights block destination publication', () => {
  const pkg = clone(moscowVarvarkaDestinationPackage);
  pkg.sources[0]!.rights = 'review-required';

  const validation = validateDestinationPackage(pkg);
  assert.equal(validation.valid, true);
  assert.equal(validation.publishable, false);
  assert.ok(validation.publicationBlockers.includes(
    `source-rights-review-required:${pkg.sources[0]!.id}`
  ));
  assert.throws(() => assertDestinationPackageCanPublish(pkg), /not publishable/);
});

test('destination package survives validated serialization roundtrip', () => {
  const raw = serializeDestinationPackage(moscowVarvarkaDestinationPackage);
  const restored = parseDestinationPackage(raw);
  assert.deepEqual(restored, moscowVarvarkaDestinationPackage);
});


test('missing Chinese localization blocks public destination publication', () => {
  const pkg = clone(moscowVarvarkaDestinationPackage);
  pkg.languages = ['ru', 'en'];
  pkg.destination.titleZh = undefined;
  pkg.nodes[0]!.titleZh = undefined;

  const validation = validateDestinationPackage(pkg);
  assert.equal(validation.valid, true);
  assert.equal(validation.publishable, false);
  assert.ok(validation.publicationBlockers.includes('chinese-localization-missing'));
  assert.ok(validation.publicationBlockers.includes('destination-title-zh-missing'));
  assert.ok(validation.publicationBlockers.includes(`node-title-zh-missing:${pkg.nodes[0]!.id}`));
});
