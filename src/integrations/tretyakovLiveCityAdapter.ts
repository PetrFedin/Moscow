import type {
  LiveDestinationEntity,
  LiveDestinationProvider,
  LiveOperationalStatus
} from '../travel/liveDestinationAuthority.ts';
import type {
  LiveProviderAdapter,
  LiveProviderSnapshot
} from '../travel/liveProviderIngestion.ts';

export const TRETYAKOV_LIVE_ADAPTER_ID = 'tretyakov-new-opening-hours-v1' as const;
export const TRETYAKOV_PROVIDER_ID = 'tretyakov-official' as const;
export const TRETYAKOV_NEW_CANONICAL_NODE_ID = 'new-tretyakov' as const;
export const TRETYAKOV_NEW_SOURCE_URL =
  'https://www.tretyakovgallery.ru/for-visitors/museums/novaya-tretyakovka/' as const;

type DayToken = 'ПН' | 'ВТ' | 'СР' | 'ЧТ' | 'ПТ' | 'СБ' | 'ВС';

type DailySchedule = {
  open?: string;
  close?: string;
  closed: boolean;
};

const DAY_TOKENS: DayToken[] = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const DAY_TOKEN_BY_UTC_DAY: DayToken[] = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

function normalizeHtmlText(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&mdash;|&#8212;|&#x2014;|&ndash;|&#8211;|&#x2013;/gi, '—')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function localMoscowDate(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(iso));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function addDate(dateOnly: string, offset: number) {
  const date = new Date(`${dateOnly}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function tokenForDate(dateOnly: string): DayToken {
  return DAY_TOKEN_BY_UTC_DAY[new Date(`${dateOnly}T12:00:00.000Z`).getUTCDay()]!;
}

function parseSchedule(text: string) {
  const schedule = new Map<DayToken, DailySchedule>(
    DAY_TOKENS.map((day) => [day, { closed: true }])
  );

  const timePattern =
    /((?:ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС)(?:\s*,\s*(?:ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС))*)\s*:\s*(\d{2}:\d{2})\s*[—–-]\s*(\d{2}:\d{2})/g;
  for (const match of text.matchAll(timePattern)) {
    const days = match[1]!.split(',').map((value) => value.trim() as DayToken);
    for (const day of days) {
      schedule.set(day, { open: match[2], close: match[3], closed: false });
    }
  }

  const closedPattern =
    /((?:ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС)(?:\s*,\s*(?:ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС))*)\s*:\s*(?:выходной|закрыто)/gi;
  for (const match of text.matchAll(closedPattern)) {
    const days = match[1]!.split(',').map((value) => value.trim().toUpperCase() as DayToken);
    for (const day of days) schedule.set(day, { closed: true });
  }

  return schedule;
}

function buildOpeningWindows(schedule: Map<DayToken, DailySchedule>, fetchedAt: string) {
  const startDate = localMoscowDate(fetchedAt);
  const windows: Array<{ opensAt: string; closesAt: string }> = [];
  for (let offset = 0; offset < 8; offset += 1) {
    const dayDate = addDate(startDate, offset);
    const day = schedule.get(tokenForDate(dayDate));
    if (!day || day.closed || !day.open || !day.close) continue;
    windows.push({
      opensAt: `${dayDate}T${day.open}:00+03:00`,
      closesAt: `${dayDate}T${day.close}:00+03:00`
    });
  }
  return windows;
}

function currentOperationalStatus(text: string): LiveOperationalStatus {
  if (/Сегодня\s+открыто\s+до\s+\d{2}:\d{2}/i.test(text)) return 'open';
  if (/Сегодня\s+(?:закрыто|выходной)/i.test(text)) return 'closed';
  return 'unknown';
}

export function normalizeTretyakovNewPage(
  html: string,
  snapshot: LiveProviderSnapshot<string>
): LiveDestinationEntity[] {
  if (!html.trim()) throw new Error('Tretyakov source page is empty');
  const text = normalizeHtmlText(html);

  if (!text.includes('Новая Третьяковка')) {
    throw new Error('Tretyakov source identity marker missing');
  }
  if (!text.includes('Крымский Вал, 10')) {
    throw new Error('Tretyakov source address marker missing');
  }

  const schedule = parseSchedule(text);
  const windows = buildOpeningWindows(schedule, snapshot.fetchedAt);
  if (windows.length === 0) {
    throw new Error('Tretyakov opening-hours schedule not found');
  }

  const fetchedMs = Date.parse(snapshot.fetchedAt);
  if (!Number.isFinite(fetchedMs)) throw new Error('Tretyakov snapshot fetchedAt is invalid');
  const expiresAt = new Date(fetchedMs + 30 * 60_000).toISOString();

  return [{
    id: 'new-tretyakov-live',
    providerEntityId: 'new-tretyakov',
    providerId: TRETYAKOV_PROVIDER_ID,
    canonicalDestinationNodeId: TRETYAKOV_NEW_CANONICAL_NODE_ID,
    kind: 'museum',
    titleRu: 'Новая Третьяковка',
    titleEn: 'New Tretyakov',
    titleZh: '新特列季亚科夫画廊',
    tags: ['музей', 'искусство', 'новая третьяковка'],
    sourceUrl: snapshot.sourceUrl,
    observedAt: snapshot.fetchedAt,
    expiresAt,
    operationalStatus: currentOperationalStatus(text),
    openingHours: {
      timezone: 'Europe/Moscow',
      windows
    }
  }];
}

export function buildTretyakovNewLiveAdapter(
  sourceUrl = TRETYAKOV_NEW_SOURCE_URL
): LiveProviderAdapter<string> {
  const provider: LiveDestinationProvider = {
    id: TRETYAKOV_PROVIDER_ID,
    name: 'Государственная Третьяковская галерея',
    relationship: 'official',
    capabilities: ['inventory', 'operational-status', 'opening-hours'],
    sourceUrl,
    attributionRu: 'Источник: Государственная Третьяковская галерея',
    attributionEn: 'Source: State Tretyakov Gallery',
    attributionZh: '来源：国立特列季亚科夫画廊'
  };

  return {
    id: TRETYAKOV_LIVE_ADAPTER_ID,
    destinationId: 'moscow',
    provider,
    refreshPolicy: {
      expectedRefreshSeconds: 15 * 60,
      hardMaxSnapshotAgeSeconds: 60 * 60,
      retryAfterSeconds: 5 * 60
    },
    normalize: (payload, snapshot) => normalizeTretyakovNewPage(payload, snapshot)
  };
}
