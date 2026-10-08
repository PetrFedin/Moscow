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

function decodeEscaped(value: string) {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\\//g, '/')
    .replace(/\\\"/g, '"');
}

function contextsForTitle(html: string, title: string) {
  const contexts: string[] = [];
  let offset = 0;
  while (offset < html.length) {
    const index = html.indexOf(title, offset);
    if (index < 0) break;
    contexts.push(html.slice(Math.max(0, index - 5000), Math.min(html.length, index + title.length + 30000)));
    offset = index + title.length;
  }
  return contexts;
}

function programmeContext(html: string, title: string) {
  const contexts = contextsForTitle(html, title);
  if (contexts.length === 0) {
    throw new Error(`Tretyakov programme title marker missing: ${title}`);
  }

  const structured = contexts.find((context) =>
    /status(?:_code)?\s*:\s*["']/.test(context)
    || /status(?:_code)?\\?["']?\s*:\s*\\?["']/.test(context)
  );
  return decodeEscaped(structured ?? contexts[contexts.length - 1]!);
}

function parseDateRange(context: string) {
  const structuredStart = context.match(/date_start_format:"(\d{4}-\d{2}-\d{2})T[^"]*"/);
  const structuredEnd = context.match(/date_end:"(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})"/i);

  if (structuredStart && structuredEnd) {
    const endMonth = MONTHS[structuredEnd[2]!.toLowerCase()];
    if (!endMonth) throw new Error('Tretyakov programme month mapping failed');
    return {
      startsAt: `${structuredStart[1]}T00:00:00+03:00`,
      endsAt: `${structuredEnd[3]}-${endMonth}-${structuredEnd[1]!.padStart(2, '0')}T23:59:59+03:00`
    };
  }

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
  const normalized = decodeEscaped(context);
  if (/status_code:"cancelled"|Отмен(?:ено|ена|ён|ен)/i.test(normalized)) return 'cancelled';
  if (/status_code:"archive"|status_code:"finished"|Архив/i.test(normalized)) return 'finished';
  if (/status_code:"rescheduled"|Сроки проведения изменены/i.test(normalized)) return 'rescheduled';
  if (
    /status_code:"current"|status_code:"future"|status:"Уже идет"|status:"Скоро будет"|status:"Скоро закончится"/i.test(normalized)
    || /Уже идет|Скоро будет|Скоро закончится/i.test(normalized)
  ) return 'scheduled';
  return 'unknown';
}

export function normalizeTretyakovProgrammePage(
  html: string,
  snapshot: LiveProviderSnapshot<string>
): LiveDestinationEntity[] {
  if (!html.trim()) throw new Error('Tretyakov programme source page is empty');
  const context = programmeContext(html, TARGET_TITLE);

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
