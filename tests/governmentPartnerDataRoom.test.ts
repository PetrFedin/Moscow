import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGovernmentPartnerDataRoom,
  governmentDataRoomPackages
} from '../src/government/governmentPartnerDataRoom.ts';

test('data room separates Moscow executive technical investor and federal decisions', () => {
  assert.deepEqual(
    governmentDataRoomPackages.map((pkg) => pkg.id),
    ['moscow-executive', 'moscow-technical', 'investor', 'federal']
  );
});

test('current Moscow intro and technical packs are sendable while investor and federal packs remain blocked', () => {
  const room = buildGovernmentPartnerDataRoom();

  assert.deepEqual(
    room.currentSendablePackages,
    ['moscow-executive', 'moscow-technical']
  );

  const blocked = new Map(room.blockedPackages.map((pkg) => [pkg.id, pkg]));
  assert.ok(blocked.has('investor'));
  assert.ok(blocked.has('federal'));
  assert.equal(blocked.has('moscow-executive'), false);
  assert.equal(blocked.has('moscow-technical'), false);
});

test('Moscow executive package contains the buyer leave-behind and pilot truth backbone', () => {
  const room = buildGovernmentPartnerDataRoom();
  const pkg = room.packages.find((item) => item.id === 'moscow-executive');

  assert.ok(pkg);
  assert.equal(pkg!.ready, true);
  assert.deepEqual(pkg!.artifactBlockers, []);
  assert.deepEqual(pkg!.evidenceBlockers, []);
  const ids = new Set(pkg!.artifacts.map((artifact) => artifact.id));
  for (const required of [
    'executive-one-pager',
    'city-pilot-demo',
    'pilot-positioning',
    'pilot-methodology',
    'pilot-acceptance',
    'funding-scale-playbook',
    'pilot-application-readiness'
  ]) {
    assert.equal(ids.has(required as never), true);
  }
});

test('technical approval readiness is not confused with verified pilot success', () => {
  const room = buildGovernmentPartnerDataRoom();
  const technical = room.packages.find((item) => item.id === 'moscow-technical');
  const investor = room.packages.find((item) => item.id === 'investor');

  assert.ok(technical);
  assert.ok(investor);
  assert.equal(technical!.ready, true);
  assert.equal(investor!.ready, false);
  assert.match(technical!.doNotClaim, /не означает успешный pilot result/i);
  assert.ok(investor!.evidenceBlockers.length > 0);
});

test('federal room remains gated by Moscow decision-ready proof and first external region', () => {
  const room = buildGovernmentPartnerDataRoom();
  const federal = room.packages.find((item) => item.id === 'federal');

  assert.ok(federal);
  assert.equal(federal!.ready, false);
  assert.ok(
    federal!.evidenceBlockers.includes('moscow-scale-decision-pack-not-ready')
  );
  assert.ok(
    federal!.evidenceBlockers.includes('first-external-region-proof-missing')
  );
});

test('data room never presents blocked investor or federal package as current sendable material', () => {
  const room = buildGovernmentPartnerDataRoom();
  const sendable = new Set(room.currentSendablePackages);

  assert.equal(sendable.has('investor'), false);
  assert.equal(sendable.has('federal'), false);
});
