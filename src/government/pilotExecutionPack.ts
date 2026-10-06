import {
  ROMANOV_FIELD_DISTANCES,
  ROMANOV_FIELD_MAX_TARGET_CM,
  ROMANOV_FIELD_MEAN_TARGET_CM,
  ROMANOV_FIELD_REQUIRED_POINTS,
  ROMANOV_REQUIRED_ANDROID_DEVICES,
  ROMANOV_REQUIRED_IOS_DEVICES
} from '../spatial/fieldVerification.ts';

export type PilotExecutionRoleId =
  | 'project-owner'
  | 'pilot-manager'
  | 'field-lead'
  | 'mobile-technical-lead'
  | 'research-lead'
  | 'finance-owner'
  | 'moscow-business-owner'
  | 'pilot-site-owner'
  | 'integration-data-owner'
  | 'security-privacy-owner'
  | 'legal-rights-owner'
  | 'provider-company-owner';

export type PilotExecutionRole = {
  id: PilotExecutionRoleId;
  label: string;
  party: 'project' | 'moscow' | 'site' | 'provider' | 'joint';
  requiredBefore: string;
};

export const pilotExecutionRoles: PilotExecutionRole[] = [
  { id:'project-owner', label:'Project owner / delivery authority', party:'project', requiredBefore:'scope freeze and external meeting' },
  { id:'pilot-manager', label:'Pilot manager / single operational coordinator', party:'project', requiredBefore:'pilot scheduling' },
  { id:'field-lead', label:'Field verification lead', party:'project', requiredBefore:'Romanov / OEC field day' },
  { id:'mobile-technical-lead', label:'Mobile / build technical lead', party:'project', requiredBefore:'field build freeze' },
  { id:'research-lead', label:'Visitor pilot research / observer lead', party:'project', requiredBefore:'participant recruitment' },
  { id:'finance-owner', label:'Measured economics owner', party:'project', requiredBefore:'first production work starts' },
  { id:'moscow-business-owner', label:'Moscow business / problem owner', party:'moscow', requiredBefore:'pilot scope can be formally agreed' },
  { id:'pilot-site-owner', label:'Pilot site representative / access owner', party:'site', requiredBefore:'physical field work' },
  { id:'integration-data-owner', label:'City integration / data owner', party:'moscow', requiredBefore:'provider/data boundary approval' },
  { id:'security-privacy-owner', label:'Security / privacy reviewer', party:'moscow', requiredBefore:'visitor/provider production-like test' },
  { id:'legal-rights-owner', label:'Legal / rights reviewer', party:'joint', requiredBefore:'publication and handover acceptance' },
  { id:'provider-company-owner', label:'Authorised YCLIENTS company / test-company owner', party:'provider', requiredBefore:'real provider test' }
];

export type PilotRaciRow = {
  id: string;
  workstream: string;
  responsible: PilotExecutionRoleId[];
  accountable: PilotExecutionRoleId[];
  consulted: PilotExecutionRoleId[];
  informed: PilotExecutionRoleId[];
  exitEvidence: string[];
};

