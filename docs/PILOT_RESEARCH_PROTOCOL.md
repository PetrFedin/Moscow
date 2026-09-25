# Supervised tourist pilot — Varvarka

## Purpose

The next product proof is not another feature. It is evidence that ordinary visitors can complete the Varvarka walk without developer guidance and find the experience worth continuing.

This protocol uses the app's existing local-only analytics. It does not introduce remote tracking, persistent visitor identity or GPS history.

## Target sample

Run the first supervised pilot with approximately **20–50 ordinary participants**.

This is a usability/product pilot, not a statistically representative survey of all Moscow visitors. The report must therefore describe the observed sample and must not generalize beyond it.

Keep recruitment records, consent and any demographic research notes outside the application analytics. Do not join those records to the app's local session IDs.

## What the tester does

1. Receives the mobile build.
2. Opens the app without a walkthrough of the interface.
3. Chooses or starts the Varvarka walk naturally.
4. Uses location permission or manual progression according to personal preference.
5. Completes as much of the walk as they want.
6. May use audio, transcript, Time Machine, archive, 3D or AR where available.
7. At the end of the session opens **My Moscow → Pilot · this device only**.
8. Taps **Share report** and sends the aggregate JSON to the study operator.

The operator should not request screenshots of raw AsyncStorage or other developer data.

## What one exported report means

One export is a snapshot of one device's bounded local outbox.

It may contain several ephemeral app sessions.

Therefore:

- sessionCount means local app sessions, not people;
- a report is not automatically one unique person;
- reports cannot be linked across devices or reinstalls through analytics;
- if outboxAtCapacity = true, early events may have been evicted and the report is potentially incomplete.

For a controlled one-participant/one-device pilot, the study roster can record that a participant submitted one report, but the app analytics itself must not carry participant identity.

## Cohort aggregation

Store the received aggregate JSON files in a study folder and run:

    npm run pilot:cohort -- report-01.json report-02.json report-03.json --out cohort.json

The CLI:

- validates every input as an aggregate-only pilot report;
- rejects forbidden raw analytics identifiers;
- skips exact duplicate reports;
- reports the duplicate count;
- sums event/session counts;
- recomputes conversion rates from the combined numerator and denominator;
- reports mixed content versions;
- reports how many source reports were at the 400-event capacity limit;
- never attempts cross-report identity matching.

The output is suitable for product review, not for identifying participants.

## Core product funnel

Use the mandatory route actions as the main funnel:

app open → route start → first stop complete → route complete → recap → continue

Physical proximity is deliberately **not** a mandatory funnel step because a visitor can deny location permission or progress manually.

## Supporting engagement evidence

Review separately:

- foreground-proximity arrival sessions;
- audio starts and completes;
- recorded-human vs TTS fallback;
- transcript opens;
- observation missions;
- Time Machine opens;
- archive opens;
- 3D opens;
- AR opens;
- post-walk destination: map / My Moscow / repeat;
- per-place presentation, completion and engagement.

AR open is not evidence of spatial verification.

## Qualitative observation sheet

Analytics alone cannot explain friction. During supervised sessions, the observer should record without coaching:

- where the participant hesitated;
- where the participant asked what to do next;
- whether they understood the route direction;
- whether they noticed the audio control;
- whether they kept the phone in hand or pocket;
- whether the historical state / evidence distinction was understandable;
- whether they tried archive / 3D / AR voluntarily;
- why they stopped early, if they stopped;
- what they wanted to do after finishing;
- any outdoor readability, noise, battery or connectivity issue.

Do not change the interface during a participant's session.

## Interpretation rules

Do not create a success threshold before seeing the first pilot evidence.

First report:

- observed counts and conversion rates;
- completion by route origin / time budget / interest / language;
- biggest stop-to-stop drop-offs;
- engagement modes actually used;
- differences between physical-proximity and manual completion;
- share of recorded audio only after real human masters exist;
- post-walk continuation behavior;
- recurring qualitative friction.

Then define the next product change from repeated evidence, not from one anecdote.

## What this pilot does not prove

This pilot does not prove:

- Romanov spatial accuracy;
- survey validity;
- persistent-anchor repeatability;
- Quest/VR readiness;
- Old English Court spatial readiness;
- market-size or citywide retention;
- causal impact of individual features.

Those require their own evidence streams.

## Exit from first pilot

The first pilot is complete when:

1. the planned participant sessions are finished;
2. aggregate reports are collected or explicitly marked missing;
3. duplicate/truncated/mixed-version caveats are recorded;
4. the cohort JSON is generated;
5. qualitative observations are synthesized;
6. the team can name the main journey breakpoints using evidence;
7. the next bounded product changes are selected.

The aim is a reliable answer to: **can an ordinary visitor complete and understand this walk without us standing beside them?**
