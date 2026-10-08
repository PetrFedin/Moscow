import {
  CITYWIDE_ROUTING_SCHEMA_VERSION,
  projectCitywideRoutingFeed,
  type CitywideRoutingFeed
} from './citywideRoutingAuthority.ts';

export const VALHALLA_REAL_SMOKE_EVIDENCE_REF =
  'evidence/routing/valhalla-real-smoke-2026-10-08.json' as const;

export const VALHALLA_REAL_SMOKE_REPLAY_AS_OF =
  '2026-10-08T09:45:00.000Z' as const;

export const VALHALLA_REAL_SMOKE_ENDPOINTS = {
  from: {
    id: 'pushkin-museum',
    latitude: 55.7472,
    longitude: 37.6054
  },
  to: {
    id: 'bolshoi-theatre',
    latitude: 55.7601,
    longitude: 37.6186
  }
} as const;

export const valhallaRealSmokeRoutingFeed: CitywideRoutingFeed = {
  schemaVersion: CITYWIDE_ROUTING_SCHEMA_VERSION,
  destinationId: 'moscow',
  generatedAt: '2026-10-08T09:41:01.000Z',
  providers: [{
    id: 'valhalla',
    name: 'Valhalla',
    relationship: 'routing-provider',
    sourceUrl: 'https://valhalla1.openstreetmap.de'
  }],
  observations: [{
    id: 'valhalla:pushkin-museum:bolshoi-theatre:walk:2026-10-08T09:41:00.499Z',
    providerId: 'valhalla',
    from: { ...VALHALLA_REAL_SMOKE_ENDPOINTS.from },
    to: { ...VALHALLA_REAL_SMOKE_ENDPOINTS.to },
    mode: 'walk',
    durationMinutes: 25,
    distanceMeters: 1813,
    observedAt: '2026-10-08T09:41:00.499Z',
    expiresAt: '2026-10-08T09:56:00.499Z',
    sourceUrl: 'https://valhalla1.openstreetmap.de/route'
  }]
};

export type RoutingEvidenceReplayContext = {
  mode: 'historical-evidence-replay';
  evidenceRef: typeof VALHALLA_REAL_SMOKE_EVIDENCE_REF;
  rawResponseSha256: string;
  workflowRunId: number;
  artifactId: number;
  replayAsOf: typeof VALHALLA_REAL_SMOKE_REPLAY_AS_OF;
};

export const valhallaRealSmokeReplayContext: RoutingEvidenceReplayContext = {
  mode: 'historical-evidence-replay',
  evidenceRef: VALHALLA_REAL_SMOKE_EVIDENCE_REF,
  rawResponseSha256: '4a4a7dbaf85bf4446a59788dd2c74e7db05384c934f3dd6c49409f677e53ef90',
  workflowRunId: 37758332333,
  artifactId: 11541226761,
  replayAsOf: VALHALLA_REAL_SMOKE_REPLAY_AS_OF
};

export function projectValhallaRealSmokeReplay() {
  return projectCitywideRoutingFeed(
    valhallaRealSmokeRoutingFeed,
    VALHALLA_REAL_SMOKE_REPLAY_AS_OF
  );
}

export function projectValhallaRealSmokeAt(nowIso: string) {
  return projectCitywideRoutingFeed(valhallaRealSmokeRoutingFeed, nowIso);
}

export function matchesValhallaRealSmokeEndpoints(input: {
  fromDestinationNodeId?: string;
  toDestinationNodeId?: string;
}) {
  return input.fromDestinationNodeId === VALHALLA_REAL_SMOKE_ENDPOINTS.from.id
    && input.toDestinationNodeId === VALHALLA_REAL_SMOKE_ENDPOINTS.to.id;
}
