import { curatedMoscowPlace, type CuratedMoscowPlace } from './curatedMoscowPlaces.ts';
import {
  addManualTripItem,
  parsePersonalTrip,
  type PersonalTrip,
  type PersonalTripCommitment,
  type PersonalTripItemKind
} from './personalTrip.ts';
import { manualMoscowInterval } from './manualTripTime.ts';

/**
 * Moscow's first venue-service bridge is a LOCAL itinerary intake and a
 * source-controlled external handoff. There are NO authenticated suppliers,
 * live seats, order transactions, card payments, fiscal receipts or refunds.
 *
 * RestoDirect, StudioBook and ticketing are candidate SERVER-SIDE adapters,
 * never implicitly activated by showing a button in the mobile client.
 */
export type VenueServiceKind =
  | 'restaurant' | 'cafe' | 'bar'
  | 'museum' | 'gallery' | 'exhibition'
  | 'theatre' | 'cinema' | 'concert' | 'event'
  | 'activity' | 'studio' | 'park';

export type VenueServiceVertical = 'dining' | 'tickets' | 'appointments' | 'visit';
export type FutureVenueAdapter = 'restodirect' | 'studiobook' | 'ticketing' | 'none';

export type VenueServiceCapability = Readonly<{
  vertical: VenueServiceVertical;
  /** Future adapter candidate only. Never means connected or enabled. */
  adapterCandidate: FutureVenueAdapter;
  commitmentKind: PersonalTripCommitment['kind'] | null;
  tripKind: PersonalTripItemKind;
  /** A venue-controlled website is NOT an API, real availability, or proof. */
  realSupplierApiConnected: false;
  liveAvailabilityVerified: false;
  inAppCheckoutEnabled: false;
}>;

const reservation = (
  vertical: VenueServiceVertical,
  adapterCandidate: FutureVenueAdapter,
  commitmentKind: PersonalTripCommitment['kind'] | null,
  tripKind: PersonalTripItemKind
): VenueServiceCapability => ({
  vertical, adapterCandidate, commitmentKind, tripKind,
  realSupplierApiConnected: false,
  liveAvailabilityVerified: false,
  inAppCheckoutEnabled: false
});

export const VENUE_SERVICE_CAPABILITIES: Readonly<Record<VenueServiceKind, VenueServiceCapability>> = Object.freeze({
  restaurant: reservation('dining', 'restodirect', 'reservation', 'food'),
  cafe: reservation('dining', 'restodirect', 'reservation', 'cafe'),
  bar: reservation('dining', 'restodirect', 'reservation', 'bar'),
  museum: reservation('tickets', 'ticketing', 'ticket', 'museum'),
  gallery: reservation('tickets', 'ticketing', 'ticket', 'gallery'),
  exhibition: reservation('tickets', 'ticketing', 'ticket', 'exhibition'),
  theatre: reservation('tickets', 'ticketing', 'ticket', 'theatre'),
  cinema: reservation('tickets', 'ticketing', 'ticket', 'cinema'),
  concert: reservation('tickets', 'ticketing', 'ticket', 'concert'),
  event: reservation('tickets', 'ticketing', 'ticket', 'event'),
  activity: reservation('visit', 'ticketing', 'ticket', 'activity'),
  studio: reservation('appointments', 'studiobook', 'reservation', 'wellness'),
  park: reservation('visit', 'none', null, 'activity')
});

export function venueServiceCapability(kind: VenueServiceKind): VenueServiceCapability {
  const selected = VENUE_SERVICE_CAPABILITIES[kind];
  if (!selected) throw new Error('Unsupported booking service category');
  return selected;
}

