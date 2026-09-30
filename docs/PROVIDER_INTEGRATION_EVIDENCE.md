# Provider Integration Harness + Journey Evidence Pack v1

## Purpose

This is the first integration-proof layer that can show a buyer one auditable day rather than a collection of features.

Required chain:

`provider snapshot → ingestion record → live block verification → real provider change → verified replan → resumed journey → provider receipt → Journey Evidence Pack`.

## Provider Integration Harness

The harness is fail-closed. The proof is complete only when all six steps have evidence references:

1. snapshot ingested;
2. live block verified;
3. provider change observed;
4. verified replan produced;
5. journey resumed;
6. provider receipt observed.

The harness cross-checks provider ID, snapshot ID, receipt ID, runtime state, planVersion and replan audit.

## Journey Evidence Pack

The evidence pack contains the original ingestion record, runtime audit, provider receipt and integration proof result.

The pack includes a deterministic SHA-256 over its canonicalized payload. This is an integrity checksum, not a legal digital signature or PKI signature.

Verification recomputes the canonical hash and reports whether the package has changed.

## Truth boundary

A complete pack proves only the contained operational facts and their evidence chain. It does not by itself prove:

- citywide tourism impact;
- revenue attribution;
- provider SLA compliance beyond the included records;
- legal authenticity of the external provider;
- qualified electronic signature.

Those require separate authorities.

## Next physical proof

Connect one real sandbox/feed and archive the first non-demo package. Until that exists, the software proves the evidence mechanism, not a real Moscow provider integration.
