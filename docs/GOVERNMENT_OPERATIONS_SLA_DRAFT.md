# Operations / SLA Draft — Moscow

Статус: negotiation draft.

Numerical SLA targets are intentionally **TBD** until hosting, production architecture, support hours, provider contracts and buyer criticality are agreed.

## 1. Service components

Potential production operations scope:

- mobile release lifecycle;
- public content/package delivery;
- City Heritage Studio;
- published asset storage;
- live provider ingestion;
- monitoring;
- incident handling;
- content correction;
- rights takedown;
- provider failure handling;
- backup/recovery;
- support.

Pilot scope may use a smaller operational contour.

## 2. Service ownership

Before production, assign:

| Area | Owner | Backup owner | Escalation |
|---|---|---|---|
| Product | TBD | TBD | TBD |
| Mobile release | TBD | TBD | TBD |
| Hosting | TBD | TBD | TBD |
| Studio | TBD | TBD | TBD |
| Historical content | TBD | TBD | TBD |
| Rights | TBD | TBD | TBD |
| Spatial evidence | TBD | TBD | TBD |
| Live providers | TBD | TBD | TBD |
| Security | TBD | TBD | TBD |
| City integration | TBD | TBD | TBD |

No “shared responsibility” line should remain without a named owner before production launch.

## 3. Incident classes

### P1 — Critical

Examples:

- public service broadly unavailable;
- serious security incident;
- incorrect publication with material legal/safety impact;
- systematic booking handoff to invalid/malicious destination;
- corrupted publication authority.

Targets:

- acknowledgement: TBD;
- mitigation: TBD;
- update cadence: TBD.

### P2 — Major

Examples:

- major route unusable;
- one critical provider feed failing;
- Studio publication blocked;
- severe client regression.

Targets: TBD.

### P3 — Standard

Examples:

- isolated content issue;
- non-critical UI defect;
- one stale non-critical entity correctly failing closed.

Targets: TBD.

### P4 — Request / improvement

- editorial update;
- enhancement;
- routine configuration.

Targets: roadmap/queue.

## 4. Availability

Production availability target is not set in the pilot repository.

Before agreement define separately for:

- public app API/content delivery;
- Studio/admin;
- live provider ingestion;
- analytics/reporting;
- asset storage.

Do not inherit third-party provider uptime as if it were controlled by Moscow platform.

## 5. Live provider failure behavior

Mandatory fail-safe:

1. fetch fails;
2. retry according to provider-specific policy;
3. last known record keeps original expiry;
4. expiry is never extended due to failure;
5. after expiry current status becomes unknown;
6. stale booking handoff disappears;
7. monitoring/alert records provider failure.

Provider outage does not justify inventing availability.

## 6. Content correction

Correction workflow:

`report → triage → authority owner → revision → review → publish`.

Historical correction that changes a claim/reconstruction must create a new revision and invalidate stale approvals where contract requires.

## 7. Rights takedown

If rights basis is withdrawn/disputed:

- identify affected source/media/package;
- block new publication where required;
- remove or replace affected public media according to legal decision;
- preserve audit record;
- do not silently relabel rights as verified.

Takedown operational targets: TBD with buyer/legal.

## 8. Spatial regression

A code/content update must not preserve field-verified status if the release authority says evidence is no longer valid for the changed artifact/version.

Changes to exact model binary/metric authority can require re-verification.

## 9. Release management

Recommended production flow:

`change → automated quality → review → staging → acceptance smoke → production → monitor`.

Current repository quality includes:

- contract tests;
- TypeScript;
- web export;
- iOS export;
- Android export;
- browser E2E.

Physical AR evidence remains outside CI.

## 10. Backup and recovery

Production values are TBD.

Define:

- RPO;
- RTO;
- backup frequency;
- encrypted backup storage;
- restore test cadence;
- evidence/archive retention;
- provider snapshot retention;
- publication snapshot retention.

Pilot local-only analytics should not create an unnecessary central raw-event backup.

## 11. Monitoring

Target monitoring domains:

- public availability;
- error rate;
- mobile crash signals where approved;
- provider refresh success/freshness;
- asset integrity;
- publication failures;
- Studio/auth anomalies;
- storage/database health;
- secret/certificate expiry;
- backup success.

Specific tooling is deployment-dependent.

## 12. Support hours

To agree:

- business-hours support;
- 24×7 P1 option;
- event-day extended support;
- field-test on-call;
- planned maintenance windows.

Do not promise 24×7 until staffed/budgeted.

## 13. Maintenance

Include:

- dependency updates;
- iOS/Android compatibility;
- SDK/provider API changes;
- map/AR provider changes;
- OS permission changes;
- content corrections;
- rights re-review;
- model optimizations;
- security fixes.

## 14. Third-party dependencies

SLA must distinguish:

- platform-controlled service;
- city-controlled system;
- external provider.

Examples:

- MapKit;
- anchor provider;
- RUSSPASS/booking provider;
- app stores.

The platform should fail safely when dependency truth becomes stale.

## 15. Pilot operational acceptance

During pilot record at minimum:

- build/version;
- device matrix;
- outages;
- provider failures;
- content incidents;
- field interruptions;
- recovery behavior;
- unresolved blockers.

## 16. SLA economics

Annual operations cost cannot be populated until:

- hosting selected;
- support model selected;
- support hours selected;
- monitoring/security scope selected;
- provider support obligations known;
- Studio user count/workflow known.

The Investment Decision Authority therefore keeps annual operations as `null` today.

## 17. Exit / transition

Define:

- final data export;
- published package export;
- credential revocation;
- provider handoff;
- support transition period;
- source/escrow delivery if contracted;
- deletion/retention responsibilities.

## 18. Approval before production

Required sign-off roles to define:

- business/product;
- IT architecture;
- information security;
- legal/rights;
- operations/support;
- integration owner.

Pilot success alone does not automatically approve production SLA.
