import { parsePersonalTrip, type PersonalTrip } from './personalTrip.ts';
import {
  PERSONAL_TRIP_ARCHIVE_STORAGE_KEY,
  emptyPersonalTripArchive,
  parsePersonalTripArchive,
  type PersonalTripArchive
} from './personalTripArchive.ts';

export const PERSONAL_TRIP_ACTIVE_STORAGE_KEY = 'moscow:v1:personal-trip';
export const PERSONAL_TRIP_TRANSACTION_STORAGE_KEY = 'moscow:v1:personal-trip-transaction';
export const PERSONAL_TRIP_TRANSACTION_VERSION = 1 as const;

const MAX_TRANSACTION_CHARACTERS = 2_500_000;

export type TripStorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
};

export type TripStorageState = {
  activeTrip: PersonalTrip | null;
  archive: PersonalTripArchive;
};

export type TripStorageOperation = 'archive' | 'switch' | 'import' | 'delete' | 'edit';

type RawImage = {
  active: string | null;
  archive: string | null;
};

type TransactionIntent = {
  schemaVersion: typeof PERSONAL_TRIP_TRANSACTION_VERSION;
  operation: TripStorageOperation;
  id: string;
  before: RawImage;
  after: RawImage;
};

/**
 * This lock serializes operations within one JS runtime only. It is NOT a
 * multi-tab or cross-device lock, nor is AsyncStorage an atomic database.
 */
let serialTail: Promise<void> = Promise.resolve();

function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const running = serialTail.then(operation);
  serialTail = running.then(() => undefined, () => undefined);
  return running;
}

function isRawImage(value: unknown): value is RawImage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const raw = value as Record<string, unknown>;
  return (typeof raw.active === 'string' || raw.active === null)
    && (typeof raw.archive === 'string' || raw.archive === null)
    && (!raw.active || raw.active.length <= MAX_TRANSACTION_CHARACTERS)
    && (!raw.archive || raw.archive.length <= MAX_TRANSACTION_CHARACTERS);
}

function parseImage(raw: RawImage): TripStorageState {
  const activeTrip = raw.active === null ? null : parsePersonalTrip(raw.active);
  const archive = raw.archive === null
    ? emptyPersonalTripArchive()
    : parsePersonalTripArchive(raw.archive);
  if (activeTrip && activeTrip.destinationId !== 'moscow') {
    throw new Error('Trip storage contains a non-Moscow active journey');
  }
  if (archive.trips.some((trip) => trip.destinationId !== 'moscow')) {
    throw new Error('Trip storage contains an invalid destination');
  }
  return { activeTrip, archive };
}

async function readRawImage(storage: TripStorageAdapter): Promise<RawImage> {
  const active = await storage.getItem(PERSONAL_TRIP_ACTIVE_STORAGE_KEY);
  const archive = await storage.getItem(PERSONAL_TRIP_ARCHIVE_STORAGE_KEY);
  const image = { active, archive };
  if (!isRawImage(image)) throw new Error('Personal trip storage snapshot is invalid or too large');
  parseImage(image);
  return image;
}

function parseIntent(raw: string): TransactionIntent {
  if (raw.length > MAX_TRANSACTION_CHARACTERS * 4) throw new Error('Trip transaction is too large');
  const value = JSON.parse(raw) as Partial<TransactionIntent> | null;
  if (!value || value.schemaVersion !== PERSONAL_TRIP_TRANSACTION_VERSION
    || !['archive', 'switch', 'import', 'delete', 'edit'].includes(value.operation as string)
    || typeof value.id !== 'string' || !value.id.trim()
    || !isRawImage(value.before) || !isRawImage(value.after)) {
    throw new Error('Unsupported or corrupted trip transaction');
  }
  parseImage(value.before);
  parseImage(value.after);
  return value as TransactionIntent;
}

async function writeChecked(storage: TripStorageAdapter, key: string, target: string | null) {
  if (target === null) await storage.removeItem(key);
  else await storage.setItem(key, target);
  const readBack = await storage.getItem(key);
  if (readBack !== target) {
    throw new Error('Trip storage read-back mismatch: ' + key);
  }
}

async function recoverPendingTransaction(storage: TripStorageAdapter): Promise<boolean> {
  const rawIntent = await storage.getItem(PERSONAL_TRIP_TRANSACTION_STORAGE_KEY);
  if (rawIntent === null) return false;
  const intent = parseIntent(rawIntent);
  const current = await readRawImage(storage);
  for (const field of ['archive', 'active'] as const) {
    if (current[field] !== intent.before[field] && current[field] !== intent.after[field]) {
      // Do not overwrite a concurrent tab's data or unknown manual revisions.
      throw new Error('Trip transaction recovery conflict: ' + field);
    }
  }

  // Idempotent forward replay: keep every version until after read-back.
  if (current.archive !== intent.after.archive) {
    await writeChecked(storage, PERSONAL_TRIP_ARCHIVE_STORAGE_KEY, intent.after.archive);
  }
  if (current.active !== intent.after.active) {
    await writeChecked(storage, PERSONAL_TRIP_ACTIVE_STORAGE_KEY, intent.after.active);
  }

  // Verify both values together before releasing the journal.
  const completed = await readRawImage(storage);
  if (completed.archive !== intent.after.archive || completed.active !== intent.after.active) {
    throw new Error('Trip transaction recovery verification failed');
  }
  await writeChecked(storage, PERSONAL_TRIP_TRANSACTION_STORAGE_KEY, null);
  return true;
}

