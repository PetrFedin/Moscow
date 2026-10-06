# Pre-Pilot External Input Request Pack

Authority: `src/government/prePilotExternalInput.ts`.

## Purpose

Send one bounded request pack to the external participants needed for pilot activation.

This pack asks for **owners, authority refs and approved routes**. It does **not** ask anyone to paste provider secrets into documents or email.

## Required responses

### Moscow
- accountable business/problem owner;
- organization;
- authority/mandate reference.

### Pilot site
- confirmed Varvarka/Zaryadye site;
- physical-access owner;
- permission/access reference;
- operating window or scheduling route.

### Integration/data
- accountable integration/data owner;
- authority reference;
- integration review route.

### Security/privacy
- reviewer;
- organization;
- review route;
- decision or scheduled-review reference.

### Legal/rights
- reviewer;
- organization;
- review route;
- rights/IP/legal-form decision or scheduled-review reference.

### Operations/SLA
- responsible owner;
- service/incident/escalation review route.

### YCLIENTS
Non-secret response:
- company/test-company ID;
- authorizing owner;
- authority reference;
- controlled-record/webhook permission reference.

Secret response:
- credentials must be transferred only through an approved secure secret-delivery route for Render;
- credentials must never be written into this manifest, email body, issue, PR, chat, screenshot, or repository file.

## Generate request template

```bash
npm run pilot:external-input-template
```

Default output:

`evidence/pre-pilot/external-input-request.json`

Every item starts as:

`status = awaiting`

## Completion rule

An item may become `received` only with:

- responseRef;
- responderName;
- responderOrganization;
- authorityRef.

The overall request pack is complete only when all required items are received and none are rejected.

## Relation to GO/NO-GO

External input completion alone does **not** create pilot GO.

It only supplies the real references needed to fill:

- Owner Assignment Manifest;
- Pre-Pilot Configuration Bundle;
- provider access path;
- governance review routes.

Then the canonical preflight still runs:

`npm run pilot:preflight-bundle -- <bundle.json>`

## Mandatory source review

Before changing this request pack review:

- `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`
- `docs/GITHUB_TECH_RADAR_AND_CITY_PRODUCT.md`
- `docs/PILOT_EXECUTION_MASTER_PLAN_TRACEABILITY.md`
