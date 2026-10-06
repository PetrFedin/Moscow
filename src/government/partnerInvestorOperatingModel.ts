import { currentPilotInvestmentEvidence } from './pilotInvestmentDecision';

export type PartnerKind =
  | 'heritage'
  | 'restaurant'
  | 'hotel'
  | 'theatre'
  | 'event'
  | 'ticketing-provider'
  | 'booking-provider'
  | 'data-provider';

export type CommercialModel =
  | 'subscription'
  | 'cpa'
  | 'cps'
  | 'revenue-share'
  | 'sponsorship'
  | 'city-funded'
  | 'none';

export type PartnerAgreementStatus = 'not-started' | 'negotiation' | 'signed' | 'terminated';
export type FeedStatus = 'not-connected' | 'sandbox' | 'live';
export type EvidenceState = 'missing' | 'received' | 'accepted' | 'rejected';

export type PartnerAgreement = {
  status: PartnerAgreementStatus;
  model: CommercialModel;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  monthlyFeeRub: number | null;
  attributionFeeRub: number | null;
  revenueShareRate: number | null;
  contractRef: string | null;
};

export type PartnerFeed = {
  status: FeedStatus;
  freshnessSlaMinutes: number | null;
  lastAuthoritativeSyncAt: string | null;
  evidenceRef: string | null;
};

export type PartnerAccount = {
  id: string;
  kind: PartnerKind;
  legalName: string;
  verified: boolean;
  agreement: PartnerAgreement;
  feed: PartnerFeed;
};

export type TravelerHandoff = {
  id: string;
  partnerId: string;
  occurredAt: string;
  offerId: string | null;
  providerUrl: string;
  consentScope: 'aggregate-attribution' | 'none';
};

export type ProviderConfirmation = {
  handoffId: string;
  providerTransactionRef: string;
  confirmedAt: string;
  terminalState: 'booked' | 'purchased' | 'completed' | 'cancelled' | 'refunded';
  grossTransactionAmountRub: number | null;
  evidenceRef: string;
};

export type AttributionRecord = {
  id: string;
  handoffId: string;
  partnerId: string;
  providerTransactionRef: string;
  attributedAt: string;
  model: Exclude<CommercialModel, 'none'>;
  evidenceRef: string;
};

export type RevenueLedgerEntry = {
  id: string;
  partnerId: string;
  attributionId: string | null;
  contractRef: string;
  recognizedAt: string;
  revenueType: 'subscription' | 'attribution' | 'sponsorship' | 'city-contract';
  amountRub: number;
  directVariableCostRub: number | null;
  evidenceRefs: string[];
  settlementState: 'not-due' | 'eligible' | 'invoiced' | 'paid' | 'reversed';
};

export type SettlementEvidence = {
  ledgerEntryId: string;
  invoiceRef: string | null;
  providerReconciliationRef: string | null;
  acceptanceRef: string | null;
  paidRef: string | null;
};

export type CommercialOperatingEvidence = {
  partners: PartnerAccount[];
  handoffs: TravelerHandoff[];
  confirmations: ProviderConfirmation[];
  attributions: AttributionRecord[];
  ledger: RevenueLedgerEntry[];
  settlements: SettlementEvidence[];
  verifiedExternalRegions: Array<{
    regionId: string;
    acceptedReferenceRef: string;
  }>;
};

export const currentCommercialOperatingEvidence: CommercialOperatingEvidence = {
  partners: [],
  handoffs: [],
  confirmations: [],
  attributions: [],
  ledger: [],
  settlements: [],
  verifiedExternalRegions: []
};

function finiteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function finiteRate(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validatePartnerAccount(partner: PartnerAccount) {
  const blockers: string[] = [];

  if (!partner.id.trim()) blockers.push('partner-id-missing');
  if (!partner.legalName.trim()) blockers.push('partner-legal-name-missing');

  const agreement = partner.agreement;
  if (agreement.status === 'signed') {
    if (!agreement.contractRef?.trim()) blockers.push('signed-contract-ref-missing');
    if (!agreement.effectiveFrom) blockers.push('signed-effective-from-missing');
    if (agreement.model === 'none') blockers.push('signed-commercial-model-missing');

    if (agreement.monthlyFeeRub !== null && !finiteNonNegative(agreement.monthlyFeeRub)) {
      blockers.push('monthly-fee-invalid');
    }
    if (agreement.attributionFeeRub !== null && !finiteNonNegative(agreement.attributionFeeRub)) {
      blockers.push('attribution-fee-invalid');
    }
    if (agreement.revenueShareRate !== null && !finiteRate(agreement.revenueShareRate)) {
      blockers.push('revenue-share-rate-invalid');
    }
  }

  if (partner.feed.status === 'live') {
    if (!partner.feed.evidenceRef?.trim()) blockers.push('live-feed-evidence-missing');
    if (!partner.feed.lastAuthoritativeSyncAt) blockers.push('live-feed-sync-missing');
    if (
      partner.feed.freshnessSlaMinutes === null
      || !Number.isFinite(partner.feed.freshnessSlaMinutes)
      || partner.feed.freshnessSlaMinutes <= 0
    ) {
      blockers.push('live-feed-sla-invalid');
    }
  }

  return { valid: blockers.length === 0, blockers };
}

export function canAttributeHandoff(
  evidence: CommercialOperatingEvidence,
  handoffId: string
) {
  const handoff = evidence.handoffs.find((item) => item.id === handoffId);
  if (!handoff) return { eligible: false, reason: 'handoff-missing' as const };

  const partner = evidence.partners.find((item) => item.id === handoff.partnerId);
  if (!partner) return { eligible: false, reason: 'partner-missing' as const };
  if (!partner.verified) return { eligible: false, reason: 'partner-not-verified' as const };
  if (partner.agreement.status !== 'signed') {
    return { eligible: false, reason: 'commercial-agreement-not-signed' as const };
  }

  const confirmation = evidence.confirmations.find((item) => item.handoffId === handoffId);
  if (!confirmation) return { eligible: false, reason: 'provider-confirmation-missing' as const };
  if (confirmation.terminalState === 'cancelled' || confirmation.terminalState === 'refunded') {
    return { eligible: false, reason: 'provider-state-not-revenue-eligible' as const };
  }
  if (!confirmation.evidenceRef.trim()) {
    return { eligible: false, reason: 'provider-evidence-missing' as const };
  }

  return {
    eligible: true,
    reason: 'provider-confirmed' as const,
    handoff,
    partner,
    confirmation
  };
}

export function calculateAttributionRevenueRub(
  partner: PartnerAccount,
  confirmation: ProviderConfirmation
) {
  const agreement = partner.agreement;
  if (agreement.status !== 'signed') return null;

  if (agreement.model === 'cpa' || agreement.model === 'cps') {
    return agreement.attributionFeeRub;
  }

  if (agreement.model === 'revenue-share') {
    if (
      agreement.revenueShareRate === null
      || confirmation.grossTransactionAmountRub === null
    ) return null;
    return Math.round(
      confirmation.grossTransactionAmountRub * agreement.revenueShareRate
    );
  }

  return null;
}

export function validateRevenueLedgerEntry(
  entry: RevenueLedgerEntry,
  evidence: CommercialOperatingEvidence
) {
  const blockers: string[] = [];

  if (!entry.contractRef.trim()) blockers.push('contract-ref-missing');
  if (!finiteNonNegative(entry.amountRub)) blockers.push('revenue-amount-invalid');
  if (entry.evidenceRefs.length === 0 || entry.evidenceRefs.some((item) => !item.trim())) {
    blockers.push('revenue-evidence-missing');
  }
  if (
    entry.directVariableCostRub !== null
    && !finiteNonNegative(entry.directVariableCostRub)
  ) {
    blockers.push('direct-variable-cost-invalid');
  }

  if (entry.revenueType === 'attribution') {
    if (!entry.attributionId) {
      blockers.push('attribution-id-missing');
    } else {
      const attribution = evidence.attributions.find((item) => item.id === entry.attributionId);
      if (!attribution) blockers.push('attribution-record-missing');
    }
  }

  return { valid: blockers.length === 0, blockers };
}

export function isSettlementEligible(
  entry: RevenueLedgerEntry,
  settlement: SettlementEvidence | undefined,
  evidence: CommercialOperatingEvidence
) {
  const validation = validateRevenueLedgerEntry(entry, evidence);
  if (!validation.valid) {
    return { eligible: false, reason: 'ledger-invalid' as const, blockers: validation.blockers };
  }

  if (!settlement) {
    return { eligible: false, reason: 'settlement-evidence-missing' as const, blockers: [] };
  }

  if (!settlement.acceptanceRef?.trim()) {
    return { eligible: false, reason: 'acceptance-evidence-missing' as const, blockers: [] };
  }

  if (entry.revenueType === 'attribution' && !settlement.providerReconciliationRef?.trim()) {
    return { eligible: false, reason: 'provider-reconciliation-missing' as const, blockers: [] };
  }

  return { eligible: true, reason: 'evidence-complete' as const, blockers: [] };
}

export type InvestorOperatingSnapshot = {
  signedCommercialContracts: number;
  activeRecurringContracts: number;
  mrrRub: number | null;
  arrRub: number | null;
  recognizedRevenueRub: number | null;
  grossContributionRub: number | null;
  grossContributionMargin: number | null;
  partnerRetentionRate: number | null;
  districtMarginalCostRub: number | null;
  verifiedExternalRegions: number;
  revenueLedgerEntries: number;
  settlementEligibleEntries: number;
};

export function buildInvestorOperatingSnapshot(
  evidence: CommercialOperatingEvidence = currentCommercialOperatingEvidence
): InvestorOperatingSnapshot {
  const signed = evidence.partners.filter((partner) => partner.agreement.status === 'signed');

  const recurring = signed.filter((partner) =>
    partner.agreement.model === 'subscription'
    && partner.agreement.monthlyFeeRub !== null
  );

  const mrr =
    recurring.length > 0
      ? recurring.reduce((sum, partner) => sum + (partner.agreement.monthlyFeeRub ?? 0), 0)
      : null;

  const recognizedRevenue =
    evidence.ledger.length > 0
      ? evidence.ledger.reduce((sum, entry) => sum + entry.amountRub, 0)
      : null;

  const entriesWithMeasuredDirectCost = evidence.ledger.filter(
    (entry) => entry.directVariableCostRub !== null
  );
  const contributionMeasurable =
    evidence.ledger.length > 0
    && entriesWithMeasuredDirectCost.length === evidence.ledger.length;

  const grossContribution = contributionMeasurable && recognizedRevenue !== null
    ? evidence.ledger.reduce(
        (sum, entry) => sum + entry.amountRub - (entry.directVariableCostRub ?? 0),
        0
      )
    : null;

  const settlementEligibleEntries = evidence.ledger.filter((entry) => {
    const settlement = evidence.settlements.find((item) => item.ledgerEntryId === entry.id);
    return isSettlementEligible(entry, settlement, evidence).eligible;
  }).length;

  return {
    signedCommercialContracts: signed.length,
    activeRecurringContracts: recurring.length,
    mrrRub: mrr,
    arrRub: mrr === null ? null : mrr * 12,
    recognizedRevenueRub: recognizedRevenue,
    grossContributionRub: grossContribution,
    grossContributionMargin:
      grossContribution === null
      || recognizedRevenue === null
      || recognizedRevenue <= 0
        ? null
        : grossContribution / recognizedRevenue,
    partnerRetentionRate: null,
    districtMarginalCostRub:
      currentPilotInvestmentEvidence.economics.nextVerifiedObjectVariableCost?.amountRub ?? null,
    verifiedExternalRegions: evidence.verifiedExternalRegions.length,
    revenueLedgerEntries: evidence.ledger.length,
    settlementEligibleEntries
  };
}

export const partnerOperatingStages = [
  {
    id: 'onboarding',
    title: 'Partner onboarding',
    truth: 'Юридическое лицо, категория, contacts, verification и commercial authority.'
  },
  {
    id: 'inventory',
    title: 'Inventory / feed',
    truth: 'Availability считается live только при authoritative feed + freshness SLA + evidence.'
  },
  {
    id: 'offer',
    title: 'Campaign / offer',
    truth: 'Offer не может менять heritage truth или скрыто покупать editorial ranking.'
  },
  {
    id: 'handoff',
    title: 'Traveler handoff',
    truth: 'Переход фиксируется как handoff, но ещё не считается продажей.'
  },
  {
    id: 'confirmation',
    title: 'Provider confirmation',
    truth: 'Транзакционный статус существует только после authoritative provider confirmation.'
  },
  {
    id: 'attribution',
    title: 'Attribution',
    truth: 'Attribution создаётся только при signed commercial agreement + provider-confirmed eligible state.'
  },
  {
    id: 'ledger',
    title: 'Revenue ledger',
    truth: 'Доход признаётся только с contractRef, evidenceRefs и допустимой моделью тарификации.'
  },
  {
    id: 'settlement',
    title: 'Settlement evidence',
    truth: 'Settlement eligibility требует acceptance; attribution revenue дополнительно требует provider reconciliation.'
  }
] as const;
