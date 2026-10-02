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
