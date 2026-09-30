# #74 Real Provider Admission & Evidence Run

## Objective

Stop expanding architecture and execute one real provider proof.

Required sequence:

`credentials/feed admission → capability discovery → schema mapping → first raw snapshot → checksum → normalized projection → live day → provider state change → automatic replan → journey continuation → provider receipt → immutable evidence archive → PASS #73`.

## Admission gate

A provider is not admitted merely because an endpoint responds.

Admission requires:

- provider and adapter identity;
- HTTPS source;
- credential mode and secret reference where credentials are required;
- evidence of credential/feed admission;
- discovered capabilities with evidence;
- explicit provider schema version;
- versioned mapping into Moscow authority;
- required field mappings for every claimed capability.

Secrets themselves must not be committed to Git. Only secret references and admission evidence belong in the archive.

## Evidence run

A PASS requires the existing Journey Evidence Pack plus an archive containing evidence for:

1. credentials/feed admission;
2. capability discovery;
3. schema mapping;
4. raw snapshot;
5. ingestion/checksum;
6. normalized projection;
7. provider state change;
8. verified replan;
9. resumed runtime;
10. provider receipt;
11. Journey Evidence Pack.

## Immutable archive

The manifest stores sorted archive entries with SHA-256 per object and a deterministic root SHA-256 over the manifest entry set.

This provides tamper detection for the archived run. It is not yet a digital signature.

## Current truth

No real provider is claimed by this document. #74 can become PASS only after actual credentials or an actual public/sandbox feed is admitted and the complete evidence chain is archived.
