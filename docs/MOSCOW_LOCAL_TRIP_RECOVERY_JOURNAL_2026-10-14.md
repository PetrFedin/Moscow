# Moscow local-trip recovery journal — 14 October 2026

Status: **DRAFT CODE / NOT DEPLOYED**.
PR #175, stacked on PRs #172 -> #171 -> #170 -> #169. Recovery follow-up: issue #173.

## Actual risk addressed
The former archive + active trip transition used two independent AsyncStorage keys without a durable intent. Power loss, interrupted writes, quota errors or a crash after archiving could leave the active copy and archive out of sync. Swallowed active-autosave errors compounded the risk.

## Implemented in this draft
- `src/travel/personalTripTransaction.ts`: a versioned, local-only pending-operation journal stored under `moscow:v1:personal-trip-transaction`.
- Before writing anything destructive, capture validated **before** and **after** snapshots for both existing keys: `moscow:v1:personal-trip` and `moscow:v1:personal-trip-archive`.
- Write journal, read it back, write/read-back archive, write/read-back active, verify the resulting pair together, then remove/read-back the journal.
- On startup, replay a pending validated journal **idempotently**. The UI hydrates only after recovery. Unknown or conflicting data blocks changes instead of silently rebuilding an empty archive.
- The journal is also used for explicitly confirmed deletion. It never silently deletes a trip absent the user's own delete action.
- Both incoming backup imports and trip switching use a fresh archive snapshot from disk and a guarded expected active snapshot. Archive-only imports leave the active key unchanged.
- React active-trip autosaves are ordered and checked on read-back. A failure blocks further changes instead of being swallowed.
- One-JS-runtime serialization prevents interleaving of operations initiated inside a single running app instance.
- A deliberate recovery notice appears after successful replay; storage conflicts show a blocking, readable warning.

## Fault and browser proof added
- `tests/personalTripTransaction.test.ts`: failures before/after archive write, before/after active removal, before/after journal removal, failed intent creation, interrupted switch, interrupted import, stale active state, concurrent archive-only additions, corrupted journal and foreign-archive conflict.
- `tests/personalTrip.e2e.spec.ts`: page reload of interrupted archive with a user-declared theatre ticket and visit note; conflict refuses to overwrite an unknown concurrent trip.
- Preserved evidence includes ticket references, user-declared verification, visit note and archived journeys. Replacement acceptance receipts remain part of the versioned PersonalTrip schema and receive their own existing contract coverage.

## Strict limitations
1. This is **not** an atomic database, cloud backup or guaranteed crash safety across multiple tabs, devices, or operating-system-level storage corruption.
2. Native AsyncStorage and browser localStorage can still be cleared or evicted. A pending journal itself contains copies of personal data in plaintext. No encryption or privacy claim is made.
3. Autosave of the latest unsaved edit can fail before any cross-key transaction. Such in-memory edits are not guaranteed recoverable after process death. The UI blocks further editing and alerts the user; separately testing emergency local export remains an open issue.
4. A conflict from a second tab can be detected and will block recovery, but **no cross-tab atomic exclusion/lock** is implemented; the lock is local to a single JS runtime.
5. File import, encrypted backup, storage quotas, native suspension/background behavior and external data-provider claims require separate acceptance.
6. Automatic journal replay is forward-completion of an already prepared, user-authorized transition, not an unrequested new operation.
7. If the pending journal is corrupt, the app does not delete it or silently reset source data; manual repair/verified recovery tooling will be needed.

## Release gates (must all be evidenced)
- Exact-head GREEN contracts, TypeScript, Expo web/iOS/Android exports, browser E2E and 375/768/1440 visual proofs.
- Fault-injection on native iOS and Android, including forced termination between writes, low-disk quota, background/resume and restart.
- Test multi-tab contention separately. Prefer an authoritative single-key transactional store or SQLite transaction where practical; do not claim cross-tab safe merely from promise serialization.
- Independent reviewer sign-off on sensitive local storage and data-retention semantics.
- Full stacked PR reconciliation + rollback proof before merging and publishing.
- Existing live-city, YCLIENTS/provider and field spatial verification acceptance stay entirely independent.

The master plan continues to prioritize the tourist experience, not infrastructure for its own sake. This journal protects the data trail underpinning My Moscow / Passport / Next Discoveries.
