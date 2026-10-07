# Moscow — End-to-End Product Blueprint

**Date:** 2026-10-07  
**Status:** ACTIVE EXECUTION BLUEPRINT  
**Product authority:** `docs/MOSCOW_PRODUCT_MASTER_PLAN_2026-10-07.md`  
**Default language:** Russian  
**Supported MVP languages:** Russian / English / Chinese

---

# 0. Executive definition

Moscow is a **personal Moscow planner and memory layer** for the full visitor lifecycle.

It is not another attraction catalogue, not a replacement OTA, and not a product that asks a person to think of Moscow as one giant trip.

The product connects:

`inspiration → plan a day or several days → fixed commitments → live day → discovery → booking/handoff → adaptive replan → visit → memory → revisit or build a new plan`

with:

`partner supply → qualified demand → conversion/visit attribution → partner economics → aggregate city demand → district/event development → measured tourism effect`.

The city buys a platform that improves the visitor experience **and** creates an operating layer for tourism demand, partner participation and district development.

---

# 1. Positioning against the existing Moscow ecosystem

RUSSPASS already covers a large part of the classical digital-tourism stack: places, events, personal trip planning, hotels, restaurants and ticket purchasing.

Therefore Moscow must not be positioned as a duplicate catalogue or booking site.

## Moscow differentiator

### RUSSPASS / authoritative provider layers may own

- authoritative city catalogue;
- ticket commerce where supported;
- hotel booking;
- restaurant reservation where supported;
- event inventory;
- provider checkout;
- authoritative opening/availability facts where contracted.

### Moscow owns

- the visitor's multi-day execution plan;
- fixed vs flexible day logic;
- imported/manual commitments from any source;
- real-time free-window discovery;
- adaptive replanning;
- explicit truth classes for reservations/tickets;
- visit memory and My Moscow;
- contextual demand ranking;
- partner attribution;
- load-balancing logic;
- unmet-demand detection;
- district/event development signals;
- post-trip continuation and repeat-visit intelligence.

---

# 2. North Star

## Tourist North Star

**Every visitor should be able to answer:**

> What should I do next in Moscow, given what I already booked, where I am, what I like, what I already saw and how much time I actually have?

The user-facing product promise is deliberately simpler than the internal Trip OS architecture:

> **Plan Moscow. Remember where you have been. Revisit what you loved or build a new route.**

The technical trip object remains an implementation primitive. It must not dominate user-facing language.

## Partner North Star

**Every partner should be able to answer:**

> What qualified tourist demand exists for my offer, when should I expose capacity, what converted, and what incremental value did Moscow create?

## City North Star

**Moscow should be able to answer:**

> Where is tourism demand concentrated, where is quality supply underused, what is missing, which interventions/events redistribute value, and what actually improved after action?

---

# 3. Core user groups

## Tourist

Primary modes:

- first-time visitor;
- repeat visitor;
- family;
- couple;
- solo;
- international visitor;
- business traveler with free windows;
- event-driven traveler;
- cultural traveler;
- gastro/nightlife traveler;
- accessibility-sensitive traveler;
- resident using Moscow as a discovery product.

## Partner

Partner types:

- museums;
- galleries;
- theatres;
- concert halls;
- event organisers;
- festivals;
- restaurants;
- cafes;
- bars;
- clubs;
- attractions;
- parks;
- activity providers;
- retail;
- hotels;
- mobility providers;
- tour operators;
- guides;
- city institutions.

## City / operator

Roles:

- tourism product owner;
- content/editorial operator;
- demand analyst;
- partner acquisition manager;
- event/programme manager;
- district manager;
- campaign manager;
- data/integration owner;
- support operator;
- finance/commercial analyst.

---

# 4. Traveler information architecture

Recommended public bottom navigation:

1. **Today**
2. **Explore**
3. **Plan**
4. **Wallet**
5. **My Moscow**

Map is available contextually from Today / Explore / Trip instead of occupying a permanent bottom-nav slot on smaller screens.

## Today

The operational home screen.

Shows:

- next fixed commitment;
- current flexible block;
- travel buffer;
- "leave by" time;
- nearby opportunities;
- event starting soon;
- meal/rest window;
- disruption;
- replan CTA;
- weather/context banner when authoritative;
- current district;
- load-aware alternatives;
- "continue evening" suggestion.

## Explore

Broad city discovery.

Modes:

