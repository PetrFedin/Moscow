import type { PersonalTrip } from './personalTrip.ts';

/**
 * Private, traveler-entered budget notes. Financial truth is never upgraded by
 * adding a ticket, visiting a place, or opening a payment provider's URL.
 * Amounts use integer kopecks to avoid floating-point accounting errors.
 */
export const MAX_TRIP_MONEY_MINOR = 100_000_000_000;
export const MAX_TRIP_FINANCE_ENTRIES = 400;

export const TRIP_FINANCE_CATEGORIES = [
  'tickets', 'food', 'transport', 'stay', 'activities', 'shopping', 'other'
] as const;

export type TripFinanceCategory = (typeof TRIP_FINANCE_CATEGORIES)[number];

export type TripFinanceEntry = {
  id: string;
  dayDate: string;
  title: string;
  category: TripFinanceCategory;
  /** A proposed amount; not a quoted or supplier-confirmed price. */
  estimateMinor?: number;
  /** A traveler-recorded actual cost; NOT a verified merchant/payment event. */
  actualMinor?: number;
  /** Optional durable link to an itinerary stop, NOT a provider booking. */
  itemId?: string;
  source: 'traveler-entered';
  createdAt: string;
  updatedAt: string;
};

export type TripFinanceState = {
  currency: 'RUB';
  /** Budget ceiling for the whole trip, not for an individual day. */
  budgetMinor?: number;
  entries: TripFinanceEntry[];
};

export type TripFinanceTotals = {
  entriesCount: number;
  estimatedMinor: number;
  actualMinor: number;
  outstandingEstimatesMinor: number;
  projectedMinor: number;
  /** Defined only for items with BOTH entered estimates and actuals. */
  recordedVarianceMinor: number;
};

export type TripFinanceCategoryTotals = TripFinanceTotals & {
  category: TripFinanceCategory;
};

export type TripFinanceReport = TripFinanceTotals & {
  currency: 'RUB';
  scope: 'trip' | 'day';
  dayDate?: string;
  /** Whole-trip budget applies only when scope === 'trip'. */
  budgetMinor?: number;
  projectedBudgetRemainingMinor?: number;
  overBudget: boolean;
  coveredStopCount: number;
  activeStopCount: number;
  byCategory: TripFinanceCategoryTotals[];
  byDay: Array<TripFinanceTotals & { dayDate: string }>;
};

function isValidCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(value + 'T12:00:00.000Z');
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

function validIso(value: unknown): value is string {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T/.test(value)
    && Number.isFinite(Date.parse(value));
}

export function assertTripMoneyMinor(value: unknown, field: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_TRIP_MONEY_MINOR) {
    throw new Error(field + ' must be an integer amount in kopecks');
  }
}

/** No float conversion or silent rounding, accepts 1 250,50 and 1250.5. */
export function parseTripMoneyInput(raw: string): number | undefined {
  const trimmed = raw.trim().replace(/[\s\u00a0\u202f]/g, '');
  if (!trimmed) return undefined;
  if (!/^\d{1,11}(?:[.,]\d{1,2})?$/.test(trimmed)) {
    throw new Error('Enter an amount with no more than two decimal places');
  }
  const [whole, fractional = ''] = trimmed.replace(',', '.').split('.');
  const result = Number(whole) * 100 + Number(fractional.padEnd(2, '0') || '0');
  assertTripMoneyMinor(result, 'Amount');
  return result;
}

export function formatTripMoneyMinor(amountMinor: number, language: 'ru' | 'en' | 'zh' = 'ru'): string {
  if (!Number.isSafeInteger(amountMinor)) throw new Error('Invalid amount to format');
  const sign = amountMinor < 0 ? '−' : '';
  const abs = Math.abs(amountMinor);
  const integer = Math.floor(abs / 100);
  const fraction = abs % 100;
  const locale = language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-GB' : 'ru-RU';
  return sign + new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(integer)
    + (fraction ? ',' + String(fraction).padStart(2, '0') : '') + ' ₽';
}

