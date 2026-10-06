# Provider Activation Pack — YCLIENTS

## Goal

Produce the first **real provider PASS**. Mock/synthetic receipts are prohibited.

## Required authorised access

From the provider/company owner:

- `YCLIENTS_PARTNER_TOKEN`
- `YCLIENTS_USER_TOKEN`
- `YCLIENTS_COMPANY_ID`
- permission to use a company/test company for one controlled record;
- permission/configuration for a real webhook event.

Receiver secrets:

- `YCLIENTS_WEBHOOK_PATH_TOKEN`
- `YCLIENTS_EVIDENCE_RETRIEVAL_TOKEN`

Optional controlled evidence capture:

- `YCLIENTS_CAPTURE_TEST_PAYLOAD=1`

Secrets belong in Render environment configuration, never in git.

## Activation order

1. Bind Render secrets.
2. Confirm `GET /ready` reports:
   - `receiverReady=true`
   - `providerSecretsReady=true`
3. Perform one authorised real API call.
4. Archive exact raw response.
5. Compute/store SHA-256.
6. Build and validate real-provider admission.
7. Create one controlled record.
8. Receive real webhook at `/webhooks/yclients/<token>`.
9. Retrieve one-shot evidence immediately.
10. Archive it outside the ephemeral receiver buffer.
11. Observe provider state change.
12. Trigger Journey Runtime `replan-required`.
13. Produce verified replacement route and continuation.
14. Obtain terminal provider receipt.
15. Build Journey Evidence Pack.
16. Run provider proof gate.

Machine-readable check:

`npm run provider:proof-status`

## Critical receiver limitation

Current receiver declares:

`evidenceBuffer = ephemeral-one-shot`

and:

`immutableArchiveReady = false`

Therefore evidence must be externally archived immediately after retrieval. A webhook that was received but not durably archived is not enough for the final evidence chain.

## PASS definition

PASS exists only when:

- admission passed;
- real evidence run passed;
- Journey Evidence Pack integrity passed;
- provider IDs/authority match;
- no blockers remain.

Runtime credentials alone do **not** equal PASS.

Evidence Signing Authority remains locked until this PASS exists.
