import assert from 'node:assert/strict';
import test from 'node:test';

import { validateRealProviderAdmission } from '../src/integrations/realProviderAdmission.ts';
import { buildEvidenceArchiveManifest, verifyEvidenceArchiveManifest } from '../src/integrations/realProviderEvidenceRun.ts';

test('credentialed provider admission fails without secret reference', () => {
  const result = validateRealProviderAdmission({
    version: 1,
    providerId: 'tickets',
    adapterId: 'tickets-v1',
    kind: 'ticketing',
    destinationId: 'moscow',
    sourceUrl: 'https://provider.example/feed',
    credentials: {
      mode: 'api-key',
      admittedAt: '2026-09-30T10:00:00Z',
      evidenceRef: 'evidence/admission.json'
    },
    discoveredCapabilities: ['operational-status', 'booking-handoff', 'booking-receipt'],
    capabilityEvidenceRef: 'evidence/capabilities.json',
    schemaMapping: {
      providerSchemaVersion: '2026-09',
      mappingVersion: '1',
      entityIdPath: '$.id',
      updatedAtPath: '$.updated_at',
      statusPath: '$.status',
      bookingUrlPath: '$.booking_url',
      receiptIdPath: '$.receipt_id',
      evidenceRef: 'evidence/schema-mapping.json'
    }
  });
  assert.equal(result.status, 'blocked');
  assert.ok(result.blockers.includes('credential-secret-ref-missing'));
});

test('public feed may be admitted without a secret', () => {
  const result = validateRealProviderAdmission({
    version: 1,
    providerId: 'city-feed',
    adapterId: 'city-feed-v1',
    kind: 'city-tourism',
    destinationId: 'moscow',
    sourceUrl: 'https://provider.example/feed',
    credentials: {
      mode: 'public-feed',
      admittedAt: '2026-09-30T10:00:00Z',
      evidenceRef: 'evidence/admission.json'
    },
    discoveredCapabilities: ['operational-status'],
    capabilityEvidenceRef: 'evidence/capabilities.json',
    schemaMapping: {
      providerSchemaVersion: '1',
      mappingVersion: '1',
      entityIdPath: '$.id',
      updatedAtPath: '$.updated_at',
      statusPath: '$.status',
      evidenceRef: 'evidence/schema-mapping.json'
    }
  });
  assert.equal(result.status, 'admitted');
});

test('archive manifest is deterministic and tamper evident', () => {
  const entries = [
    { path: 'raw-snapshot/001.json', sha256: 'a'.repeat(64), evidenceRef: 'provider://snapshot/001' },
    { path: 'provider-receipt/001.json', sha256: 'b'.repeat(64), evidenceRef: 'provider://receipt/001' }
  ];
  const manifest = buildEvidenceArchiveManifest({
    runId: 'run-001',
    providerId: 'provider-1',
    createdAt: '2026-09-30T18:00:00Z',
    entries
  });
  assert.equal(verifyEvidenceArchiveManifest(manifest), true);
  const tampered = {
    ...manifest,
    entries: [{ ...manifest.entries[0]!, sha256: 'c'.repeat(64) }, ...manifest.entries.slice(1)]
  };
  assert.equal(verifyEvidenceArchiveManifest(tampered), false);
});
