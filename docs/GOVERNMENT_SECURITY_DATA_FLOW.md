# Security / Data-Flow Readiness — Moscow Pilot

Статус: проектный security/data-flow note.

Это **не сертификат соответствия**, не аудит ИБ и не утверждение о выполнении всех требований конкретного заказчика.

Production requirements должны быть подтверждены профильными IT/ИБ/юридическими службами после выбора deployment architecture.

## 1. Data classes

### A. Public heritage content

Примеры:

- approved descriptions;
- public sources;
- published claims;
- public 3D package metadata;
- public audio/transcripts.

Target handling:

- versioned;
- cacheable;
- exportable.

### B. Rights / review material

Примеры:

- rights evidence;
- restricted source references;
- review comments;
- unpublished reconstruction decisions.

Target handling:

- authenticated access;
- role separation;
- audit;
- not automatically public.

### C. Spatial evidence

Примеры:

- survey packet;
- control-point coordinates;
- alignment observations;
- device/session condition logs;
- persistent-anchor proof.

Target handling:

- immutable/versioned evidence;
- access controlled where necessary;
- hashes/evidence refs preserved.

Не следует включать device serial/advertising IDs без отдельной необходимости.

### D. Pilot analytics

Raw app analytics are local-only in the current supervised pilot.

Aggregate export excludes:

- name;
- email;
- phone;
- advertising ID;
- device ID;
- raw GPS history;
- raw session/event identity in cohort output.

Recruitment/consent records remain outside app analytics.

### E. Provider operational data

Examples:

- event/place record;
- status;
- provider ID;
- timestamps;
- booking/deep link;
- source URL.

Raw provider snapshot:

- treated as external input;
- checksum/fetch metadata recorded;
- normalized through provider authority;
- not trusted merely because transport succeeded.

### F. Secrets

Examples:

- MapKit key;
- anchor-provider credentials;
- future API tokens.

Rules:

- never commit real secrets;
- use deployment/build secret store;
- restrict key scope where provider supports it;
- rotate/revoke outside app release where possible.

## 2. Current data-flow

### Visitor journey

`published content/package → mobile client → local interaction`.

### Pilot analytics

`mobile events → local outbox → aggregate report → study operator → cohort report`.

No analytics backend is required for the bounded supervised study.

### Provider data

`external provider → raw snapshot metadata/checksum → normalization → LiveDestinationFeed → client projection`.

Expired operational state becomes unknown.

### Field evidence

`physical session/survey → evidence bundle → validator/release gate → published state`.

## 3. Current implemented controls

Implemented software controls include:

- fail-closed field verification;
- source/model checksums;
- version binding;
- aggregate-only pilot reporting;
- forbidden analytics key checks;
- path traversal rejection in evidence bundles;
- provider capability boundaries;
- stale provider fail-close;
- provider snapshot checksum/audit metadata;
- no real secrets committed in environment example;
- explicit separation of commercial placement from live/editorial authority.

## 4. Controls still required for production

The pilot repo does **not** by itself prove production security readiness.

Before production city deployment, agree and implement:

- identity/authentication;
- SSO where required;
- RBAC enforcement;
- privileged admin model;
- database/network segmentation;
- encryption at rest/in transit as required by platform;
- key management;
- audit-log persistence;
- centralized monitoring;
- backup;
- disaster recovery;
- vulnerability/dependency management;
- secure CI/CD;
- incident response;
- retention/deletion policy;
- production access review;
- third-party/provider risk review.

## 5. Personal data boundary

The current supervised pilot is intentionally designed to minimize personal data inside app analytics.

If later product versions add:

- user accounts;
- cloud saved places;
- purchases;
- CRM;
- personalized marketing;
- persistent cross-device profiles;

a separate personal-data architecture and legal/security review is required.

Do not inherit pilot assumptions into that production scope automatically.

## 6. Location data

The app may need foreground location for nearby/route behavior.

Pilot reporting must not convert this into persistent location history.

Design principle:

- use location for immediate client function;
- export aggregate behavior;
- do not export raw coordinates as pilot analytics.

## 7. Provider freshness as security/integrity control

Stale tourism information can create operational harm even without a confidentiality breach.

Therefore:

- provider status expires;
- booking handoff expires independently;
- failed refresh does not extend truth;
- stale current status becomes unknown;
- unsupported availability/price fields are rejected.

## 8. Evidence integrity risks

Threats:

- wrong GLB attached to evidence;
- reused evidence from another version;
- manual “verified” flag;
- fabricated survey;
- stale approval after revision;
- duplicate provider entity;
- empty evidence attachment.

Current contracts contain fail-closed controls for these cases where implemented.

## 9. Suggested production trust zones

### Public zone

- read-only published content;
- public assets/API.

### Application service zone

- publication projection;
- live provider normalization/cache;
- optional client APIs.

### Editorial/admin zone

- Studio;
- rights/review workflows;
- unpublished materials.

### Evidence zone

- survey/field proof;
- immutable audit/evidence.

Exact hosting/network topology is buyer-dependent.

## 10. Retention decisions required

Before pilot launch, explicitly define retention for:

- exported aggregate pilot reports;
- observer notes;
- field evidence;
- provider raw snapshots;
- audit logs;
- unpublished content;
- support logs.

Do not infer indefinite retention.

## 11. Security review checklist before technical approval

- [ ] hosting owner selected;
- [ ] environment boundaries selected;
- [ ] auth/SSO decision;
- [ ] RBAC model;
- [ ] secret management;
- [ ] data inventory approved;
- [ ] personal-data scope confirmed;
- [ ] retention approved;
- [ ] provider/security contacts assigned;
- [ ] backup/DR approach;
- [ ] monitoring/logging approach;
- [ ] incident-response owner;
- [ ] third-party SDK/provider review;
- [ ] production penetration/security testing scope agreed if required.

## 12. Acceptance boundary

A green CI build is software quality evidence.

It is not equivalent to:

- production security approval;
- personal-data compliance conclusion;
- infrastructure certification;
- buyer IT acceptance.

Those remain separate formal decisions.
