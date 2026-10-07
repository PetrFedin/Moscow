import test from 'node:test';
import assert from 'node:assert/strict';

import {
  expandCityEventOccurrences,
  validateCityEvent,
  validateCityVenue
} from '../src/travel/cityEventAuthority.ts';

test('venue requires stable source-backed identity',()=>{
  const result=validateCityVenue({
    id:'demo-venue',
    district:'Тверской',
    titleRu:'DEMO venue',
    titleEn:'DEMO venue',
    titleZh:'DEMO venue',
    latitude:55.76,
    longitude:37.61,
    sourceRef:'demo://venue',
    truth:'demo'
  });
  assert.equal(result.valid,true);
});

test('weekly event expands only selected weekdays',()=>{
  const occurrences=expandCityEventOccurrences({
    event:{
      id:'demo-weekly',
      venueId:'demo-venue',
      organiserId:'demo-organiser',
      category:'theatre',
      titleRu:'DEMO',
      titleEn:'DEMO',
      titleZh:'DEMO',
      startsAt:'2026-10-05T16:00:00.000Z',
      endsAt:'2026-10-05T18:00:00.000Z',
      recurrence:{kind:'weekly',weekdays:[1,3,5],until:'2026-10-12T23:59:59.000Z'},
      priceClass:'mid',
      ticketRoute:'none',
      accessibilityState:'unknown',
      sourceRef:'demo://event',
      freshnessAt:'2026-10-05T00:00:00.000Z',
      truth:'demo'
    },
    from:'2026-10-05T00:00:00.000Z',
    to:'2026-10-12T23:59:59.000Z'
  });
  assert.deepEqual(occurrences.map(x=>new Date(x.startsAt).getUTCDay()),[1,3,5,1]);
});

test('deep-link ticket route requires https URL',()=>{
  const invalid=validateCityEvent({
    id:'e',venueId:'v',organiserId:'o',category:'concert',
    titleRu:'x',titleEn:'x',titleZh:'x',
    startsAt:'2026-10-07T18:00:00Z',endsAt:'2026-10-07T19:00:00Z',
    recurrence:{kind:'none'},priceClass:'mid',ticketRoute:'deep-link',
    ticketUrl:'http://example.test',
    accessibilityState:'unknown',sourceRef:'demo://event',
    freshnessAt:'2026-10-07T12:00:00Z',truth:'demo'
  });
  assert.equal(invalid.valid,false);
  assert.ok(invalid.blockers.includes('ticketUrl'));
});

test('provider truth is not implied by event schema',()=>{
  const valid=validateCityEvent({
    id:'e',venueId:'v',organiserId:'o',category:'festival',
    titleRu:'x',titleEn:'x',titleZh:'x',
    startsAt:'2026-10-07T18:00:00Z',endsAt:'2026-10-07T19:00:00Z',
    recurrence:{kind:'none'},priceClass:'free',ticketRoute:'none',
    accessibilityState:'unknown',sourceRef:'demo://event',
    freshnessAt:'2026-10-07T12:00:00Z',truth:'demo'
  });
  assert.equal(valid.valid,true);
});
