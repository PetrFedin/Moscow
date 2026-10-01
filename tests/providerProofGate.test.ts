import assert from 'node:assert/strict';
import test from 'node:test';

import { buildProviderIntegrationHarnessResult } from '../src/integrations/providerIntegrationHarness.ts';
import { buildJourneyEvidencePack } from '../src/integrations/journeyEvidencePack.ts';
import { evaluateProviderProofGate } from '../src/integrations/providerProofGate.ts';
import { validateRealProviderAdmission } from '../src/integrations/realProviderAdmission.ts';
import { validateRealProviderEvidenceRun } from '../src/integrations/realProviderEvidenceRun.ts';
import type { LiveProviderIngestionRecord } from '../src/travel/liveProviderIngestion.ts';

const providerId = 'yclients';

const admission = {
  version: 1 as const,
  providerId,
  adapterId: 'yclients-booking-v1',
  kind: 'venue' as const,
  destinationId: 'moscow',
  sourceUrl: 'https://api.yclients.com',
  credentials: {
    mode: 'api-key' as const,
    secretRef: 'render://moscow/YCLIENTS_PARTNER_TOKEN',
    admittedAt: '2026-10-01T10:00:00Z',
    evidenceRef: 'evidence/credentials/admission.json'
  },
  discoveredCapabilities: ['booking-handoff', 'booking-receipt'] as const,
  capabilityEvidenceRef: 'evidence/capabilities/yclients.json',
  schemaMapping: {
    providerSchemaVersion: 'documented-api-current',
    mappingVersion: '1',
    entityIdPath: '$.id',
    updatedAtPath: '$.last_change_date',
    bookingUrlPath: '$.booking_url',
    receiptIdPath: '$.resource_id',
    evidenceRef: 'evidence/schema-mapping/yclients-v1.json'
  }
};

const ingestion: LiveProviderIngestionRecord = {
  schemaVersion: 1,
  adapterId: 'yclients-booking-v1',
  destinationId: 'moscow',
  providerId,
  snapshotId: 'snap-real-1',
  sourceUrl: 'https://api.yclients.com',
  payloadSha256: 'a'.repeat(64),
  fetchedAt: '2026-10-01T10:05:00Z',
  normalizedAt: '2026-10-01T10:05:05Z',
  snapshotFreshness: 'fresh',
  normalizedEntityCount: 1,
  warnings: []
};

const runtime = {
  version: 1,
  journeyId: 'journey-real-1',
  destinationId: 'moscow',
  planVersion: 2,
  state: 'executed',
  blocks: [],
  audit: [
    { at: '2026-10-01T10:00:00Z', action: 'journey-planned' },
    { at: '2026-10-01T10:20:00Z', action: 'journey-replanned', ref: 'routing-proof-2' }
  ]
} as any;

const receipt = {
  schemaVersion: 1 as const,
  providerId,
  receiptId: 'yclients-record-1-update',
  handoffId: 'yclients-record-1',
  providerEntityId: '1',
  outcome: 'confirmed' as const,
  occurredAt: '2026-10-01T10:25:00Z',
  evidenceRef: 'yclients://webhook/record/1/update'
};

const events = [
  { step: 'snapshot-ingested', at: '2026-10-01T10:05:05Z', evidenceRef: 'ingestion.json', providerId, snapshotId: 'snap-real-1' },
  { step: 'live-block-verified', at: '2026-10-01T10:06:00Z', evidenceRef: 'projection.json', providerId, blockId: 'record-1' },
  { step: 'provider-change-observed', at: '2026-10-01T10:20:00Z', evidenceRef: 'provider-change.json', providerId, blockId: 'record-1' },
  { step: 'replan-produced', at: '2026-10-01T10:21:00Z', evidenceRef: 'replan.json', providerId, routingProofRef: 'routing-proof-2' },
  { step: 'journey-resumed', at: '2026-10-01T10:22:00Z', evidenceRef: 'runtime.json', providerId, blockId: 'replacement-record' },
  { step: 'provider-receipt-observed', at: '2026-10-01T10:25:00Z', evidenceRef: 'provider-receipt.json', providerId, receiptId: receipt.receiptId }
] as any;

