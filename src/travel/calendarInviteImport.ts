import {
  addManualTripItem,
  parsePersonalTrip,
  type PersonalTrip,
  type PersonalTripCommitment
} from './personalTrip.ts';

/**
 * Strict, privacy-bounded import of ONE Moscow calendar event copied from an
 * .ics invitation. Not a ticket parser, proof of payment or provider booking.
 *
 * Only SUMMARY, DTSTART, DTEND, LOCATION and UID are used. Attendees, emails,
 * description, QR/attachments and arbitrary URLs are deliberately dropped.
 */
export const CALENDAR_IMPORT_MAX_CHARS = 32000;
export type CalendarImportChoice = 'plan' | 'ticket' | 'reservation';

export type CalendarInvitePreview = Readonly<{
  title: string;
  dayDate: string;
  startAt: string;
  endAt: string;
  location?: string;
  /** Local duplicate key only. May include invite UID; never provider evidence. */
  importKey: string;
}>;

function unfoldCalendar(raw: string): string[] {
  if (typeof raw !== 'string' || raw.length < 30 || raw.length > CALENDAR_IMPORT_MAX_CHARS) {
    throw new Error('Calendar invite is empty or too large');
  }
  if (raw.includes('\0')) throw new Error('Calendar invite contains a NUL byte');
  const physical = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const logical: string[] = [];
  for (const line of physical) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (!logical.length) throw new Error('Invalid folded calendar line');
      logical[logical.length - 1] += line.slice(1);
    } else {
      logical.push(line);
    }
  }
  return logical.map(s => s.trim()).filter(Boolean);
}

function textValue(raw: string | undefined, max: number): string {
  if (raw === undefined) return '';
  const decoded = raw.replace(/\\[nN]/g, ' ')
    .replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
    .replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!decoded || decoded.length > max) throw new Error('Invalid calendar title or location');
  return decoded;
}

function fieldsOfEvent(lines: string[]): Map<string, string[]> {
  const fields = new Map<string, string[]>();
  let eventDepth = 0;
  let found = 0;
  if (lines[0]?.toUpperCase() !== 'BEGIN:VCALENDAR'
      || lines[lines.length - 1]?.toUpperCase() !== 'END:VCALENDAR') {
    throw new Error('Calendar wrapper missing');
  }
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper === 'BEGIN:VEVENT') {
      if (eventDepth !== 0) throw new Error('Nested calendar events are unsupported');
      eventDepth = 1; found++;
      continue;
    }
    if (upper === 'END:VEVENT') {
      if (eventDepth !== 1) throw new Error('Unexpected calendar event end');
      eventDepth = 0;
      continue;
    }
    if (!eventDepth) {
      if (upper === 'METHOD:CANCEL') throw new Error('Cancelled invite needs manual supplier review');
      continue;
    }
    if (upper.startsWith('BEGIN:') || upper.startsWith('END:')) {
      // Do not silently accept nested VALARMs/VEVENTs or attachments.
      throw new Error('Nested calendar components are unsupported');
    }
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error('Malformed calendar event field');
    const key = line.slice(0, separator).toUpperCase();
    const value = line.slice(separator + 1);
    const name = key.split(';')[0] || '';
    if (['RRULE', 'RDATE', 'EXDATE', 'RECURRENCE-ID'].includes(name)) {
      throw new Error('Recurring calendar event requires manual review');
    }
    if (name === 'SUMMARY' || name === 'UID' || name === 'LOCATION'
      || name === 'DTSTART' || name === 'DTEND' || name === 'STATUS') {
      const prior = fields.get(name) ?? [];
      prior.push(key + ':' + value);
      fields.set(name, prior);
    }
  }
  if (eventDepth !== 0 || found !== 1) throw new Error('Select an invite with exactly one event');
  for (const name of ['SUMMARY', 'UID', 'DTSTART', 'DTEND']) {
    if ((fields.get(name)?.length ?? 0) !== 1) throw new Error('Invite has a missing or duplicate ' + name);
  }
  for (const name of ['LOCATION', 'STATUS']) {
    if ((fields.get(name)?.length ?? 0) > 1) throw new Error('Invite has duplicate ' + name);
  }
  return fields;
}

function valuePart(field: string): string {
  return field.slice(field.indexOf(':') + 1);
}

