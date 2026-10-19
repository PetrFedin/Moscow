/** Moscow wall-clock inputs for user-entered itinerary items.
 * These values describe the venue timezone, never the device timezone.
 */
export function moscowCalendarDay(now: Date = new Date()): string {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid current date');
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return value('year') + '-' + value('month') + '-' + value('day');
}

function requireClock(raw: string): string {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(raw)) {
    throw new Error('Use a valid 24-hour Moscow time (HH:MM)');
  }
  return raw;
}

function nextDay(day: string): string {
  const date = new Date(day + 'T12:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) {
    throw new Error('Invalid itinerary day');
  }
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** An earlier end clock means next-day finish; an equal clock is ambiguous and rejected. */
export function manualMoscowInterval(day: string, start: string, end: string): {
  plannedStartAt: string;
  plannedEndAt: string;
  overnight: boolean;
} {
  const startClock = requireClock(start);
  const endClock = requireClock(end);
  // Validate the day even for same-day events.
  nextDay(day);
  if (startClock === endClock) throw new Error('Start and end times must differ');
  const overnight = endClock < startClock;
  return {
    plannedStartAt: day + 'T' + startClock + ':00+03:00',
    plannedEndAt: (overnight ? nextDay(day) : day) + 'T' + endClock + ':00+03:00',
    overnight
  };
}
