import {
  currentPilotInvestmentEvidence,
  getPilotDecisionReadiness,
  type PilotDecisionBlocker
} from './pilotInvestmentDecision.ts';
import {
  currentMoscowPilotApplicationReadiness,
  evaluateMoscowPilotApplicationReadiness
} from './moscowPilotApplicationReadiness.ts';
import {
  currentMoscowIntegrationPhase0
} from '../spatial/integrationMasterPlanGate.ts';

export type PilotReadinessOwnerClass =
  | 'project'
  | 'applicant'
  | 'moscow'
  | 'site'
  | 'provider'
  | 'legal'
  | 'finance'
  | 'joint';

export type PilotReadinessItem = {
  id: string;
  category:
    | 'owner'
    | 'field-proof'
    | 'provider'
    | 'visitor-pilot'
    | 'governance'
    | 'economics'
    | 'application';
  title: string;
  status: 'ready' | 'preparable-now' | 'blocked-external' | 'blocked-field' | 'blocked-legal';
  ownerClass: PilotReadinessOwnerClass;
  requiredOwner: string;
  requiredInput: string;
  evidenceRequired: string[];
  acceptanceGate: string;
  canPrepareNow: string[];
  blockedUntil: string | null;
  sourceRefs: string[];
};

const blockerMap: Record<PilotDecisionBlocker, Omit<PilotReadinessItem,'id'|'status'>> = {
  'romanov-field-proof-missing': {
    category:'field-proof',
    title:'Romanov real field proof',
    ownerClass:'joint',
    requiredOwner:'Project field lead + pilot site representative',
    requiredInput:'Authorised physical access, target devices, approved field procedure and reviewer.',
    evidenceRequired:[
      'Real Romanov P0 evidence archive',
      'Measured anchor/pose residuals',
      'Device/build references',
      'Reviewer acceptance'
    ],
    acceptanceGate:'Romanov release gate = field-verified-spatial-scene and package blockers = 0',
    canPrepareNow:[
      'Freeze test build and device matrix',
      'Prepare field session checklist',
      'Prepare evidence folder naming and reviewer form'
    ],
    blockedUntil:'Physical field session is executed on site.',
    sourceRefs:['docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md','src/spatial/integrationMasterPlanGate.ts']
  },
  'second-object-repeatability-missing': {
    category:'field-proof',
    title:'Old English Court repeatability proof',
    ownerClass:'joint',
    requiredOwner:'Project field lead + site/content authority',
    requiredInput:'Independent object-specific field session and evidence package.',
    evidenceRequired:[
      'Old English Court model evidence',
      'Metric/control-point authority',
      'Survey evidence',
      'Field matrix evidence',
      'Persistent anchor evidence'
    ],
    acceptanceGate:'validateOldEnglishCourtRepeatabilityProof() = valid',
    canPrepareNow:[
      'Freeze object-specific evidence template',
      'Prepare survey/control-point checklist',
      'Prepare repeatability comparison against Romanov process'
    ],
    blockedUntil:'Second-object field evidence is captured and reviewed.',
    sourceRefs:['src/spatial/integrationMasterPlanGate.ts']
  },
  'visitor-pilot-review-missing': {
    category:'visitor-pilot',
    title:'Supervised visitor pilot',
    ownerClass:'joint',
    requiredOwner:'Pilot owner + research/observer lead + site representative',
    requiredInput:'20–50 real supervised participant sessions.',
    evidenceRequired:[
      'Completed observer notes for all planned slots',
      'Reviewed pilot study report',
      'Aggregate-only evidence reference',
      'Formal review outcome'
    ],
    acceptanceGate:'Pilot report completeForFirstReview = true and evidence reference present',
    canPrepareNow:[
      'Freeze participant protocol',
      'Prepare observer form',
      'Prepare consent/privacy wording',
      'Prepare aggregate report template'
    ],
    blockedUntil:'Real participant sessions are completed.',
    sourceRefs:['docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md','src/spatial/integrationMasterPlanGate.ts']
  },
  'live-provider-agreement-missing': {
    category:'provider',
    title:'Real provider proof / YCLIENTS',
    ownerClass:'provider',
    requiredOwner:'Provider integration owner + authorised YCLIENTS company owner',
    requiredInput:'Partner token, user token, company/test-company ID and permission for controlled booking/webhook test.',
    evidenceRequired:[
      'Real raw API response',
      'SHA-256 admission evidence',
      'Controlled record',
      'Real webhook',
      'Provider state change',
      'Terminal provider receipt',
      'Immutable archived PASS'
    ],
    acceptanceGate:'providerProofGate status = pass',
    canPrepareNow:[
      'Keep receiver/admission tooling ready',
      'Prepare evidence directory and runbook',
      'Prepare secret names and Render binding checklist'
    ],
    blockedUntil:'Authorised YCLIENTS credentials and permitted test company are supplied.',
    sourceRefs:['docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md','src/integrations/providerProofGate.ts']
  },
  'publication-rights-blockers-remain': {
    category:'governance',
    title:'Publication rights clearance',
    ownerClass:'legal',
    requiredOwner:'Applicant/project legal + content rights owner',
    requiredInput:'Rights chain for software, historical media, 3D assets and pilot content.',
    evidenceRequired:['Rights matrix','Licences/permissions','Publication clearance record'],
    acceptanceGate:'publicationRightsBlockers = 0',
    canPrepareNow:['Inventory all pilot assets','Map each asset to rights basis','Prepare unresolved-rights list'],
    blockedUntil:'Rights owner/legal review closes all blockers.',
    sourceRefs:['docs/GOVERNMENT_IP_RIGHTS_HANDOVER.md']
  },
  'security-data-flow-review-missing': {
    category:'governance',
    title:'Security & data-flow review',
    ownerClass:'joint',
    requiredOwner:'Project technical owner + applicant security/privacy owner',
    requiredInput:'Final pilot data flows, retention, permissions and provider boundaries.',
    evidenceRequired:['Reviewed data-flow diagram','Security review ref','Privacy boundary confirmation'],
    acceptanceGate:'securityDataFlowReviewed = true',
    canPrepareNow:['Freeze current data-flow diagram','List personal data classes','List third-party processors/providers'],
    blockedUntil:'Responsible security/privacy owner signs review.',
    sourceRefs:['docs/GOVERNMENT_SECURITY_DATA_FLOW.md']
  },
  'ip-handover-review-missing': {
    category:'governance',
    title:'IP / handover review',
    ownerClass:'legal',
    requiredOwner:'Applicant legal + project owner',
    requiredInput:'Agreed scope of code, documentation, content, licences and operating rights transferred/retained.',
    evidenceRequired:['Handover matrix','IP review ref','Accepted contract wording'],
    acceptanceGate:'ipHandoverReviewed = true',
    canPrepareNow:['Freeze deliverables list','Prepare ownership/licence matrix','Mark third-party dependencies'],
    blockedUntil:'Legal/commercial parties agree handover terms.',
    sourceRefs:['docs/GOVERNMENT_IP_RIGHTS_HANDOVER.md']
  },
  'operations-sla-review-missing': {
    category:'governance',
    title:'Operations / SLA review',
    ownerClass:'joint',
    requiredOwner:'Project operations owner + city/operator owner',
    requiredInput:'Pilot support model, incident handling, monitoring, availability and escalation boundaries.',
    evidenceRequired:['SLA draft','Escalation matrix','Monitoring/incident responsibilities'],
    acceptanceGate:'operationsSlaReviewed = true',
    canPrepareNow:['Prepare pilot support RACI','Define severity levels','Define service-hours proposal'],
    blockedUntil:'City/operator operations owner reviews and accepts SLA.',
    sourceRefs:['docs/GOVERNMENT_PILOT_TECHNICAL_SPECIFICATION.md']
  },
  'next-object-cost-unmeasured': {
    category:'economics',
    title:'Next verified object variable cost',
    ownerClass:'finance',
    requiredOwner:'Project finance/production owner',
    requiredInput:'Actual production spend/time from verified next object.',
    evidenceRequired:['Measured RUB amount','Basis','Evidence reference'],
    acceptanceGate:'nextVerifiedObjectVariableCost != null',
    canPrepareNow:['Define cost-capture sheet','Define included/excluded cost rules'],
    blockedUntil:'Real production cycle is measured.',
    sourceRefs:['src/government/pilotInvestmentDecision.ts']
  },
  'next-object-production-time-unmeasured': {
    category:'economics',
    title:'Next verified object production time',
    ownerClass:'project',
    requiredOwner:'Production lead',
    requiredInput:'Measured end-to-end lead time on verified object.',
    evidenceRequired:['Measured days','Basis','Evidence reference'],
    acceptanceGate:'nextVerifiedObjectProductionTime != null',
    canPrepareNow:['Define cycle start/end events','Prepare production time log'],
    blockedUntil:'Real object production cycle completes.',
    sourceRefs:['src/government/pilotInvestmentDecision.ts']
  },
  'developer-hours-unmeasured': {
    category:'economics',
    title:'Developer hours per object',
    ownerClass:'project',
    requiredOwner:'Engineering lead',
    requiredInput:'Time records from real verified-object cycle.',
    evidenceRequired:['Measured hours','Basis','Evidence reference'],
    acceptanceGate:'developerHoursPerObject != null',
    canPrepareNow:['Define time-entry categories','Prepare per-object engineering log'],
    blockedUntil:'Real production work is performed and logged.',
    sourceRefs:['src/government/pilotInvestmentDecision.ts']
  },
  'institution-operator-hours-unmeasured': {
    category:'economics',
    title:'Institution/operator hours per object',
    ownerClass:'joint',
    requiredOwner:'Institution/site content owner',
    requiredInput:'Actual review/approval/operator time.',
    evidenceRequired:['Measured hours','Basis','Evidence reference'],
    acceptanceGate:'institutionOperatorHoursPerObject != null',
    canPrepareNow:['Define operator tasks','Prepare review-time log'],
    blockedUntil:'Institution/operator participates in real object cycle.',
    sourceRefs:['src/government/pilotInvestmentDecision.ts']
  },
  'district-shared-setup-cost-unmeasured': {
    category:'economics',
    title:'District shared setup cost',
    ownerClass:'finance',
    requiredOwner:'Project finance/technical owner',
    requiredInput:'Actual shared setup inputs for the pilot district.',
    evidenceRequired:['Measured RUB amount','Basis','Evidence reference'],
    acceptanceGate:'districtSharedSetupCost != null',
    canPrepareNow:['Define shared-vs-object cost allocation rules'],
    blockedUntil:'Pilot setup costs are incurred and reconciled.',
    sourceRefs:['src/government/pilotInvestmentDecision.ts']
  },
  'district-integration-cost-unmeasured': {
    category:'economics',
    title:'District integration cost',
    ownerClass:'finance',
    requiredOwner:'Integration owner + finance',
    requiredInput:'Actual provider/city integration labour and vendor costs.',
    evidenceRequired:['Measured RUB amount','Basis','Evidence reference'],
    acceptanceGate:'districtIntegrationCost != null',
    canPrepareNow:['Define integration work-package accounting'],
    blockedUntil:'Real integration work is executed.',
    sourceRefs:['src/government/pilotInvestmentDecision.ts']
  },
  'annual-operations-cost-unmeasured': {
    category:'economics',
    title:'Annual operations cost',
    ownerClass:'finance',
    requiredOwner:'Operations + finance',
    requiredInput:'Measured or contract-backed run-rate basis after pilot operating model is fixed.',
    evidenceRequired:['Annual RUB amount','Basis','Evidence reference'],
    acceptanceGate:'annualOperationsCost != null',
    canPrepareNow:['Define run-cost categories','Separate fixed/variable/provider costs'],
    blockedUntil:'Pilot operating model and actual run inputs exist.',
    sourceRefs:['src/government/pilotInvestmentDecision.ts']
  }
};

