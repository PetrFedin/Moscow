/**
 * Destination-neutral foundation for future cities.
 *
 * The pilot is Moscow ONLY. A draft listing is not a launch claim. Do not add
 * another city without an admitted venue directory, timezone, trusted routing
 * evidence, product QA and per-city provider constraints.
 *
 * Brand DAYTERA is a working candidate, NOT approved, trademark-cleared or
 * published. The public application remains Moscow.
 */
export const PRODUCT_WORKING_NAME = 'DAYTERA' as const;
export const PRODUCT_PUBLIC_NAME = 'Moscow' as const;
export const PRODUCT_BRAND_STATUS = 'proposal-only' as const;

export type DestinationDescriptor = Readonly<{
  id: string;
  countryCode: string;
  timezone: string;
  display: Readonly<{
    ru: string;
    en: string;
    zh: string;
    ruPrepositional: string;
    ruPrepositionalUpper: string;
  }>;
  phase: 'draft-pilot' | 'admitted';
  readiness: Readonly<{
    localTripDiary: boolean;
    editorialDirectory: boolean;
    onlineProviderBooking: boolean;
    publiclyVerifiedRealtimeAvailability: boolean;
    externallyVerifiedLocation: boolean;
    crossDeviceSync: boolean;
  }>;
}>;

const pilotMoscow: DestinationDescriptor = {
  id: 'moscow',
  countryCode: 'RU',
  timezone: 'Europe/Moscow',
  display: {
    ru: 'Москва',
    en: 'Moscow',
    zh: '莫斯科',
    ruPrepositional: 'Москве',
    ruPrepositionalUpper: 'МОСКВЕ'
  },
  phase: 'draft-pilot',
  readiness: {
    localTripDiary: true,
    editorialDirectory: true,
    onlineProviderBooking: false,
    publiclyVerifiedRealtimeAvailability: false,
    externallyVerifiedLocation: false,
    crossDeviceSync: false
  }
};

export const PILOT_DESTINATIONS: readonly DestinationDescriptor[] = Object.freeze([pilotMoscow]);

/** Fail closed rather than silently treating a non-Moscow trip as Moscow. */
export function requireAdmittedDestination(id: string): DestinationDescriptor {
  const match = PILOT_DESTINATIONS.find((destination) => destination.id === id);
  if (!match) throw new Error('Unsupported destination: ' + id);
  return match;
}

export function formatDestinationTime(value: string | undefined, destinationId: string): string {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';
  const destination = requireAdmittedDestination(destinationId);
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: destination.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value));
}
