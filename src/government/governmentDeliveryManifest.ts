import {
  currentPilotInvestmentEvidence,
  getPilotDecisionReadiness,
  type PilotInvestmentEvidence
} from './pilotInvestmentDecision.ts';

export const GOVERNMENT_DELIVERY_MANIFEST_VERSION = 1 as const;

export type GovernmentArtifactStatus = 'ready' | 'draft' | 'missing';

export type GovernmentArtifactId =
  | 'city-pilot-demo'
  | 'pilot-positioning'
  | 'pilot-methodology'
  | 'pilot-acceptance'
  | 'funding-scale-playbook'
  | 'investment-decision-authority'
  | 'executive-one-pager'
  | 'decision-deck'
  | 'technical-specification'
  | 'architecture-integration'
  | 'security-data-flow'
  | 'ip-rights-handover'
  | 'operations-sla'
  | 'cost-scale-model'
  | 'final-report-template';

export type GovernmentArtifact = {
  id: GovernmentArtifactId;
  title: string;
  status: GovernmentArtifactStatus;
  refs: string[];
  note: string;
};

export type GovernmentDeliveryStageId =
  | 'demo'
  | 'intro-pack'
  | 'technical-pilot-approval'
  | 'verified-pilot-report'
  | 'scale-investment-decision'
  | 'federal-expansion';

export type GovernmentDeliveryStage = {
  id: GovernmentDeliveryStageId;
  title: string;
  ready: boolean;
  artifactBlockers: GovernmentArtifactId[];
  evidenceBlockers: string[];
  note: string;
};

export type GovernmentDeliveryManifest = {
  version: typeof GOVERNMENT_DELIVERY_MANIFEST_VERSION;
  artifacts: GovernmentArtifact[];
};

export type GovernmentExternalReadiness = {
  romanovFieldVerified: boolean;
  oldEnglishCourtRepeatabilityVerified: boolean;
  visitorPilotReviewed: boolean;
  liveProviderAgreementReady: boolean;
  firstExternalRegionVerified: boolean;
};

export const currentGovernmentDeliveryManifest: GovernmentDeliveryManifest = {
  version: 1,
  artifacts: [
    {
      id: 'city-pilot-demo',
      title: 'In-app CITY PILOT government / investor demo',
      status: 'ready',
      refs: [
        'src/government/GovernmentPartnershipDemo.tsx',
        'tests/governmentDemo.e2e.spec.ts'
      ],
      note: 'Demo is separated from the consumer WOW flow and keeps external proof gaps visible.'
    },
    {
      id: 'pilot-positioning',
      title: 'Pilot positioning',
      status: 'ready',
      refs: ['docs/MOSCOW_GOV_PILOT_POSITIONING.md'],
      note: 'Positions the product as reusable heritage/destination infrastructure rather than another AR excursion.'
    },
    {
      id: 'pilot-methodology',
      title: 'Pilot methodology',
      status: 'ready',
      refs: [
        'docs/PILOT_RESEARCH_PROTOCOL.md',
        'docs/PILOT_OPERATIONAL_PACK.md'
      ],
      note: 'Defines supervised visitor research without claiming statistical representativeness.'
    },
    {
      id: 'pilot-acceptance',
      title: 'Government pilot acceptance matrix',
      status: 'ready',
      refs: ['docs/GOVERNMENT_PILOT_ACCEPTANCE.md'],
      note: 'Separates source/rights, spatial, repeatability, visitor, operations and Studio evidence.'
    },
    {
      id: 'funding-scale-playbook',
      title: 'Moscow-to-federal funding / scale playbook',
      status: 'ready',
      refs: [
        'docs/GOVERNMENT_SCALE_AND_FUNDING.md',
        'docs/GOVERNMENT_INVESTOR_DEMO_2026.md'
      ],
      note: 'Separates pilot, deployment, investment and federal routes without claiming approval.'
    },
    {
      id: 'investment-decision-authority',
      title: 'Investment / scale decision authority',
      status: 'ready',
      refs: [
        'src/government/pilotInvestmentDecision.ts',
        'docs/PILOT_INVESTMENT_DECISION.md'
      ],
      note: 'Decision pack can become ready only after physical, governance and measured economics evidence.'
    },
    {
      id: 'executive-one-pager',
      title: 'Executive one-pager',
      status: 'ready',
      refs: ['docs/GOVERNMENT_EXECUTIVE_ONE_PAGER.md'],
      note: 'Compact buyer-facing leave-behind; rendered PDF/export can be produced from this content authority.'
    },
    {
      id: 'decision-deck',
      title: '10–12 slide decision deck',
      status: 'missing',
      refs: [],
      note: 'Must use the same truth boundaries as CITY PILOT and cannot show unverified proof as complete.'
    },
    {
      id: 'technical-specification',
      title: 'Consolidated pilot technical specification',
      status: 'ready',
      refs: ['docs/GOVERNMENT_PILOT_TECHNICAL_SPECIFICATION.md'],
      note: 'Consolidates bounded scope, responsibilities, interfaces, evidence and acceptance for buyer review.'
    },
    {
      id: 'architecture-integration',
      title: 'Buyer-facing architecture / integration scheme',
      status: 'ready',
      refs: [
        'docs/GOVERNMENT_BUYER_ARCHITECTURE.md',
        'docs/INTEGRATION_STACK.md',
        'docs/LIVE_DESTINATION_AUTHORITY.md',
        'docs/MOSCOW_LIVE_PROVIDER_STRATEGY.md'
      ],
      note: 'Buyer-facing architecture now separates current implementation from target production and defines integration/trust boundaries.'
    },
    {
      id: 'security-data-flow',
      title: 'Security and data-flow note',
      status: 'ready',
      refs: ['docs/GOVERNMENT_SECURITY_DATA_FLOW.md'],
      note: 'Documents current controls, data categories, pilot flows and explicit production-security decisions still requiring buyer approval.'
    },
    {
      id: 'ip-rights-handover',
      title: 'IP / rights / source-material handover matrix',
      status: 'ready',
      refs: [
        'docs/GOVERNMENT_IP_RIGHTS_HANDOVER.md',
        'docs/PUBLISHED_SPATIAL_PACKAGE.md',
        'docs/CITY_HERITAGE_STUDIO.md'
      ],
      note: 'Provides a procurement-facing baseline for reusable platform IP, city-specific deliverables, third-party rights and portable handover.'
    },
    {
      id: 'operations-sla',
      title: 'Operations / SLA draft',
      status: 'ready',
      refs: ['docs/GOVERNMENT_OPERATIONS_SLA_DRAFT.md'],
      note: 'Defines responsibilities, incident classes, provider fail-safe, release/backup/support topics while keeping numeric SLA targets TBD until deployment is selected.'
    },
    {
      id: 'cost-scale-model',
      title: 'Cost assumptions / scale-up model',
      status: 'ready',
      refs: [
        'src/government/pilotInvestmentDecision.ts',
        'docs/PILOT_INVESTMENT_DECISION.md'
      ],
      note: 'The model exists but intentionally remains unpopulated until real measured evidence is available.'
    },
    {
      id: 'final-report-template',
      title: 'Final pilot report template',
      status: 'ready',
      refs: ['docs/GOVERNMENT_FINAL_PILOT_REPORT_TEMPLATE.md'],
      note: 'Mirrors acceptance and forces proven / not proven / blocked / measured economics outcomes to remain separate.'
    }
  ]
};

