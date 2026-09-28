# Varvarka supervised pilot — operational study pack

## Purpose

This pack turns the existing supervised-pilot protocol into a repeatable research operation for approximately 20–50 participants.

It does not create a representative survey of Moscow residents or tourists. It answers a narrower product question:

> can an ordinary visitor understand and complete the Varvarka walk without developer coaching?

## Privacy boundary

The app continues to export aggregate-only analytics.

The study layer adds only research slot IDs:

`P001 … P050`.

A slot ID:

- is not a name;
- is not a user ID;
- must not be written into app analytics;
- must not contain initials, phone numbers, email, booking identifiers or device IDs;
- exists only to let the study operator confirm whether an aggregate report and observer note were received.

Recruitment, consent and any demographic research records stay outside this bundle and must not be joined to app session IDs.

## Folder structure

Recommended structure:

```text
varvarka-supervised-wave-01/
├── study-manifest.json
├── reports/
│   ├── P001.json
│   ├── P002.json
│   └── ...
└── observers/
    ├── P001.json
    ├── P002.json
    └── ...
```

All manifest paths are relative to the bundle directory. Absolute paths and `../` traversal are rejected.

## Study manifest

The manifest contains 20–50 study slots.

Example shape:

```json
{
  "kind": "varvarka-supervised-pilot-study",
  "version": 1,
  "studyId": "varvarka-supervised-wave-01",
  "routeId": "varvarka-zaryadye-pilot",
  "protocol": "supervised-varvarka-v1",
  "expectedContentVersion": "varvarka-pilot-v1",
  "slots": [
    {
      "slotId": "P001",
      "reportStatus": "received",
      "reportPath": "reports/P001.json",
      "observerStatus": "received",
      "observerPath": "observers/P001.json"
    },
    {
      "slotId": "P002",
      "reportStatus": "missing",
      "observerStatus": "received",
      "observerPath": "observers/P002.json"
    }
  ]
}
```

A missing aggregate report must be marked explicitly as `missing`. Do not create an empty or fabricated report file.

## Observer note

The observer records structured qualitative evidence without coaching the participant.

Example:

```json
{
  "kind": "varvarka-observer-note",
  "version": 1,
  "slotId": "P001",
  "language": "ru",
  "platform": "ios",
  "hesitation": "minor",
  "askedWhatNext": false,
  "routeDirectionUnderstood": "yes",
  "audioControlNoticed": "yes",
  "phoneUse": "mixed",
  "evidenceDistinctionUnderstood": "partly",
  "voluntaryFeatures": ["audio", "time-machine"],
  "stoppedEarly": false,
  "stopReason": "completed",
  "postWalkIntent": "map",
  "issues": [],
  "shortNote": "Один раз задержался у выбора следующей точки."
}
```

### Allowed qualitative dimensions

- hesitation: none / minor / major;
- asked what to do next;
- route-direction understanding;
- whether the audio control was noticed;
- phone mostly in pocket / mixed / mostly in hand;
- understanding of documented vs reconstructed evidence;
- voluntary use of audio / transcript / Time Machine / archive / 3D / AR;
- early-stop reason;
- post-walk intent;
- outdoor readability / noise / battery / connectivity / location-permission / navigation / performance issues.

The short note is capped at 280 characters. Obvious email addresses and phone-number patterns are rejected. Do not enter names.

## Running the study report

After all planned sessions:

```bash
npm run pilot:study -- ./varvarka-supervised-wave-01/study-manifest.json --out ./varvarka-supervised-wave-01/final-study-report.json
```

The CLI:

1. validates the study manifest;
2. requires 20–50 non-identifying slots;
3. loads only bundle-relative JSON files;
4. validates every aggregate app report through the existing privacy-safe cohort authority;
5. validates every observer note;
6. recomputes the cohort funnel;
7. aggregates qualitative observation counts;
8. surfaces duplicate, truncated and mixed-version caveats;
9. never copies observer free text or slot IDs into the final study report.

## Meaning of `completeForFirstReview`

The first review is complete only when:

- the manifest contains at least 20 participant slots;
- every slot has an observer note;
- every aggregate app report is either received or explicitly marked missing.

This flag does not declare the product successful.

No success threshold is pre-created. The team reviews the evidence first, identifies repeated breakpoints and only then chooses bounded product changes.

## Final report

The final report contains:

- planned participant count;
- number of received/missing aggregate reports;
- cohort funnel;
- engagement totals;
- route-start mix by origin, budget, interest and language;
- per-place aggregate engagement;
- duplicate/truncation/content-version caveats;
- qualitative counts by language/platform;
- hesitation;
- “what next?” questions;
- route/audio/evidence understanding;
- voluntary feature use;
- early-stop reasons;
- post-walk intent;
- outdoor/technical issue counts.

It deliberately does not contain:

- app session IDs;
- event IDs;
- timestamps from raw analytics;
- participant names;
- phone/email;
- GPS;
- device IDs;
- observer short-note text;
- individual participant-level conclusions.

## Interpretation

This pack supports a supervised usability/product pilot.

It does not prove:

- citywide demand;
- representative tourist preferences;
- Romanov field accuracy;
- Old English Court spatial readiness;
- causal impact of one feature;
- federal product-market fit.

Its job is to turn the first real visitor cohort into disciplined product evidence rather than anecdotes.
