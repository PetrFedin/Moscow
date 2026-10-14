import { parsePersonalTrip, type PersonalTrip } from './personalTrip.ts';
import {
  archivePersonalTrip,
  emptyPersonalTripArchive,
  parsePersonalTripArchive,
  type PersonalTripArchive
} from './personalTripArchive.ts';

/**
 * Portable, deliberately plaintext backup. No remote upload, encryption claim or
 * provider-issued booking claim is made by this format.
 */
export const PERSONAL_TRIP_BACKUP_FORMAT = 'moscow-personal-trips-backup' as const;
export const PERSONAL_TRIP_BACKUP_VERSION = 1 as const;
export const MAX_PERSONAL_TRIP_BACKUP_CHARACTERS = 750_000;
const MAX_TRIPS = 100;
const MAX_ITEMS_PER_TRIP = 500;

export type PersonalTripBackup = {
  format: typeof PERSONAL_TRIP_BACKUP_FORMAT;
  schemaVersion: typeof PERSONAL_TRIP_BACKUP_VERSION;
  exportedAt: string;
  activeTrip: PersonalTrip | null;
  archive: PersonalTripArchive;
};

export type PersonalTripBackupPreview = {
  tripCount: number;
  itemCount: number;
  visitCount: number;
  commitmentCount: number;
  acceptanceReceiptCount: number;
};

export type PersonalTripBackupMerge = {
  archive: PersonalTripArchive;
  imported: number;
  skipped: number;
};

function validateBackupTrip(input: unknown): PersonalTrip {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Backup trip must be an object');
  }
  const trip = parsePersonalTrip(JSON.stringify(input));
  if (trip.destinationId !== 'moscow') throw new Error('Backup is not a Moscow trip');
  if (trip.id.length > 180 || trip.title.length > 200) throw new Error('Backup trip identity is too long');
  if (trip.items.length > MAX_ITEMS_PER_TRIP || trip.visits.length > MAX_ITEMS_PER_TRIP
    || (trip.replacementReceipts?.length ?? 0) > MAX_ITEMS_PER_TRIP) {
    throw new Error('Backup trip collection limit exceeded');
  }
  // An imported file is untrusted, even though an internal local archive already
  // uses parsePersonalTrip. Explicitly check the presentation-critical enums.
  for (const item of trip.items) {
    if (!['manual', 'provider', 'destination-package'].includes(item.source)
      || !['planned', 'completed', 'skipped', 'cancelled'].includes(item.status)
      || typeof item.kind !== 'string' || !item.kind.trim()
      || item.id.length > 180 || item.title.length > 500) {
      throw new Error('Invalid backup trip item');
    }
    if (item.commitment) {
      if (!['ticket', 'reservation'].includes(item.commitment.kind)
        || !['held', 'confirmed', 'cancelled'].includes(item.commitment.status)
        || !['user-declared', 'provider-confirmed'].includes(item.commitment.verification)) {
        throw new Error('Invalid backup booking verification');
      }
    }
  }
  for (const visit of trip.visits) {
    if (!['user-confirmed', 'route-completed', 'provider-receipt', 'proximity'].includes(visit.evidence)
      || visit.id.length > 180 || visit.title.length > 500) {
      throw new Error('Invalid backup visit evidence');
    }
  }
  return trip;
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, entry: unknown) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      return Object.fromEntries(
        Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))
      );
    }
    return entry;
  });
}

function normalizedArchive(raw: PersonalTripArchive): PersonalTripArchive {
  const validated = parsePersonalTripArchive(JSON.stringify(raw));
  if (validated.trips.length > MAX_TRIPS) throw new Error('Too many trips in backup');
  return {
    schemaVersion: validated.schemaVersion,
    trips: validated.trips.map(validateBackupTrip)
  };
}

