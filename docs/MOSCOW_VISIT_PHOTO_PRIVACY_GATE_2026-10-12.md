# Personal Trip photo privacy and release gate

Status: DESIGN ONLY — NOT IMPLEMENTED, NOT PRODUCTION ADMITTED.

## Default privacy
Photos and captions are private per-user by default. Never publish a visitor photo to public place content, search, partner dashboard or historical archive without a separate explicit opt-in. Do not acquire background photo access or location metadata merely to attach a photo. No face recognition. Remove EXIF location coordinates unless the traveler deliberately chooses otherwise.

## Storage model
PersonalTrip.visit.id -> private MediaAsset entry {assetId, visitId, ownerScope, createdAt, contentHash, mimeType, bytes, storageRef, consentVersion, status}. Do NOT insert base64 image bytes into AsyncStorage or the public DestinationPackage. A revocable scoped access path is required; one visitor must never access another person's private assets. Local-only picker is a potential MVP, but must include backup/export warning. Remote media is blocked pending verified access controls and cost.

## Lifecycle
Pick -> inspect -> explicit attach confirmation -> strip unneeded metadata -> local encrypted/controlled private store or approved server -> thumbnail -> reload -> export/download -> delete -> verify absence and tombstone. Handle failed uploads, cancellation, quota/retention, orphan cleanup and offline states. No background automatic upload.

## Evidence truth
User photo ≠ confirmed physical attendance or provider reservation. Visit.evidence class remains unchanged. User notes remain independent from media evidence; photos never authorize provider-confirmed.

## Testing and admission
1. Permission denied / cancelled picker.
2. Invalid MIME / oversized file / corrupt image; show meaningful errors.
3. Reload and offline recovery; no loss of fixed tickets or acceptance receipts.
4. Cross-user authorization, revoked links, deletion and export.
5. Metadata sanitation and no full photo/QR in logs or analytics.
6. Verified additional infrastructure cost = zero before release, otherwise user approval.
7. iOS/Android/web physical-device QA, 375/768/1440 visual captures, explicit privacy policy.

Tracking: GitHub Issue #160, #164. This is not a request to turn on remote photo hosting.
