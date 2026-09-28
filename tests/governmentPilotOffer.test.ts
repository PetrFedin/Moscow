import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getGovernmentPilotReadiness,
  governmentPilotOffer
} from '../src/government/governmentPilotOffer.ts';

test('government offer does not claim the city pilot is already proven', () => {
  const readiness = getGovernmentPilotReadiness();
  assert.equal(readiness.pilotProven, false);
  assert.ok(readiness.externalProofRequired >= 3);
  assert.ok(readiness.partnerAccessRequired >= 1);
});

test('Romanov, Old English Court and visitor pilot remain external evidence gates', () => {
  const byId = new Map(governmentPilotOffer.proof.map((item) => [item.id, item]));
  assert.equal(byId.get('romanov')?.status, 'external-proof-required');
  assert.equal(byId.get('old-english-court')?.status, 'external-proof-required');
  assert.equal(byId.get('visitor-pilot')?.status, 'external-proof-required');
  assert.equal(byId.get('live-destination')?.status, 'partner-access-required');
});

test('funding tracks are candidates rather than committed public financing', () => {
  assert.ok(
    governmentPilotOffer.fundingTracks.every(
      (track) => track.status === 'candidate-route' || track.status === 'post-pilot-route'
    )
  );

  const serialized = JSON.stringify(governmentPilotOffer).toLowerCase();
  for (const forbidden of [
    'финансирование одобрено',
    'бюджет утвержден',
    'бюджет утверждён',
    'закупка гарантирована',
    'субсидия гарантирована',
    'field-verified объект'
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test('federal scale is gated by Moscow proof and first external region', () => {
  const firstRegion = governmentPilotOffer.scale.find((stage) => stage.id === 'first-region');
  const federal = governmentPilotOffer.scale.find((stage) => stage.id === 'federal');

  assert.ok(firstRegion);
  assert.ok(federal);
  assert.match(firstRegion!.gate, /общий contract/i);
  assert.match(federal!.gate, /межрегиональный proof/i);
});

test('commercial partners cannot influence heritage truth authority', () => {
  const combined = governmentPilotOffer.commercialModel.join(' ').toLowerCase();
  assert.match(combined, /sponsorship/);
  assert.match(combined, /не влияет/);
  assert.match(combined, /truth authority/);
});
