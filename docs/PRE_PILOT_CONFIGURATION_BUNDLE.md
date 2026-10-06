# Pre-Pilot Configuration Bundle

Authority: `src/government/prePilotConfigurationBundle.ts`.

## Purpose

After real people, dates, devices and access paths are known, fill one configuration bundle instead of rebuilding the pilot plan manually.

## Generate template

```bash
npm run pilot:config-template
```

Default output:

`evidence/pre-pilot/pre-pilot-configuration.json`

The generated file is intentionally incomplete and must fail validation until real values are supplied.

## Required real values

### Owners
The bundle points to `owner-assignment.json`. Every required role must contain real person, organization and authority reference.

### Site
- real pilot site ID/name;
- site/access approval reference.

### Frozen build
- exact 40-character Git SHA;
- build artifact reference;
- controlled distribution reference.

### Field
The bundle points to the generated Romanov field-session plan, which carries:
- date;
- real device matrix;
- app build;
- survey reference;
- calibration reference.

### Visitor wave
The bundle points to the 20–50-slot supervised-study manifest.

### Provider
Store only:
- YCLIENTS company/test-company ID;
- company authority reference;
- access route reference;
- webhook permission reference.

**Never put tokens/secrets in this bundle.** Tokens remain in Render secret storage.

### Review routes
- acceptance matrix;
- security/privacy;
- legal/rights;
- operations/SLA.

### Master-plan controls
- Sensor Quality Gate must be included;
- privacy boundary must be confirmed;
- AprilTag may be `not-used` or `auxiliary-only`;
- street-level imagery may be `not-used` or `pre-field-hypothesis-only`;
- signed Destination Package must remain `deferred-phase-1`.

## Run one-shot preflight

```bash
npm run pilot:preflight-bundle -- evidence/pre-pilot/pre-pilot-configuration.json
```

Possible result:

- `NO_GO`
- `GO_FOR_CONTROLLED_PILOT`

GO only means the agreed controlled activities may start. It does not imply:

- Romanov field PASS;
- OEC repeatability PASS;
- visitor-pilot PASS;
- provider PASS;
- procurement approval;
- publication approval;
- scale approval.

## Mandatory source review

Before modifying this bundle contract review:

- `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`
- `docs/GITHUB_TECH_RADAR_AND_CITY_PRODUCT.md`
- `docs/PILOT_EXECUTION_MASTER_PLAN_TRACEABILITY.md`
