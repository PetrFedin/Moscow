import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PILOT_DESTINATIONS,
  PRODUCT_WORKING_NAME,
  PRODUCT_PUBLIC_NAME,
  PRODUCT_BRAND_STATUS,
  requireAdmittedDestination,
  formatDestinationTime
} from '../src/product/travelProductIdentity.ts';

test('proposed global identity does not silently rebrand published Moscow experience', () => {
  assert.equal(PRODUCT_WORKING_NAME, 'DAYTERA');
  assert.equal(PRODUCT_PUBLIC_NAME, 'Moscow');
  assert.equal(PRODUCT_BRAND_STATUS, 'proposal-only');
  assert.equal(PILOT_DESTINATIONS.length, 1);
  assert.equal(PILOT_DESTINATIONS[0]?.id, 'moscow');
  assert.equal(PILOT_DESTINATIONS[0]?.phase, 'draft-pilot');
});

test('any unsupported city fails closed instead of inheriting Moscow data or timezone', () => {
  const destination = requireAdmittedDestination('moscow');
  assert.equal(destination.countryCode, 'RU');
  assert.equal(destination.timezone, 'Europe/Moscow');
  assert.throws(() => requireAdmittedDestination('saint-petersburg'), /Unsupported destination/);
  assert.throws(() => requireAdmittedDestination(''), /Unsupported destination/);
});

test('the pilot timezone formats known instants and never invents the unknown', () => {
  assert.equal(formatDestinationTime('2026-10-13T19:00:00+03:00', 'moscow'), '19:00');
  assert.equal(formatDestinationTime('2026-10-13T16:00:00.000Z', 'moscow'), '19:00');
  assert.equal(formatDestinationTime(undefined, 'moscow'), '—');
  assert.equal(formatDestinationTime('invalid-date', 'moscow'), '—');
});

test('product readiness advertises no unverified live provider, geo or cross-device capabilities', () => {
  const readiness = requireAdmittedDestination('moscow').readiness;
  assert.equal(readiness.localTripDiary, true);
  assert.equal(readiness.editorialDirectory, true);
  assert.equal(readiness.onlineProviderBooking, false);
  assert.equal(readiness.publiclyVerifiedRealtimeAvailability, false);
  assert.equal(readiness.externallyVerifiedLocation, false);
  assert.equal(readiness.crossDeviceSync, false);
});
