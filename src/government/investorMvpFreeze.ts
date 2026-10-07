export const INVESTOR_MVP_FREEZE = {
  state: 'FEATURE_FROZEN' as const,
  productDevelopmentState: 'ACTIVE' as const,
  frozenAt: '2026-10-06',
  reason:
    'Executive demo compression completed. Investor MVP scope is frozen before real pilot readiness and field evidence.',
  allowedChangeClasses: [
    'bugfix',
    'accessibility',
    'performance',
    'security',
    'real-evidence-integration',
    'pilot-readiness',
    'data-provider-integration',
    'legal-or-acceptance-correction',
    'localization-fix',
    'traveler-product-development',
    'partner-product-development',
    'city-tourism-product-development'
  ] as const,
  blockedChangeClasses: [
    'new-investor-module',
    'new-governance-dashboard',
    'new-demo-only-financial-model',
    'new-synthetic-kpi',
    'new-unproven-product-scope'
  ] as const,
  nextPhase: [
    'citywide traveler Trip OS',
    'Today and adaptive day',
    'broad events and place taxonomy',
    'partner demand and attribution',
    'city tourism demand and load balancing',
    'optional real integrations when authorised'
  ] as const
};

export type InvestorMvpAllowedChangeClass =
  typeof INVESTOR_MVP_FREEZE.allowedChangeClasses[number];

export function investorMvpFeatureChangesAllowed() {
  return false;
}

export function isInvestorMvpMaintenanceChange(
  changeClass: string
) {
  return (INVESTOR_MVP_FREEZE.allowedChangeClasses as readonly string[])
    .includes(changeClass);
}
