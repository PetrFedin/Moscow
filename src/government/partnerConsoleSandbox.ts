import type {
  CommercialOperatingEvidence,
  PartnerAccount,
  ProviderConfirmation,
  RevenueLedgerEntry
} from './partnerInvestorOperatingModel';

export type PartnerSandboxProfile = {
  partner: PartnerAccount;
  displayName: string;
  categoryLabel: string;
  profileState: 'verified-demo';
  inventory: Array<{
    id: string;
    title: string;
    inventoryType: 'table' | 'ticket' | 'room' | 'event';
    availabilityState: 'available' | 'limited' | 'unavailable';
    authoritative: boolean;
  }>;
  offers: Array<{
    id: string;
    title: string;
    status: 'draft' | 'active' | 'paused';
    placementRule: string;
  }>;
  campaign: {
    id: string;
    title: string;
    status: 'demo-active';
    targetContext: string;
  };
};

const demoPartner: PartnerAccount = {
  id: 'demo-partner-zaryadye-dining',
  kind: 'restaurant',
  legalName: 'DEMO · Zaryadye Dining Partner',
  verified: true,
  agreement: {
    status: 'signed',
    model: 'cpa',
    effectiveFrom: '2026-10-01',
    effectiveTo: null,
    monthlyFeeRub: null,
    attributionFeeRub: 600,
    revenueShareRate: null,
    contractRef: 'DEMO-CONTRACT-PARTNER-001'
  },
  feed: {
    status: 'live',
    freshnessSlaMinutes: 15,
    lastAuthoritativeSyncAt: '2026-10-06T09:55:00Z',
    evidenceRef: 'DEMO-FEED-EVIDENCE-001'
  }
};

export const partnerConsoleSandboxProfile: PartnerSandboxProfile = {
  partner: demoPartner,
  displayName: 'Zaryadye Dining · DEMO',
  categoryLabel: 'Restaurant',
  profileState: 'verified-demo',
  inventory: [
    {
      id: 'demo-inventory-lunch',
      title: 'Lunch table · 13:30',
      inventoryType: 'table',
      availabilityState: 'available',
      authoritative: true
    },
    {
      id: 'demo-inventory-dinner',
      title: 'Dinner table · 19:00',
      inventoryType: 'table',
      availabilityState: 'limited',
      authoritative: true
    }
  ],
  offers: [
    {
      id: 'demo-offer-route',
      title: 'Route guest priority slot',
      status: 'active',
      placementRule: 'Eligible only after route intent; never changes editorial ranking.'
    }
  ],
  campaign: {
    id: 'demo-campaign-varvarka',
    title: 'Varvarka evening continuation',
    status: 'demo-active',
    targetContext: 'Traveler completed heritage route and has a free evening window.'
  }
};

const demoConfirmations: ProviderConfirmation[] = [
  {
    handoffId: 'demo-handoff-001',
    providerTransactionRef: 'DEMO-TX-001',
    confirmedAt: '2026-10-06T10:05:00Z',
    terminalState: 'booked',
    grossTransactionAmountRub: 0,
    evidenceRef: 'DEMO-PROVIDER-RECEIPT-001'
  },
  {
    handoffId: 'demo-handoff-002',
    providerTransactionRef: 'DEMO-TX-002',
    confirmedAt: '2026-10-06T10:15:00Z',
    terminalState: 'booked',
    grossTransactionAmountRub: 0,
    evidenceRef: 'DEMO-PROVIDER-RECEIPT-002'
  }
];

const demoLedger: RevenueLedgerEntry[] = [
  {
    id: 'demo-ledger-001',
    partnerId: demoPartner.id,
    attributionId: 'demo-attribution-001',
    contractRef: 'DEMO-CONTRACT-PARTNER-001',
    recognizedAt: '2026-10-06T10:06:00Z',
    revenueType: 'attribution',
    amountRub: 600,
    directVariableCostRub: 120,
    evidenceRefs: ['DEMO-PROVIDER-RECEIPT-001', 'DEMO-ATTRIBUTION-001'],
    settlementState: 'eligible'
  },
  {
    id: 'demo-ledger-002',
    partnerId: demoPartner.id,
    attributionId: 'demo-attribution-002',
    contractRef: 'DEMO-CONTRACT-PARTNER-001',
    recognizedAt: '2026-10-06T10:16:00Z',
    revenueType: 'attribution',
    amountRub: 600,
    directVariableCostRub: 120,
    evidenceRefs: ['DEMO-PROVIDER-RECEIPT-002', 'DEMO-ATTRIBUTION-002'],
    settlementState: 'eligible'
  }
];

export const demoCommercialOperatingEvidence: CommercialOperatingEvidence = {
  partners: [demoPartner],
  handoffs: [
    {
      id: 'demo-handoff-001',
      partnerId: demoPartner.id,
      occurredAt: '2026-10-06T10:03:00Z',
      offerId: 'demo-offer-route',
      providerUrl: 'https://demo.invalid/booking/001',
      consentScope: 'aggregate-attribution'
    },
    {
      id: 'demo-handoff-002',
      partnerId: demoPartner.id,
      occurredAt: '2026-10-06T10:13:00Z',
      offerId: 'demo-offer-route',
      providerUrl: 'https://demo.invalid/booking/002',
      consentScope: 'aggregate-attribution'
    },
    {
      id: 'demo-handoff-003',
      partnerId: demoPartner.id,
      occurredAt: '2026-10-06T10:20:00Z',
      offerId: 'demo-offer-route',
      providerUrl: 'https://demo.invalid/booking/003',
      consentScope: 'aggregate-attribution'
    }
  ],
  confirmations: demoConfirmations,
  attributions: [
    {
      id: 'demo-attribution-001',
      handoffId: 'demo-handoff-001',
      partnerId: demoPartner.id,
      providerTransactionRef: 'DEMO-TX-001',
      attributedAt: '2026-10-06T10:06:00Z',
      model: 'cpa',
      evidenceRef: 'DEMO-ATTRIBUTION-001'
    },
    {
      id: 'demo-attribution-002',
      handoffId: 'demo-handoff-002',
      partnerId: demoPartner.id,
      providerTransactionRef: 'DEMO-TX-002',
      attributedAt: '2026-10-06T10:16:00Z',
      model: 'cpa',
      evidenceRef: 'DEMO-ATTRIBUTION-002'
    }
  ],
  ledger: demoLedger,
  settlements: [
    {
      ledgerEntryId: 'demo-ledger-001',
      invoiceRef: 'DEMO-INVOICE-001',
      providerReconciliationRef: 'DEMO-RECON-001',
      acceptanceRef: 'DEMO-ACCEPT-001',
      paidRef: null
    },
    {
      ledgerEntryId: 'demo-ledger-002',
      invoiceRef: 'DEMO-INVOICE-002',
      providerReconciliationRef: 'DEMO-RECON-002',
      acceptanceRef: 'DEMO-ACCEPT-002',
      paidRef: null
    }
  ],
  verifiedExternalRegions: []
};

export const demoScenarioDisclaimer = {
  ru: 'DEMO SCENARIO · Все партнёры, транзакции, договоры и суммы в этом режиме синтетические и нужны только для демонстрации механики.',
  en: 'DEMO SCENARIO · All partners, transactions, contracts and amounts in this mode are synthetic and exist only to demonstrate mechanics.',
  zh: '演示场景 · 此模式中的所有合作伙伴、交易、合同和金额均为合成数据，仅用于展示机制。'
} as const;
