# Moscow trip backup & safe import — 2026-10-13

Status: **DRAFT CODE; NOT DEPLOYED**. Parent: PR #169 local multi-trip archive.

## User value
A visitor who planned Moscow, recorded museums/restaurants/theatres, imported an already purchased ticket, or accepted a replan can take their local history to another device without requiring a new paid provider.

## Implemented
- Versioned `moscow-personal-trips-backup` JSON envelope, `schemaVersion=1`.
- Export captures the currently active trip plus archived historical trips. A stale archival snapshot with the active ID is omitted.
- Validated import **adds to local archived trips only**; existing active trip is never replaced.
- Invalid schema, corrupt trips, duplicate active/archived identity, divergent trip ID conflicts, unsupported booking verification or wrong destination fail closed.
- Explicit preview counts trips, planned items, visits, booking/ticket references and accepted replacements.
- The UI requires a second user action to commit the import. If the text changes after preview, preview is invalidated.
- Limits: 750,000 JS string characters, 100 trips, 500 items/visits/receipts per trip.
- Input stays on-device and is not uploaded by this feature; plaintext needs private handling. No encrypted backup or end-to-end protection is claimed.

## Important limitations
- This first implementation uses manual **copy/paste text** rather than a share-sheet or file-picker; large archives may be cumbersome.
- Import is not two-way synchronization, automatic cloud backup, or a multi-device account.
- Local AsyncStorage is not a transactional database; failed writes and races with other archived-trip actions require further fault-injection tests.
- Malformed JSON and unknown claims are rejected, but this is not a cryptographically authenticated file format. Imported data is user-supplied; `provider-confirmed` records require existing receipt fields, but import alone must never be represented as independent provider authentication.
- This feature does not export photos, raw media, location tracks, auth credentials or live reservation inventory.

## Follow-up gate
1. Exact-head TS + contract + E2E CI; screenshot inspection at 375/768/1440.
2. Fault-injection: storage quota, interrupted write, cross-tab contention, large payload.
3. Native iOS/Android clipboard/file import with explicit on-device consent.
4. Optional encrypted export using vetted primitives and explicit recovery strategy; do **not** invent a cloud service.
5. Review local-only privacy warnings and product language RU/EN/ZH.
6. No main merge or Render deployment without independent review and rollback proof.

Canonical authority: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`.