export function tripMoneyInputValue(amountMinor: number | undefined): string {
  if (amountMinor === undefined) return '';
  assertTripMoneyMinor(amountMinor, 'Amount');
  const integer = Math.floor(amountMinor / 100);
  const fractional = amountMinor % 100;
  return String(integer) + (fractional ? ',' + String(fractional).padStart(2, '0') : '');
}

export function validateTripFinance(trip: Pick<PersonalTrip, 'days' | 'items' | 'finance'>): void {
  const state: unknown = trip.finance;
  if (state === undefined) return;
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new Error('Invalid Trip Finance state');
  }
  const finance = state as TripFinanceState;
  if (finance.currency !== 'RUB' || !Array.isArray(finance.entries)
    || finance.entries.length > MAX_TRIP_FINANCE_ENTRIES) {
    throw new Error('Invalid Trip Finance currency or entries');
  }
  if (finance.budgetMinor !== undefined) assertTripMoneyMinor(finance.budgetMinor, 'Trip budget');
  const seen = new Set<string>();
  for (const entry of finance.entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
      || typeof entry.id !== 'string' || !entry.id.trim() || entry.id.length > 180
      || seen.has(entry.id)
      || typeof entry.title !== 'string' || !entry.title.trim() || entry.title.length > 160
      || !TRIP_FINANCE_CATEGORIES.includes(entry.category)
      || entry.source !== 'traveler-entered'
      || !isValidCalendarDate(entry.dayDate) || !trip.days.includes(entry.dayDate)
      || !validIso(entry.createdAt) || !validIso(entry.updatedAt)) {
      throw new Error('Invalid or duplicate Trip Finance entry');
    }
    seen.add(entry.id);
    if (entry.itemId !== undefined && (
      typeof entry.itemId !== 'string' || !entry.itemId.trim() || entry.itemId.length > 180
    )) throw new Error('Trip Finance entry has an unknown itinerary link');
    if (entry.estimateMinor === undefined && entry.actualMinor === undefined) {
      throw new Error('Trip Finance entry requires estimated or actual amount');
    }
    if (entry.estimateMinor !== undefined) assertTripMoneyMinor(entry.estimateMinor, 'Estimated expense');
    if (entry.actualMinor !== undefined) assertTripMoneyMinor(entry.actualMinor, 'Recorded expense');
  }
}

function emptyTotals(): TripFinanceTotals {
  return {
    entriesCount: 0,
    estimatedMinor: 0,
    actualMinor: 0,
    outstandingEstimatesMinor: 0,
    projectedMinor: 0,
    recordedVarianceMinor: 0
  };
}

function accumulate(totals: TripFinanceTotals, entry: TripFinanceEntry) {
  totals.entriesCount++;
  totals.estimatedMinor += entry.estimateMinor ?? 0;
  totals.actualMinor += entry.actualMinor ?? 0;
  // When an actual amount is entered for a row it REPLACES its estimate in forecast.
  if (entry.actualMinor === undefined) totals.outstandingEstimatesMinor += entry.estimateMinor ?? 0;
  totals.projectedMinor += entry.actualMinor ?? entry.estimateMinor ?? 0;
  if (entry.estimateMinor !== undefined && entry.actualMinor !== undefined) {
    totals.recordedVarianceMinor += entry.actualMinor - entry.estimateMinor;
  }
}