const STAGE_ARTIFACTS: Record<GovernmentDeliveryStageId, GovernmentArtifactId[]> = {
  demo: [
    'city-pilot-demo',
    'pilot-positioning',
    'pilot-acceptance'
  ],
  'intro-pack': [
    'city-pilot-demo',
    'pilot-positioning',
    'pilot-methodology',
    'pilot-acceptance',
    'funding-scale-playbook',
    'executive-one-pager'
  ],
  'technical-pilot-approval': [
    'executive-one-pager',
    'technical-specification',
    'architecture-integration',
    'security-data-flow',
    'ip-rights-handover',
    'operations-sla',
    'pilot-acceptance'
  ],
  'verified-pilot-report': [
    'pilot-methodology',
    'pilot-acceptance',
    'final-report-template',
    'cost-scale-model'
  ],
  'scale-investment-decision': [
    'funding-scale-playbook',
    'investment-decision-authority',
    'cost-scale-model',
    'final-report-template'
  ],
  'federal-expansion': [
    'funding-scale-playbook',
    'investment-decision-authority',
    'architecture-integration',
    'security-data-flow',
    'ip-rights-handover',
    'operations-sla'
  ]
};

function artifactMap(manifest: GovernmentDeliveryManifest) {
  return new Map(manifest.artifacts.map((artifact) => [artifact.id, artifact]));
}

export function validateGovernmentDeliveryManifest(
  manifest: GovernmentDeliveryManifest
) {
  const blockers: string[] = [];
  if (manifest.version !== GOVERNMENT_DELIVERY_MANIFEST_VERSION) {
    blockers.push('government-delivery-version-invalid');
  }

  const seen = new Set<string>();
  for (const artifact of manifest.artifacts) {
    if (seen.has(artifact.id)) blockers.push(`duplicate-government-artifact:${artifact.id}`);
    seen.add(artifact.id);

    if (!artifact.title.trim()) blockers.push(`government-artifact-title-missing:${artifact.id}`);
    if (
      artifact.status !== 'ready'
      && artifact.status !== 'draft'
      && artifact.status !== 'missing'
    ) {
      blockers.push(`government-artifact-status-invalid:${artifact.id}`);
    }
    if (!artifact.note.trim()) blockers.push(`government-artifact-note-missing:${artifact.id}`);
    if (artifact.status === 'ready' && artifact.refs.length === 0) {
      blockers.push(`ready-government-artifact-has-no-ref:${artifact.id}`);
    }
    if (artifact.refs.some((ref) => !ref.trim())) {
      blockers.push(`government-artifact-ref-invalid:${artifact.id}`);
    }
  }

  for (const required of Object.values(STAGE_ARTIFACTS).flat()) {
    if (!seen.has(required)) blockers.push(`government-artifact-not-declared:${required}`);
  }

  return {
    valid: blockers.length === 0,
    blockers: [...new Set(blockers)]
  };
}

