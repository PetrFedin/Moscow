# Romanov Chambers — production candidate v1

## Purpose

This package is the first evidence-aware 3D reconstruction used by Moscow Spatial MVP. It is a **production candidate**, not a field-certified or final museum reconstruction.

Two spatial states are generated:

- `1857` — pre-restoration state;
- `1859/1883` — Richter restoration state, cross-checked against early post-restoration photography.

Both are stored in metric world units and are designed for the same AR calibration profile.

## Evidence policy

Every generated node name starts with an evidence class:

- `documented__` — form is directly visible in archival/current evidence or supported by official museum/restoration documentation;
- `reconstructed__` — research reconstruction based on the documented restoration and early post-restoration imagery, with exact dimensions still provisional;
- `hypothesis__` — temporary massing pending survey. Hypothesis geometry must not be presented to the public as historical fact.

The model intentionally does **not** hide uncertainty.

## Primary source pack

### State before restoration

1. State Historical Museum: history of the Romanov Chambers and the Richter restoration programme.
   - https://shm.ru/kollektsii-i-muzeynyy-kompleks/museum_history/palaty-romanovykh/history/
2. 1857 image of the chambers before restoration.
   - https://commons.wikimedia.org/wiki/File:Палаты_бояр_Романовых._1857.jpg

### Richter restoration / early restored state

3. State Historical Museum catalogue: architectural graphic, 1859.
   - https://catalog.shm.ru/entity/OBJECT/6323005
4. Early photographic record used as a visual control for the reconstructed state.
   - https://commons.wikimedia.org/wiki/File:N.A.Naidenov_(1884)._Views_of_Moscow._46._Varvarka.png

### Architectural and archaeological control

5. Official Moscow architectural/archaeological documentation for the Romanov Chambers site.
   - https://www.mos.ru/upload/documents/files/614/Romanovperd2_6str3.pdf
6. Official Moscow material containing plan information for the monument.
   - https://www.mos.ru/upload/documents/files/8873/25082020_16-31-570_20_Emelyanov_AA_Rojdestvenskaya_SA.pdf

## Current geometry status

### 1857

- main masonry volume — documented;
- street-facade rhythm — documented at research level, exact spacing still subject to measured drawing/field control;
- pre-restoration roof silhouette — documented at research level;
- side/service mass — hypothesis until a measured plan resolves it.

### 1859/1883

- principal masonry mass — documented;
- restored facade treatment / rustication — reconstructed;
- decorated window surrounds — reconstructed;
- timber terem and roof — reconstructed from restoration evidence and early photography;
- porch, arch and grand external stair — reconstructed; dimensions provisional;
- unresolved side volume — hypothesis.

## Why dimensions are still provisional

The current generator deliberately uses metric dimensions sufficient for:

- GLB loading;
- mobile performance tests;
- AR scale behaviour;
- calibration UI;
- switching between eras;
- portal and VR pipeline tests.

They are **not** yet certified measured dimensions. Before public historical use, global dimensions and facade control points must be reconciled with measured drawings or an on-site survey.

## Field gate

The model advances from `production-candidate` to `field-verified` only when all checks below pass:

1. global width, depth and height checked against measured documentation or field measurement;
2. at least five stable facade control points recorded;
3. unresolved hypothesis side mass either measured or removed;
4. window spacing and porch/stair dimensions validated;
5. AR alignment error measured at approximately 5 m, 10 m and 15 m viewing distance;
6. calibration repeated on more than one supported iOS device and more than one supported Android device;
7. an evidence reviewer accepts the public-visible geometry classification.

## Generated assets

The reproducible generator is:

`/scripts/build_romanov_production_candidate_v1.py`

The CI workflow writes:

- `assets/models/romanov-1857-production-candidate-v1.glb`
- `assets/models/romanov-1857-production-candidate-v1.gltf`
- `assets/models/romanov-1859-production-candidate-v1.glb`
- `assets/models/romanov-1859-production-candidate-v1.gltf`
- `assets/models/romanov-production-candidate-v1.manifest.json`

## Next geometry pass

The next pass is not generic beautification. It must retire uncertainty in this order:

1. measured envelope;
2. facade control points;
3. exact porch/stair geometry;
4. exact window spacing/profiles;
5. material research;
6. historical textures;
7. mobile LOD0/LOD1/LOD2;
8. night/HDR presentation only after geometric validation.
