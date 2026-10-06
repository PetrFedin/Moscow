export const PRE_PILOT_EXTERNAL_INPUT_VERSION = 1 as const;

export type ExternalInputParty =
  | 'moscow'
  | 'site'
  | 'integration'
  | 'security-privacy'
  | 'legal-rights'
  | 'operations'
  | 'provider';

export type ExternalInputItem = {
  id: string;
  party: ExternalInputParty;
  title: string;
  request: string;
  expectedEvidence: string[];
  secretHandling: 'not-secret' | 'secure-channel-required';
  status: 'awaiting' | 'received' | 'rejected';
  responseRef?: string;
  responderName?: string;
  responderOrganization?: string;
  authorityRef?: string;
};

export type PrePilotExternalInputManifest = {
  kind: 'moscow-pre-pilot-external-input';
  version: typeof PRE_PILOT_EXTERNAL_INPUT_VERSION;
  pilotId: 'varvarka-zaryadye-pilot';
  updatedAt: string;
  items: ExternalInputItem[];
};

const requestDefinitions: Array<Omit<ExternalInputItem,'status'>> = [
  {
    id:'moscow-business-owner',
    party:'moscow',
    title:'Moscow business/problem owner',
    request:'Name the accountable Moscow owner for pilot scope, acceptance and the final human scale/no-scale decision.',
    expectedEvidence:['person name','organization','authority/mandate reference'],
    secretHandling:'not-secret'
  },
  {
    id:'pilot-site-access',
    party:'site',
    title:'Pilot site and physical access',
    request:'Confirm the Varvarka/Zaryadye pilot site, physical-access owner and permitted field-work route/window.',
    expectedEvidence:['site identifier','access owner','access/permission reference','allowed operating window or scheduling route'],
    secretHandling:'not-secret'
  },
  {
    id:'integration-data-owner',
    party:'integration',
    title:'Integration/data owner',
    request:'Name the accountable owner for city/provider data boundaries and integration review.',
    expectedEvidence:['person name','organization','authority reference','integration contact route'],
    secretHandling:'not-secret'
  },
  {
    id:'security-privacy-review',
    party:'security-privacy',
    title:'Security/privacy review route',
    request:'Confirm the reviewer and route for pilot data flow, retention, permissions, analytics and provider boundaries.',
    expectedEvidence:['reviewer/organization','review route reference','privacy/security decision or scheduled review reference'],
    secretHandling:'not-secret'
  },
  {
    id:'legal-rights-review',
    party:'legal-rights',
    title:'Legal/rights review route',
    request:'Confirm reviewer and route for content/publication rights, software/IP handover and pilot legal form.',
    expectedEvidence:['reviewer/organization','review route reference','rights/IP decision or scheduled review reference'],
    secretHandling:'not-secret'
  },
  {
    id:'operations-sla-review',
    party:'operations',
    title:'Operations/SLA review route',
    request:'Confirm who reviews support hours, incidents, monitoring and escalation responsibilities for the bounded pilot.',
    expectedEvidence:['owner/organization','review route reference','SLA/escalation decision or scheduled review reference'],
    secretHandling:'not-secret'
  },
  {
    id:'yclients-company-authority',
    party:'provider',
    title:'YCLIENTS company/test-company authority',
    request:'Confirm which YCLIENTS company/test company may be used for one controlled record/webhook run and who authorizes it.',
    expectedEvidence:['company/test-company ID','authorizing owner','company authority reference','webhook/test permission reference'],
    secretHandling:'not-secret'
  },
  {
    id:'yclients-secret-delivery',
    party:'provider',
    title:'YCLIENTS secret delivery',
    request:'Provide the required provider credentials only through an approved secure secret-delivery route for Render configuration.',
    expectedEvidence:['secure delivery route reference','confirmation that partner/user tokens are available for authorized binding'],
    secretHandling:'secure-channel-required'
  }
];

function validIso(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildExternalInputRequestTemplate(
  updatedAt = new Date().toISOString()
): PrePilotExternalInputManifest {
  return {
    kind:'moscow-pre-pilot-external-input',
    version:PRE_PILOT_EXTERNAL_INPUT_VERSION,
    pilotId:'varvarka-zaryadye-pilot',
    updatedAt,
    items:requestDefinitions.map((item)=>({
      ...item,
      status:'awaiting'
    }))
  };
}

export function validateExternalInputManifest(
  manifest:PrePilotExternalInputManifest
) {
  const blockers:string[]=[];
  if (manifest.kind !== 'moscow-pre-pilot-external-input') blockers.push('kind-invalid');
  if (manifest.version !== PRE_PILOT_EXTERNAL_INPUT_VERSION) blockers.push('version-invalid');
  if (manifest.pilotId !== 'varvarka-zaryadye-pilot') blockers.push('pilot-invalid');
  if (!validIso(manifest.updatedAt)) blockers.push('updated-at-invalid');

  const expectedIds=new Set(requestDefinitions.map((item)=>item.id));
  const seen=new Set<string>();

  for (const item of manifest.items) {
    if (!expectedIds.has(item.id)) {
      blockers.push(`unknown-item:${item.id}`);
      continue;
    }
    if (seen.has(item.id)) blockers.push(`duplicate-item:${item.id}`);
    seen.add(item.id);

    if (!['awaiting','received','rejected'].includes(item.status)) {
      blockers.push(`status-invalid:${item.id}`);
      continue;
    }

    if (item.status === 'received') {
      if (!text(item.responseRef)) blockers.push(`response-ref-missing:${item.id}`);
      if (!text(item.responderName)) blockers.push(`responder-name-missing:${item.id}`);
      if (!text(item.responderOrganization)) blockers.push(`responder-organization-missing:${item.id}`);
      if (!text(item.authorityRef)) blockers.push(`authority-ref-missing:${item.id}`);
    }

    if (item.secretHandling === 'secure-channel-required') {
      const serialized=JSON.stringify(item);
      if (/YCLIENTS_(PARTNER|USER|WEBHOOK_PATH|EVIDENCE_RETRIEVAL)_TOKEN/i.test(serialized)) {
        blockers.push(`secret-name-leaked-into-response:${item.id}`);
      }
      if (/token\s*[:=]\s*[^\s]+/i.test(serialized)) {
        blockers.push(`possible-secret-value-in-manifest:${item.id}`);
      }
    }
  }

  for (const definition of requestDefinitions) {
    if (!seen.has(definition.id)) blockers.push(`item-missing:${definition.id}`);
  }

  const awaiting=manifest.items.filter((item)=>item.status==='awaiting').map((item)=>item.id);
  const rejected=manifest.items.filter((item)=>item.status==='rejected').map((item)=>item.id);
  const received=manifest.items.filter((item)=>item.status==='received').map((item)=>item.id);

  return {
    valid:blockers.length===0,
    complete:blockers.length===0 && awaiting.length===0 && rejected.length===0 && received.length===requestDefinitions.length,
    blockers:[...new Set(blockers)],
    awaiting,
    rejected,
    received
  };
}

export const prePilotExternalInputDefinitions=requestDefinitions;
