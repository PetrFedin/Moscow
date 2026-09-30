import type { DestinationJourneyRuntime } from '../travel/destinationJourneyRuntime.ts';
import type { LiveProviderIngestionRecord } from '../travel/liveProviderIngestion.ts';
import type { ProviderSandboxReceipt } from './providerSandboxContract.ts';

export const PROVIDER_INTEGRATION_PROOF_VERSION = 1 as const;

export type ProviderIntegrationProofStep =
  | 'snapshot-ingested'
  | 'live-block-verified'
  | 'provider-change-observed'
  | 'replan-produced'
  | 'journey-resumed'
  | 'provider-receipt-observed';

export type ProviderIntegrationProofEvent = {
  step: ProviderIntegrationProofStep;
  at: string;
  evidenceRef: string;
  providerId?: string;
  blockId?: string;
  snapshotId?: string;
  routingProofRef?: string;
  receiptId?: string;
};

export type ProviderIntegrationHarnessResult = {
  version: typeof PROVIDER_INTEGRATION_PROOF_VERSION;
  status: 'blocked' | 'complete';
  providerId: string | null;
  journeyId: string | null;
  completedSteps: ProviderIntegrationProofStep[];
  missingSteps: ProviderIntegrationProofStep[];
  evidence: ProviderIntegrationProofEvent[];
  blockers: string[];
};

const REQUIRED_STEPS: ProviderIntegrationProofStep[] = [
  'snapshot-ingested',
  'live-block-verified',
  'provider-change-observed',
  'replan-produced',
  'journey-resumed',
  'provider-receipt-observed'
];

function validIso(value: string) {
  return Number.isFinite(Date.parse(value));
}

export function validateProviderIntegrationProofEvent(
  event: ProviderIntegrationProofEvent
) {
  const blockers: string[] = [];
  if (!REQUIRED_STEPS.includes(event.step)) blockers.push('integration-proof-step-invalid');
  if (!validIso(event.at)) blockers.push('integration-proof-time-invalid');
  if (!event.evidenceRef.trim()) blockers.push('integration-proof-evidence-ref-missing');

  if (event.step === 'snapshot-ingested' && !event.snapshotId?.trim()) {
    blockers.push('integration-proof-snapshot-id-missing');
  }
  if (
    (event.step === 'live-block-verified'
      || event.step === 'provider-change-observed'
      || event.step === 'journey-resumed')
    && !event.blockId?.trim()
  ) {
    blockers.push('integration-proof-block-id-missing');
  }
  if (event.step === 'replan-produced' && !event.routingProofRef?.trim()) {
    blockers.push('integration-proof-routing-proof-missing');
  }
  if (event.step === 'provider-receipt-observed' && !event.receiptId?.trim()) {
    blockers.push('integration-proof-receipt-id-missing');
  }
  return { valid: blockers.length === 0, blockers };
}

export function buildProviderIntegrationHarnessResult(input: {
  ingestionRecord?: LiveProviderIngestionRecord;
  runtime?: DestinationJourneyRuntime;
  events: ProviderIntegrationProofEvent[];
  receipt?: ProviderSandboxReceipt;
}): ProviderIntegrationHarnessResult {
  const blockers: string[] = [];
  const evidence = [...input.events].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  for (const event of evidence) {
    const validation = validateProviderIntegrationProofEvent(event);
    blockers.push(...validation.blockers.map((item) => `${event.step}:${item}`));
  }

  const uniqueSteps = new Set<ProviderIntegrationProofStep>();
  for (const event of evidence) uniqueSteps.add(event.step);

  if (!input.ingestionRecord) {
    blockers.push('integration-ingestion-record-missing');
  } else {
    if (!uniqueSteps.has('snapshot-ingested')) blockers.push('integration-snapshot-step-missing');
    const event = evidence.find((item) => item.step === 'snapshot-ingested');
    if (event?.providerId && event.providerId !== input.ingestionRecord.providerId) {
      blockers.push('integration-provider-mismatch');
    }
    if (event?.snapshotId && event.snapshotId !== input.ingestionRecord.snapshotId) {
      blockers.push('integration-snapshot-mismatch');
    }
  }

  if (!input.runtime) {
    blockers.push('integration-runtime-missing');
  } else {
    if (input.runtime.state !== 'executing' && input.runtime.state !== 'executed') {
      blockers.push('integration-runtime-not-resumed');
    }
    if (input.runtime.planVersion < 2) blockers.push('integration-runtime-was-not-replanned');
    if (!input.runtime.audit.some((item) => item.action === 'journey-replanned')) {
      blockers.push('integration-replan-audit-missing');
    }
  }

  if (!input.receipt) {
    blockers.push('integration-provider-receipt-missing');
  } else {
    if (!uniqueSteps.has('provider-receipt-observed')) blockers.push('integration-receipt-step-missing');
    const event = evidence.find((item) => item.step === 'provider-receipt-observed');
    if (event?.providerId && event.providerId !== input.receipt.providerId) {
      blockers.push('integration-receipt-provider-mismatch');
    }
    if (event?.receiptId && event.receiptId !== input.receipt.receiptId) {
      blockers.push('integration-receipt-id-mismatch');
    }
  }

  const completedSteps = REQUIRED_STEPS.filter((step) => uniqueSteps.has(step));
  const missingSteps = REQUIRED_STEPS.filter((step) => !uniqueSteps.has(step));
  if (missingSteps.length > 0) blockers.push(...missingSteps.map((step) => `integration-step-missing:${step}`));

  const providerIds = new Set(
    evidence.map((event) => event.providerId).filter((value): value is string => Boolean(value))
  );
  if (input.ingestionRecord) providerIds.add(input.ingestionRecord.providerId);
  if (input.receipt) providerIds.add(input.receipt.providerId);
  if (providerIds.size > 1) blockers.push('integration-multiple-provider-authorities');

  return {
    version: PROVIDER_INTEGRATION_PROOF_VERSION,
    status: blockers.length === 0 ? 'complete' : 'blocked',
    providerId: providerIds.size === 1 ? [...providerIds][0]! : null,
    journeyId: input.runtime?.journeyId ?? null,
    completedSteps,
    missingSteps,
    evidence,
    blockers: [...new Set(blockers)]
  };
}