function clockField(raw: string): string {
  const header = raw.slice(0, raw.indexOf(':')).toUpperCase();
  const value = valuePart(raw).toUpperCase();
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(value);
  if (!match) throw new Error('Calendar event time must include an explicit timezone and minute');
  const [, year, month, day, hour, minute, seconds = '00', utc] = match;
  const local = year + '-' + month + '-' + day + 'T' + hour + ':' + minute + ':' + seconds;
  if (+year < 2020 || +year > 2100) throw new Error('Calendar event date is out of range');
  const token = header.split(';').slice(1);
  const recognized = token.length === 0 || (
    token.length === 1 && /^TZID="?EUROPE\/MOSCOW"?$/.test(token[0])
  );
  if (!recognized || (utc && token.length > 0) || (!utc && token.length === 0)) {
    throw new Error('Only UTC or Europe/Moscow calendar times are supported');
  }
  const timestamp = utc ? local + 'Z' : local + '+03:00';
  const parsed = new Date(timestamp);
  if (!Number.isFinite(parsed.getTime())) throw new Error('Invalid calendar event time');
  const check = new Date(parsed.getTime() + (utc ? 0 : 3 * 3600000)).toISOString().slice(0, 19);
  if (check !== local) throw new Error('Impossible calendar event date or time');
  return timestamp;
}

function moscowDate(timestamp: string): string {
  const date = new Date(timestamp);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return part('year') + '-' + part('month') + '-' + part('day');
}

export function previewCalendarInvite(raw: string, trip: PersonalTrip): CalendarInvitePreview {
  if (trip.destinationId !== 'moscow') throw new Error('Only the admitted Moscow pilot is supported');
  const fields = fieldsOfEvent(unfoldCalendar(raw));
  const first = (key: string) => fields.get(key)?.[0] ?? '';
  if (first('STATUS') && valuePart(first('STATUS')).toUpperCase() === 'CANCELLED') {
    throw new Error('Cancelled calendar invite requires manual review');
  }
  const uid = valuePart(first('UID'));
  if (!/^[A-Za-z0-9._@+:-]{1,140}$/.test(uid)) {
    throw new Error('Invalid or oversized calendar UID');
  }
  const importKey = 'ics:' + uid;
  if (trip.items.some(item => item.calendarImportKey === importKey)) {
    throw new Error('Calendar invite is already in this journey');
  }
  const startAt = clockField(first('DTSTART'));
  const endAt = clockField(first('DTEND'));
  const elapsed = Date.parse(endAt) - Date.parse(startAt);
  if (!(elapsed > 0 && elapsed <= 36 * 3600000)) {
    throw new Error('Calendar event must have a positive duration up to 36 hours');
  }
  const dayDate = moscowDate(startAt);
  if (!trip.days.includes(dayDate)) throw new Error('Invite date is outside this trip');
  const title = textValue(valuePart(first('SUMMARY')), 180);
  const location = first('LOCATION') ? textValue(valuePart(first('LOCATION')), 220) : undefined;
  return {
    title, startAt, endAt, dayDate,
    ...(location ? { location } : {}),
    importKey
  };
}

/**
 * Caller must first preview and explicitly choose whether this is merely a
 * calendar plan or their own reported ticket/reservation. Never upgrades to
 * provider-confirmed or reuses UID as a provider order reference.
 */
export function importCalendarInvite(input: {
  trip: PersonalTrip;
  raw: string;
  choice: CalendarImportChoice;
  reference?: string;
  itemId: string;
  updatedAt: string;
}): PersonalTrip {
  const preview = previewCalendarInvite(input.raw, input.trip);
  if (!['plan', 'ticket', 'reservation'].includes(input.choice)) {
    throw new Error('Unsupported calendar import choice');
  }
  const reference = input.reference?.trim() ?? '';
  if (reference.length > 120 || /[\r\n\u0000-\u001f]/.test(reference)) {
    throw new Error('Invalid calendar ticket reference');
  }
  if (input.choice === 'plan' && reference) throw new Error('A plan-only event cannot claim a booking reference');
  const commitment: PersonalTripCommitment | undefined = input.choice === 'plan' ? undefined : {
    kind: input.choice,
    status: 'confirmed', // A self-reported user choice, NEVER a provider API confirmation.
    verification: 'user-declared',
    ...(reference ? { reference } : {}),
    ...(preview.location ? { address: preview.location } : {})
  };
  const inserted = addManualTripItem({
    trip: input.trip,
    itemId: input.itemId,
    dayDate: preview.dayDate,
    title: preview.title,
    kind: input.choice === 'reservation' ? 'food' : 'event',
    plannedStartAt: preview.startAt,
    plannedEndAt: preview.endAt,
    ...(preview.location && !commitment ? { note: preview.location } : {}),
    ...(commitment ? { commitment } : {}),
    updatedAt: input.updatedAt
  });
  const changed: PersonalTrip = {
    ...inserted,
    items: inserted.items.map(item => item.id === input.itemId
      ? { ...item, calendarImportKey: preview.importKey }
      : item)
  };
  return parsePersonalTrip(JSON.stringify(changed));
}
