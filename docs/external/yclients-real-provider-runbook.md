# YCLIENTS real-provider admission runbook

## Goal

Execute the first non-demo #74 proof against an authorized YCLIENTS company or test company.

## Secret storage

Configure only in deployment secret storage:

- `YCLIENTS_PARTNER_TOKEN`
- `YCLIENTS_USER_TOKEN`
- `YCLIENTS_COMPANY_ID`
- `YCLIENTS_WEBHOOK_PATH_TOKEN`
- `YCLIENTS_EVIDENCE_RETRIEVAL_TOKEN`

The repository must never contain real token values.

YCLIENTS documents partner authorization as `Authorization: Bearer <partner token>`; methods requiring user authorization additionally use `User <user token>`.

## Receiver

Start:

`npm run provider:yclients-receiver`

Endpoints:

- `GET /health` — process liveness.
- `GET /ready` — reports whether receiver secrets and provider credentials are configured, without returning secret values.
- `POST /webhooks/yclients/<YCLIENTS_WEBHOOK_PATH_TOKEN>` — receives YCLIENTS `record` webhooks, normalizes provider receipt evidence and calculates SHA-256 over the exact HTTP body.
- `GET /evidence/yclients/<YCLIENTS_EVIDENCE_RETRIEVAL_TOKEN>` — one-time retrieval of the latest buffered evidence; retrieving clears the buffer.

The receiver buffer is deliberately ephemeral. It is not the immutable archive.

## Raw test payload rule

`YCLIENTS_CAPTURE_TEST_PAYLOAD=1` is allowed only for an authorized test company and a synthetic test record containing no real customer personal data.

With the flag disabled the receiver retains only the payload checksum and normalized receipt.

## #74 execution sequence

1. Confirm `/health`.
2. Confirm `/ready`; provider credentials may remain false until issued.
3. Register the webhook URL in the authorized YCLIENTS application/company.
4. Make the first authorized API call and archive the raw response immediately.
5. Calculate SHA-256 over exact raw bytes.
6. Record capability discovery and schema mapping evidence.
7. Create the controlled test booking.
8. Capture the provider webhook and payload SHA-256.
9. Change/cancel/reschedule the record so provider state changes.
10. Feed that external change into Journey Runtime and force `replan-required`.
11. Produce a verified replacement route.
12. Resume/complete the journey.
13. Retrieve the one-shot webhook evidence and archive it immediately.
14. Build Journey Evidence Pack and #74 immutable archive manifest.
15. PASS only if all validators pass.

## Current status

Software receiver and adapter can be deployed before YCLIENTS credentials exist. PASS #74 remains blocked until a real authorized API/feed event and provider receipt are captured.
