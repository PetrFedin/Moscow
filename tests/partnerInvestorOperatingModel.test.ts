import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildInvestorOperatingSnapshot,
  calculateAttributionRevenueRub,
  canAttributeHandoff,
  currentCommercialOperatingEvidence,
  isSettlementEligible,
  type CommercialOperatingEvidence,
  type PartnerAccount,
  type ProviderConfirmation,
  type RevenueLedgerEntry
} from '../src/government/partnerInvestorOperatingModel.ts';

test('empty operating evidence does not fabricate investor metrics', () => {
  const snapshot = buildInvestorOperatingSnapshot(currentCommercialOperatingEvidence);

  assert.equal(snapshot.signedCommercialContracts, 0);
  assert.equal(snapshot.activeRecurringContracts, 0);
  assert.equal(snapshot.mrrRub, null);
  assert.equal(snapshot.arrRub, null);
  assert.equal(snapshot.recognizedRevenueRub, null);
  assert.equal(snapshot.grossContributionRub, null);
  assert.equal(snapshot.partnerRetentionRate, null);
  assert.equal(snapshot.verifiedExternalRegions, 0);
});

test('handoff cannot become attribution without signed agreement and provider confirmation', () => {
  const evidence: CommercialOperatingEvidence = {
    partners: [],
    handoffs: [{
      id: 'h1',
      partnerId: 'p1',
      occurredAt: '2026-10-06T10:00:00Z',
      offerId: null,
      providerUrl: 'https://provider.example/item',
      consentScope: 'aggregate-attribution'
    }],
    confirmations: [],
    attributions: [],
    ledger: [],
    settlements: [],
    verifiedExternalRegions: []
  };

  assert.equal(canAttributeHandoff(evidence, 'h1').eligible, false);
});

test('revenue share is calculated only from signed agreement and provider amount', () => {
  const partner: PartnerAccount = {
    id: 'p1',
    kind: 'ticketing-provider',
    legalName: 'Provider',
    verified: true,
    agreement: {
      status: 'signed',
      model: 'revenue-share',
      effectiveFrom: '2026-10-01',
      effectiveTo: null,
      monthlyFeeRub: null,
      attributionFeeRub: null,
      revenueShareRate: 0.1,
      contractRef: 'CTR-1'
    },
    feed: {
      status: 'live',
      freshnessSlaMinutes: 15,
      lastAuthoritativeSyncAt: '2026-10-06T10:00:00Z',
      evidenceRef: 'FEED-1'
    }
  };

  const confirmation: ProviderConfirmation = {
    handoffId: 'h1',
    providerTransactionRef: 'TX-1',
    confirmedAt: '2026-10-06T10:01:00Z',
    terminalState: 'purchased',
    grossTransactionAmountRub: 10000,
    evidenceRef: 'TX-EVIDENCE-1'
  };

  assert.equal(calculateAttributionRevenueRub(partner, confirmation), 1000);
});

test('attribution settlement requires reconciliation and acceptance evidence', () => {
  const evidence: CommercialOperatingEvidence = {
    partners: [],
    handoffs: [],
    confirmations: [],
    attributions: [{
      id: 'a1',
      handoffId: 'h1',
      partnerId: 'p1',
      providerTransactionRef: 'TX-1',
      attributedAt: '2026-10-06T10:02:00Z',
      model: 'cps',
      evidenceRef: 'ATTR-1'
    }],
    ledger: [],
    settlements: [],
    verifiedExternalRegions: []
  };

  const entry: RevenueLedgerEntry = {
    id: 'l1',
    partnerId: 'p1',
    attributionId: 'a1',
    contractRef: 'CTR-1',
    recognizedAt: '2026-10-06T10:03:00Z',
    revenueType: 'attribution',
    amountRub: 500,
    directVariableCostRub: 50,
    evidenceRefs: ['ATTR-1'],
    settlementState: 'not-due'
  };

  assert.equal(
    isSettlementEligible(
      entry,
      { ledgerEntryId: 'l1', invoiceRef: null, providerReconciliationRef: null, acceptanceRef: 'ACC-1', paidRef: null },
      evidence
    ).eligible,
    false
  );

  assert.equal(
    isSettlementEligible(
      entry,
      { ledgerEntryId: 'l1', invoiceRef: null, providerReconciliationRef: 'REC-1', acceptanceRef: 'ACC-1', paidRef: null },
      evidence
    ).eligible,
    true
  );
});
