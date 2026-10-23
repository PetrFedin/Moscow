import {
  EXPERIENCE_STORAGE_KEY,
  normalizeExperienceSnapshot,
  type PersistedExperienceState
} from './experiencePersistence.ts';

export type ExperienceStorageAdapter = Readonly<{
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
}>;

const LOCK_NAME = 'moscow-experience-v4-serialized';
const MAX_SNAPSHOT_CHARACTERS = 250_000;

/**
 * A separate storage domain from PersonalTrip v1.
 *
 * One writer serializes local effects, checks the observed prior version,
 * writes and reads it back. On any failed write, subsequent effects fail closed
 * until an explicit retry. Web Locks coordinate cooperating same-origin tabs;
 * without Web Locks, external mutation is detected on best effort read-back.
 *
 * This is not a cross-device database and cannot make React's optimistic
 * controls equivalent to a confirmed durable save.
 */
export function createExperienceStorageCoordinator(storage: ExperienceStorageAdapter) {
  let tail: Promise<void> = Promise.resolve();
  let expectedRaw: string | null | undefined;
  let lastAttemptedRaw: string | null = null;
  let failed = false;

  const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
    const next = tail.then(() => {
      const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
      return locks?.request ? locks.request(LOCK_NAME, operation) : operation();
    });
    tail = next.then(() => undefined, () => undefined);
    return next;
  };

  return {
    hydrate(): Promise<PersistedExperienceState> {
      return serialize(async () => {
        const raw = await storage.getItem(EXPERIENCE_STORAGE_KEY);
        // Preserve malformed raw data for investigation. Do not replace it
        // with defaults just because JSON parsing or storage access failed.
        const parsed = raw === null
          ? normalizeExperienceSnapshot(null)
          : normalizeExperienceSnapshot(JSON.parse(raw));
        expectedRaw = raw;
        lastAttemptedRaw = null;
        failed = false;
        return parsed;
      });
    },
    persist(state: PersistedExperienceState, retry = false): Promise<void> {
      const nextRaw = JSON.stringify(state);
      if (nextRaw.length > MAX_SNAPSHOT_CHARACTERS) {
        return Promise.reject(new Error('Experience snapshot exceeds the allowed size'));
      }
      return serialize(async () => {
        if (expectedRaw === undefined) {
          throw new Error('Experience storage has not been safely hydrated');
        }
        if (failed && !retry) {
          throw new Error('Experience storage failed; explicit retry required');
        }
        const current = await storage.getItem(EXPERIENCE_STORAGE_KEY);
        if (current !== expectedRaw
          && current !== nextRaw
          && !(retry && lastAttemptedRaw !== null && current === lastAttemptedRaw)) {
          throw new Error('Experience storage changed externally; refusing stale overwrite');
        }

        if (current !== nextRaw) {
          lastAttemptedRaw = nextRaw;
          await storage.setItem(EXPERIENCE_STORAGE_KEY, nextRaw);
        }
        if (await storage.getItem(EXPERIENCE_STORAGE_KEY) !== nextRaw) {
          throw new Error('Experience storage read-back verification failed');
        }
        expectedRaw = nextRaw;
        lastAttemptedRaw = null;
        failed = false;
      }).catch((error: unknown) => {
        failed = true;
        throw error;
      });
    }
  };
}
