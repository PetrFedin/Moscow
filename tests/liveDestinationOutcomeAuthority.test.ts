import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLiveDestinationOutcomeSnapshot } from '../src/government/liveDestinationOutcomeAuthority.ts';

test('fails closed before provider evidence exists', () => {
  const snapshot = buildLiveDestinationOutcomeSnapshot({
    destinationId: 'moscow',
    asOf: '2026-09-30T00:00:00Z'
  });

  assert.equal(snapshot.providerState, 'not-connected');
  assert.equal(snapshot.bookingState, 'not-evidenced');
  assert.equal(snapshot.metrics.length, 0);
  assert.ok(snapshot.blockers.includes('live-provider-ingestion-evidence-missing'));
  assert.ok(snapshot.blockers.includes('provider-booking-confirmation-evidence-missing'));
});

test('does not treat booking handoff as booking success', () => {
  const snapshot = buildLiveDestinationOutcomeSnapshot({
    destinationId: 'moscow',
    asOf: '2026-09-30T00:00:00Z',
    journeyStarts: { count: 10, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    heritageCompletions: { count: 8, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    liveEntityOpens: { count: 6, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    bookingHandoffOpens: { count: 4, authority: 'app-aggregate', evidenceRef: 'journeys.json' }
  });

  assert.equal(snapshot.bookingState, 'handoff-only');
  assert.ok(snapshot.metrics.some((metric) => metric.id === 'booking-handoff'));
  assert.ok(!snapshot.metrics.some((metric) => metric.id === 'provider-confirmed-booking'));
});

test('requires provider receipt authority for confirmed booking outcome', () => {
  const snapshot = buildLiveDestinationOutcomeSnapshot({
    destinationId: 'moscow',
    asOf: '2026-09-30T00:00:00Z',
    journeyStarts: { count: 10, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    heritageCompletions: { count: 8, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    liveEntityOpens: { count: 6, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    bookingHandoffOpens: { count: 4, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    providerConfirmedBookings: { count: 3, authority: 'app-aggregate', evidenceRef: 'client-events.json' }
  });

  assert.equal(snapshot.bookingState, 'handoff-only');
  assert.ok(snapshot.blockers.includes('booking-confirmation-not-provider-authoritative'));
});

test('accepts confirmed booking only from provider receipt aggregate', () => {
  const snapshot = buildLiveDestinationOutcomeSnapshot({
    destinationId: 'moscow',
    asOf: '2026-09-30T00:00:00Z',
    journeyStarts: { count: 10, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    heritageCompletions: { count: 8, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    liveEntityOpens: { count: 6, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    bookingHandoffOpens: { count: 4, authority: 'app-aggregate', evidenceRef: 'journeys.json' },
    providerConfirmedBookings: { count: 3, authority: 'provider-receipt-aggregate', evidenceRef: 'provider-receipts.json' }
  });

  assert.equal(snapshot.bookingState, 'provider-confirmed');
  const metric = snapshot.metrics.find((item) => item.id === 'provider-confirmed-booking');
  assert.equal(metric?.numerator, 3);
  assert.equal(metric?.denominator, 4);
  assert.equal(snapshot.interpretation.handoffIsNotBookingSuccess, true);
});
