import type { LiveDestinationEntity, LiveDestinationProvider } from '../travel/liveDestinationAuthority.ts';
import type { LiveProviderSnapshot } from '../travel/liveProviderIngestion.ts';
import type { ProviderSandboxAdapter, ProviderSandboxReceipt } from './providerSandboxContract.ts';

export type YclientsBookingRecord = {
  id: number;
  company_id?: number;
  datetime?: string;
  date?: string;
  attendance?: number;
  visit_attendance?: number;
  confirmed?: number;
  deleted?: boolean;
  online?: boolean;
  prepaid?: boolean;
  prepaid_confirmed?: boolean;
  last_change_date?: string;
  services?: Array<{ id?: number; title?: string }>;
};

export type YclientsWebhook = {
  company_id: number;
  resource: string;
  resource_id: number;
  status: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
};

export const YCLIENTS_PROVIDER_ID = 'yclients' as const;

export const yclientsProvider: LiveDestinationProvider = {
  id: YCLIENTS_PROVIDER_ID,
  name: 'YCLIENTS',
  relationship: 'booking-provider',
  capabilities: ['booking-handoff'],
  sourceUrl: 'https://api.yclients.com',
  attributionRu: 'Данные бронирования: YCLIENTS',
  attributionEn: 'Booking data: YCLIENTS',
  attributionZh: '预订数据：YCLIENTS'
};

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function bookingStatus(record: YclientsBookingRecord) {
  if (record.deleted) return 'closed' as const;
  if (record.attendance === -1 || record.visit_attendance === -1) return 'closed' as const;
  return 'open' as const;
}

export function normalizeYclientsBookingRecord(
  record: YclientsBookingRecord,
  snapshot: LiveProviderSnapshot<unknown>,
  options: {
    entityId: string;
    titleRu: string;
    titleEn: string;
    titleZh: string;
    latitude: number;
    longitude: number;
    bookingUrl: string;
    expiresAt: string;
  }
): LiveDestinationEntity {
  const observedAt = text(record.last_change_date) ?? snapshot.fetchedAt;
  return {
    id: options.entityId,
    providerEntityId: String(record.id),
    providerId: YCLIENTS_PROVIDER_ID,
    kind: 'activity',
    titleRu: options.titleRu,
    titleEn: options.titleEn,
    titleZh: options.titleZh,
    latitude: options.latitude,
    longitude: options.longitude,
    tags: ['booking', 'service'],
    sourceUrl: yclientsProvider.sourceUrl,
    observedAt,
    expiresAt: options.expiresAt,
    operationalStatus: bookingStatus(record),
    booking: {
      mode: 'external-provider',
      provider: 'YCLIENTS',
      action: 'reserve',
      url: options.bookingUrl,
      providerId: YCLIENTS_PROVIDER_ID,
      verifiedAt: snapshot.fetchedAt,
      expiresAt: options.expiresAt
    }
  };
}

export function normalizeYclientsWebhookReceipt(
  payload: unknown,
  receiverObservedAt?: string
): ProviderSandboxReceipt {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('YCLIENTS webhook receipt must be an object');
  }
  const webhook = payload as Partial<YclientsWebhook>;
  if (webhook.resource !== 'record') {
    throw new Error('YCLIENTS receipt requires record webhook');
  }
  if (!Number.isInteger(webhook.resource_id)) {
    throw new Error('YCLIENTS receipt requires record resource_id');
  }
  if (webhook.status !== 'create' && webhook.status !== 'update' && webhook.status !== 'delete') {
    throw new Error('YCLIENTS receipt status is invalid');
  }

  const data = (webhook.data ?? {}) as Record<string, unknown>;
  const deleted = data.deleted === true || webhook.status === 'delete';
  const attendance =
    typeof data.attendance === 'number'
      ? data.attendance
      : typeof data.visit_attendance === 'number'
        ? data.visit_attendance
        : undefined;
  const confirmed =
    typeof data.confirmed === 'number'
      ? data.confirmed
      : undefined;

  const outcome: ProviderSandboxReceipt['outcome'] =
    deleted || attendance === -1
      ? 'cancelled'
      : confirmed === 1 || confirmed === 2 || attendance === 1 || attendance === 2
        ? 'confirmed'
        : 'observed';

  const providerOccurredAt =
    text(data.last_change_date)
    ?? text(data.create_date)
    ?? text(data.datetime)
    ?? text(data.date);
  const observedAt = text(receiverObservedAt);
  const occurredAt = providerOccurredAt ?? observedAt;

  if (!occurredAt || !Number.isFinite(Date.parse(occurredAt))) {
    throw new Error('YCLIENTS receipt requires provider timestamp or receiver observed time');
  }

  return {
    schemaVersion: 1,
    providerId: YCLIENTS_PROVIDER_ID,
    receiptId: `yclients-record-${webhook.resource_id}-${webhook.status}-${occurredAt}`,
    handoffId: `yclients-record-${webhook.resource_id}`,
    providerEntityId: String(webhook.resource_id),
    outcome,
    occurredAt,
    evidenceRef: `yclients://webhook/record/${webhook.resource_id}/${webhook.status}`
  };
}

export function createYclientsSandboxAdapter(input: {
  destinationId: string;
  entityOptions: {
    entityId: string;
    titleRu: string;
    titleEn: string;
    titleZh: string;
    latitude: number;
    longitude: number;
    bookingUrl: string;
    expiresAt: string;
  };
}): ProviderSandboxAdapter<YclientsBookingRecord> {
  return {
    contractVersion: 1,
    id: 'yclients-booking-v1',
    kind: 'venue',
    destinationId: input.destinationId,
    provider: yclientsProvider,
    refreshPolicy: {
      expectedRefreshSeconds: 60,
      hardMaxSnapshotAgeSeconds: 300,
      retryAfterSeconds: 30
    },
    normalizeSnapshot: (snapshot) =>
      [normalizeYclientsBookingRecord(snapshot.payload, snapshot, input.entityOptions)],
    normalizeReceipt: normalizeYclientsWebhookReceipt
  };
}
