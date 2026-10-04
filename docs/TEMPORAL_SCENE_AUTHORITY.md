# Temporal Scene Authority

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Additional wave — Temporal Scene Model.

Issue: #98.

## Purpose

Time Machine UI must not decide historical truth.

The Temporal Scene Authority binds a historical state to:

- a precise temporal extent type;
- source evidence;
- claims/evidence elements;
- model/media assets;
- reconstruction status;
- confidence state;
- publication state.

The UI consumes this authority. Slider positions are only navigation.

## Temporal extent types

### exact-date

Use only when year, month and day are all supported.

### exact-year

Use when the evidence supports a specific year but not a specific day.

### bounded-range

A known continuous interval with explicit start/end bounds.

### approximate-range

An interval whose bounds are approximate and must remain labelled as such.

### reference-points

A set of non-contiguous evidence/reference years.

This is important for the current Romanov restoration research state: the product already references `1859 / 1883`. The authority therefore stores `[1859, 1883]` as reference points instead of silently converting it to a continuous `1859–1883` range.

### undated

Use when a temporal state is source-backed but cannot honestly be assigned a usable date/range.

## Confidence

`not-assessed` is a valid and intentional state.

Moscow must not manufacture high/medium/low confidence scores merely because a scene exists. A later research/review workflow can assign confidence with evidence.

## Reconstruction status

- `documented`;
- `reconstructed`;
- `hypothesis`;
- `mixed`.

`mixed` is required when one user-visible state includes both documented and reconstructed elements.

## Evidence binding

Every active scene must bind to repository/package authority:

- source IDs;
- claim IDs;
- evidence-element IDs;
- asset IDs;
- optional experience-period IDs.

Missing references fail validation.

## Overlap rule

Two active scenes for the same place may overlap only when they are an explicit alternative interpretation:

- both carry the same `alternativeGroupId`;
- their `interpretationMode` differs.

Silent overlapping truth states fail closed.

## Publication boundary

Temporal records currently use only:

- `draft`;
- `production-candidate`;
- `superseded`.

They cannot self-declare `field-verified`. Physical field verification remains derived exclusively by the existing spatial survey/session/calibration/persistent-anchor release gate.

## Supersession

A temporal record can declare `supersedes`, but superseded records should be marked `superseded` before a replacement becomes the only active authority.

This contract does not delete historical interpretations; it makes revision explicit.

## Romanov Phase 1

Current repository truth is normalized without adding new dates:

1. `romanov-pre-restoration-1857`
   - exact year 1857;
   - existing `romanov-1857` experience period;
   - existing 1857 model variants;
   - source/claim/element bindings derived from the current published candidate.

2. `romanov-restoration-reference-state`
   - reference points 1859 and 1883;
   - existing `romanov-1883` experience period;
   - existing runtime era `1859`;
   - current documented + public-research model variants;
   - reconstruction status resolves to `mixed`.

No continuous `1859–1883` historical state is asserted.

## Runtime binding

`placeExperienceRegistry.ts` no longer owns a separate Romanov `modelEraMap`.

For Romanov:

`Time Machine index → Temporal Scene Authority → runtimeEraId → model runtime`.

This removes duplicate temporal authority while preserving the existing runtime mapping:

- index 0 → 1857;
- indexes 1/2 → current restoration research state → runtime era 1859.

## Evidence boundary

Temporal normalization does not:

- mark a scene field-verified;
- complete MOSCOW-INT-00;
- create missing historical evidence;
- authorize new assets;
- resolve source-rights review;
- change provider/YCLIENTS proof.

It only makes the existing temporal claims machine-verifiable and fail-closed.
