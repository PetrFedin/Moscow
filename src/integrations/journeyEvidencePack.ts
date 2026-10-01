import { createHash } from 'node:crypto';

import type { DestinationJourneyRuntime } from '../travel/destinationJourneyRuntime.ts';
import type { LiveProviderIngestionRecord } from '../travel/liveProviderIngestion.ts';
import type { ProviderSandboxReceipt } from './providerSandboxContract.ts';
import type { ProviderIntegrationHarnessResult } from './providerIntegrationHarness.ts';

export const JOURNEY_EVIDENCE_PACK_VERSION = 1 as const;

export type JourneyEvidencePack = {
  version: typeof JOURNEY_EVIDENCE_PACK_VERSION;
  kind: 'moscow-destination-journey-evidence-pack';
  journeyId: string;
  destinationId: string;
  providerId: string;
  generatedAt: string;
  source: {
    ingestion: LiveProviderIngestionRecord;
    runtime: DestinationJourneyRuntime;
    receipt: ProviderSandboxReceipt;
    integrationProof: ProviderIntegrationHarnessResult;
  };
  summary: {
    planVersion: number;
    runtimeState: DestinationJourneyRuntime['state'];
    auditEventCount: number;
    evidenceEventCount: number;
    providerReceiptOutcome: ProviderSandboxReceipt['outcome'];
  };
  integrity: {
    algorithm: 'sha256';
    canonicalPayloadSha256: string;
  };
};

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalize(nested)}`);
  return `{${entries.join(',')}}`;
}

export function hashJourneyEvidencePayload(value: unknown) {
  return createHash('sha256').update(canonicalize(value)).digest('hex');
}

export function buildJourneyEvidencePack(input: {
  generatedAt: string;
  ingestion: LiveProviderIngestionRecord;
  runtime: DestinationJourneyRuntime;
  receipt: ProviderSandboxReceipt;
  integrationProof: ProviderIntegrationHarnessResult;
}): JourneyEvidencePack {
  if (!Number.isFinite(Date.parse(input.generatedAt))) {
    throw new Error('Journey evidence pack generatedAt must be valid ISO');
  }
  if (input.integrationProof.status !== 'complete') {
    throw new Error('Journey evidence pack requires complete provider integration proof');
  }
  if (input.receipt.outcome === 'observed') {
    throw new Error('Journey evidence pack requires terminal provider receipt outcome');
  }
  if (input.runtime.state !== 'executed' && input.runtime.state !== 'executing') {
    throw new Error('Journey evidence pack requires resumed or executed runtime');
  }
  if (input.runtime.planVersion < 2) {
    throw new Error('Journey evidence pack requires at least one verified replan');
  }
  if (input.ingestion.providerId !== input.receipt.providerId) {
    throw new Error('Journey evidence pack provider mismatch');
  }
  if (input.integrationProof.providerId !== input.ingestion.providerId) {
    throw new Error('Journey evidence pack integration proof provider mismatch');
  }

  const payload = {
    version: JOURNEY_EVIDENCE_PACK_VERSION,
    kind: 'moscow-destination-journey-evidence-pack' as const,
    journeyId: input.runtime.journeyId,
    destinationId: input.runtime.destinationId,
    providerId: input.ingestion.providerId,
    generatedAt: input.generatedAt,
    source: {
      ingestion: input.ingestion,
      runtime: input.runtime,
      receipt: input.receipt,
      integrationProof: input.integrationProof
    },
    summary: {
      planVersion: input.runtime.planVersion,
      runtimeState: input.runtime.state,
      auditEventCount: input.runtime.audit.length,
      evidenceEventCount: input.integrationProof.evidence.length,
      providerReceiptOutcome: input.receipt.outcome
    }
  };

  return {
    ...payload,
    integrity: {
      algorithm: 'sha256',
      canonicalPayloadSha256: hashJourneyEvidencePayload(payload)
    }
  };
}

export function verifyJourneyEvidencePack(pack: JourneyEvidencePack) {
  const payload = {
    version: pack.version,
    kind: pack.kind,
    journeyId: pack.journeyId,
    destinationId: pack.destinationId,
    providerId: pack.providerId,
    generatedAt: pack.generatedAt,
    source: pack.source,
    summary: pack.summary
  };
  const computed = hashJourneyEvidencePayload(payload);
  return {
    valid: computed === pack.integrity.canonicalPayloadSha256,
    expectedSha256: pack.integrity.canonicalPayloadSha256,
    computedSha256: computed
  };
}
