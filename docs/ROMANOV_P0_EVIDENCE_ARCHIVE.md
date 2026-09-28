# Romanov P0 — final evidence archive

Status: **tooling ready / real field evidence still missing**

## Purpose

The field campaign produces several independent evidence artifacts:

1. approved survey campaign;
2. one session bundle per physical device;
3. final persistent-anchor proof after independent resolve and restart/recovery.

Those files must remain independently reviewable.

The final P0 archive therefore does **not** replace the raw files with a manually edited summary. A small manifest references the raw files and the repository rebuilds the consolidated proof from them.

## Required raw evidence

Store the exported JSON files under a versioned evidence directory, for example:

```text
evidence/romanov/2026-10-field-day/
  campaign.json
  iphone-1.sessions.json
  iphone-2.sessions.json
  android-1.sessions.json
  android-2.sessions.json
  final-anchor-proof.json
  manifest.json
```

The names are examples. The evidence content must come from the actual field tools.

Do not hand-create field sessions, residuals, verified calibration timestamps or anchor proof fields.

## Manifest

Example:

```json
{
  "kind": "romanov-p0-evidence-manifest",
  "version": 1,
  "campaignPath": "evidence/romanov/2026-10-field-day/campaign.json",
  "sessionBundlePaths": [
    "evidence/romanov/2026-10-field-day/iphone-1.sessions.json",
    "evidence/romanov/2026-10-field-day/iphone-2.sessions.json",
    "evidence/romanov/2026-10-field-day/android-1.sessions.json",
    "evidence/romanov/2026-10-field-day/android-2.sessions.json"
  ],
  "anchorProofPath": "evidence/romanov/2026-10-field-day/final-anchor-proof.json"
}
```

Manifest paths must be repository-relative JSON paths and cannot escape the repository root.

## Validation command

Run:

```bash
npm run validate:romanov-p0-evidence --   evidence/romanov/2026-10-field-day/manifest.json
```

On success the command reports:

- survey packet ID;
- one common field build ID;
- exact release session count;
- four-device inventory;
- persistent-anchor proof ID;
- independent resolving device;
- restart/recovery session ID;
- final release state.

The process exits non-zero if the evidence is not release-ready.

## Create the consolidated archive

To write the recomputed final package:

```bash
npm run validate:romanov-p0-evidence --   evidence/romanov/2026-10-field-day/manifest.json   evidence/romanov/2026-10-field-day/romanov-p0-evidence-package.json
```

The written package is immediately parsed and recomputed again before the command succeeds.

## What is revalidated

The final package reuses the existing production authorities rather than trusting manifest flags.

### Survey

The campaign must contain:

- current metric authority;
- current control-point authority;
- all five measured and verified points;
- approved survey metadata.

### Device bundles

Every imported bundle must:

- use field-session bundle version 2;
- use one survey packet;
- represent one physical device;
- use one exact calibration placement;
- contain release-authoritative residual evidence;
- contain the required field-condition log.

Across the final release matrix:

- 2 independent iOS devices are required;
- 2 independent Android devices are required;
- every complete device contributes 5 / 10 / 15 m;
- the exact 12 release session IDs are recomputed;
- daylight evidence is mandatory.

### Build identity

The 12 release sessions must contain one explicit non-`local` app build ID.

Different build IDs block the final archive even when residuals pass.

This makes the evidence attributable to one reproducible field build.

### Persistent anchor

The imported proof is revalidated for:

- current metric/calibration authority;
- anchor-frame consistency;
- host continuity;
- independent resolve on another physical device;
- verification by the resolving device;
- a second resolve after application restart in a new runtime session.

The original independent resolve and restart/recovery resolve remain distinct evidence.

## Final release rule

The consolidated package receives:

`releaseReady = true`

only when both are true:

1. package-level integrity has no blockers;
2. `summarizeRomanovReleaseGate` returns `field-verified-spatial-scene`.

The manifest cannot directly set either result.

## Important distinction

This archive proves the **Romanov spatial field gate**.

It does not silently clear unrelated publication dependencies such as source-rights review or production human audio.

The later `PublishedSpatialPackage` must still pass its own publication gates.

## After field day

Archive together:

- raw survey campaign;
- all original device bundles;
- final anchor proof;
- manifest;
- consolidated evidence package;
- survey photos/drawings referenced by the survey;
- external surveyor documentation where applicable.

The raw evidence should be retained even after the consolidated package is created.
