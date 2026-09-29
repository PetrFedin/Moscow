# Pilot Outcome Authority v1

## Purpose

The technical proof answers whether the technology works. The investment model answers what measured scaling inputs cost. Pilot Outcome Authority answers a separate question: **what was actually observed in the visitor journey**.

It accepts only reviewed output from the supervised Varvarka pilot and publishes no outcome percentage before evidence exists.

## Metrics

All v1 metrics are descriptive observer-note ratios:

- route completion;
- participant independently asked what comes next;
- voluntary AR use;
- post-walk continuation signal: map, saved or repeat.

Each ratio is `numerator / receivedObserverNotes`. The UI preserves numerator and denominator.

## Fail closed

Status remains `awaiting-field-evidence` until there is a final PilotStudyReport, first-review completeness, 20–50 slots, an observer note for every slot, an evidence reference, and `representativeSurvey=false`.

No demo value is substituted.

## Interpretation guardrails

The supervised pilot is not a representative survey of Moscow tourists, does not establish causal impact, and must not be extrapolated automatically to citywide tourism.

## Next extension

After formal Live Destination provider access, add a separate evidence family for heritage-to-food/event continuation, booking handoff, successful provider open and freshness failures. These metrics must also remain fail-closed until real provider evidence exists.
