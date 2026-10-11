# Moscow — Verified Travel Decision Layer

Status: **PROPOSED, documentation only**. Date: 2026-10-11. This roadmap complements existing canonical plans and does not represent shipped functionality.

## Strategic enhancements
1. P0: real-time journey execution UI with a single next action, map-led narrative, provider timestamp and offline-safe ticket wallet.
2. P0: disruption detection -> source confidence -> alternatives with real verified capacity -> explicit user acceptance -> durable receipt.
3. P1: private visited-place journal including notes/photos, source-aware visit verification, user-controlled export/delete.
4. P1: accessibility-constrained replan for wheelchair/stroller needs, weather, museum hours and transport disruptions, without invented ETAs.
5. P2: verified local provider publishing network with versioned contracts, time-bounded offers, reversible onboarding and attribution ledger.
6. P2: heritage licensing with IIIF source references, uncertainty labels, creator rights and measured field anchor quality.

## Common implementation contract
- Inspect and preserve existing domain authorities, schemas, tasks and existing roadmap before implementation. Do not build a parallel source of truth.
- Every proposal becomes a bounded PR with owner, dependency graph, acceptance criteria, CI and rollback procedure.
- For recommendations, record source, freshness, confidence, effect estimate, human approval and outcome; distinguish measured impact from hypothetical scenarios.
- Introduce issuer/verifier credentials only where independently useful; support issuance, expiry, suspension/revocation, key rotation and privacy-preserving verification.
- Apply least privilege, per-tenant access, audit retention and independent negative-path tests.
- Demand functional device/browser proof, golden-path replay, exact-SHA CI and recoverability before production admission.
- Pilot with baseline and outcome metrics; no fabricated ROI, partner agreements, customer evidence or production readiness.

## Reference standards (evaluate applicability, do not assume compliance)
- W3C Verifiable Credentials 2.0: https://www.w3.org/TR/vc-data-model-2.0/
- OpenID4VC specifications: https://openid.net/wg/digital-credentials-protocols/specifications/
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- OWASP GenAI Security Project: https://genai.owasp.org/

## Execution gate
Discovery -> architecture boundary review -> single vertical slice -> adversarial tests -> human acceptance -> measured pilot -> commercial rollout. Missing external credentials, rights, legal applicability, real-world evidence, or CI is an explicit BLOCKED state.
