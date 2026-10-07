# Moscow Product Master Plan — 2026-10-07

**Status:** ACTIVE PRODUCT AUTHORITY  
**Canonical scope:** citywide tourist MVP / government & investor proposition  
**Default language:** RU; supported: EN / 中文

## Product thesis

Moscow is a **city trip operating system**, not a catalogue of attractions and not a single heritage route.

It connects:

`plan trip → live day → tickets/reservations → nearby opportunities → adaptive replan → confirmed visits → My Moscow → next-day discovery`

with:

`traveler intent → partner supply → transaction/visit attribution → demand intelligence → district load balancing → tourism development signal`.

## Users

### Tourist

The tourist gets:

- one multi-day trip;
- personal interests, pace, accessibility intent and day bounds;
- imported/manual tickets and reservations;
- museums, heritage, restaurants, bars, theatres, events, activities, shopping, stays and transport in one timeline;
- Today view;
- nearby options for free windows;
- replan without breaking fixed commitments;
- visited/history memory;
- My Moscow passport;
- recommendations that avoid already visited places;
- RU / EN / 中文;
- offline-safe content where available.

### Partner

A museum, restaurant, theatre, event organiser, activity provider, retailer, hotel or mobility partner gets:

- profile / inventory / availability;
- offers/campaigns;
- qualified contextual demand;
- handoff;
- booking/ticket/deep-link/provider confirmation when integration exists;
- attribution;
- transaction/revenue evidence;
- settlement evidence where applicable;
- retention and repeat-visit insight;
- district-level demand context.

Paid placement must remain separate from organic relevance.

### City

Moscow gets:

- aggregate tourism-demand map;
- demand gaps by district/time/category;
- supply coverage;
- visitor-flow distribution;
- overload / underused capacity signals;
- event and venue opportunity signals;
- district opportunity briefs;
- campaign / intervention measurement;
- tourism-seasonality view;
- repeat-visit / cross-district exploration;
- city KPI layer without exposing individual traveler history.

## Core traveler product

### 1. Before trip

`dates → interests → pace → accessibility → must-see → existing tickets/reservations → day plan`

### 2. Today

Every day has:

- fixed commitments;
- flexible blocks;
- travel buffer;
- food/rest windows;
- nearby opportunity slots;
- disruption/replan state.

### 3. Live city

Contextual opportunity ranking considers:

- relevance;
- time fit;
- distance;
- opening/availability freshness where known;
- preferences;
- service quality;
- prior visits;
- day load;
- route friction.

Sponsored inventory never silently changes organic rank.

### 4. Booking / ticket wallet

Three explicit truth classes:

- user-declared;
- provider-linked;
- provider-confirmed.

No provider integration may be fabricated.

### 5. Visit memory

`planned → visited → evidence class → category → day → My Moscow`

History should answer:

- where I was;
- what I saw;
- where I ate;
- which events I attended;
- which districts I explored;
- what remains new.

### 6. Next day

Recommendations must use:

- remaining free time;
- unvisited categories;
- visited districts;
- declared interests;
- weather/provider inputs when authoritative;
- city-load policy where enabled;
- active events;
- distance and travel friction.

## Content / experience types

The MVP is not limited to heritage.

Supported product categories:

- heritage;
- museum;
- exhibition;
- theatre;
- concert/event;
- festival;
- restaurant/cafe;
- bar/nightlife;
- viewpoint;
- park/nature;
- activity;
- shopping;
- hotel/stay;
- transport/mobility;
- seasonal city experience.

Historical Time Machine / 3D / AR is one premium content mechanic inside eligible places, not the product centre.

## City load balancing

Goal: **improve the visitor day while spreading value across Moscow**, not forcibly route people away from popular places.

Signals:

- high-demand / constrained-supply windows;
- underused quality supply;
- district/event capacity;
- free-window fit;
- travel time;
- user preference match.

Possible product actions:

- suggest a different time;
- suggest a nearby alternative;
- pair a popular anchor with an underexplored district;
- promote evening/morning inventory;
- surface temporary events;
- create themed cross-district routes.

Rules:

- never hide a user-requested destination;
- never disguise paid promotion as load balancing;
- city policy affects recommendation only within transparent product rules;
- actual capacity requires authoritative data.

## Event development loop

`intent → demand gap → event/venue opportunity → partner acquisition/campaign → attendance → repeat/cross-district effect → city measurement`

The city can use aggregate unmet intent to understand:

- missing evening supply;
- weak family/weekend offer;
- seasonal gaps;
- district-specific cultural demand;
- food/nightlife demand after events;
- opportunity for temporary programming.

## Commercial model

Potential revenue layers shown separately:

- B2G platform / operating contract;
- B2B partner subscription / tooling;
- transaction or qualified handoff fee where contractually allowed;
- clearly labelled sponsorship/campaign inventory;
- API / white-label / regional licensing;
- production/content services.

MVP must distinguish:
- modelled revenue;
- contracted revenue;
- confirmed transaction revenue.

## Product authority hierarchy

1. **This file** — product direction.
2. Travel / marketplace authorities — functional contracts.
3. `MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` — optional spatial-heritage engineering sub-plan.
4. Pilot execution documents — future real implementation workflow.

## Spatial heritage scope correction

Romanov Chambers, Old English Court and Varvarka were early validation assets.

They are:

- useful demo/reference content;
- replaceable;
- optional spatial showcase;
- not mandatory geography for the broad MVP;
- not a gate for trip planning, events, partner marketplace, demand intelligence or city load balancing.

Their field gates continue to govern any claims about their own AR/spatial accuracy only.

## Product development priority

1. Traveler Trip OS.
2. Today / adaptive day.
3. Booking & ticket wallet.
4. My Moscow visit memory.
5. Broad supply taxonomy + events.
6. Partner Console / attribution.
7. City demand & load-balancing intelligence.
8. District/event development loop.
9. Optional premium heritage/spatial experiences.
10. Real integrations only after authorised access exists.

## Truth rules

- demo inventory must be labelled demo;
- user-entered reservation != provider confirmation;
- forecast != actual;
- modelled economics != contracted economics;
- aggregate city intelligence must not expose personal trip history;
- no single pilot location may become the product architecture.


## Execution documents

- End-to-end product blueprint: `docs/MOSCOW_END_TO_END_PRODUCT_BLUEPRINT_2026-10-07.md`
- Execution roadmap: `docs/MOSCOW_EXECUTION_ROADMAP_2026-10-07.md`

These two files define the complete traveler / partner / city product and implementation order. They supersede ad-hoc feature expansion.
