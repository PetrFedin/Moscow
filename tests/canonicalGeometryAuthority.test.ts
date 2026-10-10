import assert from 'node:assert/strict';
import test from 'node:test';

import {
  geometryEvidenceToRouteEndpoint,
  listCanonicalGeometryEvidence,
  resolveCanonicalGeometry
} from '../src/travel/canonicalGeometryAuthority.ts';

test('canonical geometry registry exposes only recorded source-backed facts', () => {
  const facts = listCanonicalGeometryEvidence();
  assert.equal(facts.length, 2);

  const tretyakov = resolveCanonicalGeometry({
    canonicalNodeId: 'tretyakov-aleksey-bogolyubov-neva-bosporus'
  });
  assert.ok(tretyakov);
  assert.equal(tretyakov.latitude, 55.7413613);
  assert.equal(tretyakov.longitude, 37.6202196);
  assert.equal(tretyakov.source.kind, 'official-address+geocoder');
  assert.match(tretyakov.source.evidenceRef, /replacement-geometry-v1/);

  const bolshoi = resolveCanonicalGeometry({
    canonicalNodeId: 'bolshoi-theatre'
  });
  assert.ok(bolshoi);
  assert.deepEqual(geometryEvidenceToRouteEndpoint(bolshoi), {
    id: 'bolshoi-theatre',
    latitude: 55.7601296,
    longitude: 37.6186118
  });

  assert.equal(resolveCanonicalGeometry({
    canonicalNodeId: 'unknown-place'
  }), undefined);
});

test('fresh provider geometry takes precedence over static geometry', () => {
  const live = resolveCanonicalGeometry({
    canonicalNodeId: 'bolshoi-theatre',
    liveEntities: [{
      id: 'bolshoi-live',
      providerEntityId: 'bolshoi',
      providerId: 'official-provider',
      providerName: 'Official Provider',
      canonicalDestinationNodeId: 'bolshoi-theatre',
      kind: 'theatre',
      titleRu: 'Большой театр',
      titleEn: 'Bolshoi Theatre',
      titleZh: '莫斯科大剧院',
      latitude: 55.7602,
      longitude: 37.6187,
      tags: ['theatre'],
      sourceUrl: 'https://example.org/bolshoi',
      observedAt: '2026-10-10T09:00:00.000Z',
      expiresAt: '2026-10-10T09:30:00.000Z',
      freshness: 'fresh',
      operationalStatus: 'open',
      openingState: 'unknown',
      journeyEligible: true,
      providerAttributionRu: 'Источник',
      providerAttributionEn: 'Source',
      providerAttributionZh: '来源'
    }]
  });

  assert.ok(live);
  assert.equal(live.latitude, 55.7602);
  assert.equal(live.longitude, 37.6187);
  assert.equal(live.source.kind, 'current-live');
  assert.equal(live.source.providerId, 'official-provider');
});
