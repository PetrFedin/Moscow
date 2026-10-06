# Pre-Pilot Synthetic Dry Run

Command:

```bash
npm run pilot:dry-run
```

## Purpose

Verify that the internal pre-pilot pipeline can execute end-to-end:

- owner manifest structure;
- field-plan generator;
- visitor-wave generator;
- configuration bundle validation;
- pre-pilot gate.

## Output

Successful execution returns:

`DRY_RUN_ONLY_NOT_PILOT_GO`

The script may internally exercise the GO path using deliberately synthetic values, but this is only a software integration test.

## Guardrail

Synthetic dry-run values:

- are not real owners;
- are not real site permission;
- are not provider authority;
- are not field evidence;
- are not visitor evidence;
- are not acceptance evidence;
- must never be copied into real pilot manifests.

By default dry-run artifacts are created in the operating system temporary directory and deleted after the run.

Set `KEEP_DRY_RUN_ARTIFACTS=1` only for local debugging. Retained synthetic artifacts still have no pilot authority.

## Relation to real preflight

Real preflight remains:

`npm run pilot:preflight-bundle -- <real-bundle.json>`

Only the real bundle may produce the operational decision for a controlled pilot.