export function assessTripFinances(trip: PersonalTrip, dayDate?: string): TripFinanceReport {
  validateTripFinance(trip);
  if (dayDate !== undefined && !trip.days.includes(dayDate)) {
    throw new Error('Trip Finance day does not belong to this trip');
  }
  const report = emptyTotals();
  const byCategory = TRIP_FINANCE_CATEGORIES.map(category => ({
    category, ...emptyTotals()
  }));
  const byDay = trip.days.map(day => ({ dayDate: day, ...emptyTotals() }));
  const entries = (trip.finance?.entries ?? []).filter(e => dayDate === undefined || e.dayDate === dayDate);
  for (const entry of entries) {
    accumulate(report, entry);
    accumulate(byCategory.find(c => c.category === entry.category)!, entry);
    accumulate(byDay.find(d => d.dayDate === entry.dayDate)!, entry);
  }
  const active = trip.items.filter(item => item.status === 'planned' &&
    item.commitment?.status !== 'cancelled' &&
    (dayDate === undefined || item.dayDate === dayDate));
  const covered = new Set(entries.filter(e => e.itemId).map(e => e.itemId));
  const scope = dayDate === undefined ? 'trip' : 'day';
  const budgetMinor = scope === 'trip' ? trip.finance?.budgetMinor : undefined;
  const projectedBudgetRemainingMinor = budgetMinor === undefined ? undefined
    : budgetMinor - report.projectedMinor;
  return {
    ...report,
    currency: 'RUB',
    scope,
    ...(dayDate !== undefined ? { dayDate } : {}),
    ...(budgetMinor !== undefined ? { budgetMinor } : {}),
    ...(projectedBudgetRemainingMinor !== undefined ? { projectedBudgetRemainingMinor } : {}),
    overBudget: projectedBudgetRemainingMinor !== undefined && projectedBudgetRemainingMinor < 0,
    coveredStopCount: active.filter(item => covered.has(item.id)).length,
    activeStopCount: active.length,
    byCategory: byCategory.filter(c => c.entriesCount > 0),
    byDay
  };
}


/**
 * Mutations are copy-on-write and validated before returning. A previously
 * linked item may later be deleted or moved: the private spending evidence is
 * not erased or made unreadable when its original itinerary stop disappears.
 */
function editableFinance(trip: PersonalTrip): TripFinanceState {
  validateTripFinance(trip);
  return {
    currency: 'RUB',
    ...(trip.finance?.budgetMinor !== undefined ? { budgetMinor: trip.finance.budgetMinor } : {}),
    entries: (trip.finance?.entries ?? []).map(entry => ({ ...entry }))
  };
}

function verifiedTime(raw: string, label: string) {
  if (!validIso(raw)) throw new Error('Invalid ' + label + ' timestamp');
}

export function setTripFinanceBudget(input: {
  trip: PersonalTrip;
  budgetMinor?: number;
  updatedAt: string;
}): PersonalTrip {
  verifiedTime(input.updatedAt, 'budget revision');
  if (input.budgetMinor !== undefined) assertTripMoneyMinor(input.budgetMinor, 'Trip budget');
  const finance = editableFinance(input.trip);
  if (input.budgetMinor === undefined) delete finance.budgetMinor;
  else finance.budgetMinor = input.budgetMinor;
  const next = { ...input.trip, finance, updatedAt: input.updatedAt };
  validateTripFinance(next);
  return next;
}

export function upsertTripFinanceEntry(input: {
  trip: PersonalTrip;
  entry: TripFinanceEntry;
  updatedAt: string;
}): PersonalTrip {
  verifiedTime(input.updatedAt, 'financial revision');
  const finance = editableFinance(input.trip);
  const previousIndex = finance.entries.findIndex(entry => entry.id === input.entry.id);
  if (previousIndex >= 0) {
    // Editing an existing record cannot rewrite its original identity.
    if (finance.entries[previousIndex]?.createdAt !== input.entry.createdAt) {
      throw new Error('Financial entry creation timestamp is immutable');
    }
    finance.entries[previousIndex] = { ...input.entry };
  } else {
    if (input.entry.itemId && !input.trip.items.some(item => item.id === input.entry.itemId)) {
      throw new Error('Cannot link new financial entry to unknown itinerary stop');
    }
    finance.entries.push({ ...input.entry });
  }
  const next = { ...input.trip, finance, updatedAt: input.updatedAt };
  validateTripFinance(next);
  return next;
}

export function removeTripFinanceEntry(input: {
  trip: PersonalTrip;
  entryId: string;
  updatedAt: string;
}): PersonalTrip {
  verifiedTime(input.updatedAt, 'financial revision');
  const finance = editableFinance(input.trip);
  const originalLength = finance.entries.length;
  finance.entries = finance.entries.filter(entry => entry.id !== input.entryId);
  if (finance.entries.length === originalLength) throw new Error('Financial entry not found');
  const next = { ...input.trip, finance, updatedAt: input.updatedAt };
  validateTripFinance(next);
  return next;
}
