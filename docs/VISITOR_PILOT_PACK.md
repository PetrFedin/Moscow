# Visitor Pilot Pack — 20–50 supervised sessions

## Purpose

Answer one bounded question:

**Can an ordinary visitor understand and complete the Varvarka route without developer coaching?**

This is a usability/product pilot, not a representative survey of Moscow tourists.

## Sample

- Minimum planned slots: **20**
- Maximum planned slots: **50**
- Non-identifying slot IDs: `P001…P050`
- Route: `varvarka-zaryadye-pilot`

## Session sequence

1. Participant receives the approved mobile build.
2. No interface coaching.
3. Participant starts the route naturally.
4. Location/manual progression is chosen by the participant.
5. Observer records structured friction without intervention.
6. Participant completes as much of the route as desired.
7. At end: `My Moscow → Pilot · this device only → Share report`.
8. Aggregate JSON is delivered to study operator.
9. Observer note is stored separately by slot ID.

## Observer fields

Record:

- hesitation: none / minor / major;
- asked what next;
- route direction understood;
- audio control noticed;
- phone use: pocket / mixed / hand;
- evidence distinction understood;
- voluntary features used;
- early stop + reason;
- post-walk intent;
- readability / noise / battery / connectivity / location / navigation / performance issue.

No coaching during the session.

## Privacy / consent boundary

Do not put into app analytics:

- names;
- phone/email;
- booking IDs;
- device IDs;
- GPS history;
- recruitment records;
- consent records.

Recruitment/consent records remain outside analytics and are not joined to app session IDs.

## First-review completeness

The study is complete for first review only when:

- 20–50 slots exist;
- every planned slot has an observer note;
- every aggregate report is either received or explicitly marked missing;
- manifest validates;
- final study report is generated.

Command:

`npm run pilot:study -- <study-manifest.json> --out <final-study-report.json>`

## Output

Final report includes aggregate funnel and qualitative counts only.

Core funnel:

`app open → route start → first stop complete → route complete → recap → continue`

Do not claim:

- representative demand;
- citywide retention;
- causal impact;
- Romanov spatial accuracy;
- OEC repeatability;
- federal product-market fit.
