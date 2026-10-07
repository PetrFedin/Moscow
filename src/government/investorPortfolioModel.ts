import type { AppLanguage } from '../i18n';
import { revenueEngines, type RevenueEngineId } from './stakeholderValueModel.ts';
import {
  buildInvestorOperatingSnapshot,
  type CommercialOperatingEvidence
} from './partnerInvestorOperatingModel.ts';

export type PortfolioMode = 'actual' | 'demo';

export type PortfolioBucket = {
  id: RevenueEngineId;
  maturity: 'mvp' | 'post-pilot' | 'scale';
  actualRevenueRub: number | null;
  recurringRevenueRub: number | null;
  evidenceState: 'none' | 'modelled' | 'actual';
};

export type InvestorPortfolioSnapshot = {
  mode: PortfolioMode;
  totalRecognizedRevenueRub: number | null;
  totalRecurringRevenueRub: number | null;
  revenueMix: PortfolioBucket[];
  signedCommercialContracts: number;
  partnerRetentionRate: number | null;
  grossContributionRub: number | null;
  grossContributionMargin: number | null;
  districtMarginalCostRub: number | null;
  verifiedExternalRegions: number;
};

function bucket(id: RevenueEngineId, maturity: PortfolioBucket['maturity']): PortfolioBucket {
  return {
    id,
    maturity,
    actualRevenueRub: null,
    recurringRevenueRub: null,
    evidenceState: 'none'
  };
}

export function buildInvestorPortfolioSnapshot(
  evidence: CommercialOperatingEvidence,
  mode: PortfolioMode
): InvestorPortfolioSnapshot {
  const operating = buildInvestorOperatingSnapshot(evidence);
  const buckets = revenueEngines.map((engine) => bucket(engine.id, engine.maturity));

  for (const entry of evidence.ledger) {
    const partner = evidence.partners.find((item) => item.id === entry.partnerId);
    let engineId: RevenueEngineId | null = null;

    if (entry.revenueType === 'city-contract') {
      engineId = entry.attributionId ? 'district-production' : 'platform-license';
    } else if (entry.revenueType === 'subscription') {
      engineId = partner?.kind === 'data-provider' ? 'api-sdk' : 'partner-console';
    } else if (entry.revenueType === 'attribution') {
      engineId = 'provider-attribution';
    } else if (entry.revenueType === 'sponsorship') {
      engineId = 'sponsored-experience';
    }

    if (!engineId) continue;
    const target = buckets.find((item) => item.id === engineId);
    if (!target) continue;
    target.actualRevenueRub = (target.actualRevenueRub ?? 0) + entry.amountRub;
    target.evidenceState = mode === 'actual' ? 'actual' : 'modelled';
  }

  for (const partner of evidence.partners) {
    if (
      partner.agreement.status === 'signed'
      && partner.agreement.model === 'subscription'
      && partner.agreement.monthlyFeeRub !== null
    ) {
      const target = buckets.find((item) => item.id === 'partner-console');
      if (target) {
        target.recurringRevenueRub =
          (target.recurringRevenueRub ?? 0) + partner.agreement.monthlyFeeRub;
        target.evidenceState = mode === 'actual' ? 'actual' : 'modelled';
      }
    }
  }

  const totalRecurringRevenueRub =
    buckets.some((item) => item.recurringRevenueRub !== null)
      ? buckets.reduce((sum, item) => sum + (item.recurringRevenueRub ?? 0), 0)
      : null;

  return {
    mode,
    totalRecognizedRevenueRub: operating.recognizedRevenueRub,
    totalRecurringRevenueRub,
    revenueMix: buckets,
    signedCommercialContracts: operating.signedCommercialContracts,
    partnerRetentionRate: operating.partnerRetentionRate,
    grossContributionRub: operating.grossContributionRub,
    grossContributionMargin: operating.grossContributionMargin,
    districtMarginalCostRub: operating.districtMarginalCostRub,
    verifiedExternalRegions: operating.verifiedExternalRegions
  };
}

export const portfolioLabels: Record<RevenueEngineId, Record<AppLanguage, string>> = {
  'government-pilot': {
    ru: 'B2G pilot',
    en: 'B2G pilot',
    zh: 'B2G 试点'
  },
  'platform-license': {
    ru: 'B2G recurring',
    en: 'B2G recurring',
    zh: 'B2G 经常性收入'
  },
  'district-production': {
    ru: 'Production',
    en: 'Production',
    zh: '制作'
  },
  'partner-console': {
    ru: 'B2B subscription',
    en: 'B2B subscription',
    zh: 'B2B 订阅'
  },
  'provider-attribution': {
    ru: 'Transaction',
    en: 'Transaction',
    zh: '交易'
  },
  'sponsored-experience': {
    ru: 'Sponsorship',
    en: 'Sponsorship',
    zh: '赞助'
  },
  'destination-intelligence': {
    ru: 'Intelligence',
    en: 'Intelligence',
    zh: '数据智能'
  },
  'regional-license': {
    ru: 'Regional',
    en: 'Regional',
    zh: '区域许可'
  },
  'api-sdk': {
    ru: 'API / SDK',
    en: 'API / SDK',
    zh: 'API / SDK'
  }
};