- For you;
- Today;
- This evening;
- This weekend;
- Nearby;
- Events;
- Food;
- Culture;
- Family;
- Nightlife;
- Shopping;
- Parks;
- Hidden Moscow;
- New district;
- Seasonal;
- Free;
- Premium.

## Plan

Planning for one day, several days, or a return visit.

Contains:

- trip dates;
- travel party;
- pace;
- interests;
- accessibility intent;
- must-see;
- fixed tickets/reservations;
- day-by-day timeline;
- free windows;
- conflicts;
- alternative arrangements;
- travel time;
- add from Explore;
- import own commitment;
- day replan.

## Wallet

All commitments.

Types:

- ticket;
- reservation;
- hotel;
- event;
- table;
- activity;
- transport;
- voucher;
- offer/coupon.

Truth classes:

1. `user-declared`
2. `provider-linked`
3. `provider-confirmed`

The UI must never visually merge these states.

## My Moscow

Personal visit memory.

Answers:

- where I was;
- what I saw;
- where I ate;
- what events I attended;
- what districts I explored;
- favorite categories;
- saved places;
- collections;
- unfinished ideas;
- "new for next visit";
- trip recap.

---

# 5. Onboarding

Keep onboarding under 90 seconds.

## Required

- language;
- trip dates or "I'm already in Moscow";
- party type;
- main interests;
- pace.

## Optional

- children;
- mobility/accessibility;
- food preferences;
- day start/end;
- walking tolerance;
- budget comfort;
- nightlife preference;
- preferred transport;
- hotel/base district;
- must-see places;
- existing tickets/reservations.

## Principle

Every optional answer must visibly improve the plan.

Do not ask profile questions that are not used.

---

# 6. Trip planning engine

## Input

- date range;
- fixed commitments;
- opening windows where authoritative;
- travel times;
- user preferences;
- pace;
- walking tolerance;
- meal windows;
- must-see;
- category balance;
- prior visits;
- availability;
- event schedule;
- district friction;
- accessibility constraints;
- weather only when authoritative.

## Day object

Every day contains:

### Fixed

Cannot move automatically:

- timed ticket;
- theatre;
- concert;
- reservation;
- flight/train;
- hotel check-in where relevant;
- booked activity.

### Flexible

May be moved:

- museum without timed entry;
- park;
- shopping;
- viewpoint;
- free exhibition;
- walk;
- meal without reservation;
- district exploration.

### Buffers

- travel;
- queue;
- rest;
- meal;
- return to hotel;
- contingency.

## Conflict engine

Detect:

- overlapping commitments;
- impossible travel;
- missing buffer;
- closing-time conflict;
- reservation too close to another event;
- excessive continuous walking;
- missing meal/rest;
- accessibility conflict;
- stale provider state.

## Replan policy

Never silently move fixed commitments.

Replan only flexible inventory around them.

---

# 7. City Discovery & Event Engine

This is the next active implementation priority.

## Experience types

- heritage;
- museum;
- gallery/exhibition;
- theatre;
- concert;
- festival;
- sport;
- restaurant;
- cafe;
- bar;
- nightlife;
- park;
- viewpoint;
- architecture;
- activity;
- family;
- shopping;
- market;
- hotel;
- mobility;
- seasonal;
- temporary event;
- city programme.

## Event identity

Every event must have:

- stable ID;
- organiser;
- venue;
- category;
- start/end;
- recurrence;
- age guidance;
- language;
- price class;
- booking/ticket route;
- source;
- freshness;
- rights;
- district;
- coordinates;
- accessibility metadata where known;
- audience tags.

## Discovery queries

- open now;
- starts in 30 min;
- starts in 60 min;
- starts in 2 hours;
- fits 45 min;
- fits 90 min;
- fits evening;
- near next booking;
- near hotel;
- new for me;
- not visited;
- another district;
- family now;
- rainy-day;
- late-night;
- free;
- high-rated;
- underexplored;
- seasonal.

---

# 8. Ranking model

Separate **organic rank** from **commercial exposure**.

## Organic rank components

- intent relevance;
- category affinity;
- time-window fit;
- route friction;
- distance;
- opening/availability confidence;
- user pace;
- accessibility fit;
- quality;
- freshness;
- prior visits;
- novelty;
- party fit;
- weather fit where authoritative;
- load-distribution opportunity.

## Negative signals

