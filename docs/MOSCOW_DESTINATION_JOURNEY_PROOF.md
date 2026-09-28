# Moscow Destination Journey — proof gate

Status: software proof gate for #42.

## Product question

Can the platform produce one coherent Moscow visitor day:

`history → live event → food → booking → routing`

without inventing any of the operational facts?

The answer is allowed to be only:

- `READY` from current evidence; or
- `BLOCKED` with explicit missing authorities.

There is no demo-only green state.

## Why this is a separate proof

A complete travel day combines data with different owners and different failure modes:

1. historical/editorial destination authority;
2. field-verified spatial heritage authority;
3. real visitor-pilot evidence;
4. live event/food authority;
5. booking handoff authority;
6. routing/time authority.

A static catalog cannot safely substitute for any of these layers.

## Required authorities

### 1. DestinationPackage

The destination package must be structurally valid and publishable.

Required:

- Russian primary/default;
- RU / EN / ZH;
- published heritage route;
- offline-eligible heritage content.

### 2. Field-verified heritage

Every spatial package referenced by the chosen heritage route must be a valid, publishable `PublishedSpatialPackage` with:

- `releaseState=field-verified`;
- RU / EN / ZH;
- offline eligibility.

For the current Varvarka reference route this means the bound Romanov and Old English Court packages cannot be replaced by demo flags.

### 3. Visitor pilot review

The journey gate does not accept a manually-set `pilotPassed=true`.

Pilot evidence must be derived from a real `PilotStudyReport` through `createVisitorPilotReviewEvidence`.

Required:

- 20–50 planned participant slots;
- `completeForFirstReview=true`;
- at least one aggregate app report;
- one observer note per participant slot;
- explicit `representativeSurvey=false`;
- evidence reference;
- real review timestamp that is not in the future.

This proves only supervised usability/product evidence, not representative Moscow demand.

### 4. Live event and food

The selected event and food stop come from `LiveDestinationProjection`.

Both must be:

- present;
- correct entity kind;
- `fresh`;
- `journeyEligible`.

A stale provider record becomes `unknown` upstream and cannot satisfy this gate.

### 5. Provider ingestion evidence

The journey cannot rely on a projection detached from provider ingestion.

The selected event/food provider must have a matching `LiveProviderIngestionRecord` for the same destination.

If a selected entity has booking, the booking provider also needs matching ingestion evidence.

Future-dated ingestion records do not count.

### 6. Booking handoff

At least one selected live entity must expose a fresh, provider-authorized booking/ticket/reservation handoff.

The proof contains the handoff URL and expiry but does not claim:

- live price authority;
- remaining inventory;
- guaranteed availability.

Those remain false until separate provider contracts exist.

### 7. Routing proof

The journey does not synthesize travel time from coordinates.

A separate routing authority must provide:

- proof ID;
- provider;
- HTTPS source reference;
- generatedAt;
- expiresAt;
- total journey start/end;
- ordered timed blocks.

Blocks may reference only:

- a published destination route; or
- a live destination entity.

They must:

- be unique;
- not overlap;
- fit inside the journey window.

The routing proof must contain:

- the selected heritage route;
- the selected event;
- the selected food stop.

### 8. Cross-authority temporal consistency

A live entity must still be fresh at the time when routing plans to visit it.

For events:

- event `startsAt` must fall inside the planned event block.

For food:

- live evidence must not expire before the planned food block.

The routing proof itself is also time-limited. `READY` output exposes `routingProofExpiresAt` so the caller knows when replanning is mandatory.

## READY proof output

A successful proof contains only evidence-backed references:

- destination ID;
- heritage route ID;
- field-verified spatial package IDs;
- visitor pilot study/evidence reference;
- live provider IDs;
- selected event/food IDs;
- verified booking handoffs;
- routing proof/provider;
- routing-proof expiry;
- journey start/end;
- RU / EN / ZH;
- offline heritage flag.

It also explicitly records:

- `representativeSurvey=false`;
- `livePriceAuthority=false`;
- `inventoryCountAuthority=false`.

## Current Moscow state

The current reference package is deliberately expected to return `BLOCKED`.

At the software level we have the gate, but the repository does not yet contain all real-world evidence required for a complete day.

Current external blockers include:

### Romanov (#36)

Needs the real physical survey/device/anchor/restart-recovery evidence required for a genuine field-verified package.

### Old English Court (#37)

Needs the real production GLB/evidence bundle, object-specific survey and field proof.

### Visitor pilot (#38)

Needs the real 20–50 participant supervised study and reviewed study report.

### Live Destination (#41)

Needs at least one real provider/feed with evidenced capabilities, freshness and, where applicable, booking semantics.

### Routing

Needs a real routing authority/proof for the assembled day.

## What must not be done to make #42 look complete

Do not add:

- fake restaurant records;
- hard-coded “open now”;
- demo events presented as current;
- guessed RUSSPASS URLs;
- fake booking links;
- sample ticket prices;
- invented remaining seats;
- manually green field-verification flags;
- manually green pilot flags;
- coordinate-derived travel times presented as routing truth.

## Definition of Done

#42 closes only when the same `evaluateDestinationDayJourney` code that is currently red becomes `READY` from real evidence, without changing the acceptance rules.

That is the proof that Moscow has become a complete visitor journey rather than a historical demo or a catalog.
