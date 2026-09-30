import assert from 'node:assert/strict';
import test from 'node:test';

import { buildProviderIntegrationHarnessResult } from '../src/integrations/providerIntegrationHarness.ts';
import { buildJourneyEvidencePack, verifyJourneyEvidencePack } from '../src/integrations/journeyEvidencePack.ts';
import type { LiveProviderIngestionRecord } from '../src/travel/liveProviderIngestion.ts';

const ingestion: LiveProviderIngestionRecord = {
  schemaVersion: 1,
  adapterId: 'sandbox-city',
  destinationId: 'moscow',
  providerId: 'provider-1',
  snapshotId: 'snap-2',
  sourceUrl: 'https://provider.example/feed',
  payloadSha256: 'a'.repeat(64),
  fetchedAt: '2026-09-30T08:00:00Z',
  normalizedAt: '2026-09-30T08:01:00Z',
  snapshotFreshness: 'fresh',
  normalizedEntityCount: 3,
  warnings: [] as string[]
};

const runtime = {
  version: 1,
  journeyId: 'journey-1',
  destinationId: 'moscow',
  planVersion: 2,
  state: 'executed',
  blocks: [],
  audit: [
    { at: '2026-09-30T07:00:00Z', action: 'journey-planned' },
    { at: '2026-09-30T09:00:00Z', action: 'journey-replanned', ref: 'routing-proof-2' }
  ]
} as any;

const receipt = {
  schemaVersion: 1,
  providerId: 'provider-1',
  receiptId: 'receipt-1',
  handoffId: 'handoff-1',
  providerEntityId: 'event-1',
  outcome: 'confirmed',
  occurredAt: '2026-09-30T18:00:00Z',
  evidenceRef: 'provider://receipt/receipt-1'
} as const;

const events = [
  { step: 'snapshot-ingested', at: '2026-09-30T08:01:00Z', evidenceRef: 'ingestion.json', providerId: 'provider-1', snapshotId: 'snap-2' },
  { step: 'live-block-verified', at: '2026-09-30T08:05:00Z', evidenceRef: 'projection.json', providerId: 'provider-1', blockId: 'event-1' },
  { step: 'provider-change-observed', at: '2026-09-30T09:00:00Z', evidenceRef: 'provider-change.json', providerId: 'provider-1', blockId: 'event-1' },
  { step: 'replan-produced', at: '2026-09-30T09:01:00Z', evidenceRef: 'replan.json', providerId: 'provider-1', routingProofRef: 'routing-proof-2' },
  { step: 'journey-resumed', at: '2026-09-30T09:02:00Z', evidenceRef: 'runtime.json', providerId: 'provider-1', blockId: 'replacement-event' },
  { step: 'provider-receipt-observed', at: '2026-09-30T18:00:00Z', evidenceRef: 'receipt.json', providerId: 'provider-1', receiptId: 'receipt-1' }
] as any;

test('provider integration proof stays blocked when a required proof step is absent', () => {
  const result = buildProviderIntegrationHarnessResult({
    ingestionRecord: ingestion,
    runtime,
    receipt,
    events: events.filter((event: any) => event.step !== 'replan-produced')
  });
  assert.equal(result.status, 'blocked');
  assert.ok(result.missingSteps.includes('replan-produced'));
});

test('complete integration proof requires ingestion, replan, resume and provider receipt', () => {
  const result = buildProviderIntegrationHarnessResult({
    ingestionRecord: ingestion,
    runtime,
    receipt,
    events
  });
  assert.equal(result.status, 'complete');
  assert.equal(result.providerId, 'provider-1');
  assert.equal(result.missingSteps.length, 0);
});

test('journey evidence pack is deterministically hash-verifiable', () => {
  const proof = buildProviderIntegrationHarnessResult({
    ingestionRecord: ingestion,
    runtime,
    receipt,
    events
  });
  const pack = buildJourneyEvidencePack({
    generatedAt: '2026-09-30T18:05:00Z',
    ingestion,
    runtime,
    receipt,
    integrationProof: proof
  });
  const verification = verifyJourneyEvidencePack(pack);
  assert.equal(verification.valid, true);
  assert.match(pack.integrity.canonicalPayloadSha256, /^[a-f0-9]{64}$/);
});

test('tampered evidence pack fails integrity verification', () => {
  const proof = buildProviderIntegrationHarnessResult({
    ingestionRecord: ingestion,
    runtime,
    receipt,
    events
  });
  const pack = buildJourneyEvidencePack({
    generatedAt: '2026-09-30T18:05:00Z',
    ingestion,
    runtime,
    receipt,
    integrationProof: proof
  });
  const tampered = {
    ...pack,
    summary: { ...pack.summary, evidenceEventCount: 999 }
  };
  assert.equal(verifyJourneyEvidencePack(tampered).valid, false);
});