function artifactBlockersForStage(
  manifest: GovernmentDeliveryManifest,
  stageId: GovernmentDeliveryStageId
) {
  const byId = artifactMap(manifest);
  return STAGE_ARTIFACTS[stageId].filter(
    (id) => byId.get(id)?.status !== 'ready'
  );
}

function externalReadinessFromInvestmentEvidence(
  evidence: PilotInvestmentEvidence,
  firstExternalRegionVerified: boolean
): GovernmentExternalReadiness {
  return {
    romanovFieldVerified: evidence.proof.romanovFieldVerified,
    oldEnglishCourtRepeatabilityVerified:
      evidence.proof.oldEnglishCourtRepeatabilityVerified,
    visitorPilotReviewed: evidence.proof.visitorPilotReviewed,
    liveProviderAgreementReady: evidence.proof.liveProviderAgreementReady,
    firstExternalRegionVerified
  };
}

export function evaluateGovernmentDeliveryReadiness(input?: {
  manifest?: GovernmentDeliveryManifest;
  investmentEvidence?: PilotInvestmentEvidence;
  firstExternalRegionVerified?: boolean;
}) {
  const manifest = input?.manifest ?? currentGovernmentDeliveryManifest;
  const investmentEvidence =
    input?.investmentEvidence ?? currentPilotInvestmentEvidence;
  const firstExternalRegionVerified =
    input?.firstExternalRegionVerified ?? false;

  const validation = validateGovernmentDeliveryManifest(manifest);
  if (!validation.valid) {
    throw new Error(
      `Invalid government delivery manifest: ${validation.blockers.join('; ')}`
    );
  }

  const external = externalReadinessFromInvestmentEvidence(
    investmentEvidence,
    firstExternalRegionVerified
  );
  const investmentReadiness = getPilotDecisionReadiness(investmentEvidence);

  const stage = (
    id: GovernmentDeliveryStageId,
    title: string,
    evidenceBlockers: string[],
    note: string
  ): GovernmentDeliveryStage => {
    const artifactBlockers = artifactBlockersForStage(manifest, id);
    return {
      id,
      title,
      ready: artifactBlockers.length === 0 && evidenceBlockers.length === 0,
      artifactBlockers,
      evidenceBlockers,
      note
    };
  };

  const verifiedPilotEvidenceBlockers = [
    ...(!external.romanovFieldVerified ? ['romanov-field-proof-missing'] : []),
    ...(!external.oldEnglishCourtRepeatabilityVerified
      ? ['old-english-court-repeatability-missing']
      : []),
    ...(!external.visitorPilotReviewed ? ['visitor-pilot-review-missing'] : []),
    ...(!external.liveProviderAgreementReady
      ? ['live-provider-agreement-missing']
      : [])
  ];

  const stages = [
    stage(
      'demo',
      'Demo conversation',
      [],
      'Can demonstrate the product and bounded collaboration concept without claiming pilot success.'
    ),
    stage(
      'intro-pack',
      'Formal introductory meeting pack',
      [],
      'Requires a concise executive leave-behind in addition to the in-app demo and pilot framing.'
    ),
    stage(
      'technical-pilot-approval',
      'Technical pilot approval pack',
      [],
      'Requires buyer-facing technical, security, IP/handover and operations artifacts before formal approval.'
    ),
    stage(
      'verified-pilot-report',
      'Verified pilot result pack',
      verifiedPilotEvidenceBlockers,
      'Requires real physical, second-object, visitor and provider evidence plus a final report template.'
    ),
    stage(
      'scale-investment-decision',
      'Scale / investment decision pack',
      investmentReadiness.decisionPackReady
        ? []
        : investmentReadiness.blockers,
      'Requires proof, governance and measured economics. It does not itself recommend an investment decision.'
    ),
    stage(
      'federal-expansion',
      'Federal expansion proposal',
      [
        ...(investmentReadiness.decisionPackReady
          ? []
          : ['moscow-scale-decision-pack-not-ready']),
        ...(!external.firstExternalRegionVerified
          ? ['first-external-region-proof-missing']
          : [])
      ],
      'Federal proposal is gated by a decision-ready Moscow proof and a real first external region.'
    )
  ] satisfies GovernmentDeliveryStage[];

  const artifacts = manifest.artifacts.map((artifact) => ({
    ...artifact,
    refs: [...artifact.refs]
  }));

  return {
    manifestVersion: manifest.version,
    readyArtifactCount: artifacts.filter((artifact) => artifact.status === 'ready').length,
    draftArtifactCount: artifacts.filter((artifact) => artifact.status === 'draft').length,
    missingArtifactCount: artifacts.filter((artifact) => artifact.status === 'missing').length,
    artifacts,
    external,
    investmentReadiness,
    stages
  };
}
