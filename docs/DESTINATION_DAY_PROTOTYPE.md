# Destination Day Prototype v1

## Product goal

Move the consumer experience from a historical guide to a travel operating layer:

`where to go → what to see → history → where to eat → what is on → booking handoff → what next`.

Moscow is the first reference destination. The contract must remain portable to another Russian region without Moscow-specific branches in the day planner.

## Current prototype

The Discover screen now leads with **My Day in Moscow**.

The prototype supports:

- 3 / 5 / 8 hour day budgets;
- a source-backed heritage block from `DestinationPackage`;
- multilingual RU / EN / ZH presentation;
- a real handoff into the existing Varvarka walk;
- explicit food / event / activity slots;
- live/provider readiness boundaries;
- future verified booking handoffs.

## Truth model

The prototype is built from two independent authorities.

### Published destination authority

`DestinationPackage`

Provides:

- destination identity;
- localized place inventory;
- published routes;
- source / rights references;
- heritage package bindings;
- sponsor disclosure surfaces;
- offline eligibility.

### Live destination authority

`LiveDestinationProjection`

May provide only fresh, provider-authorized:

- operational status;
- current events;
- food/activity inventory;
- booking handoff.

The day prototype does not invent:

- restaurants;
- events;
- opening hours;
- ticket availability;
- prices;
- free tables;
- route travel time between arbitrary nodes.

If live data is missing, the slot remains visibly unresolved.

## Current Moscow state

Today the day planner can truthfully fill:

1. **History and city** — Varvarka published editorial route.

It intentionally leaves unresolved:

2. **Where to eat**;
3. **What is on today**;
4. **What next**.

Those become active only after a formal Moscow / RUSSPASS / partner provider feed is connected through Live Destination Authority.

## Why this matters for Moscow government discussions

This prototype changes the product proposition from:

> historical AR app

to:

> one travel journey in which verified Moscow history is the differentiating layer.

The city does not need another isolated directory. The platform can reuse existing tourism channels for live data and booking while contributing a new verified heritage/spatial layer.

## Region portability

The same UI consumes a generic `DestinationPackage`.

A first external region should only need:

- regional destination identity;
- RU / EN / ZH content;
- verified place inventory;
- published routes;
- provider adapters;
- local booking handoff contracts;
- optional heritage/spatial packages.

The day planner itself must not gain `if (moscow)` business rules.

## Next production gates

1. connect a formal Moscow live provider;
2. populate food/event/activity slots from fresh projection;
3. preserve freshness and fail-closed behavior;
4. add verified booking handoff UI;
5. run one complete Moscow day scenario;
6. repeat with the first external region.
