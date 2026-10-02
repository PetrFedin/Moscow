import type { PersonalTrip, PersonalTripItem, PersonalTripVisit } from './personalTrip.ts';
import { deriveTripFreeWindows, detectTripScheduleConflicts, type TripFreeWindow } from './tripScheduler.ts';

export type TouristTodayState = {
  tripActive: boolean;
  dayDate: string;
  nowIso: string;
  currentItems: PersonalTripItem[];
  nextItem?: PersonalTripItem;
  nextCommitment?: PersonalTripItem;
  remainingItems: PersonalTripItem[];
  completedItems: PersonalTripItem[];
  visitsToday: PersonalTripVisit[];
  currentFreeWindow?: TripFreeWindow;
  nextFreeWindow?: TripFreeWindow;
  conflictCount: number;
};

function parseIso(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return parsed;
}

function moscowDateOnly(value: string) {
  const date = new Date(parseIso(value));
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) throw new Error('Cannot derive Moscow date');
  return `${year}-${month}-${day}`;
}

function dayBoundary(dayDate: string, hhmm: string) {
  return `${dayDate}T${hhmm}:00+03:00`;
}

function itemStart(item: PersonalTripItem) {
  return item.plannedStartAt ? parseIso(item.plannedStartAt) : Number.POSITIVE_INFINITY;
}

function itemEnd(item: PersonalTripItem) {
  return item.plannedEndAt ? parseIso(item.plannedEndAt) : itemStart(item);
}

function isRemaining(item: PersonalTripItem) {
  return item.status === 'planned';
}

function isComplete(item: PersonalTripItem) {
  return item.status === 'completed';
}

function isConfirmedCommitment(item: PersonalTripItem) {
  return item.status === 'planned' && item.commitment?.status === 'confirmed';
}

export function deriveTouristTodayState(input: {
  trip: PersonalTrip;
  nowIso: string;
  dayStartsAt?: string;
  dayEndsAt?: string;
}): TouristTodayState {
  const now = parseIso(input.nowIso);
  const dayDate = moscowDateOnly(input.nowIso);
  const tripActive = input.trip.days.includes(dayDate);

  if (!tripActive) {
    return {
      tripActive: false,
      dayDate,
      nowIso: input.nowIso,
      currentItems: [],
      remainingItems: [],
      completedItems: [],
      visitsToday: [],
      conflictCount: 0
    };
  }

  const items = input.trip.items.filter((item) => item.dayDate === dayDate);
  const remainingItems = items
    .filter(isRemaining)
    .sort((a, b) => itemStart(a) - itemStart(b) || (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER));

  const completedItems = items.filter(isComplete);
  const visitsToday = input.trip.visits
    .filter((visit) => visit.dayDate === dayDate)
    .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt));

  const currentItems = remainingItems.filter((item) => {
    if (!item.plannedStartAt || !item.plannedEndAt) return false;
    const start = itemStart(item);
    const end = itemEnd(item);
    return start <= now && now < end;
  });

  const nextItem = remainingItems.find((item) =>
    item.plannedStartAt ? itemStart(item) > now : false
  ) ?? remainingItems.find((item) => !item.plannedStartAt);

  const nextCommitment = remainingItems
    .filter(isConfirmedCommitment)
    .filter((item) => !item.plannedStartAt || itemStart(item) > now)
    .sort((a, b) => itemStart(a) - itemStart(b))[0];

  const dayStart = input.dayStartsAt ?? dayBoundary(dayDate, '09:00');
  const dayEnd = input.dayEndsAt ?? dayBoundary(dayDate, '23:00');
  const freeWindows = deriveTripFreeWindows({
    trip: input.trip,
    dayDate,
    dayStartsAt: dayStart,
    dayEndsAt: dayEnd,
    minimumMinutes: 30
  });

  const currentFreeWindow = freeWindows.find((window) =>
    parseIso(window.startsAt) <= now && now < parseIso(window.endsAt)
  );
  const nextFreeWindow = freeWindows.find((window) => parseIso(window.startsAt) > now);

  return {
    tripActive: true,
    dayDate,
    nowIso: input.nowIso,
    currentItems,
    ...(nextItem ? { nextItem } : {}),
    ...(nextCommitment ? { nextCommitment } : {}),
    remainingItems,
    completedItems,
    visitsToday,
    ...(currentFreeWindow ? { currentFreeWindow } : {}),
    ...(nextFreeWindow ? { nextFreeWindow } : {}),
    conflictCount: detectTripScheduleConflicts(input.trip).filter((conflict) => conflict.dayDate === dayDate).length
  };
}

export function minutesUntilItem(nowIso: string, item?: PersonalTripItem) {
  if (!item?.plannedStartAt) return null;
  const delta = parseIso(item.plannedStartAt) - parseIso(nowIso);
  return Math.ceil(delta / 60_000);
}

export function todayProgress(state: TouristTodayState) {
  const total = state.completedItems.length + state.remainingItems.length;
  return {
    completed: state.completedItems.length,
    remaining: state.remainingItems.length,
    total,
    ratio: total > 0 ? state.completedItems.length / total : 0
  };
}

export function todayVisitTitles(state: TouristTodayState) {
  return state.visitsToday.map((visit) => visit.title);
}
