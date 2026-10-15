import assert from 'node:assert/strict';
import test from 'node:test';
import { createPersonalTrip, parsePersonalTrip } from '../src/travel/personalTrip.ts';
import { importCalendarInvite, previewCalendarInvite } from '../src/travel/calendarInviteImport.ts';

const raw = [
  'BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
  'UID:theatre-2026@example.test','SUMMARY:Мой театр',
  'DTSTART;TZID=Europe/Moscow:20261020T190000',
  'DTEND;TZID=Europe/Moscow:20261020T210000',
  'LOCATION:Театральная площадь',
  'DESCRIPTION:PRIVATE BANK DATA MUST NEVER BE SAVED',
  'END:VEVENT','END:VCALENDAR'
].join('\r\n');
function trip() { return createPersonalTrip({id:'trip-ics',destinationId:'moscow',
  title:'Моя поездка',startDate:'2026-10-20',endDate:'2026-10-21',
  createdAt:'2026-10-15T08:00:00.000Z'}); }

test('preview reads one fixed calendar event without saving description or claiming proof', () => {
  const before=trip();
  const snapshot=JSON.stringify(before);
  const view=previewCalendarInvite(raw,before);
  assert.equal(view.dayDate,'2026-10-20');
  assert.equal(view.title,'Мой театр');
  assert.equal(view.startAt,'2026-10-20T19:00:00+03:00');
  assert.ok(!JSON.stringify(view).includes('PRIVATE BANK DATA'));
  assert.equal(JSON.stringify(before),snapshot);
});

test('user-selected ticket stays user-declared and duplicate UID is rejected', () => {
  const original=trip();
  const saved=importCalendarInvite({
    trip:original,raw,choice:'ticket',reference:'USER-REF',
    itemId:'calendar-ticket',updatedAt:'2026-10-15T08:05:00.000Z'
  });
  assert.equal(original.items.length,0);
  assert.equal(saved.items[0]?.commitment?.verification,'user-declared');
  assert.equal(saved.items[0]?.commitment?.receiptEvidenceRef,undefined);
  assert.equal(saved.items[0]?.commitment?.reference,'USER-REF');
  assert.equal(saved.items[0]?.calendarImportKey,'ics:theatre-2026@example.test');
  assert.deepEqual(parsePersonalTrip(JSON.stringify(saved)),saved);
  assert.throws(()=>previewCalendarInvite(raw,saved),/already in this journey/);
});

test('calendar-only import never fabricates a purchased ticket', () => {
  const saved=importCalendarInvite({trip:trip(),raw,choice:'plan',
    itemId:'calendar-only',updatedAt:'2026-10-15T08:05:00.000Z'});
  assert.equal(saved.items[0]?.commitment,undefined);
  assert.throws(()=>importCalendarInvite({trip:trip(),raw,choice:'plan',
    reference:'FORGED',itemId:'bad',updatedAt:'2026-10-15T08:05:00.000Z'}),/plan-only/);
});

test('cancelled, recurring, ambiguous timezone, multi-event and out-of-trip invites fail closed', () => {
  for (const bad of [
    raw.replace('BEGIN:VEVENT','METHOD:CANCEL\r\nBEGIN:VEVENT'),
    raw.replace('UID:theatre-2026@example.test','RRULE:FREQ=DAILY\r\nUID:theatre-2026@example.test'),
    raw.replace('TZID=Europe/Moscow','TZID=Europe/London'),
    raw.replace('20261020T190000','20261023T190000'),
    raw.replace('20261020T190000','20261020T250000'),
    raw.replace('END:VCALENDAR','BEGIN:VEVENT\r\nUID:another\r\nEND:VEVENT\r\nEND:VCALENDAR')
  ]) assert.throws(()=>previewCalendarInvite(bad,trip()));
});

test('restored trip cannot contain two imported calendar events with the same UID', () => {
  const saved = importCalendarInvite({
    trip: trip(), raw, choice:'ticket', itemId:'first',
    updatedAt:'2026-10-15T09:00:00.000Z'
  });
  const forged = { ...saved, items: [...saved.items,
    { ...saved.items[0]!, id:'second' }] };
  assert.throws(() => parsePersonalTrip(JSON.stringify(forged)), /Duplicate imported calendar event/);
  assert.equal(saved.items.length,1);
});

test('backup parser refuses duplicate item IDs or malformed booking verification', () => {
  const saved = importCalendarInvite({
    trip:trip(),raw,choice:'ticket',itemId:'first',updatedAt:'2026-10-15T09:00:00.000Z'
  });
  assert.throws(() => parsePersonalTrip(JSON.stringify({
    ...saved, items:[...saved.items, { ...saved.items[0]! }]
  })), /Duplicate trip item ID/);
  assert.throws(() => parsePersonalTrip(JSON.stringify({
    ...saved, items:saved.items.map(item => ({
      ...item, commitment:{ ...item.commitment, verification:'supplier-verified' }
    }))
  })), /Invalid booking type, status or verification/);
});