export const pilotRaci: PilotRaciRow[] = [
  {
    id:'scope-acceptance',
    workstream:'Pilot scope, acceptance and change control',
    responsible:['pilot-manager','project-owner'],
    accountable:['project-owner','moscow-business-owner'],
    consulted:['pilot-site-owner','integration-data-owner','legal-rights-owner'],
    informed:['finance-owner','security-privacy-owner'],
    exitEvidence:['approved scope reference','acceptance matrix version','named owners']
  },
  {
    id:'romanov-field',
    workstream:'Romanov physical field proof',
    responsible:['field-lead','mobile-technical-lead'],
    accountable:['project-owner'],
    consulted:['pilot-site-owner'],
    informed:['moscow-business-owner'],
    exitEvidence:['Romanov P0 evidence package','field matrix summary','persistent anchor proof']
  },
  {
    id:'oec-repeatability',
    workstream:'Old English Court second-object repeatability',
    responsible:['field-lead','mobile-technical-lead'],
    accountable:['project-owner'],
    consulted:['pilot-site-owner','legal-rights-owner'],
    informed:['moscow-business-owner'],
    exitEvidence:['OEC object-specific repeatability proof','independent evidence refs']
  },
  {
    id:'visitor-pilot',
    workstream:'20–50 participant supervised visitor pilot',
    responsible:['research-lead','pilot-manager'],
    accountable:['project-owner'],
    consulted:['pilot-site-owner','security-privacy-owner'],
    informed:['moscow-business-owner'],
    exitEvidence:['study manifest','observer notes','aggregate study report','review outcome']
  },
  {
    id:'provider-proof',
    workstream:'Real YCLIENTS/provider evidence run',
    responsible:['integration-data-owner','mobile-technical-lead','provider-company-owner'],
    accountable:['project-owner'],
    consulted:['security-privacy-owner'],
    informed:['moscow-business-owner','pilot-manager'],
    exitEvidence:['real admission evidence','real webhook evidence','journey evidence pack','provider PASS']
  },
  {
    id:'governance',
    workstream:'Security, privacy, rights, IP/handover and SLA review',
    responsible:['security-privacy-owner','legal-rights-owner','project-owner'],
    accountable:['moscow-business-owner','project-owner'],
    consulted:['integration-data-owner','pilot-site-owner'],
    informed:['pilot-manager','finance-owner'],
    exitEvidence:['security review ref','rights clearance','IP handover review','operations SLA review']
  },
  {
    id:'economics',
    workstream:'Measured production economics',
    responsible:['finance-owner','pilot-manager'],
    accountable:['project-owner'],
    consulted:['field-lead','mobile-technical-lead','pilot-site-owner','integration-data-owner'],
    informed:['moscow-business-owner'],
    exitEvidence:['validated seven-input economics capture','basis/evidence refs for every measured input']
  },
  {
    id:'final-acceptance',
    workstream:'Final evidence package and human scale decision',
    responsible:['pilot-manager','project-owner'],
    accountable:['moscow-business-owner','project-owner'],
    consulted:['finance-owner','security-privacy-owner','legal-rights-owner','pilot-site-owner','integration-data-owner'],
    informed:['provider-company-owner'],
    exitEvidence:['final pilot report','acceptance matrix','decision record']
  }
];

export const romanovFieldDayRequirements = {
  minimumIosDevices: ROMANOV_REQUIRED_IOS_DEVICES,
  minimumAndroidDevices: ROMANOV_REQUIRED_ANDROID_DEVICES,
  distanceBucketsMeters: [...ROMANOV_FIELD_DISTANCES],
  controlPointsPerSession: ROMANOV_FIELD_REQUIRED_POINTS,
  minimumCompleteSessions:
    (ROMANOV_REQUIRED_IOS_DEVICES + ROMANOV_REQUIRED_ANDROID_DEVICES)
    * ROMANOV_FIELD_DISTANCES.length,
  meanResidualTargetCm: ROMANOV_FIELD_MEAN_TARGET_CM,
  maxResidualTargetCm: ROMANOV_FIELD_MAX_TARGET_CM,
  requiredConditions: [
    'one approved/current survey packet',
    'one exact current calibration placement per device bundle',
    'current metric authority',
    'field conditions recorded',
    'at least one daylight or overcast-daylight evidence session',
    'independent persistent-anchor resolve on another physical device',
    'restart/recovery evidence'
  ] as const,
  failClosedOn: [
    'missing or stale survey/metric authority',
    'unmeasured control point',
    'wrong distance bucket',
    'incomplete field conditions',
    'residual target failure',
    'insufficient iOS or Android device coverage',
    'persistent-anchor independent resolve missing',
    'restart/recovery evidence missing'
  ] as const
};

export const oldEnglishCourtFieldDayRequirements = {
  mustBeIndependentFromRomanovEvidence: true,
  requiredArtifacts: [
    'object-specific model evidence',
    'metric authority reference',
    'control-point authority reference',
    'survey evidence',
    'field matrix evidence',
    'persistent-anchor evidence'
  ] as const,
  failClosedOn: [
    'Romanov evidence reused',
    'object-specific authority missing',
    'field release not verified'
  ] as const
};

