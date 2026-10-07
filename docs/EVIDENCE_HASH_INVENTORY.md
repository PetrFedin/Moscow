# Pilot Evidence Hash Inventory

Command:

```bash
npm run pilot:evidence-inventory -- <pilot-run-id>
```

## Purpose

Create a deterministic SHA-256 inventory of files already captured in a real pilot evidence archive.

Output:

`evidence/varvarka-zaryadye/<pilot-run-id>/09-final/evidence-hash-inventory.json`

The inventory records:

- relative file path;
- file size;
- SHA-256;
- deterministic root hash over the canonical sorted inventory.

## What the root hash proves

It can detect later file changes relative to the generated inventory.

It proves **file integrity only**.

It does not prove:

- that field measurements were physically correct;
- that a provider response was authentic;
- that a reviewer accepted the evidence;
- that the evidence was captured at the claimed place/time;
- legal non-repudiation.

Those remain separate authority/review questions.

## Sequencing

This is not the Phase 1 signed Destination Package.

The master plan still defers package signing until after Phase 0.

Hash inventory may be used during Phase 0 because it is a local integrity tool, not a publication signature authority.