- already visited;
- schedule conflict;
- stale data;
- impossible travel;
- mismatched age;
- inaccessible when accessibility is required;
- excessive price against declared preference;
- low provider reliability;
- repeated same category;
- long queue/load when a better equal alternative exists.

## Sponsorship

Sponsored opportunities are:

- visibly labelled;
- ranked in a separate sponsored slot or eligible sponsored surface;
- never allowed to overwrite the top organic answer invisibly.

---

# 9. Ratings, reviews and quality

Do not create a low-trust anonymous review swamp.

## Quality model

Combine separately:

- editorial quality;
- provider quality;
- verified visitor feedback;
- completion rate;
- repeat/save rate;
- cancellation/no-show signals;
- complaint rate;
- freshness;
- partner response reliability.

## Visitor review

After a confirmed/user-confirmed visit:

- overall 1–5;
- "worth the time";
- "accurate description";
- "crowding";
- "service";
- optional short note;
- family/accessibility tags where relevant.

## Anti-abuse

- review eligibility tied to visit signal;
- one review per visit;
- partner response;
- moderation;
- suspicious pattern detection;
- no paid manipulation of organic quality score.

---

# 10. Promotions, offers and city campaigns

## Partner offer types

- discount;
- bundle;
- complimentary item;
- off-peak incentive;
- last-minute slot;
- family offer;
- event + restaurant;
- museum + district walk;
- repeat-visit offer.

## City campaign types

- seasonal programme;
- district discovery;
- museum night;
- gastronomy week;
- family weekend;
- evening economy;
- low-season activation;
- international visitor campaign.

## Rules

An offer has:

- eligibility;
- start/end;
- inventory/capacity;
- geography;
- audience;
- source;
- sponsor;
- redemption route;
- attribution;
- budget cap if paid;
- disclosure.

---

# 11. Booking and transaction architecture

Moscow should be an **orchestration layer** first.

## Handoff modes

### A. Deep link

Moscow sends visitor to provider.

Capture:

- click;
- provider;
- offer;
- timestamp;
- attribution ID.

### B. API reservation

When authorised:

- availability;
- create;
- update;
- cancel;
- webhook;
- provider receipt.

### C. City platform integration

Where the city already has authoritative commerce/catalogue capability, Moscow should reuse it rather than duplicate it.

## Never fabricate

- availability;
- price;
- confirmation;
- sold-out state;
- receipt.

---

# 12. Adaptive Today engine

Primary runtime loop:

`commitment → travel → experience → disruption/opportunity → replan → visit → next`

## Trigger examples

- user is late;
- event cancelled;
- restaurant booking changed;
- rain;
- museum sold out;
- user skips a stop;
- user finishes early;
- user wants coffee;
- user wants to continue evening;
- visitor enters another district.

## Response

The app computes:

- what stays fixed;
- what can move;
- what should be dropped;
- best replacement;
- travel impact;
- next deadline;
- alternative district.

---

# 13. My Moscow memory

The product becomes more valuable after every visit.

## Visit evidence classes

- user-confirmed;
- route-completed;
- provider-receipt;
- privacy-safe proximity signal.

## Collections

Automatic:

- museums seen;
- theatres;
- restaurants;
- districts;
- parks;
- architecture;
- Moscow at night;
- family;
- Soviet Moscow;
- contemporary Moscow.

User-defined:

- favorites;
- return later;
- with friends;
- next visit;
- wishlist.

## Repeat visit / next plan

Use history to avoid recommending the same obvious set and to support both deliberate revisits and a fresh plan.

A repeat visitor should feel:

> Moscow knows what I have already done and opens a new city.

---

# 14. Partner Console

Navigation:

1. Profile
2. Inventory
3. Availability
4. Events
5. Offers
6. Campaigns
7. Handoffs
8. Confirmed visits/transactions
9. Revenue & attribution
10. Audience insights
11. Settlement
12. Support

## Profile

- business identity;
- category;
- districts;
- languages;
- contacts;
- rights;
- verification;
- booking routes;
- integration method.

## Inventory

- place/service/event;
- schedule;
- capacity;
- prices;
- duration;
- audience;
- age;
- accessibility;
- media;
- cancellation;
- freshness.

## Demand insight

Partner sees aggregate:

- intent volume;
- time-of-day;
- district;
- category demand;
- free-window demand;
- unmet demand;
- conversion;
- repeat;
- source campaign.

No individual traveler history.

---

