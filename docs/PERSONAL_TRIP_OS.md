# Personal Trip OS v1

Issue: #101

## Product goal

Moscow should work as a personal travel operating layer, not as a directory.

The core lifecycle is:

`Trip -> Day -> Plan item -> Ticket/Reservation -> Visit -> History -> What next`

A visitor should be able to plan one or several days, combine source-backed Moscow places with their own commitments, record where they actually went and understand what is still unseen.

## First user journey

1. Create a Moscow trip with arrival date and 1/2/3/5/7 day duration.
2. Open a specific day.
3. Add a saved Moscow place.
4. Add a manual item such as a museum, restaurant, theatre, bar, event, activity or shopping stop.
5. If a ticket or reservation was already purchased elsewhere, attach it to the item.
6. Execute the day.
7. Mark a place as visited, or complete an in-app Moscow walk stop.
8. Keep the completed visit in the trip history.
9. Use "what else to see" to surface source-backed Moscow nodes not already planned or visited.

## Truth model

### User-declared commitments

A ticket or reservation manually entered by the visitor is stored as:

`verification = user-declared`

It is useful personal trip data, but it is not provider proof.

The UI must never relabel a user-entered booking as provider-confirmed.

### Provider-confirmed commitments

A commitment may use:

`verification = provider-confirmed`

only when it carries:

- provider identity;
- provider receipt/evidence reference.

This remains aligned with Live Destination Authority and the #74/#73 real-provider proof chain.

### Visit evidence

Personal Trip v1 supports bounded visit evidence:

- `user-confirmed`;
- `route-completed`;
- `provider-receipt`;
- `proximity`.

The first product slice uses explicit user confirmation and completed in-app route stops.

No continuous GPS history is required.

## Data model

`PersonalTrip`

- destination;
- start/end dates;
- ordered trip days;
- plan items;
- visit ledger;
- created/updated timestamps.

`PersonalTripItem`

- day;
- title;
- category;
- source;
- optional DestinationPackage node;
- optional start/end time;
- lifecycle status;
- optional ticket/reservation commitment.

`PersonalTripVisit`

- visit time;
- trip day;
- title;
- optional plan item;
- optional DestinationPackage node;
- bounded evidence class;
- optional evidence reference.

## Integration with existing Moscow architecture

Personal Trip does not replace:

- `DestinationPackage`;
- `DestinationJourneyPlanner`;
- `DestinationJourneyRuntime`;
- Live Destination Authority;
- provider evidence;
- field-verification gates.

Instead it is the visitor-owned layer above them.

Source-backed Moscow nodes enter the trip from `DestinationPackage`.

Live provider entities and receipts can later upgrade commitments without changing the personal-trip UX contract.

Journey Runtime remains responsible for live verification, invalidation and replan-required behavior for provider-controlled blocks.

## Persistence

The first slice is local-first and stored separately from the historical experience snapshot:

`moscow:v1:personal-trip`

This allows the trip model to evolve without destabilizing the existing Varvarka experience persistence.

## Privacy boundary

Personal Trip v1 does not require:

- continuous GPS history;
- background location;
- camera content;
- device identifiers.

A visitor may type a booking reference manually. It remains local application state in this slice.

## Current UI

The main navigation now contains:

- Discover;
- Map;
- Walk;
- My Trip;
- My Moscow.

My Trip supports:

- trip creation;
- multi-day tabs;
- manual plan items;
- manual ticket/reservation capture;
- saved-place quick add;
- route-completion sync;
- explicit "I was here" completion;
- visit history;
- source-backed "what else to see".

## Next product layers

After v1 is stable:

1. drag/reorder plan items inside a day;
2. move an item between days;
3. conflict detection for overlapping fixed commitments;
4. travel-time slots backed by routing authority;
5. import provider receipt / deep-link return;
6. calendar import/export;
7. hotel/stay anchor and day start/end points;
8. weather-aware and opening-hours-aware suggestions from trusted live sources;
9. "free window" suggestions based on current day state;
10. trip recap with visited neighborhoods, themes and unvisited saved places.

These layers must not manufacture provider availability, opening status or route geometry.


## Trip Scheduler v2

Issue: #103.

The next layer turns the day list into an editable trip schedule while preserving truth boundaries.

Implemented in the stacked branch:

- explicit display ordering for day items;
- move planned items between trip days;
- fixed-time rebasing keeps the supplied local clock time when the user explicitly moves an item;
- visited items cannot be moved to rewrite historical visit facts;
- overlap detection for confirmed commitments with complete start/end timestamps;
- free-window derivation from fixed commitments;
- every free window is marked `routingVerified: false`;
- the UI never claims travel feasibility or opening-hours feasibility from a time gap alone;
- RU / EN / ZH scheduler controls and conflict/free-window surfaces.

Reordering does not mutate supplied timestamps. Provider/user verification state remains unchanged when a planned item moves.

The following still requires later authorities:

- route/travel-time feasibility;
- current opening hours;
- live capacity or ticket inventory;
- automatic replan after provider state change.


### External booking link boundary

A user may store an HTTPS link to a ticket, hotel, restaurant, theatre, transport or other reservation together with a human-readable source/provider name and order reference.

This link is a personal trip convenience only. Its presence does not prove that:

- the provider recognizes the booking;
- the booking is still valid;
- the venue is currently open;
- the ticket remains usable;
- any inventory or capacity is available.

Only a real provider receipt/evidence path may promote the commitment to `provider-confirmed`. Opening a stored link must not change verification state.


## Tourist Today cockpit

Issue: #105.

Tourist Today turns the stored itinerary into an in-day operating view:

`Now -> Next commitment -> Remaining plan -> Free windows -> Seen today -> What else`.

Implemented contract and UI:

- Moscow-time current-day detection;
- current planned item;
- next timed item;
- next confirmed ticket/reservation;
- minutes until the next fixed commitment;
- completed / remaining day progress;
- visits completed today;
- current or next schedule-only free window;
- time-conflict count;
- one-tap opening of a stored ticket/reservation link;
- source-backed unseen Moscow candidates;
- RU / EN / ZH labels.

Truth boundaries remain explicit:

- a free window is schedule-only and always keeps `routingVerified=false`;
- the UI does not say that the visitor can reach a place in time;
- the UI does not say that a venue is open now;
- the UI does not say that tickets are available now;
- a user-entered commitment remains `user-declared`;
- provider-confirmed display requires the existing provider receipt/evidence contract.

The clock refreshes in the UI once per minute. No background GPS history is required.


## Moscow Passport — semantic trip history

Issue: #107.

Moscow Passport turns the raw visit ledger into a useful personal history:

`Plan item -> Visit -> Semantic category -> Day recap -> Trip passport`.

Visit categories:

- `saw` — heritage, museums, nature and viewpoints;
- `ate` — restaurants/cafes/food;
- `nightlife` — bars;
- `culture` — theatre and events;
- `activity` — activities;
- `shopping`;
- `stay`;
- `transport`;
- `other`.

The semantic category is independent from visit evidence.

Evidence remains one of:

- `user-confirmed`;
- `route-completed`;
- `provider-receipt`;
- `proximity`.

A category such as "Где ел" never upgrades a visit to provider-verified.

### Backward compatibility

New visits persist an optional `kind`.

Older v1 visits without `kind` are resolved in this order:

1. linked Personal Trip item;
2. linked DestinationPackage node;
3. `other`.

This allows existing local trip data to be upgraded without rewriting historical evidence.

### UI

The old flat visit list is replaced with Moscow Passport:

- total visited places;
- days with recorded visits;
- semantic category totals;
- per-day visit history;
- evidence label per visit.

No background GPS history is required.
