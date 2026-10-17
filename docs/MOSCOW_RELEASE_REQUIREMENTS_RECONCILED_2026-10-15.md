# Moscow — reconciled release gate, 2026-10-15

Status: DRAFT / HOLD. This document consolidates the requirements that were isolated in PRs #154, #155 and #156 into the current cumulative development branch. It does not mark them as implemented or released.

## Mandatory distinction
IN_CODE means code exists; CI_PASS means exact-head automated gates passed; LIVE_VERIFIED means the deployed SHA and browser behavior match; FIELD_VERIFIED requires physical evidence; PROVIDER_VERIFIED requires authenticated supplier evidence. No status is inferred from another.

## Consolidated P0 release requirements
1. Tourist-first Today and Discover must be visually accepted on 375/768/1440; legible cards, next step, correct fixed ticket, interruption and replacement prompt must remain visible. Heritage/institutional diagnostics should not overwhelm the visitor.
2. Booking integrity: no silent movement of confirmed, held, cancelled or manually entered supplier commitments; acceptance receipts must survive reload with source, timestamp, before/after and rationale.
3. Durable travel memory: note/check-in/journal/backup/erase operations must prove recovery from failed writes, restart and stale concurrent edits; never claim cross-device sync from local storage.
4. Imported .ics must be validated before use and durably saved **before** the UI clears raw content. Failures retain user input, do not fabricate supplier proof and disclose recovery blocker.
5. Run real external HTTP read-only checks on the exact staging SHA, verify /health, /ready and static app route, and record release/rollback; only after independent review consider main.
6. Mobile-native physical iOS/Android crash, offline, storage-full and accessibility acceptance remain OPEN. CI-export of native code is not installed-device proof.
7. Keep field spatial Phase-0, real YCLIENTS booking/refund evidence and content/media rights independent release gates. No fake pass by demo fixture.

## P1/P2 retained rather than silently dropped
- Visit Passport: optional opt-in photos and deletion/export with source/rights/retention; notes remain private by default.
- City directory: expand beyond seven sourced records after address/entrance/rights/language/provenance audit, then map and supplier handoffs with real freshness.
- Tour disruption: no fabricated transport travel times or supplier state transitions.
- Visitor/partner network: onboarding, consented referrals, actual attribution and payout audit; city analytics aggregate only, never covert user tracking.
- Spatial experience: historical attribution, 3D evidence gates and physical pilot before scale.
- Multi-city DAYTERA remains proposal; trademark and external city qualification pending.

## Zero-additional-cost boundary (PR #156)
No new paid infrastructure, pay-as-you-go API, automated upgrades, billing-bearing CI/AI/media/maps/storage, actual transactions or messaging. Verify available free quota explicitly; when unconfirmed, use BLOCKED_NO_FREE_CAPACITY. Do not alter secrets, databases, other products or production/main as part of draft work.

## Release proof snapshot
- Latest parent Draft PR #185 exact-head `b191527159ae2d07168777a7efbb716e0650743a`: [CI 38753671351](https://github.com/PetrFedin/Moscow/actions/runs/38753671351) green 610 contract / 44 browser / 3 visual, NOT a deployed acceptance.
- Public Render preview at audit: deployed `840248491bb67f9e5f8b6f0c11e88a2ff5fd9dcb`, GitHub main `13d8fbc76ba11e6912be7489c7be24ff66c6409d`. Both predate the draft chain; see [issue #186](https://github.com/PetrFedin/Moscow/issues/186).
- PR #154 [institutional strategy](https://github.com/PetrFedin/Moscow/pull/154), #155 [completion plan](https://github.com/PetrFedin/Moscow/pull/155), #156 [zero-cost rules](https://github.com/PetrFedin/Moscow/pull/156) were independent documentation branches. Requirements are summarized here, not presented as a merge or proof.
- Canonical engineering authority remains `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md`; source documents remain reviewable on their original PRs.

## Release steps
P0: green exact-head CI; inspect CI screenshots; independent review; controlled staging SHA; real browser end-to-end including retry/reload and screenshots; native device survival; supplier field gates explicitly blocked or proved; rollback. No publishing without approval.
