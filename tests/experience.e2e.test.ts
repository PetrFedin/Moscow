import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertExperienceInvariant,
  initialExperienceState,
  reduceExperience
} from '../src/e2e/experienceContract.ts';

test('Romanov journey preserves place, era and trust from map through portal and back', () => {
  let state = initialExperienceState;

  const apply = (event: Parameters<typeof reduceExperience>[1]) => {
    state = reduceExperience(state, event);
    assert.equal(assertExperienceInvariant(state), true);
    return state;
  };

  apply({ type: 'OPEN_MAP' });
  apply({ type: 'SELECT_PLACE', placeId: 'romanov-chambers' });
  apply({ type: 'SET_SHEET', state: 'expanded' });
  apply({ type: 'OPEN_STORY' });
  apply({ type: 'SET_TIME', index: 1, era: '1859' });
  apply({ type: 'SET_TRUST', trustMode: 'documented' });
  apply({ type: 'OPEN_3D' });

  assert.equal(state.selectedPlaceId, 'romanov-chambers');
  assert.equal(state.era, '1859');
  assert.equal(state.trustMode, 'documented');
  assert.equal(state.surface, 'model3d');

  apply({ type: 'OPEN_SPATIAL' });
  assert.equal(state.spatialStage, 'searching');
  apply({ type: 'SURFACE_CANDIDATE_FOUND' });
  apply({ type: 'ANCHOR_CREATED' });
  apply({ type: 'CALIBRATION_SAVED' });
  apply({ type: 'FIELD_VERIFIED' });
  apply({ type: 'OPEN_PORTAL_PREVIEW' });
  apply({ type: 'ENTER_PORTAL' });

  assert.equal(state.portalEntered, true);
  assert.equal(state.spatialStage, 'portal-entered');
  assert.equal(state.era, '1859');
  assert.equal(state.trustMode, 'documented');

  apply({ type: 'EXIT_PORTAL' });
  apply({ type: 'BACK_TO_3D' });
  assert.equal(state.surface, 'model3d');
  assert.equal(state.era, '1859');
  assert.equal(state.trustMode, 'documented');
});

test('portal cannot be entered before field verification', () => {
  let state = reduceExperience(initialExperienceState, { type: 'OPEN_SPATIAL' });
  state = reduceExperience(state, { type: 'SURFACE_CANDIDATE_FOUND' });
  state = reduceExperience(state, { type: 'ANCHOR_CREATED' });
  state = reduceExperience(state, { type: 'CALIBRATION_SAVED' });
  const blocked = reduceExperience(state, { type: 'ENTER_PORTAL' });
  assert.equal(blocked.portalEntered, false);
  assert.equal(blocked.spatialStage, 'calibrated');
});

test('invalid AR state jumps are ignored', () => {
  let state = reduceExperience(initialExperienceState, { type: 'OPEN_SPATIAL' });
  state = reduceExperience(state, { type: 'FIELD_VERIFIED' });
  assert.equal(state.spatialStage, 'searching');
  state = reduceExperience(state, { type: 'ANCHOR_CREATED' });
  assert.equal(state.spatialStage, 'searching');
});
