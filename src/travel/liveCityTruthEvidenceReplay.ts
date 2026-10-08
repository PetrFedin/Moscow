import {
  LIVE_DESTINATION_SCHEMA_VERSION,
  projectLiveDestinationFeed,
  type LiveDestinationFeed
} from './liveDestinationAuthority.ts';

export const TRETYAKOV_LIVE_CITY_EVIDENCE_REF =
  'evidence/live-city/tretyakov-live-city-2026-10-08.json' as const;

export const TRETYAKOV_LIVE_CITY_REPLAY_AS_OF =
  '2026-10-08T13:30:00.000Z' as const;

export const TRETYAKOV_LIVE_CITY_CANONICAL_NODE_ID =
  'new-tretyakov' as const;

export const tretyakovLiveCityEvidenceFeed: LiveDestinationFeed = {
  schemaVersion: LIVE_DESTINATION_SCHEMA_VERSION,
  destinationId: 'moscow',
  generatedAt: '2026-10-08T13:25:35.102Z',
  providers: [{
    id: 'tretyakov-official',
    name: 'Государственная Третьяковская галерея',
    relationship: 'official',
    capabilities: ['inventory', 'operational-status', 'opening-hours'],
    sourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/',
    attributionRu: 'Источник: Государственная Третьяковская галерея',
    attributionEn: 'Source: State Tretyakov Gallery',
    attributionZh: '来源：国立特列季亚科夫画廊'
  }],
  entities: [{
    id: 'new-tretyakov-live',
    providerEntityId: 'new-tretyakov',
    providerId: 'tretyakov-official',
    canonicalDestinationNodeId: TRETYAKOV_LIVE_CITY_CANONICAL_NODE_ID,
    kind: 'museum',
    titleRu: 'Новая Третьяковка',
    titleEn: 'New Tretyakov',
    titleZh: '新特列季亚科夫画廊',
    tags: ['музей', 'искусство', 'новая третьяковка'],
    sourceUrl: 'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/',
    observedAt: '2026-10-08T13:25:33.145Z',
    expiresAt: '2026-10-08T13:55:33.145Z',
    operationalStatus: 'open',
    openingHours: {
      timezone: 'Europe/Moscow',
      windows: [
        { opensAt: '2026-10-08T10:00:00+03:00', closesAt: '2026-10-08T21:00:00+03:00' },
        { opensAt: '2026-10-09T10:00:00+03:00', closesAt: '2026-10-09T21:00:00+03:00' },
        { opensAt: '2026-10-10T10:00:00+03:00', closesAt: '2026-10-10T21:00:00+03:00' },
        { opensAt: '2026-10-11T10:00:00+03:00', closesAt: '2026-10-11T21:00:00+03:00' },
        { opensAt: '2026-10-13T10:00:00+03:00', closesAt: '2026-10-13T21:00:00+03:00' },
        { opensAt: '2026-10-14T10:00:00+03:00', closesAt: '2026-10-14T21:00:00+03:00' },
        { opensAt: '2026-10-15T10:00:00+03:00', closesAt: '2026-10-15T21:00:00+03:00' }
      ]
    }
  }]
};

export const tretyakovLiveCityReplayContext = {
  mode: 'historical-evidence-replay' as const,
  evidenceRef: TRETYAKOV_LIVE_CITY_EVIDENCE_REF,
  rawHtmlSha256: '200425047c507379d1c80b9f13de96911b6991caa8337e37f481d5505f35ef0d',
  workflowRunId: 37784139228,
  artifactId: 11553645959,
  replayAsOf: TRETYAKOV_LIVE_CITY_REPLAY_AS_OF
};

export function projectTretyakovLiveCityReplay() {
  return projectLiveDestinationFeed(
    tretyakovLiveCityEvidenceFeed,
    TRETYAKOV_LIVE_CITY_REPLAY_AS_OF
  );
}

export function projectTretyakovLiveCityAt(nowIso: string) {
  return projectLiveDestinationFeed(tretyakovLiveCityEvidenceFeed, nowIso);
}
