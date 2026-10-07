import type {
  MarketplaceRankingOutput,
  MarketplaceSponsoredResult
} from './demandRankingAuthority.ts';

export type MarketplaceOpportunity = {
  opportunityId: string;
  intentId: string;
  candidateId: string;
  partnerId: string;
  selectedAt: string;
  policyId: string;
  policyVersion: string;
  organicRank: number;
  organicScore: number;
  sponsored: boolean;
  sponsorContractRef: string | null;
  sponsorDisclosureLabel: string | null;
  availabilityState: string;
  availabilityCheckedAt: string | null;
};

export function buildMarketplaceOpportunity({
  opportunityId,
  intentId,
  candidateId,
  selectedAt,
  ranking
}: {
  opportunityId: string;
  intentId: string;
  candidateId: string;
  selectedAt: string;
  ranking: MarketplaceRankingOutput;
}): MarketplaceOpportunity {
  const organic = ranking.organic.find(
    (item) => item.candidate.id === candidateId
  );

  if (!organic) {
    throw new Error('marketplace-candidate-not-organically-ranked');
  }

  const sponsored: MarketplaceSponsoredResult | undefined =
    ranking.sponsored.find((item) => item.candidate.id === candidateId);

  return {
    opportunityId,
    intentId,
    candidateId,
    partnerId: organic.candidate.partnerId,
    selectedAt,
    policyId: ranking.policyId,
    policyVersion: ranking.policyVersion,
    organicRank: organic.organicRank,
    organicScore: organic.organicScore,
    sponsored: Boolean(sponsored),
    sponsorContractRef: sponsored?.sponsorContractRef ?? null,
    sponsorDisclosureLabel: sponsored?.disclosureLabel ?? null,
    availabilityState: organic.candidate.availability.state,
    availabilityCheckedAt: organic.candidate.availability.checkedAt
  };
}

export function marketplaceOpportunityIsAuditable(
  opportunity: MarketplaceOpportunity
) {
  if (!opportunity.opportunityId.trim()) return false;
  if (!opportunity.intentId.trim()) return false;
  if (!opportunity.candidateId.trim()) return false;
  if (!opportunity.partnerId.trim()) return false;
  if (!opportunity.policyId.trim()) return false;
  if (!opportunity.policyVersion.trim()) return false;
  if (!Number.isInteger(opportunity.organicRank) || opportunity.organicRank <= 0) return false;
  if (
    !Number.isFinite(opportunity.organicScore)
    || opportunity.organicScore < 0
    || opportunity.organicScore > 1
  ) return false;

  if (opportunity.sponsored) {
    if (!opportunity.sponsorContractRef?.trim()) return false;
    if (!opportunity.sponsorDisclosureLabel?.trim()) return false;
  } else if (
    opportunity.sponsorContractRef !== null
    || opportunity.sponsorDisclosureLabel !== null
  ) {
    return false;
  }

  return true;
}
