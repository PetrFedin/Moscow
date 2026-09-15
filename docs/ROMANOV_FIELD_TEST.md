# Romanov Chambers — AR field verification protocol

## Goal

Turn on-site alignment from a subjective visual check into repeatable measurements that can be shown in a pilot report.

This protocol validates the **Moscow implementation**, not the generic accuracy of ARKit, ARCore, ViroReact or any external SDK.

## Test distances

Run the same verification at approximately:

- 5 m;
- 10 m;
- 15 m.

The approved viewpoint and safe standing position must be recorded during the survey.

## Control points

Five stable facade candidates are defined in `src/spatial/romanovControlPoints.ts`:

1. left corner of the main masonry volume;
2. right corner of the main masonry volume;
3. stable facade window opening;
4. plinth / undercroft reference line;
5. stable roof reference edge.

All remain `pending-survey` until the exact physical feature and model coordinate are measured and verified.

## Procedure

For each supported device and each test distance:

1. open the Romanov AR scene;
2. select a spatial era;
3. align the model using X / Y / Z / yaw / scale;
4. save the calibration profile;
5. visually compare each of the five verified control points against the real facade;
6. enter the residual error in centimetres;
7. save the session;
8. export the TSV report;
9. repeat after restarting the app to test persistence;
10. repeat from a fresh launch without re-tuning to measure repeatability.

## Internal P0 quality gate

The current internal pilot target is:

- mean residual error <= 35 cm;
- maximum residual error <= 60 cm;
- measurements entered for all five points.

These values are product acceptance targets and may be tightened or revised after the first real survey. They must never be presented as a guarantee of the underlying AR platform.

## Devices

Minimum field matrix before claiming field verification:

- more than one supported iPhone / iOS device;
- more than one supported Android / ARCore device;
- daylight test;
- a second lighting/weather condition if practical.

Quest is validated separately for VR experience quality; it is not part of the facade alignment acceptance gate.

## Output

Every saved session contains:

- timestamp;
- selected era;
- device platform/version;
- viewing distance;
- calibration profile;
- residual for every control point;
- mean residual;
- maximum residual;
- pass/recalibrate result.

The mobile field panel stores the session locally and can export it as TSV for the pilot report.

## Advancement rule

`production-candidate` becomes `field-verified` only after:

- measured facade geometry replaces unresolved scale assumptions;
- exact control points are selected and stored;
- the field matrix is completed;
- repeatability is demonstrated;
- historical expert review accepts all public-visible geometry classifications.
