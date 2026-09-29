# Government meeting deep links

## Purpose

A government or investor recipient should not need to navigate through the tourist home screen to find the CITY PILOT layer.

The web build supports explicit meeting entry modes while leaving the normal tourist URL unchanged.

## Links

Normal tourist product:

```text
https://<host>/
```

Open the Government / Investor guided route immediately:

```text
https://<host>/?cityPilot=guided
```

Open the Government package / Partner Investor Data Room immediately:

```text
https://<host>/?cityPilot=package
```

Open Moscow Pilot Application Readiness immediately:

```text
https://<host>/?cityPilot=application
```

Open the CITY PILOT overview:

```text
https://<host>/?cityPilot=overview
```

## Truth boundary

The query parameter changes only the presentation entry point.

It does not:

- change pilot readiness;
- unlock blocked evidence;
- change Funding Path stages;
- mark buyer approval;
- mark investment readiness;
- change any spatial or provider authority.

All readiness shown inside the linked experience continues to come from the same underlying government/spatial/investment authorities.

## Usage

Recommended first-meeting link:

`?cityPilot=guided`

Recommended follow-up / pre-read link:

`?cityPilot=package`

Recommended application working-session link:

`?cityPilot=application`

The recipient can still close CITY PILOT and return to the normal consumer experience.
