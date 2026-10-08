import assert from 'node:assert/strict';
import test from 'node:test';

import { validateRealProviderAdmission } from '../src/integrations/realProviderAdmission.ts';
import {
  buildValhallaRoutingAdmission,
  buildValhallaRoutingFeed,
  buildValhallaWalkingRequest,
  normalizeValhallaWalkingRoute
} from '../src/integrations/valhallaRoutingAdapter.ts';
import { validateCitywideRoutingFeed } from '../src/travel/citywideRoutingAuthority.ts';

const from = {
  id: 'pushkin-museum',
  latitude: 55.7472,
  longitude: 37.6054
};

const to = {
  id: 'bolshoi-theatre',
  latitude: 55.7601,
  longitude: 37.6186
};

test('Valhalla admission uses common provider authority with routing capability', () => {
  const admission = buildValhallaRoutingAdmission({
    sourceUrl: 'https://routing.example.com',
    admittedAt: '2026-10-08T09:00:00.000Z',
    evidenceRef: 'evidence/valhalla/admission.json',
    capabilityEvidenceRef: 'evidence/valhalla/capabilities.json',
    schemaEvidenceRef: 'evidence/valhalla/schema.json'
  });

  const result = validateRealProviderAdmission(admission);
  assert.equal(result.status, 'admitted');
  assert.deepEqual(result.admittedCapabilities, ['routing']);
  assert.equal(admission.kind, 'routing');
  assert.equal(admission.credentials.mode, 'public-api');
});

test('Valhalla walking request is deterministic and walking-only in v1', () => {
  assert.deepEqual(buildValhallaWalkingRequest(from, to), {
    locations: [
      { lat: 55.7472, lon: 37.6054 },
      { lat: 55.7601, lon: 37.6186 }
    ],
    costing: 'pedestrian',
    units: 'kilometers',
    directions_options: {
      units: 'kilometers'
    }
  });
});

test('Valhalla response normalizes seconds and kilometers into routing authority units', () => {
  const observation = normalizeValhallaWalkingRoute({
    raw: {
      trip: {
        status: 0,
        status_message: 'Found route between points',
        units: 'kilometers',
        summary: {
          time: 1441,
          length: 2.345
        }
      }
    },
    sourceUrl: 'https://routing.example.com/route',
    from,
    to,
    fetchedAt: '2026-10-08T09:05:00.000Z',
    expiresAt: '2026-10-08T09:20:00.000Z',
    observationId: 'route:pushkin:bolshoi:walk'
  });

  assert.equal(observation.mode, 'walk');
  assert.equal(observation.durationMinutes, 25);
  assert.equal(observation.distanceMeters, 2345);
  assert.equal(observation.providerId, 'valhalla');
  assert.equal(observation.from.id, 'pushkin-museum');
  assert.equal(observation.to.id, 'bolshoi-theatre');

  const feed = buildValhallaRoutingFeed({
    sourceUrl: 'https://routing.example.com',
    generatedAt: '2026-10-08T09:06:00.000Z',
    observations: [observation]
  });
  assert.equal(validateCitywideRoutingFeed(feed).valid, true);
});

test('Valhalla response fails closed on provider error, invalid units or missing duration', () => {
  assert.throws(
    () => normalizeValhallaWalkingRoute({
      raw: { trip: { status: 171, status_message: 'No suitable edges near location' } },
      sourceUrl: 'https://routing.example.com/route',
      from,
      to,
      fetchedAt: '2026-10-08T09:05:00.000Z',
      expiresAt: '2026-10-08T09:20:00.000Z',
      observationId: 'route:error'
    }),
    /Valhalla route failed/
  );

  assert.throws(
    () => normalizeValhallaWalkingRoute({
      raw: {
        trip: {
          status: 0,
          units: 'miles',
          summary: { time: 300, length: 1 }
        }
      },
      sourceUrl: 'https://routing.example.com/route',
      from,
      to,
      fetchedAt: '2026-10-08T09:05:00.000Z',
      expiresAt: '2026-10-08T09:20:00.000Z',
      observationId: 'route:miles'
    }),
    /Unsupported Valhalla units/
  );

  assert.throws(
    () => normalizeValhallaWalkingRoute({
      raw: {
        trip: {
          status: 0,
          units: 'kilometers',
          summary: { length: 1 }
        }
      },
      sourceUrl: 'https://routing.example.com/route',
      from,
      to,
      fetchedAt: '2026-10-08T09:05:00.000Z',
      expiresAt: '2026-10-08T09:20:00.000Z',
      observationId: 'route:no-duration'
    }),
    /summary time/
  );
});
