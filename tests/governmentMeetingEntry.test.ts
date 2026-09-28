import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGovernmentMeetingUrl,
  parseGovernmentMeetingEntryUrl
} from '../src/government/governmentMeetingEntry.ts';

test('government meeting entry parses overview guided and package links', () => {
  assert.equal(
    parseGovernmentMeetingEntryUrl('https://example.org/?cityPilot=overview'),
    'overview'
  );
  assert.equal(
    parseGovernmentMeetingEntryUrl('https://example.org/?cityPilot=guided'),
    'guided'
  );
  assert.equal(
    parseGovernmentMeetingEntryUrl('https://example.org/?cityPilot=package'),
    'package'
  );
});

test('meeting and data-room aliases stay deterministic', () => {
  assert.equal(
    parseGovernmentMeetingEntryUrl('https://example.org/?cityPilot=meeting'),
    'guided'
  );
  assert.equal(
    parseGovernmentMeetingEntryUrl('https://example.org/?cityPilot=data-room'),
    'package'
  );
  assert.equal(
    parseGovernmentMeetingEntryUrl('https://example.org/?cityPilot=dataroom'),
    'package'
  );
});

test('unknown or malformed links do not open government mode', () => {
  assert.equal(parseGovernmentMeetingEntryUrl(null), null);
  assert.equal(parseGovernmentMeetingEntryUrl('not-a-url'), null);
  assert.equal(parseGovernmentMeetingEntryUrl('https://example.org/'), null);
  assert.equal(
    parseGovernmentMeetingEntryUrl('https://example.org/?cityPilot=investor-ready'),
    null
  );
});

test('shareable link builder preserves the origin and sets one explicit meeting mode', () => {
  assert.equal(
    buildGovernmentMeetingUrl('https://moscow.example.org/', 'guided'),
    'https://moscow.example.org/?cityPilot=guided'
  );
  assert.equal(
    buildGovernmentMeetingUrl(
      'https://moscow.example.org/path?foo=bar#demo',
      'package'
    ),
    'https://moscow.example.org/path?foo=bar&cityPilot=package#demo'
  );
});
