import {
  resolvePersonalTripPreferences,
  summarizePersonalTrip,
  type PersonalTrip,
  type PersonalTripCommitment,
  type PersonalTripItem,
  type PersonalTripVisit,
  type ResolvedPersonalTripPreferences
} from './personalTrip.ts';
import {
  deriveTouristTodayState,
  minutesUntilItem,
  todayProgress,
  type TouristTodayState
} from './touristToday.ts';

export type CityConciergeIntent =
  | 'trip-overview'
  | 'today'
  | 'next-commitment'
  | 'free-time'
  | 'visited-history'
  | 'preferences'
  | 'unsupported-live-fact'
  | 'unsupported';

export type CityConciergeAnswerStatus = 'answered' | 'unknown' | 'unsupported';

export type CityConciergeFactKind =
  | 'trip-day-count'
  | 'planned-count'
  | 'commitment-count'
  | 'completed-count'
  | 'visited-count'
  | 'today-date'
  | 'current-item'
  | 'next-item'
  | 'next-commitment'
  | 'minutes-until-next-commitment'
  | 'free-window'
  | 'conflict-count'
  | 'visit'
  | 'pace'
  | 'day-bounds'
  | 'lunch-window'
  | 'step-free-intent'
  | 'max-continuous-walking'
  | 'priority-mode';

export type CityConciergeAuthority =
  | 'personal-trip'
  | 'destination-package'
  | 'provider-receipt'
  | 'visit-evidence'
  | 'local-schedule'
  | 'user-preference'
  | 'system-default'
  | 'unknown';

export type CityConciergeVerification =
  | 'provider-confirmed'
  | 'user-declared'
  | 'local-record'
  | 'derived-local'
  | 'user-confirmed'
  | 'route-completed'
  | 'provider-receipt'
  | 'proximity'
  | 'default'
  | 'unknown';

export type CityConciergeGrounding = {
  authority: CityConciergeAuthority;
  verification: CityConciergeVerification;
  sourceRef?: string;
};

export type CityConciergeFact = {
  id: string;
  kind: CityConciergeFactKind;
  value: string | number;
  secondaryValue?: string | number;
  itemId?: string;
  grounding: CityConciergeGrounding;
};

export type CityConciergeBoundaries = {
  readOnly: true;
  providerActionAllowed: false;
  routingVerified: false;
  openingHoursVerified: false;
  accessibilityVerified: false;
  weatherVerified: false;
  liveAvailabilityVerified: false;
};

export type CityConciergeAnswer = {
  intent: CityConciergeIntent;
  status: CityConciergeAnswerStatus;
  reason:
    | 'grounded-answer'
    | 'trip-not-active-today'
    | 'no-upcoming-confirmed-commitment'
    | 'no-free-window'
    | 'no-visited-history'
    | 'external-live-fact-not-authorized'
    | 'unsupported-read-only-intent';
  facts: CityConciergeFact[];
  boundaries: CityConciergeBoundaries;
};

export const CITY_CONCIERGE_READ_ONLY_BOUNDARIES: CityConciergeBoundaries = {
  readOnly: true,
  providerActionAllowed: false,
  routingVerified: false,
  openingHoursVerified: false,
  accessibilityVerified: false,
  weatherVerified: false,
  liveAvailabilityVerified: false
};

const LIVE_FACT_PATTERNS = [
  /\b(open|opening|hours?|closed?|closure|available|availability|price|cost|weather|accessible|accessibility)\b/i,
  /(открыт|закрыт|часы\s*работ|график|доступн|налич|цена|стоим|погод|безбарьер|доступност)/i,
  /(营业|开放时间|关门|关闭|有票|可用|价格|天气|无障碍)/i
];

