import test from 'node:test';
import assert from 'node:assert/strict';

import { getGovernmentOwnerRouteCopy } from '../src/government/governmentOwnerRoute.ts';
import { getGovernmentOwnerRehearsalNotes } from '../src/government/governmentOwnerRehearsal.ts';

test('every executive route step has rehearsal coverage', () => {
  const route = getGovernmentOwnerRouteCopy('ru');
  const notes = getGovernmentOwnerRehearsalNotes('ru');

  assert.equal(notes.length, route.steps.length);

  for (const step of route.steps) {
    const note = notes.find((item) => item.stepId === step.id);
    assert.ok(note, `missing rehearsal note for ${step.id}`);
    assert.ok((note?.speakerCue.length ?? 0) > 20);
    assert.ok((note?.executiveObjection.length ?? 0) > 20);
    assert.ok((note?.objectionResponse.length ?? 0) > 20);
    assert.ok((note?.doNotPromise.length ?? 0) > 20);
    assert.ok((note?.closeCue.length ?? 0) > 20);
    assert.ok((note?.shortcuts.length ?? 0) >= 1);
  }
});

test('rehearsal evidence jumps only target valid Investor MVP destinations', () => {
  const allowed = new Set([
    'control','product','deliverables','ecosystem','operations','money','acceptance','contract'
  ]);

  for (const note of getGovernmentOwnerRehearsalNotes('ru')) {
    for (const shortcut of note.shortcuts) {
      assert.ok(allowed.has(shortcut.destination));
      assert.ok(shortcut.label.length > 2);
    }
  }
});