function statusFor(item: Omit<PilotReadinessItem,'id'|'status'>): PilotReadinessItem['status'] {
  if (item.blockedUntil?.toLowerCase().includes('field')) return 'blocked-field';
  if (item.ownerClass === 'legal') return 'blocked-legal';
  if (item.blockedUntil) return 'blocked-external';
  return 'preparable-now';
}

export function buildPilotReadinessDossier() {
  const decision = getPilotDecisionReadiness(currentPilotInvestmentEvidence);
  const application = evaluateMoscowPilotApplicationReadiness(currentMoscowPilotApplicationReadiness);

  const items: PilotReadinessItem[] = decision.blockers.map((blocker) => {
    const base = blockerMap[blocker];
    return {
      id: blocker,
      status: statusFor(base),
      ...base
    };
  });

  for (const field of application.blockers) {
    if (items.some((item) => item.id === `application:${field.id}`)) continue;
    items.push({
      id:`application:${field.id}`,
      category:'application',
      title:field.title,
      status:
        field.status === 'legal-review-required'
          ? 'blocked-legal'
          : field.status === 'external-confirmation-required'
            ? 'blocked-external'
            : 'preparable-now',
      ownerClass:
        field.status === 'legal-review-required'
          ? 'legal'
          : field.status === 'external-confirmation-required'
            ? 'moscow'
            : 'applicant',
      requiredOwner:field.authority,
      requiredInput:field.requiredAction,
      evidenceRequired:field.refs.length > 0 ? field.refs : ['Applicant/authority-provided evidence'],
      acceptanceGate:`Application field status becomes ready: ${field.id}`,
      canPrepareNow:
        field.status === 'external-confirmation-required'
          ? ['Prepare meeting ask and required confirmation wording']
          : ['Prepare draft/collection checklist without inventing applicant data'],
      blockedUntil:
        field.status === 'ready'
          ? null
          : field.status === 'external-confirmation-required'
            ? 'External Moscow/pilot operator confirmation.'
            : field.status === 'legal-review-required'
              ? 'Legal review by responsible authority.'
              : 'Applicant-owned input is supplied.',
      sourceRefs:field.refs
    });
  }

  const summary = {
    total: items.length,
    blockedField: items.filter((item) => item.status === 'blocked-field').length,
    blockedExternal: items.filter((item) => item.status === 'blocked-external').length,
    blockedLegal: items.filter((item) => item.status === 'blocked-legal').length,
    preparableNow: items.filter((item) => item.status === 'preparable-now').length,
    phase0Status: currentMoscowIntegrationPhase0.status,
    decisionPackReady: decision.decisionPackReady,
    submissionReady: application.submissionReady
  };

  return {
    version:1 as const,
    generatedFrom:'repository-authorities',
    summary,
    items,
    guardrails:[
      'No field/provider/applicant/legal gate is upgraded from project-side preparation alone.',
      'No missing applicant data, cost, credential, city owner or legal conclusion is invented.',
      'Investor MVP remains feature-frozen; this dossier is pilot-readiness work only.',
      'MOSCOW-INT-00 remains authoritative for spatial scaling.'
    ]
  };
}

export const currentPilotReadinessDossier = buildPilotReadinessDossier();
