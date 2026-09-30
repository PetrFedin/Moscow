import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyJourneyRuntimeEvent,
  applyVerifiedReplan,
  createDestinationJourneyRuntime
} from '../src/travel/destinationJourneyRuntime.ts';
import {
  validateProviderSandboxReceipt
} from '../src/integrations/providerSandboxContract.ts';

function blocks() {
  return [
    {
      id: 'morning-heritage',
      kind: 'heritage' as const,
      title: 'Варварка',
      plannedStartAt: '2026-09-30T08:00:00Z',
      plannedEndAt: '2026-09-30T09:00:00Z',
      authority: { kind: 'published' as const, ref: 'route:varvarka' },
      status: 'planned' as const
    },
    {
      id: 'museum',
      kind: 'museum' as const,
      title: 'Museum',
      plannedStartAt: '2026-09-30T09:15:00Z',
      plannedEndAt: '2026-09-30T10:15:00Z',
      authority: { kind: 'live-destination' as const, entityId: 'museum-1', providerId: 'city', evidenceRef: 'snapshot-1' },
      status: 'planned' as const
    }
  ];
}

test('live block cannot execute before verification', () => {
  const runtime = createDestinationJourneyRuntime({
    journeyId: 'day-1',
    destinationId: 'moscow',
    blocks: blocks(),
    createdAt: '2026-09-30T07:00:00Z'
  });
  assert.throws(
    () => applyJourneyRuntimeEvent(runtime, { type: 'start-block', blockId: 'museum', at: '2026-09-30T09:15:00Z' }),
    /fresh verification/
  );
});

test('provider invalidation forces replan', () => {
  let runtime = createDestinationJourneyRuntime({
    journeyId: 'day-1',
    destinationId: 'moscow',
    blocks: blocks(),
    createdAt: '2026-09-30T07:00:00Z'
  });
  runtime = applyJourneyRuntimeEvent(runtime, {
    type: 'verify-live-block',
    blockId: 'museum',
    evidenceRef: 'snapshot-2',
    at: '2026-09-30T07:30:00Z'
  });
  runtime = applyJourneyRuntimeEvent(runtime, {
    type: 'provider-invalidated',
    blockId: 'museum',
    reason: 'closed',
    evidenceRef: 'snapshot-3',
    at: '2026-09-30T08:30:00Z'
  });
  assert.equal(runtime.state, 'replan-required');
  assert.match(runtime.replanReason ?? '', /museum:closed/);
});

test('replan itself requires routing proof', () => {
  let runtime = createDestinationJourneyRuntime({
    journeyId: 'day-1',
    destinationId: 'moscow',
    blocks: blocks(),
    createdAt: '2026-09-30T07:00:00Z'
  });
  runtime = applyJourneyRuntimeEvent(runtime, {
    type: 'provider-invalidated',
    blockId: 'museum',
    reason: 'stale',
    evidenceRef: 'snapshot-stale',
    at: '2026-09-30T08:30:00Z'
  });

  assert.throws(() => applyVerifiedReplan({
    runtime,
    replacementBlocks: blocks(),
    routingProofRef: '',
    at: '2026-09-30T08:31:00Z'
  }), /routing proof/);
});

test('provider receipt must be provider-bound evidence', () => {
  const result = validateProviderSandboxReceipt({
    schemaVersion: 1,
    providerId: 'tickets',
    receiptId: 'r-1',
    handoffId: 'h-1',
    providerEntityId: 'event-1',
    outcome: 'confirmed',
    occurredAt: '2026-09-30T12:00:00Z',
    evidenceRef: 'provider://receipt/r-1'
  }, 'tickets');
  assert.equal(result.valid, true);
});
