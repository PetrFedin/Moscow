import assert from 'node:assert/strict';
import test from 'node:test';

import {
  fieldPilotObservabilityEnabled,
  sanitizeFieldPilotDiagnostic,
  sanitizeFieldPilotSentryEvent
} from '../src/observability/fieldPilotObservabilityContract.ts';

test('field observability is disabled unless both flag and DSN are present', () => {
  assert.equal(fieldPilotObservabilityEnabled({ enabledFlag: '0', dsn: 'https://dsn.example/1' }), false);
  assert.equal(fieldPilotObservabilityEnabled({ enabledFlag: '1', dsn: '' }), false);
  assert.equal(fieldPilotObservabilityEnabled({ enabledFlag: '1', dsn: 'https://dsn.example/1' }), true);
});

test('diagnostic contract keeps only bounded allowlisted context', () => {
  const safe = sanitizeFieldPilotDiagnostic({
    kind: 'model-load-failed',
    buildVersion: 'field-2026-10-01',
    packageId: 'romanov-v1',
    packageVersion: '1',
    objectId: 'romanov-chambers',
    errorClass: 'asset-decode',
    deviceClass: 'iphone',
    osClass: 'ios'
  });

  assert.deepEqual(safe.tags, {
    'field.kind': 'model-load-failed',
    'app.build': 'field-2026-10-01',
    'package.id': 'romanov-v1',
    'package.version': '1',
    'object.id': 'romanov-chambers',
    'device.class': 'iphone',
    'os.class': 'ios',
    'error.class': 'asset-decode'
  });
});

test('unsafe tag-like values are dropped rather than transmitted', () => {
  const safe = sanitizeFieldPilotDiagnostic({
    kind: 'location-state',
    objectId: 'romanov?lat=55.752&lon=37.617',
    errorClass: 'permission-denied'
  });
  assert.equal(safe.tags['object.id'], undefined);
  assert.equal(safe.tags['error.class'], 'permission-denied');
});

test('beforeSend sanitizer strips common PII and precise-context surfaces', () => {
  const event = sanitizeFieldPilotSentryEvent({
    message: 'user was at exact coordinates 55.752,37.617',
    user: { id: 'person-1', email: 'person@example.com' },
    request: { url: 'https://example.com/?token=secret' },
    breadcrumbs: [{ message: 'walk route' }],
    contexts: { location: { lat: 55.752, lon: 37.617 } },
    extra: { cameraFrame: 'base64...' },
    fingerprint: ['person-1'],
    transaction: '/private/route',
    tags: {
      'field.kind': 'route-screen-crash',
      'object.id': 'varvarka',
      forbidden: 'secret'
    },
    exception: {
      values: [{ type: 'Error', value: 'token=secret at 55.752,37.617' }]
    }
  });

  assert.equal(event.message, 'field-pilot:route-screen-crash');
  assert.deepEqual(event.tags, {
    'field.kind': 'route-screen-crash',
    'object.id': 'varvarka'
  });
  assert.equal(event.user, undefined);
  assert.equal(event.request, undefined);
  assert.equal(event.breadcrumbs, undefined);
  assert.equal(event.contexts, undefined);
  assert.equal(event.extra, undefined);
  assert.equal(event.fingerprint, undefined);
  assert.equal(event.transaction, undefined);
  assert.equal(event.exception?.values?.[0]?.value, 'Field pilot diagnostic message redacted');
});