# 15. Partner economics

Separate:

- impressions;
- qualified opportunities;
- handoffs;
- bookings;
- confirmed visits;
- revenue;
- attributed revenue;
- paid campaign spend;
- commission;
- subscription;
- net partner value.

## Monetisation candidates

- free/basic listing;
- partner SaaS subscription;
- transaction/handoff fee;
- campaign spend;
- premium analytics;
- API;
- white label.

Never combine these into one fictional ARR number in MVP.

---

# 16. City Tourism Control Tower

The city does not need personal itineraries.

It needs aggregate operating intelligence.

## City screens

### Demand map

- district;
- time;
- category;
- visitor type;
- season;
- language/market where lawful and aggregate.

### Supply coverage

- capacity;
- opening hours;
- event density;
- price mix;
- accessibility coverage;
- category gaps.

### Load

- high demand;
- balanced;
- opportunity capacity;
- uncertainty.

### Unmet intent

Examples:

- family activity 18:00–21:00;
- late museum;
- restaurant after theatre;
- rainy-day attraction;
- accessible route;
- Chinese-language experience.

### Event impact

Before / during / after:

- demand;
- footfall proxy;
- handoffs;
- confirmed visits;
- cross-category spillover;
- district spread;
- repeat interest.

---

# 17. District and tourism-development loop

`persistent demand gap → opportunity brief → partner/event action → launch → measurement → keep/change/stop`

Example:

Demand shows repeated family intent in a district on weekend afternoons.

The city can:

- recruit relevant partner;
- extend venue hours;
- create temporary programming;
- bundle nearby supply;
- run campaign;
- measure whether unmet intent falls.

This is the city-economic differentiator.

---

# 18. Load balancing policy

Goal: spread tourism value **without degrading user utility**.

## Allowed

- suggest alternate time;
- suggest equivalent nearby option;
- pair anchor with another district;
- surface underused high-quality supply;
- encourage morning/evening;
- create cross-district theme;
- use events as district anchors.

## Forbidden

- hide requested place;
- silently downgrade user relevance;
- disguise sponsorship;
- use personal identity for city pressure;
- present modelled crowding as live fact.

---

# 19. Event development OS

## Event lifecycle

`idea → demand case → organiser → venue → schedule → publish → campaign → booking/handoff → attendance → spillover → post-event analysis`

## City gets

- evidence for where to create new events;
- which categories drive district spend;
- what timing works;
- what seasonal gaps exist;
- whether temporary events create repeat demand.

## Partner gets

- demand brief;
- target audience;
- suggested time;
- expected district context;
- campaign tools;
- attribution.

---

# 20. Content and editorial system

Content source hierarchy:

1. authoritative city/provider data;
2. verified partner data;
3. editorial data;
4. user-supplied trip data;
5. demo data.

UI must expose truth class where it materially changes action.

## Editorial objects

- place;
- event;
- collection;
- route;
- district guide;
- story;
- seasonal programme;
- recommendation set.

---

# 21. Languages

MVP:

- Russian default;
- English;
- Chinese.

Requirements:

- full navigation;
- descriptions;
- event metadata;
- booking status;
- partner offer disclosure;
- errors;
- support;
- accessibility copy.

No partial-language dead ends.

---

# 22. Accessibility

Profile supports:

- step-free required/preferred;
- max walking;
- rest frequency;
- captions;
- audio;
- large text;
- low-visual-attention mode.

Accessibility facts must be:

- sourced;
- fresh;
- unknown when not verified.

Never infer accessible status.

---

# 23. Offline & degraded mode

Available offline:

- trip;
- commitments;
- saved items;
- tickets already stored if legally/technically allowed;
- maps/content packs where supported;
- My Moscow history;
- emergency contact/help text.

Unavailable offline:

- live capacity;
- live booking;
- live event status;
- dynamic provider confirmation.

App should explain the distinction.

---

# 24. Safety and support

Support surfaces:

- booking issue;
- lost ticket;
- venue closed;
- event cancelled;
- accessibility issue;
- safety/emergency links;
- report incorrect info.

Do not build emergency-service logic beyond official routing.

---

# 25. Privacy model

Personal Trip is personal.

City analytics are aggregate.

## Never expose to city dashboard

- named trip;
- exact personal route history;
- identity-linked place history;
- private ticket references.

## City receives

- aggregated demand;
- aggregated conversion;
- aggregated district movement;
- aggregated unmet intent.

