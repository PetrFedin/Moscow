# Tourist analytics authority

Status: **local-only pilot analytics; no third-party analytics transport and no persistent user identity**.

## Why this exists

Moscow uses the same evidence discipline for product analytics that it uses for spatial claims.

A screen impression is not a physical visit. A manual “next” action is not proof that the tourist reached the facade. Opening AR is not proof that alignment was field-verified.

The event model therefore keeps those facts separate.

## Collection mode

Current authority is:

`local-only`

Events are stored in a bounded AsyncStorage outbox on the device for pilot QA. There is no analytics SDK, upload endpoint, advertising identifier, cross-app identifier or user account attached to this layer.

Any future remote transport must be a separate bounded change with an explicit privacy/consent decision. It must not silently reinterpret this local outbox as permission to upload.

## Privacy boundary

Analytics events may contain:

- event name and schema/content version;
- ephemeral session id;
- event timestamp;
- route id;
- place id;
- language;
- route time budget and interest;
- route step/count;
- audio mode;
- evidence category such as `foreground-proximity`;
- manual vs audio-auto completion mode.

Analytics events must not contain:

- latitude or longitude;
- coordinates or geohash;
- exact distance to a stop;
- stored GPS history;
- location accuracy;
- name, email or phone;
- user id;
- device id;
- advertising id / IDFA / GAID;
- IP address.

The privacy contract is executable: forbidden keys fail the contract tests.

## Evidence semantics

### `stop_presented`

The current walk stop became visible in the route UI.

It does **not** mean the tourist reached the place.

### `stop_arrive`

The native foreground location watcher observed that the tourist crossed the existing 55 m trigger radius.

The stored event records only:

`arrivalEvidence = foreground-proximity`

The coordinate and measured distance are discarded and never enter analytics.

### `stop_complete`

The route step was completed.

The event distinguishes:

- `manual` — the tourist pressed the route completion button;
- `audio-auto` — foreground proximity triggered narration and the narration completed successfully.

Neither mode is silently rewritten as physical arrival.

### `audio_start` / `audio_complete`

The audio mode is recorded as either:

- `recorded`;
- `tts-fallback`.

The mode comes from the playback runtime, so a master that fails and falls back to TTS is not reported as a completed recorded master.

### `ar_open`

The spatial experience was opened.

There is intentionally **no** `ar_verified` product event yet. Field verification belongs to the spatial evidence pipeline and must not be inferred from a UI open.

## Current funnel

The current schema supports:

`app_open → discover_view → nearby_open / route_preview → route_start / route_resume → stop_presented → stop_arrive → audio_start → audio_complete → transcript_open → mission_complete → time_machine_open → archive_open → model_open → ar_open → stop_complete → route_complete`

Not every tourist is expected to produce every event.

## Retention

The local outbox is capped at 400 newest records.

A new app runtime creates a new ephemeral session id. There is no persistent visitor id connecting sessions into a person-level profile.

## Next step

After real pilot use proves the event semantics, a separate analytics transport can be evaluated. Before enabling upload, define:

1. lawful/consented collection mode for the target deployment;
2. retention period;
3. operator/controller responsibilities;
4. data processing location/provider;
5. aggregate reporting requirements;
6. deletion/reset behavior;
7. a strict allowlist matching this schema.

Until that decision exists, local-only remains the production authority.
