# Buyer Architecture / Integration — Moscow Pilot

## 1. Принцип

Проект разделяет:

1. историческую truth authority;
2. spatial evidence;
3. visitor experience;
4. live operational data;
5. внешние городские integrations.

Один внешний SDK не становится владельцем всех данных и решений.

## 2. Текущая реализация vs target production

### Реализовано в репозитории

- React Native / Expo client;
- web QA/demo;
- source/rights/content domain;
- PublishedSpatialPackage;
- City Heritage Studio domain workflow;
- GLB validation;
- generic field evidence/release authority;
- local-only analytics;
- pilot cohort/study reporting;
- DestinationPackage;
- Live Destination Authority;
- provider ingestion/freshness contracts;
- government/investment readiness contracts.

### Не следует считать production backend

Текущий репозиторий не должен описываться как уже развёрнутый городской backend/CMS.

До production deployment необходимо отдельно согласовать:

- hosting;
- backend/database;
- authentication/SSO;
- operational RBAC enforcement;
- production audit storage;
- backup/DR;
- monitoring;
- security controls;
- provider credentials;
- API gateway/integration channel.

## 3. Логические слои

### Layer A — Heritage Authority

Stores/represents:

- place identity;
- historical periods;
- sources;
- rights state;
- claims;
- reconstruction elements;
- model version;
- checksums;
- publication state.

Output:

- PublishedSpatialPackage.

### Layer B — Spatial Proof

Inputs:

- model;
- metric scale;
- control points;
- survey;
- field observations;
- device matrix;
- anchor evidence.

Output:

- fail-closed release state.

### Layer C — Visitor Client

React Native surfaces:

- Discover;
- Map;
- route;
- Time Machine;
- audio;
- 3D/AR;
- recap/My Moscow;
- offline content.

Client must consume published authority; it must not promote unpublished candidate content.

### Layer D — Pilot Analytics

Raw runtime analytics:

- local to device.

Export:

- aggregate-only pilot report.

Aggregation:

- cohort/study report.

No remote identity matching is required for the supervised pilot.

### Layer E — Live Destination

Inputs:

- provider feed/snapshot.

Authority:

`provider capability → checksum/fetch → refresh policy → normalization → entity expiry/status → booking handoff`.

Output:

- current safe projection.

### Layer F — City Heritage Studio

Target operational workflow:

- source intake;
- rights review;
- claim/reconstruction mapping;
- model revision;
- historical review;
- rights review;
- technical review;
- publication.

Current repo implements domain authority; production service/auth/storage remain deployment work.

## 4. External integrations

### Yandex MapKit

Purpose:

- native map;
- location;
- route/map functions.

Boundary:

- map provider is not historical truth authority.

### AR runtime / persistent anchors

Purpose:

- rendering;
- tracking;
- anchor host/resolve.

Boundary:

- provider success is not sufficient for field verification;
- release comes from project evidence authority.

### RUSSPASS / city tourism data

Preferred mode:

- formal provider feed/API;
- deep-link/API handoff;
- no duplicated inventory where existing city system is authoritative.

Required contract semantics:

- stable IDs;
- modified/published times;
- cancellation/reschedule;
- booking deep links;
- attribution;
- rights;
- rate limits;
- retention/caching.

No undocumented endpoint is treated as production contract.

### Moscow Open Data

Suitable for:

- reference/inventory data where dataset semantics support it.

Not automatically suitable for:

- open now;
- ticket availability;
- price;
- booking availability.

## 5. Integration modes

Supported target patterns:

### Read-only ingest

External city/provider system → provider snapshot → validated LiveDestinationFeed.

### Deep-link handoff

Moscow client → verified city/provider URL.

### Package export

Published heritage package → museum/city channel/educational use.

### API/service integration

Target production backend exposes agreed published entities/packages.

Not implemented as a production public API yet.

## 6. IDs and versioning

Required stable identifiers:

- destination;
- place;
- heritage package;
- model version;
- provider;
- provider entity;
- publication revision.

Binary assets:

- repository/object identity;
- SHA-256;
- byte size;
- model version.

## 7. Trust boundaries

### Trusted only after project validation

- PublishedSpatialPackage;
- field release result;
- Studio publication snapshot;
- validated LiveDestinationFeed.

### External/untrusted input until validated

- raw provider JSON;
- contractor GLB;
- evidence submission;
- user-supplied/observer note;
- third-party media;
- integration callbacks.

## 8. Offline boundary

Offline pilot pack may include:

- historical text;
- media with cleared rights;
- audio;
- model assets;
- route content.

Live provider status cannot remain “current” indefinitely offline.

Expired operational data fails closed.

## 9. Buyer integration decisions required

Before production deployment, city/buyer must decide:

- hosting authority;
- network boundary;
- database authority;
- auth/SSO;
- secrets storage;
- API gateway;
- data retention;
- logging/audit;
- provider ownership;
- monitoring owner;
- support model.

## 10. Avoiding vendor lock-in

Recommended handover principles:

- exportable published packages;
- portable checksums;
- provider/source IDs preserved;
- documented schemas;
- content/evidence export;
- no hidden “green status” only inside vendor UI.

## 11. Pilot architecture decision

For the bounded pilot:

- keep consumer client and evidence contracts stable;
- avoid premature citywide backend complexity;
- agree production target architecture during technical pilot approval;
- do not call the pilot demo architecture a finished city production platform.
