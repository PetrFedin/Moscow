# MOSCOW-INT-00 — evidence manifest

This manifest is the final integrity index for the Phase 0 field-proof gate defined by `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`.

It does not create evidence. It binds already-produced evidence files to exact SHA-256 values so the inputs used for PASS can be reproduced later.

## Required evidence

The manifest references exactly three JSON artifacts:

1. Romanov P0 evidence package generated from real field sessions;
2. Old English Court field-verified repeatability proof;
3. final supervised visitor pilot report.

The government technical-pilot package remains repository authority and is evaluated separately by the gate.

## Example layout

```text
evidence/moscow-int-00/2026-10-phase0/
  phase0-evidence-manifest.json
  romanov/
    romanov-p0-evidence-package.json
  old-english-court/
    repeatability-proof.json
  pilot/
    final-study-report.json
```

Example manifest shape:

```json
{
  "kind": "moscow-integration-phase0-evidence",
  "version": 1,
  "createdAt": "2026-10-01T00:00:00Z",
  "romanovEvidencePackage": {
    "path": "romanov/romanov-p0-evidence-package.json",
    "sha256": "<actual SHA-256>"
  },
  "oldEnglishCourtRepeatabilityProof": {
    "path": "old-english-court/repeatability-proof.json",
    "sha256": "<actual SHA-256>"
  },
  "visitorPilotReport": {
    "path": "pilot/final-study-report.json",
    "sha256": "<actual SHA-256>"
  }
}
```

Do not copy the example hashes or create placeholder evidence files.

## Validation

Run:

```bash
npm run integration:validate-phase0 -- evidence/moscow-int-00/2026-10-phase0/phase0-evidence-manifest.json
```

The validator:

- rejects absolute/traversal paths;
- verifies SHA-256 against exact file bytes;
- parses/recomputes the Romanov release-ready package through the existing Romanov authority;
- checks Old English Court repeatability through the MOSCOW-INT-00 gate;
- checks the supervised visitor report and binds its SHA-256 into the evidence reference;
- checks the government technical-pilot package;
- returns Phase 0 PASS only if every mandatory evidence family passes.

The validator exits non-zero while the gate is blocked.

## Trust boundary

SHA-256 proves file integrity, not that a physical measurement was honestly performed. Real field sessions, reviewer responsibility and source evidence remain mandatory.

This manifest must never be used to turn manually fabricated JSON into field proof.