export const visitorPilotExecution = {
  minimumParticipants: 20,
  maximumParticipants: 50,
  slotFormat: 'P001…P050',
  routeId: 'varvarka-zaryadye-pilot',
  requiredForFirstReview: [
    'every planned slot has an observer note',
    'every aggregate app report is received or explicitly marked missing',
    'study manifest validates',
    'aggregate report passes privacy-safe cohort validation'
  ] as const,
  privacyRules: [
    'slot ID is not an app user ID',
    'no names, phone, email, booking IDs, device IDs or GPS in app analytics',
    'recruitment/consent records stay outside analytics',
    'observer free text is excluded from final aggregate study report'
  ] as const
};

export const yclientsProviderActivation = {
  requiredRuntimeSecrets: [
    'YCLIENTS_PARTNER_TOKEN',
    'YCLIENTS_USER_TOKEN',
    'YCLIENTS_COMPANY_ID',
    'YCLIENTS_WEBHOOK_PATH_TOKEN',
    'YCLIENTS_EVIDENCE_RETRIEVAL_TOKEN'
  ] as const,
  optionalRuntimeSecrets: [
    'YCLIENTS_CAPTURE_TEST_PAYLOAD=1'
  ] as const,
  controlledRun: [
    'bind secrets in Render; never commit them',
    'GET /ready must report receiverReady=true and providerSecretsReady=true',
    'perform one authorised real API call against permitted company/test company',
    'archive exact raw response and SHA-256',
    'create/validate real provider admission',
    'create one controlled record',
    'receive real webhook into /webhooks/yclients/<token>',
    'retrieve one-shot evidence and archive immediately',
    'observe provider state change',
    'trigger Journey Runtime replan-required and verified replacement route',
    'obtain terminal provider receipt',
    'build and validate immutable Journey Evidence Pack',
    'providerProofGate must return pass'
  ] as const,
  guardrails: [
    'receiver buffer is ephemeral-one-shot',
    'immutable external archive is mandatory before claiming PASS',
    'no mock or synthetic receipt can satisfy provider PASS',
    'Evidence Signing Authority remains locked until provider PASS'
  ] as const
};

export const governmentMeetingAsk = {
  meetingGoal:'Open the real pilot evidence path, not approve citywide scale.',
  decisionsRequired:[
    'name Moscow business/problem owner',
    'confirm pilot site / access owner',
    'name integration/data owner',
    'name security/privacy and legal/rights review owners',
    'agree field-day procedure and evidence review route',
    'agree supervised visitor-pilot procedure',
    'confirm provider/test-company access path or formal integration handoff',
    'agree legal/contract path for bounded pilot'
  ] as const,
  explicitNonAsks:[
    'no citywide rollout approval',
    'no invented ROI approval',
    'no automatic capital commitment',
    'no claim that provider or field proof already exists'
  ] as const,
  meetingExit:[
    'named owners',
    'confirmed pilot site',
    'confirmed dependency owners',
    'agreed evidence/acceptance working session',
    'dated next operational checkpoint only after owners confirm availability'
  ] as const
};

export function validatePilotExecutionPack() {
  const roleIds = new Set(pilotExecutionRoles.map((role) => role.id));
  const raciRolesValid = pilotRaci.every((row) =>
    [...row.responsible, ...row.accountable, ...row.consulted, ...row.informed]
      .every((role) => roleIds.has(role))
  );
  const everyWorkstreamOwned = pilotRaci.every(
    (row) => row.responsible.length > 0 && row.accountable.length > 0 && row.exitEvidence.length > 0
  );

  return {
    roleCount: pilotExecutionRoles.length,
    raciRows: pilotRaci.length,
    raciRolesValid,
    everyWorkstreamOwned,
    romanovMinimumCompleteSessions: romanovFieldDayRequirements.minimumCompleteSessions,
    visitorRangeValid:
      visitorPilotExecution.minimumParticipants === 20
      && visitorPilotExecution.maximumParticipants === 50,
    providerSecretsEnumerated: yclientsProviderActivation.requiredRuntimeSecrets.length === 5,
    meetingAskDecisionCount: governmentMeetingAsk.decisionsRequired.length
  };
}
