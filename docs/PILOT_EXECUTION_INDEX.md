# Moscow Pilot Execution Pack

Статус: **PRE-PILOT · execution pack ready for owner assignment**

Этот индекс связывает feature-frozen Investor MVP с реальным пилотом. Он не создаёт field/provider/legal evidence и не переводит readiness gates в PASS.

## Порядок исполнения

1. `docs/PILOT_RACI.md` — назначить владельцев.
2. `docs/FIELD_DAY_PACK.md` — Romanov + Old English Court field proof.
3. `docs/VISITOR_PILOT_PACK.md` — 20–50 supervised sessions.
4. `docs/PROVIDER_ACTIVATION_PACK.md` — YCLIENTS / provider activation.
5. `docs/MEASURED_ECONOMICS_CAPTURE.md` — семь measured inputs.
6. `docs/GOVERNMENT_MEETING_ASK.md` — решение, которое требуется от Москвы.

## Mandatory source review

Before every pilot-readiness wave review:

- `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`
- `docs/GITHUB_TECH_RADAR_AND_CITY_PRODUCT.md`
- `docs/PILOT_EXECUTION_MASTER_PLAN_TRACEABILITY.md`

## Commands

- `npm run pilot:owners-template -- [out.json]`
- `npm run pilot:field-plan -- <config.json> [out.json]`
- `npm run pilot:visitor-wave -- <studyId> <contentVersion> <20..50> [out.json]`
- `npm run pilot:init-evidence -- <pilot-run-id>`
- `npm run pilot:config-template -- [out.json]`
- `npm run pilot:preflight-bundle -- <bundle.json>`
- `npm run pilot:preflight -- <config.json>`
- `npm run pilot:readiness-dossier -- --text`
- `npm run pilot:economics-validate -- <capture.json>`
- `npm run pilot:dry-run`
- `npm run pilot:evidence-inventory -- <pilot-run-id>`

## Pre-Pilot Configuration Bundle

Canonical workflow:

`owners-template → field-plan → visitor-wave → config-template → fill real refs → preflight-bundle`

Runbook: `docs/PRE_PILOT_CONFIGURATION_BUNDLE.md`.

External handoff request: `docs/PRE_PILOT_EXTERNAL_INPUT_REQUEST.md`.

## Internal execution validation

- Synthetic pipeline rehearsal: `docs/PRE_PILOT_DRY_RUN.md`
- Real evidence file integrity: `docs/EVIDENCE_HASH_INVENTORY.md`

Neither artifact upgrades field/provider/user readiness.

## Authority

Machine-readable execution authority:

- `src/government/pilotExecutionPack.ts`
- `src/government/pilotReadinessDossier.ts`
- `src/government/measuredEconomicsCapture.ts`

Existing proof authorities remain canonical:

- `src/spatial/integrationMasterPlanGate.ts`
- `src/spatial/fieldVerification.ts`
- `src/integrations/providerProofGate.ts`
- `src/government/pilotInvestmentDecision.ts`

## Critical path

`owners → site/access → Romanov field proof → OEC repeatability → visitor pilot → provider PASS → governance reviews → measured economics → final acceptance → human scale decision`

## Non-negotiable truth boundary

- preparation ≠ evidence;
- credential configured ≠ provider PASS;
- demo ≠ field proof;
- unspent ≠ available capital;
- modeled cost ≠ measured cost;
- pilot completion ≠ automatic scale approval.