/**
 * User edits are also transitions: one active-key autosave cannot silently
 * replace a newer saved revision. Legacy v1 data is compared by validated
 * record content, not the last editor's current React render.
 *
 * This avoids stale-tab overwrites when the other edit has already completed;
 * it does NOT provide an atomic cross-tab lock where Web Locks are unavailable.
 */
/** Read both keys only after replaying any interrupted, validated journal. */
export function readRecoveredTripStorage(storage: TripStorageAdapter): Promise<TripStorageState & { recovered: boolean }> {
  return serialized(async () => {
    const recovered = await recoverPendingTransaction(storage);
    return { ...parseImage(await readRawImage(storage)), recovered };
  });
}

/**
 * Journal -> archive verified -> active verified -> journal removed.
 * A failed operation leaves enough information to roll forward after reload.
 * The caller MUST NOT clear the React active state on failure.
 */
export function transactTripStorage<T>(input: {
  storage: TripStorageAdapter;
  operation: TripStorageOperation;
  id: string;
  expectedActiveTrip: PersonalTrip | null;
  transform: (current: TripStorageState) => TripStorageState & { result: T };
}): Promise<TripStorageState & { result: T; changed: boolean }> {
  return serialized(async () => {
    const { storage } = input;
    await recoverPendingTransaction(storage);
    const before = await readRawImage(storage);
    const current = parseImage(before);
    const expected = input.expectedActiveTrip
      ? parsePersonalTrip(JSON.stringify(input.expectedActiveTrip))
      : null;
    if (JSON.stringify(expected) !== JSON.stringify(current.activeTrip)) {
      throw new Error('Active trip changed or is not durably saved; retry after saving');
    }
    const transformed = input.transform(current);
    const validatedActive = transformed.activeTrip
      ? parsePersonalTrip(JSON.stringify(transformed.activeTrip))
      : null;
    const validatedArchive = parsePersonalTripArchive(JSON.stringify(transformed.archive));
    const after: RawImage = {
      // Avoid even an identical active-key rewrite for archive-only imports.
      active: JSON.stringify(validatedActive) === JSON.stringify(current.activeTrip)
        ? before.active
        : (validatedActive ? JSON.stringify(validatedActive) : null),
      archive: JSON.stringify(validatedArchive) === JSON.stringify(current.archive)
        ? before.archive
        : JSON.stringify(validatedArchive)
    };

    if (before.active === after.active && before.archive === after.archive) {
      return { ...current, result: transformed.result, changed: false };
    }
    const intent = parseIntent(JSON.stringify({
      schemaVersion: PERSONAL_TRIP_TRANSACTION_VERSION,
      operation: input.operation,
      id: input.id,
      before,
      after
    } satisfies TransactionIntent));

    await writeChecked(storage, PERSONAL_TRIP_TRANSACTION_STORAGE_KEY, JSON.stringify(intent));
    // Important: a failed archive operation must NEVER clear the active key.
    // A concurrent writer can appear between our initial read and journal
    // creation. Never knowingly overwrite an unexpected intermediate value.
    const guardedArchive = await storage.getItem(PERSONAL_TRIP_ARCHIVE_STORAGE_KEY);
    if (guardedArchive !== before.archive && guardedArchive !== after.archive) {
      throw new Error('Trip transaction concurrent archive modification');
    }
    if (before.archive !== after.archive) {
      await writeChecked(storage, PERSONAL_TRIP_ARCHIVE_STORAGE_KEY, after.archive);
    }
    const guardedActive = await storage.getItem(PERSONAL_TRIP_ACTIVE_STORAGE_KEY);
    if (guardedActive !== before.active && guardedActive !== after.active) {
      throw new Error('Trip transaction concurrent active modification');
    }
    // Import must not rewrite the user's unchanged active trip. Likewise a
    // switch that retains an archive does not need to rewrite that archive.
    if (before.active !== after.active) {
      await writeChecked(storage, PERSONAL_TRIP_ACTIVE_STORAGE_KEY, after.active);
    }
    const completed = await readRawImage(storage);
    if (completed.archive !== after.archive || completed.active !== after.active) {
      throw new Error('Trip transaction commit verification failed');
    }
    await writeChecked(storage, PERSONAL_TRIP_TRANSACTION_STORAGE_KEY, null);
    return {
      ...parseImage(completed),
      result: transformed.result,
      changed: true
    };
  });
}