function buildValidRun() {
  const admissionResult = validateRealProviderAdmission(admission as any);
  const integrationProof = buildProviderIntegrationHarnessResult({
    ingestionRecord: ingestion,
    runtime,
    receipt,
    events
  });
  const journeyEvidencePack = buildJourneyEvidencePack({
    generatedAt: '2026-10-01T10:30:00Z',
    ingestion,
    runtime,
    receipt,
    integrationProof
  });

  const names = [
    'credentials',
    'capabilities',
    'schema-mapping',
    'raw-snapshot',
    'ingestion',
    'projection',
    'provider-change',
    'replan',
    'runtime',
    'provider-receipt',
    'journey-evidence-pack'
  ];

  return {
    version: 1 as const,
    runId: 'yclients-real-run-1',
    providerId,
    startedAt: '2026-10-01T10:00:00Z',
    completedAt: '2026-10-01T10:31:00Z',
    admission: admission as any,
    admissionResult,
    journeyEvidencePack,
    archive: names.map((name, index) => ({
      path: `${name}/${String(index + 1).padStart(2, '0')}.json`,
      sha256: (index + 1).toString(16).padStart(64, '0'),
      evidenceRef: `archive://${name}/${index + 1}`
    }))
  };
}

test('provider proof remains blocked and signing locked without real evidence', () => {
  const gate = evaluateProviderProofGate({
    providerId,
    runtimeCredentialsConfigured: false
  });
  assert.equal(gate.status, 'blocked');
  assert.equal(gate.evidenceSigningAuthority, 'locked');
  assert.ok(gate.blockers.includes('real-provider-evidence-run-missing'));
  assert.ok(gate.blockers.includes('provider-runtime-credentials-not-configured'));
});

test('configured credentials alone do not unlock Evidence Signing Authority', () => {
  const gate = evaluateProviderProofGate({
    providerId,
    runtimeCredentialsConfigured: true,
    admission: admission as any
  });
  assert.equal(gate.status, 'blocked');
  assert.equal(gate.checkpoints.admissionPassed, true);
  assert.equal(gate.evidenceSigningAuthority, 'locked');
  assert.ok(gate.blockers.includes('real-provider-evidence-run-missing'));
});

test('validated provider evidence run unlocks signing even after runtime credentials are rotated away', () => {
  const run = buildValidRun();
  const gate = evaluateProviderProofGate({
    providerId,
    runtimeCredentialsConfigured: false,
    evidenceRun: run as any
  });
  assert.equal(gate.status, 'pass');
  assert.equal(gate.checkpoints.admissionPassed, true);
  assert.equal(gate.checkpoints.realEvidenceRunPassed, true);
  assert.equal(gate.checkpoints.journeyEvidenceIntegrity, true);
  assert.equal(gate.evidenceSigningAuthority, 'available');
});

test('tampered Journey Evidence Pack relocks signing', () => {
  const run = buildValidRun();
  run.journeyEvidencePack = {
    ...run.journeyEvidencePack,
    summary: {
      ...run.journeyEvidencePack.summary,
      evidenceEventCount: 999
    }
  };

  const gate = evaluateProviderProofGate({
    providerId,
    runtimeCredentialsConfigured: true,
    evidenceRun: run as any
  });
  assert.equal(gate.status, 'blocked');
  assert.equal(gate.evidenceSigningAuthority, 'locked');
  assert.ok(gate.blockers.some((blocker) => blocker.includes('journey-evidence-pack-integrity-failed')));
});

test('real-provider run cannot trust a forged admitted result when admission evidence is invalid', () => {
  const run = buildValidRun();
  run.admission = {
    ...run.admission,
    credentials: {
      ...run.admission.credentials,
      evidenceRef: ''
    }
  };

  const result = validateRealProviderEvidenceRun(run as any);
  assert.equal(result.status, 'blocked');
  assert.ok(result.blockers.includes('provider-admission:credential-admission-evidence-missing'));
});


test('separate admission evidence must match the admission embedded in the evidence run', () => {
  const run = buildValidRun();
  const otherAdmission = {
    ...admission,
    credentials: {
      ...admission.credentials,
      evidenceRef: 'evidence/credentials/different-admission.json'
    }
  };

  const gate = evaluateProviderProofGate({
    providerId,
    runtimeCredentialsConfigured: true,
    admission: otherAdmission as any,
    evidenceRun: run as any
  });

  assert.equal(gate.status, 'blocked');
  assert.equal(gate.evidenceSigningAuthority, 'locked');
  assert.ok(gate.blockers.includes('provider-admission-evidence-mismatch'));
});
