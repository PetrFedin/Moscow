# Live City OIDC Publication Relay

Status: implementing — immutable GitHub OIDC subject admitted

Canonical context: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`

## Why this contour exists

The master plan requires:

`real provider source -> raw snapshot + SHA-256 -> merged current feed -> HTTPS publication -> Day Composer -> disruption -> replan-required`

The first Render deployment proved that the co-located publication service is healthy, but both official Tretyakov HTTPS reads time out from the Render runtime. The same source reads have already passed from GitHub Actions and produced archived raw evidence.

Therefore the production contour separates **source acquisition** from **snapshot publication** without creating a second truth model.

## Authority chain

`GitHub Actions scheduled worker`

-> fetch both official sources

-> preserve raw HTML + SHA-256

-> existing provider adapters

-> existing `LiveCityRefreshRuntime`

-> validated `live-city-current-snapshot`

-> GitHub Actions OIDC identity

-> `PUT /live-city/publish`

-> Render in-memory/current cache

-> `GET /live-city/current.json`

-> client-side freshness projection

## Authentication

No shared publish token is committed to the repository or copied into ChatGPT.

The workflow requests a short-lived GitHub Actions OIDC token with audience:

`moscow-live-city-publish-v1`

The publication authority validates:

- issuer and RSA signature against GitHub's fixed OIDC JWKS authority;
- audience;
- repository name and repository ID;
- exact `refs/heads/main` ref;
- exact workflow file on `main`;
- allowed event type: push, schedule or workflow dispatch;
- issued-at, not-before and expiry window;
- exact subject for the main branch.

The repository uses GitHub's immutable subject format for repositories created after the July 2026 rollout:

`repo:PetrFedin@81327591/Moscow@1371430954:ref:refs/heads/main`

The first production publish attempt proved the signature, audience and surrounding claims but was correctly rejected because the authority still expected the legacy name-only subject. The authority now requires the immutable owner/repository IDs and continues to validate the independent `repository`, `repository_id`, optional `repository_owner_id`, `ref` and `workflow_ref` claims.

Pull-request workflow identities and the legacy name-only subject are rejected.

## Snapshot admission

A publish is admitted only when:

- snapshot contract validates;
- destination is Moscow;
- snapshot is recent;
- both real provider snapshots are present;
- both provider authorities are present in the merged feed;
- every source has a valid HTTPS URL, timestamp and SHA-256;
- disruption list is explicit;
- the snapshot is newer than the currently served snapshot.

Malformed, old, incomplete or replayed snapshots fail closed.

## Render runtime mode

Production uses:

`LIVE_CITY_REFRESH_MODE=push`

In this mode Render does not contact the official sources directly. It only validates and serves OIDC-authenticated current snapshots.

The previous direct-pull runtime remains available as a replaceable transport option, but it is not allowed to fabricate fallback truth after provider timeout.

## Durability boundary

The authority writes the last admitted snapshot to an ephemeral local cache for process restarts in the same runtime contour.

This is sufficient for the current MVP proof but is not final durable authority. A later production phase should move the admitted current snapshot to PostgreSQL/object storage without changing:

- provider adapters;
- merged feed contract;
- Day Composer;
- disruption semantics;
- client snapshot URL.

## Acceptance

- scheduled worker fetches both real sources;
- raw source SHA-256 values remain independently inspectable;
- OIDC-authenticated publish is accepted;
- unauthenticated/PR/wrong-workflow/legacy-subject publish is rejected;
- `/ready=200` only while admitted entity truth remains fresh;
- `/live-city/current.json` exposes both provider snapshots;
- ordinary Personal Trip renders current truth without replay labels;
- source expiry still degrades to UNKNOWN;
- closed/cancelled/rescheduled/stale continues into the existing replan authority.

## Sequence

`immutable subject contract -> exact-head quality -> merge -> exact-main Render deploy -> merge-triggered real publish -> /ready=200 -> current.json proof -> production Day Composer proof -> disruption UX -> verified replacement plan`
