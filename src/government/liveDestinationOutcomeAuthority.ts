import type { LiveDestinationProjectionEntity } from '../travel/liveDestinationAuthority.ts';
import type { LiveProviderIngestionRecord } from '../travel/liveProviderIngestion.ts';

export const LIVE_DESTINATION_OUTCOME_VERSION = 1 as const;

export type OutcomeEvidenceAuthority =
  | 'app-aggregate'
  | 'provider-receipt-aggregate'
  | 'ingestion-audit';

export type OutcomeCounterEvidence = {
  count: number;
  authority: OutcomeEvidenceAuthority;
  evidenceRef: string;
};

export type LiveDestinationOutcomeInput = {
  destinationId: string;
  asOf: string;
  projectedEntities?: LiveDestinationProjectionEntity[];
  ingestionRecords?: LiveProviderIngestionRecord[];
  journeyStarts?: OutcomeCounterEvidence;
  heritageCompletions?: OutcomeCounterEvidence;
  liveEntityOpens?: OutcomeCounterEvidence;
  bookingHandoffOpens?: OutcomeCounterEvidence;
  providerConfirmedBookings?: OutcomeCounterEvidence;
  freshnessBlocks?: OutcomeCounterEvidence;
};

export type LiveDestinationOutcomeMetric = {
  id:
    | 'heritage-completion'
    | 'live-continuation'
    | 'booking-handoff'
    | 'provider-confirmed-booking';
  numerator: number;
  denominator: number;
  rate: number;
  basis: string;
  evidenceRef: string;
};

export type LiveDestinationOutcomeSnapshot = {
  version: typeof LIVE_DESTINATION_OUTCOME_VERSION;
  destinationId: string;
  asOf: string;
  providerState: 'not-connected' | 'connected-no-fresh-entities' | 'live';
  bookingState: 'not-evidenced' | 'handoff-only' | 'provider-confirmed';
  freshEntityCount: number;
  staleOrBlockedEntityCount: number;
  auditedProviderCount: number;
  metrics: LiveDestinationOutcomeMetric[];
  blockers: string[];
  interpretation: {
    handoffIsNotBookingSuccess: true;
    providerConfirmationRequiredForBookingSuccess: true;
    revenueNotInferred: true;
    availabilityNotInferred: true;
    citywideImpactNotInferred: true;
  };
};

function isValidCounter(value: OutcomeCounterEvidence | undefined) {
  return Boolean(
    value
      && Number.isInteger(value.count)
      && value.count >= 0
      && value.evidenceRef.trim()
  );
}

function ratio(
  id: LiveDestinationOutcomeMetric['id'],
  numerator: OutcomeCounterEvidence,
  denominator: OutcomeCounterEvidence,
  basis: string
): LiveDestinationOutcomeMetric {
  if (denominator.count <= 0) {
    throw new Error(`${id} denominator must be positive`);
  }
  if (numerator.count > denominator.count) {
    throw new Error(`${id} numerator cannot exceed denominator`);
  }
  return {
    id,
    numerator: numerator.count,
    denominator: denominator.count,
    rate: numerator.count / denominator.count,
    basis,
    evidenceRef: `${numerator.evidenceRef} | denominator: ${denominator.evidenceRef}`
  };
}

export function buildLiveDestinationOutcomeSnapshot(
  input: LiveDestinationOutcomeInput
): LiveDestinationOutcomeSnapshot {
  if (!input.destinationId.trim()) throw new Error('Destination outcome requires destinationId');
  if (!Number.isFinite(Date.parse(input.asOf))) throw new Error('Destination outcome requires valid asOf');

  const entities = input.projectedEntities ?? [];
  const records = input.ingestionRecords ?? [];
  const freshEntities = entities.filter((entity) => entity.freshness === 'fresh');
  const staleOrBlocked = entities.length - freshEntities.length;

  const providerIds = new Set(records.map((record) => record.providerId));
  const freshProviderIds = new Set(freshEntities.map((entity) => entity.providerId));

  const blockers: string[] = [];
  if (records.length === 0) blockers.push('live-provider-ingestion-evidence-missing');
  if (freshEntities.length === 0) blockers.push('fresh-live-entities-missing');

  const metrics: LiveDestinationOutcomeMetric[] = [];

  if (isValidCounter(input.journeyStarts) && isValidCounter(input.heritageCompletions)) {
    metrics.push(ratio(
      'heritage-completion',
      input.heritageCompletions!,
      input.journeyStarts!,
      'reviewed aggregate app evidence'
    ));
  } else {
    blockers.push('heritage-journey-outcome-evidence-missing');
  }

  if (isValidCounter(input.heritageCompletions) && isValidCounter(input.liveEntityOpens)) {
    metrics.push(ratio(
      'live-continuation',
      input.liveEntityOpens!,
      input.heritageCompletions!,
      'fresh live entity open after heritage completion'
    ));
  } else {
    blockers.push('live-continuation-evidence-missing');
  }

  if (isValidCounter(input.liveEntityOpens) && isValidCounter(input.bookingHandoffOpens)) {
    metrics.push(ratio(
      'booking-handoff',
      input.bookingHandoffOpens!,
      input.liveEntityOpens!,
      'client-observed handoff open; not booking success'
    ));
  } else {
    blockers.push('booking-handoff-evidence-missing');
  }

  const confirmed = input.providerConfirmedBookings;
  const handoffs = input.bookingHandoffOpens;
  if (isValidCounter(confirmed)) {
    if (confirmed!.authority !== 'provider-receipt-aggregate') {
      blockers.push('booking-confirmation-not-provider-authoritative');
    } else if (!isValidCounter(handoffs)) {
      blockers.push('booking-confirmation-denominator-missing');
    } else {
      metrics.push(ratio(
        'provider-confirmed-booking',
        confirmed!,
        handoffs!,
        'provider receipt aggregate only'
      ));
    }
  } else {
    blockers.push('provider-booking-confirmation-evidence-missing');
  }

  if (input.freshnessBlocks && !isValidCounter(input.freshnessBlocks)) {
    blockers.push('freshness-block-evidence-invalid');
  }

  const providerState =
    records.length === 0
      ? 'not-connected'
      : freshEntities.length === 0
        ? 'connected-no-fresh-entities'
        : 'live';

  const bookingState =
    metrics.some((metric) => metric.id === 'provider-confirmed-booking')
      ? 'provider-confirmed'
      : metrics.some((metric) => metric.id === 'booking-handoff')
        ? 'handoff-only'
        : 'not-evidenced';

  if (freshProviderIds.size > providerIds.size) {
    blockers.push('projection-provider-without-ingestion-audit');
  }

  return {
    version: LIVE_DESTINATION_OUTCOME_VERSION,
    destinationId: input.destinationId,
    asOf: input.asOf,
    providerState,
    bookingState,
    freshEntityCount: freshEntities.length,
    staleOrBlockedEntityCount: staleOrBlocked,
    auditedProviderCount: providerIds.size,
    metrics,
    blockers: [...new Set(blockers)],
    interpretation: {
      handoffIsNotBookingSuccess: true,
      providerConfirmationRequiredForBookingSuccess: true,
      revenueNotInferred: true,
      availabilityNotInferred: true,
      citywideImpactNotInferred: true
    }
  };
}

export const currentMoscowLiveOutcome = buildLiveDestinationOutcomeSnapshot({
  destinationId: 'moscow',
  asOf: '2026-09-30T00:00:00Z'
});
