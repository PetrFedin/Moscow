# Moscow — local multi-trip history and recovery (2026-10-13)

Status: DRAFT IMPLEMENTATION, NOT DEPLOYED.

Parent: PR #168 (Today independent next stop / ticket / check-in). PR #167 contains the currently GREEN source for city directory UX.

## Why
A leisure companion should not erase an entire past trip when planning the next weekend. Historic trips carry user-declared tickets, visit notes, personal check-ins and accepted replacement receipts. The old single `moscow:v1:personal-trip` record remains readable; this change adds an independent, versioned archive with migration-safe behavior.

## Implemented contract
- `moscow:v1:personal-trip`: current PersonalTrip; remains unchanged for compatibility.
- `moscow:v1:personal-trip-archive`: versioned collection of separately validated PersonalTrip snapshots.
- New-trip choices are explicit: **Archive and start new** (non-destructive), **Delete active trip** (destructive) or **Cancel**.
- Archive is written and checked before the active key is cleared. A failed archive write must leave the current trip intact.
- Opening an archived trip first archives the latest active snapshot, then activates the requested validated trip.
- The archive displays trip dates and count of planned stops, personal visits and accepted change receipts.
- Existing tickets retain their original user-declared/provider-evidence distinction; no invented booking, location verification or price.
- Global historical walk-progress IDs must not be incorrectly inserted as visits into another trip. Auto-synchronization is restricted to route nodes intentionally included in the selected active trip on that date.
- The same trip ID is updated on archival rather than duplicated. Other trips are unaffected.

## What this is not
No multi-device backup, cloud account, cryptographic storage encryption or durable server history. AsyncStorage and browser localStorage remain local-first and can be lost if the device is erased. Photo storage and export/import remain a separate controlled privacy gate. The dual-key local write is not a transactional database: interruption or storage quota failure still requires dedicated failure/recovery testing.

## Acceptance
1. Contract: versioning, unique IDs, corrupt archive, preservation of fixed tickets, private notes and acceptance receipts, deep cloning.
2. Browser: archive trip one; create trip two; reopen trip one; recover trip two; survive reload; active and archived copies distinguishable.
3. Browser: accidental delete requires confirmation; cancel preserves active trip and prior archive.
4. Browser: global walk-completed IDs cannot synthesize a visit in a different trip.
5. Visual: phone, tablet and desktop show readable past trips and non-destructive action.
6. Release: exact CI GREEN, independent visual review, physical-device check, saved-data recovery tests, published SHA and rollback plan.

## Next gates
- Manual secure export and import, encryption/key-management and consent before syncing private trip material.
- Storage failure injection and recovery with minimal user data loss.
- Per-trip ownership for all walking events and media references.
- No paid infrastructure without approval.