/** Only already curated real venue URLs can be opened as official handoffs. */
export function officialVenueServiceHandoff(place: CuratedMoscowPlace): Readonly<{
  url: string;
  kind: 'official-website-only';
  supplierBookingVerified: false;
  customerDataTransmitted: false;
}> {
  const canonical = curatedMoscowPlace(place.id);
  if (!canonical || canonical.kind !== place.kind
    || canonical.officialUrl !== place.officialUrl) {
    throw new Error('Venue has no approved official handoff');
  }
  let url: URL;
  try { url = new URL(canonical.officialUrl); }
  catch { throw new Error('Venue official URL is invalid'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password
    || url.port || url.searchParams.has('token')) {
    throw new Error('Venue official URL must be a safe source-controlled HTTPS URL');
  }
  return {
    url: url.toString(),
    kind: 'official-website-only',
    supplierBookingVerified: false,
    customerDataTransmitted: false
  };
}

export type SaveVenueServiceInput = Readonly<{
  trip: PersonalTrip;
  venue: CuratedMoscowPlace;
  itemId: string;
  dayDate: string;
  startTime: string;
  endTime: string;
  /** plan = intention ONLY; self-reported = user says they already hold a booking. */
  mode: 'plan' | 'self-reported';
  partySize?: number;
  reference?: string;
  updatedAt: string;
}>;

/**
 * A single personal trip stop is the authority for the Wallet, Today,
 * schedule conflict detector and Visit Passport. Never maintain an
 * independent "booking status" copy for a third-party handoff.
 */
export function saveVenueServiceToTrip(input: SaveVenueServiceInput): PersonalTrip {
  const handoff = officialVenueServiceHandoff(input.venue);
  const canonical = curatedMoscowPlace(input.venue.id);
  if (!canonical) throw new Error('Unknown curated venue');
  const capability = venueServiceCapability(canonical.kind);
  const { plannedStartAt, plannedEndAt } = manualMoscowInterval(
    input.dayDate, input.startTime, input.endTime
  );
  const ref = input.reference?.trim() ?? '';
  if (ref.length > 120 || /[\x00-\x1f\x7f]/.test(ref)) {
    throw new Error('Invalid private booking reference');
  }
  if (input.partySize !== undefined && (
    !Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > 50
  )) {
    throw new Error('Participants must be between 1 and 50');
  }
  if (input.mode !== 'plan' && input.mode !== 'self-reported') {
    throw new Error('Unsupported service booking mode');
  }
  if (input.mode === 'plan' && ref) {
    throw new Error('A planned visit cannot carry a purchased-ticket reference');
  }
  if (input.mode === 'self-reported' && !capability.commitmentKind) {
    throw new Error('This venue does not admit an unverified ticket/reservation');
  }
  if (input.trip.destinationId !== 'moscow') {
    throw new Error('Venue service is not admitted in this destination');
  }
  if (input.trip.items.some(item =>
    item.catalogPlaceId === canonical.id
    && item.plannedStartAt === plannedStartAt
    && item.status !== 'cancelled')) {
    throw new Error('This venue and time are already in the trip');
  }

  const commitment: PersonalTripCommitment | undefined =
    input.mode === 'self-reported' && capability.commitmentKind
      ? {
          kind: capability.commitmentKind,
          status: 'confirmed',
          verification: 'user-declared',
          ...(ref ? { reference: ref } : {}),
          ...(input.partySize ? { partySize: input.partySize } : {}),
          address: canonical.addressRu,
          externalUrl: handoff.url
        }
      : undefined;
  // Upgrade an unscheduled venue saved from Discover without duplicating it
  // in the day route and Passport. Never rewrite an already visited, booked,
  // cancelled or independently timed occurrence.
  const unbookedPlan = input.trip.items.find(item =>
    item.catalogPlaceId === canonical.id
    && item.dayDate === input.dayDate
    && !item.plannedStartAt
    && !item.commitment
    && item.status === 'planned'
    && !input.trip.visits.some(visit => visit.itemId === item.id)
  );
  if (unbookedPlan) {
    return parsePersonalTrip(JSON.stringify({
      ...input.trip,
      updatedAt: input.updatedAt,
      items: input.trip.items.map(item => item.id === unbookedPlan.id
        ? {
            ...item,
            kind: capability.tripKind,
            title: canonical.titleRu,
            note: canonical.addressRu,
            plannedStartAt,
            plannedEndAt,
            ...(input.mode === 'plan' && input.partySize
              ? { plannedPartySize: input.partySize } : {}),
            ...(commitment ? { commitment } : {}),
            catalogPlaceId: canonical.id,
            officialSourceUrl: handoff.url
          } : item)
    }));
  }
  const inserted = addManualTripItem({
    trip: input.trip,
    itemId: input.itemId,
    dayDate: input.dayDate,
    title: canonical.titleRu,
    kind: capability.tripKind,
    plannedStartAt,
    plannedEndAt,
    note: canonical.addressRu,
    ...(commitment ? { commitment } : {}),
    updatedAt: input.updatedAt
  });
  return parsePersonalTrip(JSON.stringify({
    ...inserted,
    items: inserted.items.map(item => item.id === input.itemId
      ? {
          ...item,
          ...(input.mode === 'plan' && input.partySize ? { plannedPartySize: input.partySize } : {}),
          catalogPlaceId: canonical.id,
          officialSourceUrl: handoff.url
        }
      : item)
  }));
}