export function createPersonalTripBackup(input: {
  activeTrip: PersonalTrip | null;
  archive: PersonalTripArchive;
  exportedAt: string;
}): string {
  const active = input.activeTrip ? validateBackupTrip(input.activeTrip) : null;
  const existing = normalizedArchive(input.archive);
  // The active version supersedes any older snapshot with the same ID.
  const archive = parsePersonalTripArchive(JSON.stringify({
    schemaVersion: existing.schemaVersion,
    trips: existing.trips.filter((trip) => trip.id !== active?.id)
  }));
  if (!active && archive.trips.length === 0) throw new Error('No trips to export');
  if (!Number.isFinite(Date.parse(input.exportedAt)) || new Date(input.exportedAt).toISOString() !== input.exportedAt) {
    throw new Error('Invalid backup export time');
  }
  const raw = JSON.stringify({
    format: PERSONAL_TRIP_BACKUP_FORMAT,
    schemaVersion: PERSONAL_TRIP_BACKUP_VERSION,
    exportedAt: input.exportedAt,
    activeTrip: active,
    archive
  } satisfies PersonalTripBackup, null, 2);
  if (raw.length > MAX_PERSONAL_TRIP_BACKUP_CHARACTERS) throw new Error('Backup too large for manual export');
  // Test the same parser used for files received from another device.
  parsePersonalTripBackup(raw);
  return raw;
}

export function parsePersonalTripBackup(raw: string): PersonalTripBackup {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_PERSONAL_TRIP_BACKUP_CHARACTERS) {
    throw new Error('Backup is empty or too large');
  }
  const input = JSON.parse(raw) as Partial<PersonalTripBackup> | null;
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || input.format !== PERSONAL_TRIP_BACKUP_FORMAT
    || input.schemaVersion !== PERSONAL_TRIP_BACKUP_VERSION
    || typeof input.exportedAt !== 'string'
    || !Number.isFinite(Date.parse(input.exportedAt))
    || new Date(input.exportedAt).toISOString() !== input.exportedAt
    || !('activeTrip' in input)
    || !('archive' in input)) {
    throw new Error('Unsupported Moscow backup format');
  }
  const active = input.activeTrip === null ? null : validateBackupTrip(input.activeTrip);
  const archive = normalizedArchive(input.archive as PersonalTripArchive);
  if (active && archive.trips.some((trip) => trip.id === active.id)) {
    throw new Error('Backup contains two versions of the active trip');
  }
  if ((active ? 1 : 0) + archive.trips.length === 0
    || (active ? 1 : 0) + archive.trips.length > MAX_TRIPS) {
    throw new Error('Invalid backup trip count');
  }
  return {
    format: PERSONAL_TRIP_BACKUP_FORMAT,
    schemaVersion: PERSONAL_TRIP_BACKUP_VERSION,
    exportedAt: input.exportedAt,
    activeTrip: active,
    archive
  };
}

export function previewPersonalTripBackup(raw: string): PersonalTripBackupPreview {
  const parsed = parsePersonalTripBackup(raw);
  const trips = [...(parsed.activeTrip ? [parsed.activeTrip] : []), ...parsed.archive.trips];
  return {
    tripCount: trips.length,
    itemCount: trips.reduce((count, trip) => count + trip.items.length, 0),
    visitCount: trips.reduce((count, trip) => count + trip.visits.length, 0),
    commitmentCount: trips.reduce((count, trip) =>
      count + trip.items.filter((item) => Boolean(item.commitment)).length, 0),
    acceptanceReceiptCount: trips.reduce((count, trip) =>
      count + (trip.replacementReceipts?.length ?? 0), 0)
  };
}

/**
 * Import is archive-only. The local active trip and any different revision with
 * an existing ID are NEVER overwritten. Callers persist the resulting archive
 * only after validating the entire incoming file.
 */
export function mergePersonalTripBackup(input: {
  backup: PersonalTripBackup;
  activeTrip: PersonalTrip | null;
  archive: PersonalTripArchive;
}): PersonalTripBackupMerge {
  const local = normalizedArchive(input.archive);
  const active = input.activeTrip ? validateBackupTrip(input.activeTrip) : null;
  const incoming = parsePersonalTripBackup(JSON.stringify(input.backup));
  const known = new Map<string, string>();
  for (const trip of local.trips) known.set(trip.id, canonical(trip));
  if (active) known.set(active.id, canonical(active));

  let merged = local;
  let imported = 0;
  let skipped = 0;
  const trips = [...(incoming.activeTrip ? [incoming.activeTrip] : []), ...incoming.archive.trips];
  for (const trip of trips) {
    const previous = known.get(trip.id);
    if (previous !== undefined) {
      if (previous !== canonical(trip)) throw new Error('Trip identity conflict: ' + trip.id);
      skipped++;
      continue;
    }
    merged = archivePersonalTrip(merged, trip);
    known.set(trip.id, canonical(trip));
    imported++;
  }
  return { archive: merged, imported, skipped };
}

export function emptyBackupArchive(): PersonalTripArchive {
  return emptyPersonalTripArchive();
}
