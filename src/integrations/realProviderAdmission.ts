import type { ProviderSandboxKind } from './providerSandboxContract.ts';

export const REAL_PROVIDER_ADMISSION_VERSION = 1 as const;

export type ProviderAdmissionCapability =
  | 'operational-status'
  | 'event-schedule'
  | 'booking-handoff'
  | 'booking-receipt'
  | 'routing';

export type ProviderCredentialAdmission = {
  mode: 'api-key' | 'oauth2' | 'signed-feed' | 'public-feed' | 'public-api';
  secretRef?: string;
  admittedAt: string;
  evidenceRef: string;
};

export type ProviderSchemaMapping = {
  providerSchemaVersion: string;
  mappingVersion: string;
  entityIdPath?: string;
  updatedAtPath?: string;
  statusPath?: string;
  bookingUrlPath?: string;
  receiptIdPath?: string;
  routeDurationPath?: string;
  routeDistancePath?: string;
  evidenceRef: string;
};

export type RealProviderAdmission = {
  version: typeof REAL_PROVIDER_ADMISSION_VERSION;
  providerId: string;
  adapterId: string;
  kind: ProviderSandboxKind | 'routing';
  destinationId: string;
  sourceUrl: string;
  credentials: ProviderCredentialAdmission;
  discoveredCapabilities: ProviderAdmissionCapability[];
  capabilityEvidenceRef: string;
  schemaMapping: ProviderSchemaMapping;
};

export type ProviderAdmissionResult = {
  status: 'blocked' | 'admitted';
  providerId: string;
  blockers: string[];
  admittedCapabilities: ProviderAdmissionCapability[];
};

function validIso(value: string) {
  return Number.isFinite(Date.parse(value));
}

export function validateRealProviderAdmission(
  admission: RealProviderAdmission
): ProviderAdmissionResult {
  const blockers: string[] = [];
  if (!admission.providerId.trim()) blockers.push('provider-id-missing');
  if (!admission.adapterId.trim()) blockers.push('adapter-id-missing');
  if (!admission.destinationId.trim()) blockers.push('destination-id-missing');
  if (!admission.sourceUrl.startsWith('https://')) blockers.push('provider-source-url-invalid');
  if (!validIso(admission.credentials.admittedAt)) blockers.push('credential-admission-time-invalid');
  if (!admission.credentials.evidenceRef.trim()) blockers.push('credential-admission-evidence-missing');
  if (
    admission.credentials.mode !== 'public-feed'
    && admission.credentials.mode !== 'public-api'
    && !admission.credentials.secretRef?.trim()
  ) {
    blockers.push('credential-secret-ref-missing');
  }
  if (!admission.capabilityEvidenceRef.trim()) blockers.push('capability-evidence-missing');
  if (admission.discoveredCapabilities.length === 0) blockers.push('provider-capabilities-empty');
  if (!admission.schemaMapping.providerSchemaVersion.trim()) blockers.push('provider-schema-version-missing');
  if (!admission.schemaMapping.mappingVersion.trim()) blockers.push('schema-mapping-version-missing');
  const routingOnly = admission.kind === 'routing'
    || admission.discoveredCapabilities.includes('routing');

  if (!routingOnly && !admission.schemaMapping.entityIdPath?.trim()) {
    blockers.push('schema-entity-id-path-missing');
  }
  if (!routingOnly && !admission.schemaMapping.updatedAtPath?.trim()) {
    blockers.push('schema-updated-at-path-missing');
  }
  if (!admission.schemaMapping.evidenceRef.trim()) blockers.push('schema-mapping-evidence-missing');

  if (
    admission.discoveredCapabilities.includes('operational-status')
    && !admission.schemaMapping.statusPath?.trim()
  ) blockers.push('schema-status-path-missing');

  if (
    admission.discoveredCapabilities.includes('booking-handoff')
    && !admission.schemaMapping.bookingUrlPath?.trim()
  ) blockers.push('schema-booking-url-path-missing');

  if (
    admission.discoveredCapabilities.includes('booking-receipt')
    && !admission.schemaMapping.receiptIdPath?.trim()
  ) blockers.push('schema-receipt-id-path-missing');

  if (
    admission.discoveredCapabilities.includes('routing')
    && !admission.schemaMapping.routeDurationPath?.trim()
  ) blockers.push('schema-route-duration-path-missing');

  return {
    status: blockers.length === 0 ? 'admitted' : 'blocked',
    providerId: admission.providerId,
    blockers,
    admittedCapabilities: blockers.length === 0 ? [...new Set(admission.discoveredCapabilities)] : []
  };
}