const INTENT_PATTERNS: Array<[CityConciergeIntent, RegExp[]]> = [
  ['next-commitment', [
    /(следующ|ближайш).*(билет|брон|резерв)/i,
    /(билет|брон|резерв).*(следующ|ближайш)/i,
    /\b(next|upcoming).*(ticket|booking|reservation)\b/i,
    /\b(ticket|booking|reservation).*(next|upcoming)\b/i,
    /(下一|最近).*(门票|预订|预约)/i
  ]],
  ['free-time', [
    /(свободн.*(врем|окн)|окн.*свобод)/i,
    /\b(free|spare).*(time|window)\b/i,
    /(空闲|空档|自由时间)/i
  ]],
  ['visited-history', [
    /(что.*(видел|посетил)|где.*был|уже.*(видел|посетил))/i,
    /\b(visited|already seen|where have i been|what have i seen)\b/i,
    /(去过|看过|参观过|到访)/i
  ]],
  ['preferences', [
    /(предпочт|огранич|настройк|темп|безбарьер|ходьб)/i,
    /\b(preference|constraint|pace|step[- ]?free|walking limit)\b/i,
    /(偏好|限制|节奏|无障碍|步行)/i
  ]],
  ['today', [
    /(что.*сегодня|план.*сегодня|сегодня.*план)/i,
    /\b(today|today's plan|what.*today)\b/i,
    /(今天|今日).*(安排|计划|什么)?/i
  ]],
  ['trip-overview', [
    /(поездк|мой план|весь план|сводк)/i,
    /\b(trip|my plan|overview|summary)\b/i,
    /(行程|旅行|总览|概览)/i
  ]]
];

function parseIso(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return parsed;
}

function commitmentGrounding(commitment: PersonalTripCommitment): CityConciergeGrounding {
  if (commitment.verification === 'provider-confirmed') {
    return {
      authority: 'provider-receipt',
      verification: 'provider-confirmed',
      ...(commitment.receiptEvidenceRef ? { sourceRef: commitment.receiptEvidenceRef } : {})
    };
  }
  return {
    authority: 'personal-trip',
    verification: 'user-declared'
  };
}

function itemGrounding(item: PersonalTripItem): CityConciergeGrounding {
  if (item.commitment) return commitmentGrounding(item.commitment);
  if (item.source === 'destination-package') {
    return {
      authority: 'destination-package',
      verification: 'local-record'
    };
  }
  return {
    authority: 'personal-trip',
    verification: item.source === 'provider' ? 'local-record' : 'user-declared'
  };
}

function visitGrounding(visit: PersonalTripVisit): CityConciergeGrounding {
  return {
    authority: visit.evidence === 'provider-receipt' ? 'provider-receipt' : 'visit-evidence',
    verification: visit.evidence,
    ...(visit.evidenceRef ? { sourceRef: visit.evidenceRef } : {})
  };
}

function preferenceGrounding(trip: PersonalTrip): CityConciergeGrounding {
  return trip.preferences
    ? { authority: 'user-preference', verification: 'user-declared' }
    : { authority: 'system-default', verification: 'default' };
}

function answer(
  intent: CityConciergeIntent,
  status: CityConciergeAnswerStatus,
  reason: CityConciergeAnswer['reason'],
  facts: CityConciergeFact[]
): CityConciergeAnswer {
  return {
    intent,
    status,
    reason,
    facts,
    boundaries: { ...CITY_CONCIERGE_READ_ONLY_BOUNDARIES }
  };
}

function nextUpcomingConfirmedCommitment(trip: PersonalTrip, nowIso: string) {
  const now = parseIso(nowIso);
  return trip.items
    .filter((item) =>
      item.status === 'planned'
      && item.commitment?.status === 'confirmed'
      && Boolean(item.plannedStartAt)
      && parseIso(item.plannedStartAt!) >= now
    )
    .sort((a, b) =>
      parseIso(a.plannedStartAt!) - parseIso(b.plannedStartAt!)
      || a.id.localeCompare(b.id)
    )[0];
}

function overviewFacts(trip: PersonalTrip): CityConciergeFact[] {
  const summary = summarizePersonalTrip(trip);
  const grounding: CityConciergeGrounding = {
    authority: 'personal-trip',
    verification: 'local-record'
  };
  return [
    { id: 'overview:days', kind: 'trip-day-count', value: summary.dayCount, grounding },
    { id: 'overview:planned', kind: 'planned-count', value: summary.plannedCount, grounding },
    { id: 'overview:commitments', kind: 'commitment-count', value: summary.commitmentCount, grounding },
    { id: 'overview:completed', kind: 'completed-count', value: summary.completedCount, grounding },
    { id: 'overview:visited', kind: 'visited-count', value: summary.visitedCount, grounding }
  ];
}

function todayFacts(state: TouristTodayState): CityConciergeFact[] {
  const facts: CityConciergeFact[] = [{
    id: 'today:date',
    kind: 'today-date',
    value: state.dayDate,
    grounding: { authority: 'local-schedule', verification: 'derived-local' }
  }];

  for (const item of state.currentItems) {
    facts.push({
      id: `today:current:${item.id}`,
      kind: 'current-item',
      value: item.title,
      itemId: item.id,
      grounding: itemGrounding(item)
    });
  }

  if (state.nextItem) {
    facts.push({
      id: `today:next:${state.nextItem.id}`,
      kind: 'next-item',
      value: state.nextItem.title,
      secondaryValue: state.nextItem.plannedStartAt ?? '',
      itemId: state.nextItem.id,
      grounding: itemGrounding(state.nextItem)
    });
  }

  if (state.nextCommitment) {
    facts.push({
      id: `today:commitment:${state.nextCommitment.id}`,
      kind: 'next-commitment',
      value: state.nextCommitment.title,
      secondaryValue: state.nextCommitment.plannedStartAt ?? '',
      itemId: state.nextCommitment.id,
      grounding: itemGrounding(state.nextCommitment)
    });
  }

  const window = state.currentFreeWindow ?? state.nextFreeWindow;
  if (window) {
    facts.push({
      id: `today:free:${window.startsAt}`,
      kind: 'free-window',
      value: window.startsAt,
      secondaryValue: window.endsAt,
      grounding: { authority: 'local-schedule', verification: 'derived-local' }
    });
  }

  facts.push({
    id: 'today:conflicts',
    kind: 'conflict-count',
    value: state.conflictCount,
    grounding: { authority: 'local-schedule', verification: 'derived-local' }
  });

  const progress = todayProgress(state);
  facts.push({
    id: 'today:completed',
    kind: 'completed-count',
    value: progress.completed,
    secondaryValue: progress.total,
    grounding: { authority: 'personal-trip', verification: 'local-record' }
  });

  return facts;
}

function preferenceFacts(
  trip: PersonalTrip,
  preferences: ResolvedPersonalTripPreferences
): CityConciergeFact[] {
  const grounding = preferenceGrounding(trip);
  const facts: CityConciergeFact[] = [
    { id: 'pref:pace', kind: 'pace', value: preferences.pace, grounding },
    {
      id: 'pref:day-bounds',
      kind: 'day-bounds',
      value: preferences.dayStart,
      secondaryValue: preferences.dayEnd,
      grounding
    },
    { id: 'pref:step-free', kind: 'step-free-intent', value: preferences.stepFreeIntent, grounding },
    {
      id: 'pref:walk-limit',
      kind: 'max-continuous-walking',
      value: preferences.maxContinuousWalkingMinutes,
      grounding
    },
    { id: 'pref:priority', kind: 'priority-mode', value: preferences.priorityMode, grounding }
  ];
  if (preferences.lunchWindow) {
    facts.push({
      id: 'pref:lunch',
      kind: 'lunch-window',
      value: preferences.lunchWindow.start,
      secondaryValue: preferences.lunchWindow.end,
      grounding
    });
  }
  return facts;
}

export function routeCityConciergePrompt(prompt: string): CityConciergeIntent {
  const normalized = prompt.normalize('NFKC').trim();
  if (!normalized) return 'unsupported';

  if (LIVE_FACT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return 'unsupported-live-fact';
  }

  for (const [intent, patterns] of INTENT_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(normalized))) return intent;
  }
  return 'unsupported';
}

