export const INVESTOR_MVP_FREEZE = {
  state: 'FEATURE_FROZEN' as const,
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
    'localization-fix'
  ] as const,
  blockedChangeClasses: [
    'new-investor-module',
    'new-governance-dashboard',
    'new-demo-only-financial-model',
    'new-synthetic-kpi',
    'new-unproven-product-scope'
  ] as const,
  nextPhase: [
    'real pilot owner',
    'real data/integration owners',
    'real field proof',
    'real visitor pilot',
    'measured production economics',
    'government meeting'
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
