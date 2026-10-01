# Field Pilot Observability — privacy-safe Sentry track

Canonical source: `docs/MOSCOW_INTEGRATION_MASTER_PLAN_2026-10-01.md` → Additional wave.

Issue: #90.

## Role

Sentry is **operational diagnostics only**. It does not create, approve or replace Romanov/Old English Court field evidence.

A Sentry event can help answer "why did the package/model/AR screen fail?" It can never answer "did the spatial placement pass?".

## Default state

Telemetry is OFF unless both conditions are true:

- `EXPO_PUBLIC_FIELD_OBSERVABILITY=1`;
- `EXPO_PUBLIC_SENTRY_DSN` is configured.

Web builds remain no-op for this field-pilot layer.

## Captured failure classes

Only bounded categories are exposed by the helper:

- destination package download/verify failure;
- model load failure;
- AR session initialization failure;
- anchor placement failure class;
- location/compass state class;
- offline cache failure;
- route-screen crash.

Allowed diagnostic tags:

- app/build version;
- package ID/version;
- scene/object ID;
- device/OS class;
- bounded error class.

## Privacy guard

The SDK is initialized with `sendDefaultPii=false` and tracing disabled.

Before any event leaves the app, the project sanitizer removes:

- user;
- request;
- breadcrumbs;
- contexts;
- extra;
- fingerprint;
- transaction;
- raw exception messages.

Attachments are removed in `beforeSend`.

Sentry 8.28 native privacy switches are also explicitly disabled:

- network breadcrumbs (iOS/Android);
- automatic/app/activity/system/component breadcrumbs;
- accessibility identifiers;
- screenshots and view hierarchy attachments;
- raw MetricKit payload.

The field helper never accepts latitude/longitude, a route trace, camera data, email, phone, name, provider token or arbitrary metadata.

Sentry project-side data scrubbing and IP-address storage settings should also be reviewed before enabling a real DSN.

## Native setup

Current dependency target: `@sentry/react-native@8.28.0`.

Metro uses Sentry's Expo config while preserving Moscow GLB/glTF/VRX/OBJ/MTL asset extensions.

The Expo config plugin is included only when `SENTRY_ORG` and `SENTRY_PROJECT` are present. Source-map/native-symbol upload remains disabled without `SENTRY_AUTH_TOKEN`.

Never expose `SENTRY_AUTH_TOKEN` through an `EXPO_PUBLIC_*` variable.

## Evidence boundary

Field Verification remains authoritative.

- telemetry event = diagnostic fact;
- field session/residual/survey/anchor package = product evidence;
- only reviewed evidence can move MOSCOW-INT-00.

No Sentry dashboard state may change a package publication or Phase 0 status automatically.