Use minimum cohorts / privacy thresholds in production.

---

# 26. Analytics event model

Traveler funnel:

`open → onboarding → trip_created → commitment_added → opportunity_shown → opportunity_opened → handoff → booking_confirmed → visit → review → next_day → repeat_trip`

Partner funnel:

`inventory_active → eligible_demand → offer_shown → handoff → confirmation → visit → attributed_revenue → repeat`

City funnel:

`intent → unmet_gap → intervention → activated_supply → demand_shift → confirmed_effect`

---

# 27. KPI tree

## Tourist

- trip creation;
- active days;
- plan completion;
- commitment conflict rate;
- successful replan rate;
- saved-to-visit;
- opportunity-to-visit;
- repeat visit;
- NPS/satisfaction;
- average districts explored.

## Partner

- active supply;
- freshness;
- qualified handoffs;
- conversion;
- confirmed visits;
- attributed revenue;
- campaign ROAS where applicable;
- retention.

## City

- unmet demand;
- demand concentration;
- district spread;
- event spillover;
- repeat/cross-district exploration;
- supply coverage;
- partner activation;
- model confidence.

---

# 28. Government / investor value proposition

## What Moscow buys

- visitor client;
- Trip OS;
- demand marketplace;
- partner operating layer;
- city tourism intelligence;
- event/district development loop;
- integration architecture;
- multilingual content framework;
- analytics;
- optional heritage/spatial premium experiences.

## What the city does not buy

- another static catalogue;
- another isolated route app;
- fake live data;
- an ungoverned advertising feed;
- a proprietary payment core unless explicitly required.

---

# 29. Revenue model

## B2G

- platform license/operation;
- implementation;
- integration;
- analytics/control;
- content/event production modules.

## B2B

- partner subscription;
- advanced analytics;
- campaign tooling;
- inventory/API;
- optional transaction/handoff fee.

## Marketplace

- transaction fee where legally/contractually appropriate;
- qualified lead/handoff;
- sponsored campaigns clearly separated from organic rank.

## Expansion

- regional white-label;
- API;
- destination OS licensing.

---

# 30. Product roadmap

## Phase A — Reference MVP

Goal: prove the entire product story with clearly labelled demo/live truth.

Deliver:

- City Trip home;
- multi-day Trip;
- Today;
- manual ticket/reservation import;
- Wallet;
- Explore;
- broad category taxonomy;
- Event Engine demo;
- adaptive replan;
- My Moscow;
- Partner Console demo;
- City Control demo;
- RU/EN/ZH;
- investor/government guided route.

## Phase B — Integration-ready MVP

- authoritative provider adapters;
- event feeds;
- official city/catalog links;
- availability freshness;
- deep-link attribution;
- partner onboarding;
- real offer lifecycle;
- support tooling.

## Phase C — Controlled live pilot

Use replaceable selected districts/partners.

Goal:

- real trip use;
- real partner supply;
- real handoffs;
- real visits;
- aggregate city intelligence;
- measured economics.

No dependency on any specific old heritage object.

## Phase D — Moscow scale

- many districts;
- event ecosystem;
- partner self-service;
- tourism campaigns;
- live load signals where authoritative;
- repeat-visitor product;
- demand-driven event development.

## Phase E — Platform expansion

- city/region white label;
- API;
- destination operating system;
- cross-city traveler identity by consent;
- institutional partner network.

---

# 31. Acceptance for Reference MVP

MVP is ready for investor/government presentation when:

- a tourist can create a 3-day Moscow trip;
- add their own timed ticket and restaurant booking;
- view Today;
- discover an event fitting a free window;
- add it to the day;
- trigger a disruption and see replan;
- mark actual visits;
- see My Moscow update;
- receive next-day/new-district recommendations;
- inspect Wallet truth classes;
- see a partner opportunity become handoff/attribution;
- see city aggregate demand/load signal;
- compare organic vs sponsored ranking;
- switch RU/EN/ZH without partial UI;
- demo data is visibly labelled;
- no flow requires Romanov/OEC/YCLIENTS specifically.

---

# 32. Final product destination

Moscow should become the service a visitor opens repeatedly **throughout the day**, not once before arrival.

The long-term flywheel:

`better trip utility → more visitor intent → better demand signal → better partner supply → better conversion → better city programming → better tourism product → more repeat visitors`.

That is the product moat.

