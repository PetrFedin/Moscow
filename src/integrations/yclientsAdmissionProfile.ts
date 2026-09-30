import type { RealProviderAdmission } from './realProviderAdmission.ts';

export const yclientsAdmissionProfile: Omit<RealProviderAdmission, 'credentials'> = {
  version: 1,
  providerId: 'yclients',
  adapterId: 'yclients-booking-v1',
  kind: 'venue',
  destinationId: 'moscow',
  sourceUrl: 'https://api.yclients.com',
  discoveredCapabilities: [
    'booking-handoff',
    'booking-receipt'
  ],
  capabilityEvidenceRef: 'docs/external/yclients-api-webhook-capabilities.md',
  schemaMapping: {
    providerSchemaVersion: 'documented-api-current',
    mappingVersion: '1',
    entityIdPath: '$.id',
    updatedAtPath: '$.last_change_date',
    bookingUrlPath: '$.booking_url',
    receiptIdPath: '$.resource_id',
    evidenceRef: 'docs/external/yclients-schema-mapping-v1.md'
  }
};
