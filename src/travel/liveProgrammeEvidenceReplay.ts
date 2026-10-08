import {
  LIVE_DESTINATION_SCHEMA_VERSION,
  projectLiveDestinationFeed,
  type LiveDestinationFeed
} from './liveDestinationAuthority.ts';

export const TRETYAKOV_PROGRAMME_EVIDENCE_REF =
  'evidence/live-city/tretyakov-programme-2026-10-08.json' as const;

export const TRETYAKOV_PROGRAMME_REPLAY_AS_OF =
  '2026-10-08T15:30:00.000Z' as const;

export const TRETYAKOV_PROGRAMME_CANONICAL_NODE_ID =
  'tretyakov-aleksey-bogolyubov-neva-bosporus' as const;

export const tretyakovProgrammeEvidenceFeed: LiveDestinationFeed = {
  schemaVersion: LIVE_DESTINATION_SCHEMA_VERSION,
  destinationId: 'moscow',
  generatedAt: '2026-10-08T15:24:30.641Z',
  providers: [{
    id: 'tretyakov-programme-official',
    name: 'Государственная Третьяковская галерея · выставки',
    relationship: 'official',
    capabilities: ['inventory', 'event-schedule', 'operational-status'],
    sourceUrl: 'https://www.tretyakovgallery.ru/exhibitions/o/aleksey-bogolyubov-ot-nevy-do-bosfora/',
    attributionRu: 'Источник: Государственная Третьяковская галерея · выставки',
    attributionEn: 'Source: State Tretyakov Gallery · exhibitions',
    attributionZh: '来源：国立特列季亚科夫画廊 · 展览'
  }],
  entities: [{
    id: TRETYAKOV_PROGRAMME_CANONICAL_NODE_ID,
    providerEntityId: 'aleksey-bogolyubov-neva-bosporus',
    providerId: 'tretyakov-programme-official',
    canonicalDestinationNodeId: TRETYAKOV_PROGRAMME_CANONICAL_NODE_ID,
    kind: 'exhibition',
    titleRu: 'Алексей Боголюбов. От Невы до Босфора',
    titleEn: 'Alexey Bogolyubov. From the Neva to the Bosphorus',
    titleZh: '阿列克谢·博戈柳博夫：从涅瓦河到博斯普鲁斯海峡',
    tags: ['выставка', 'искусство', 'третьяковская галерея'],
    sourceUrl: 'https://www.tretyakovgallery.ru/exhibitions/o/aleksey-bogolyubov-ot-nevy-do-bosfora/',
    observedAt: '2026-10-08T15:24:28.881Z',
    expiresAt: '2026-10-08T15:54:28.881Z',
    operationalStatus: 'scheduled',
    startsAt: '2026-09-29T00:00:00+03:00',
    endsAt: '2027-06-06T23:59:59+03:00'
  }]
};

export const tretyakovProgrammeReplayContext = {
  mode: 'historical-evidence-replay' as const,
  evidenceRef: TRETYAKOV_PROGRAMME_EVIDENCE_REF,
  rawHtmlSha256: '794ae75ec513ea0adeff11311fd8cae8657f5798a29f2958bab7283398f92094',
  workflowRunId: 37800450242,
  artifactId: 11561270003,
  replayAsOf: TRETYAKOV_PROGRAMME_REPLAY_AS_OF
};

export function projectTretyakovProgrammeReplay() {
  return projectLiveDestinationFeed(
    tretyakovProgrammeEvidenceFeed,
    TRETYAKOV_PROGRAMME_REPLAY_AS_OF
  );
}

export function projectTretyakovProgrammeAt(nowIso: string) {
  return projectLiveDestinationFeed(tretyakovProgrammeEvidenceFeed, nowIso);
}
