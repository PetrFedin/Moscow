# Government Pilot Delivery Manifest

## Purpose

A government-facing project cannot use one generic “readiness percentage”.

Different decisions need different evidence.

The delivery manifest answers:

- can we demonstrate the product now?
- do we have a formal introductory meeting pack?
- do we have enough formal artifacts for technical pilot approval?
- do we have a verified pilot-result pack?
- do we have a decision-ready scale/investment pack?
- do we have evidence for federal expansion?

## Stages

### 1. Demo conversation

Requires:

- CITY PILOT demo;
- pilot positioning;
- pilot acceptance backbone.

This stage can be ready before physical field proof.

Meaning:

> we can explain the product, bounded pilot and truth boundaries.

It does not mean the pilot is approved or verified.

### 2. Formal introductory meeting pack

Adds:

- pilot methodology;
- funding/scale playbook;
- executive one-pager.

Current blocker:

- executive one-pager is not yet a formal deliverable.

### 3. Technical pilot approval pack

Requires formal buyer-facing artifacts:

- executive one-pager;
- consolidated technical specification;
- architecture/integration scheme;
- security/data-flow note;
- IP/rights/handover matrix;
- operations/SLA;
- acceptance matrix.

This stage deliberately does **not** require the pilot to be already successful.

Technical approval is the permission/contract stage before execution.

### 4. Verified pilot result pack

Requires formal artifacts plus real external evidence:

- Romanov physical field proof;
- Old English Court independent repeatability;
- reviewed Varvarka visitor pilot;
- formal live/provider integration authority;
- final report template;
- measured cost/scale framework.

### 5. Scale / investment decision pack

Requires:

- complete proof;
- governance review;
- measured economics;
- final report;
- investment/scale decision authority.

The system can declare the **pack** decision-ready.

It does not declare the investment decision itself.

### 6. Federal expansion proposal

Requires:

- Moscow scale/investment decision pack ready;
- first external region genuinely verified;
- federal-grade architecture/security/IP/operations artifacts.

This blocks a Moscow-only prototype from being marketed as a proven federal platform.

## Formal artifacts

Current manifest tracks:

- CITY PILOT demo;
- pilot positioning;
- pilot methodology;
- pilot acceptance;
- funding/scale playbook;
- investment decision authority;
- executive one-pager;
- 10–12 slide decision deck;
- technical specification;
- architecture/integration;
- security/data-flow;
- IP/rights/handover;
- operations/SLA;
- cost/scale model;
- final pilot report template.

Artifact status is:

- `ready`;
- `draft`;
- `missing`.

A `ready` artifact must have at least one inspectable repository reference.

## External evidence remains separate

Document completion never sets these to true:

- Romanov field verification;
- Old English Court repeatability;
- visitor-pilot review;
- live provider agreement;
- first external region proof.

Those states come only from their own evidence authorities.

## CLI

Current state can be inspected with:

```bash
npm run government:readiness
```

The command outputs:

- artifact counts;
- artifact status/refs;
- external evidence state;
- investment decision readiness;
- readiness and blockers for every government delivery stage.

## Current expected state

The current project should report approximately:

- demo conversation — ready;
- formal intro pack — blocked;
- technical pilot approval — blocked;
- verified pilot report — blocked;
- scale/investment decision — blocked;
- federal expansion — blocked.

That is a desirable state before the real pilot.

It means the demo/productization layer is useful without falsifying external proof.
