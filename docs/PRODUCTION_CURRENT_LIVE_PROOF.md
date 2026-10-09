# Production Current Live Proof

Status: **PASS**

Canonical product and integration plan:

`docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`

Transport authority:

`docs/LIVE_CITY_OIDC_PUBLICATION.md`

## Admitted production chain

The following chain is now factually proven:

`two official Tretyakov sources`

-> GitHub Actions fetch

-> independent raw SHA-256 values

-> existing provider adapters

-> `LiveCityRefreshRuntime`

-> merged current snapshot

-> short-lived GitHub Actions OIDC identity

-> Render `PUT /live-city/publish`

-> `GET /live-city/current.json`

-> ordinary PersonalTrip

-> Day Composer current-truth rendering.

The first successful publication was produced from exact main:

`788fe9ea8fcabd1658d4a953a5fac76ad829eb03`

GitHub Actions publication run:

`37962471778`

Published snapshot:

`refreshedAt = 2026-10-09T16:57:44.697Z`

Provider proofs:

- `tretyakov-official`
  - status: fresh
  - venue: open
  - opening state: open
  - SHA-256: `34a39e9aafcab6308881d5e0231b8dab4aee391b47017bd167798c5d1327105a`
- `tretyakov-programme-official`
  - status: fresh
  - programme: scheduled
  - SHA-256: `794ae75ec513ea0adeff11311fd8cae8657f5798a29f2958bab7283398f92094`

Render admission log confirmed:

- publisher run ID `37962471778`;
- exact source SHA `788fe9ea8fcabd1658d4a953a5fac76ad829eb03`;
- both provider IDs;
- disruption count `0`.

## Production browser proof

Proof workflow:

`production-current-live-proof`

GitHub Actions run:

`37963447562`

Result:

`1 passed (3.4s)`

The proof used the public production origin:

`https://moscow-mobile-preview.onrender.com`

The same browser/API run verified:

1. `/ready` returned `200`.
2. Runtime mode was `push`.
3. Current publisher identity was present.
4. `/live-city/current.json` returned `200`.
5. Both source snapshots were present.
6. Both source SHA-256 values were structurally valid.
7. Both provider authorities were present in the merged feed.
8. `new-tretyakov-live` was source-backed and operationally `open`.
9. A normal PersonalTrip with canonical node `new-tretyakov` rendered:

   `LIVE · FRESH · OPEN`

10. The same Day Composer contained neither:

   - `EVIDENCE REPLAY`;
   - `NOT CURRENT`.

Evidence artifact:

- name: `production-current-live-proof`;
- artifact ID: `11632363024`;
- ZIP SHA-256: `994809a357319ebcc036f1227ac87d1a60484ab4084e11c2f850c667459cc933`;
- retention: 30 days;
- contents: full-page production screenshot and Playwright evidence output.

## Proof scope

The production proof verifies all of the following in one run:

1. `/ready` returns `200` with push mode and current publisher identity.
2. `/live-city/current.json` returns the current snapshot contract.
3. Both source snapshots are present with valid SHA-256 values.
4. Both provider authorities are present in the merged feed.
5. New Tretyakov is source-backed and operationally `open`.
6. The ordinary Day Composer path renders current truth.
7. Historical replay disclosures are absent.
8. A full-page browser screenshot is archived.

## Fail-closed rules

- a `503` readiness response fails the proof;
- missing provider evidence fails the proof;
- invalid SHA-256 fails the proof;
- stale current truth fails the proof;
- replay mode appearing in the ordinary PersonalTrip fails the proof;
- UI text without a valid production current snapshot does not count;
- the production screenshot is evidence only when the API and UI assertions pass in the same run.

## Next strict transition

`production current proof PASS`

-> disruption UX

-> affected Day Composer item

-> existing Journey Runtime `replan-required`

-> source-backed replacement candidates

-> fixed commitments preserved

-> explicit user acceptance

-> continuation of the day.
