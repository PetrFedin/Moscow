import assert from 'node:assert/strict';
import test from 'node:test';

import {
  currentMoscowPilotApplicationReadiness,
  evaluateMoscowPilotApplicationReadiness
} from '../src/government/moscowPilotApplicationReadiness.ts';

test('Moscow pilot application readiness remains blocked without applicant and city data', () => {
  const readiness = evaluateMoscowPilotApplicationReadiness();

  assert.equal(readiness.totalFields, 21);
  assert.equal(readiness.readyFields, 3);
  assert.equal(readiness.submissionReady, false);
  assert.equal(readiness.byStatus['applicant-input-required'], 7);
  assert.equal(readiness.byStatus['external-confirmation-required'], 1);
  assert.equal(readiness.byStatus['legal-review-required'], 3);
  assert.equal(readiness.byStatus['missing-artifact'], 1);
  assert.equal(readiness.decisionDeckMissing, true);
});

test('corporate and financial applicant fields cannot be prefilled as ready', () => {
  const applicantOwned = currentMoscowPilotApplicationReadiness.fields.filter(
    (field) =>
      field.authority.startsWith('Applicant')
      || field.id === 'revenue-three-years'
      || field.id === 'tariff-grid'
      || field.id === 'origin-components'
  );

  assert.ok(applicantOwned.length > 0);
  assert.ok(applicantOwned.every((field) => field.status !== 'ready'));

  const serialized = JSON.stringify(applicantOwned).toLowerCase();
  for (const forbidden of [
    'инн: ',
    'кпп: ',
    'выручка составляет',
    'тариф утверждён',
    'тариф утвержден'
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test('pilot site remains an external confirmation gate', () => {
  const site = currentMoscowPilotApplicationReadiness.fields.find(
    (field) => field.id === 'pilot-site'
  );

  assert.ok(site);
  assert.equal(site!.status, 'external-confirmation-required');
  assert.match(site!.currentValue, /не подтверждены/i);
});

test('presentation remains blocked until the decision deck exists', () => {
  const presentation = currentMoscowPilotApplicationReadiness.fields.find(
    (field) => field.id === 'presentation'
  );

  assert.ok(presentation);
  assert.equal(presentation!.status, 'missing-artifact');
  assert.match(presentation!.requiredAction, /decision deck/i);
});

test('project drafts are not equivalent to submitted application truth', () => {
  const readiness = evaluateMoscowPilotApplicationReadiness();
  assert.ok(readiness.byStatus['project-draft'] > 0);
  assert.ok(
    readiness.blockers.some(
      (blocker) =>
        blocker.status === 'project-draft'
        && blocker.id === 'commercialization-model'
    )
  );
});

test('application readiness keeps explicit legal and financing guardrails', () => {
  const combined = currentMoscowPilotApplicationReadiness.guardrails
    .join(' ')
    .toLowerCase();

  assert.match(combined, /не является юридическим заключением/);
  assert.match(combined, /не означает финансовую поддержку/);
  assert.match(combined, /не считается присвоенным/);
});