export function answerCityConcierge(input: {
  trip: PersonalTrip;
  nowIso: string;
  intent: CityConciergeIntent;
}): CityConciergeAnswer {
  parseIso(input.nowIso);

  switch (input.intent) {
    case 'trip-overview':
      return answer('trip-overview', 'answered', 'grounded-answer', overviewFacts(input.trip));

    case 'today': {
      const state = deriveTouristTodayState({ trip: input.trip, nowIso: input.nowIso });
      if (!state.tripActive) {
        return answer('today', 'unknown', 'trip-not-active-today', []);
      }
      return answer('today', 'answered', 'grounded-answer', todayFacts(state));
    }

    case 'next-commitment': {
      const item = nextUpcomingConfirmedCommitment(input.trip, input.nowIso);
      if (!item?.commitment || !item.plannedStartAt) {
        return answer('next-commitment', 'unknown', 'no-upcoming-confirmed-commitment', []);
      }
      const minutes = minutesUntilItem(input.nowIso, item);
      return answer('next-commitment', 'answered', 'grounded-answer', [
        {
          id: `commitment:${item.id}`,
          kind: 'next-commitment',
          value: item.title,
          secondaryValue: item.plannedStartAt,
          itemId: item.id,
          grounding: commitmentGrounding(item.commitment)
        },
        ...(minutes === null ? [] : [{
          id: `commitment:minutes:${item.id}`,
          kind: 'minutes-until-next-commitment' as const,
          value: minutes,
          itemId: item.id,
          grounding: { authority: 'local-schedule' as const, verification: 'derived-local' as const }
        }])
      ]);
    }

    case 'free-time': {
      const state = deriveTouristTodayState({ trip: input.trip, nowIso: input.nowIso });
      if (!state.tripActive) return answer('free-time', 'unknown', 'trip-not-active-today', []);
      const window = state.currentFreeWindow ?? state.nextFreeWindow;
      if (!window) return answer('free-time', 'unknown', 'no-free-window', []);
      return answer('free-time', 'answered', 'grounded-answer', [{
        id: `free:${window.startsAt}`,
        kind: 'free-window',
        value: window.startsAt,
        secondaryValue: window.endsAt,
        grounding: { authority: 'local-schedule', verification: 'derived-local' }
      }]);
    }

    case 'visited-history': {
      if (input.trip.visits.length === 0) {
        return answer('visited-history', 'unknown', 'no-visited-history', []);
      }
      const visits = [...input.trip.visits].sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
      return answer('visited-history', 'answered', 'grounded-answer', visits.map((visit) => ({
        id: `visit:${visit.id}`,
        kind: 'visit',
        value: visit.title,
        secondaryValue: visit.visitedAt,
        ...(visit.itemId ? { itemId: visit.itemId } : {}),
        grounding: visitGrounding(visit)
      })));
    }

    case 'preferences': {
      const preferences = resolvePersonalTripPreferences(input.trip);
      return answer('preferences', 'answered', 'grounded-answer', preferenceFacts(input.trip, preferences));
    }

    case 'unsupported-live-fact':
      return answer('unsupported-live-fact', 'unsupported', 'external-live-fact-not-authorized', []);

    case 'unsupported':
      return answer('unsupported', 'unsupported', 'unsupported-read-only-intent', []);
  }
}

export function askCityConcierge(input: {
  trip: PersonalTrip;
  nowIso: string;
  prompt: string;
}) {
  return answerCityConcierge({
    trip: input.trip,
    nowIso: input.nowIso,
    intent: routeCityConciergePrompt(input.prompt)
  });
}
