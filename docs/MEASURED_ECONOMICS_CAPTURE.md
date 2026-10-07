# Measured Economics Capture — Varvarka Pilot

## Rule

No market estimate, sales assumption or “reasonable number” may be inserted as measured economics.

Every value requires:

- measured numeric value;
- basis;
- evidence reference.

Authority: `src/government/measuredEconomicsCapture.ts`.

Validation command:

`npm run pilot:economics-validate -- <capture.json>`

The command exits non-zero until the capture is complete.

## Seven mandatory inputs

1. Next verified object variable cost — RUB
2. Next verified object production time — days
3. Developer hours / object
4. Institution/operator hours / object
5. District shared setup cost — RUB
6. District integration cost — RUB
7. Annual operations cost — RUB

Scale economics remain blocked until **7/7** are complete.

## Capture discipline

### Cost
Record only actual included costs according to a frozen allocation policy.

Separate:

- object-specific production;
- shared district setup;
- integration;
- recurring operations.

Do not double-count shared work in object variable cost.

### Time
Define start/end events before work begins.

Example:
- start = approved production brief;
- end = accepted verified object package.

Do not silently remove waiting/review time. If elapsed time and active labour time differ, record both in underlying evidence and keep the authority metric definition explicit.

### Labour
Engineering and institution/operator hours must be supported by a work log, timesheet or equivalent evidence.

## Suggested evidence folder

`evidence/economics/<pilot-id>/`

Suggested source records:

- supplier invoices / approved internal cost records;
- time logs;
- work-package records;
- integration invoices/hours;
- hosting/monitoring/support basis;
- reconciliation note.

## Final use

Only a complete capture can populate `PilotInvestmentEvidence.economics`.

Then the district arithmetic may be calculated as:

`shared setup + integration + N × measured verified-object variable cost`

This is still **not** automatically a procurement price, ROI or funding commitment.
