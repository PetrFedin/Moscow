import type {
  LiveDestinationEntity,
  LiveDestinationProvider
} from '../travel/liveDestinationAuthority.ts';
import type {
  LiveProviderRefreshPolicy,
  LiveProviderSnapshot
} from '../travel/liveProviderIngestion.ts';

export const PROVIDER_SANDBOX_CONTRACT_VERSION = 1 as const;

export type ProviderSandboxKind =
  | 'city-tourism'
  | 'ticketing'
  | 'restaurant'
  | 'venue'
  | 'events';

export type ProviderSandboxReceipt = {
  schemaVersion: 1;
  providerId: string;
  receiptId: string;
  handoffId: string;
  providerEntityId: string;
  outcome: 'observed' | 'confirmed' | 'rejected' | 'cancelled' | 'expired';
  occurredAt: string;
  evidenceRef: string;
};

export type ProviderSandboxAdapter<TPayload = unknown> = {
  contractVersion: typeof PROVIDER_SANDBOX_CONTRACT_VERSION;
  id: string;
  kind: ProviderSandboxKind;
  destinationId: string;
  provider: LiveDestinationProvider;
  refreshPolicy: LiveProviderRefreshPolicy;
  normalizeSnapshot: (
    snapshot: LiveProviderSnapshot<TPayload>
  ) => LiveDestinationEntity[];
  normalizeReceipt?: (payload: unknown) => ProviderSandboxReceipt;
};

function validIso(value: string) {
  return Number.isFinite(Date.parse(value));
}

export function validateProviderSandboxAdapter(
  adapter: ProviderSandboxAdapter
) {
  const blockers: string[] = [];
  if (adapter.contractVersion !== PROVIDER_SANDBOX_CONTRACT_VERSION) blockers.push('sandbox-contract-version-invalid');
  if (!adapter.id.trim()) blockers.push('sandbox-adapter-id-missing');
  if (!adapter.destinationId.trim()) blockers.push('sandbox-destination-id-missing');
  if (!adapter.provider.id.trim()) blockers.push('sandbox-provider-id-missing');
  if (!adapter.provider.sourceUrl.startsWith('https://')) blockers.push('sandbox-provider-source-url-invalid');
  if (adapter.refreshPolicy.expectedRefreshSeconds <= 0) blockers.push('sandbox-refresh-interval-invalid');
  if (adapter.refreshPolicy.hardMaxSnapshotAgeSeconds < adapter.refreshPolicy.expectedRefreshSeconds) {
    blockers.push('sandbox-hard-max-age-invalid');
  }
  return { valid: blockers.length === 0, blockers };
}

export function validateProviderSandboxReceipt(
  receipt: ProviderSandboxReceipt,
  expectedProviderId?: string
) {
  const blockers: string[] = [];
  if (receipt.schemaVersion !== 1) blockers.push('sandbox-receipt-version-invalid');
  if (!receipt.providerId.trim()) blockers.push('sandbox-receipt-provider-id-missing');
  if (expectedProviderId && receipt.providerId !== expectedProviderId) blockers.push('sandbox-receipt-provider-mismatch');
  if (!receipt.receiptId.trim()) blockers.push('sandbox-receipt-id-missing');
  if (!receipt.handoffId.trim()) blockers.push('sandbox-receipt-handoff-id-missing');
  if (!receipt.providerEntityId.trim()) blockers.push('sandbox-receipt-entity-id-missing');
  if (!['observed', 'confirmed', 'rejected', 'cancelled', 'expired'].includes(receipt.outcome)) blockers.push('sandbox-receipt-outcome-invalid');
  if (!validIso(receipt.occurredAt)) blockers.push('sandbox-receipt-time-invalid');
  if (!receipt.evidenceRef.trim()) blockers.push('sandbox-receipt-evidence-missing');
  return { valid: blockers.length === 0, blockers };
}

export function providerSandboxConformanceSummary(
  adapter: ProviderSandboxAdapter
) {
  const validation = validateProviderSandboxAdapter(adapter);
  return {
    adapterId: adapter.id,
    providerId: adapter.provider.id,
    kind: adapter.kind,
    destinationId: adapter.destinationId,
    valid: validation.valid,
    blockers: validation.blockers,
    supportsOperationalStatus: adapter.provider.capabilities.includes('operational-status'),
    supportsEventSchedule: adapter.provider.capabilities.includes('event-schedule'),
    supportsBookingHandoff: adapter.provider.capabilities.includes('booking-handoff'),
    supportsBookingReceipt: Boolean(adapter.normalizeReceipt)
  };
}
