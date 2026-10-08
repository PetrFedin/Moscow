import type {
  LiveDestinationEntity,
  LiveDestinationProvider,
  LiveOperationalStatus
} from '../travel/liveDestinationAuthority.ts';
import type {
  LiveProviderAdapter,
  LiveProviderSnapshot
} from '../travel/liveProviderIngestion.ts';

export const TRETYAKOV_PROGRAMME_ADAPTER_ID = 'tretyakov-exhibitions-programme-v1' as const;
export const TRETYAKOV_PROGRAMME_PROVIDER_ID = 'tretyakov-programme-official' as const;
export const TRETYAKOV_PROGRAMME_SOURCE_URL =
  'https://www.tretyakovgallery.ru/exhibitions/o/aleksey-bogolyubov-ot-nevy-do-bosfora/' as const;

export const TRETYAKOV_BOGOLYUBOV_EVENT_ID =
  'tretyakov-aleksey-bogolyubov-neva-bosporus' as const;

const TARGET_TITLE = 'Алексей Боголюбов. От Невы до Босфора';

const MONTHS: Record<string, string> = {
  'января': '01',
  'февраля': '02',
  'марта': '03',
  'апреля': '04',
  'мая': '05',
  'июня': '06',
  'июля': '07',
  'августа': '08',
  'сентября': '09',
  'октября': '10',
  'ноября': '11',
  'декабря': '12'
};

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

function cardContext(text: string, title: string) {
  const index = text.indexOf(title);
  if (index < 0) throw new Error(`Tretyakov programme title marker missing: ${title}`);
  return text.slice(Math.max(0, index - 450), Math.min(text.length, index + title.length + 350));
}

function parseDateRange(context: string) {
  const match = context.match(
    /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})\s*—\s*(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i
  );
  if (!match) throw new Error('Tretyakov programme date range not found');

  const startMonth = MONTHS[match[2]!.toLowerCase()];
  const endMonth = MONTHS[match[5]!.toLowerCase()];
  if (!startMonth || !endMonth) throw new Error('Tretyakov programme month mapping failed');

  const pad = (value: string) => value.padStart(2, '0');
  return {
    startsAt: `${match[3]}-${startMonth}-${pad(match[1]!)}T00:00:00+03:00`,
    endsAt: `${match[6]}-${endMonth}-${pad(match[4]!)}T23:59:59+03:00`
  };
}

export function programmeStatusFromTretyakovContext(
  context: string
): LiveOperationalStatus {
  if (/Отмен(?:ено|ена|ён|ен)/i.test(context)) return 'cancelled';
  if (/Архив/i.test(context)) return 'finished';
  if (/Сроки проведения изменены/i.test(context)) return 'rescheduled';
  if (/Уже идет|Скоро будет|Скоро закончится/i.test(context)) return 'scheduled';
  return 'unknown';
}

export function normalizeTretyakovProgrammePage(
  html: string,
  snapshot: LiveProviderSnapshot<string>
): LiveDestinationEntity[] {
  if (!html.trim()) throw new Error('Tretyakov programme source page is empty');
  const text = normalizeHtmlText(html);
  if (!text.includes('Выставки')) throw new Error('Tretyakov programme source identity marker missing');

  const context = cardContext(text, TARGET_TITLE);
  if (!context.includes('Третьяковская галерея')) {
    throw new Error('Tretyakov programme venue marker missing');
  }

  const { startsAt, endsAt } = parseDateRange(context);
  const status = programmeStatusFromTretyakovContext(context);
  if (status === 'unknown') {
    throw new Error('Tretyakov programme explicit status marker missing');
  }

  const fetchedMs = Date.parse(snapshot.fetchedAt);
  if (!Number.isFinite(fetchedMs)) throw new Error('Tretyakov programme snapshot fetchedAt is invalid');

  return [{
    id: TRETYAKOV_BOGOLYUBOV_EVENT_ID,
    providerEntityId: 'aleksey-bogolyubov-neva-bosporus',
    providerId: TRETYAKOV_PROGRAMME_PROVIDER_ID,
    canonicalDestinationNodeId: TRETYAKOV_BOGOLYUBOV_EVENT_ID,
    kind: 'exhibition',
    titleRu: TARGET_TITLE,
    titleEn: 'Alexey Bogolyubov. From the Neva to the Bosphorus',
    titleZh: '阿列克谢·博戈柳博夫：从涅瓦河到博斯普鲁斯海峡',
    tags: ['выставка', 'искусство', 'третьяковская галерея'],
    sourceUrl: snapshot.sourceUrl,
    observedAt: snapshot.fetchedAt,
    expiresAt: new Date(fetchedMs + 30 * 60_000).toISOString(),
    operationalStatus: status,
    startsAt,
    endsAt
  }];
}

export function buildTretyakovProgrammeAdapter(
  sourceUrl = TRETYAKOV_PROGRAMME_SOURCE_URL
): LiveProviderAdapter<string> {
  const provider: LiveDestinationProvider = {
    id: TRETYAKOV_PROGRAMME_PROVIDER_ID,
    name: 'Государственная Третьяковская галерея · выставки',
    relationship: 'official',
    capabilities: ['inventory', 'event-schedule', 'operational-status'],
    sourceUrl,
    attributionRu: 'Источник: Государственная Третьяковская галерея · выставки',
    attributionEn: 'Source: State Tretyakov Gallery · exhibitions',
    attributionZh: '来源：国立特列季亚科夫画廊 · 展览'
  };

  return {
    id: TRETYAKOV_PROGRAMME_ADAPTER_ID,
    destinationId: 'moscow',
    provider,
    refreshPolicy: {
      expectedRefreshSeconds: 15 * 60,
      hardMaxSnapshotAgeSeconds: 60 * 60,
      retryAfterSeconds: 5 * 60
    },
    normalize: (payload, snapshot) =>
      normalizeTretyakovProgrammePage(payload, snapshot)
  };
}
