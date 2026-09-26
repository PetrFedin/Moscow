export type AppLanguage = 'ru' | 'en' | 'zh';

export const DEFAULT_LANGUAGE: AppLanguage = 'ru';
export const SUPPORTED_LANGUAGES: AppLanguage[] = ['ru', 'en', 'zh'];

const copy = {
  ru: {
    discover: 'Открыть',
    map: 'Карта',
    route: 'Прогулка',
    saved: 'Находки',
    profile: 'Профиль',
    nearby: 'Рядом со мной',
    listen: 'Слушать',
    stopAudio: 'Остановить',
    download: 'Скачать прогулку',
    downloaded: 'Доступно офлайн',
    timeMachine: 'Машина времени',
    lens: 'Линза времени',
    sources: 'Источники',
    languageName: 'Русский'
  },
  en: {
    discover: 'Discover',
    map: 'Map',
    route: 'Walk',
    saved: 'Discoveries',
    profile: 'Profile',
    nearby: 'Near me',
    listen: 'Listen',
    stopAudio: 'Stop',
    download: 'Download walk',
    downloaded: 'Available offline',
    timeMachine: 'Time machine',
    lens: 'Time lens',
    sources: 'Sources',
    languageName: 'English'
  },
  zh: {
    discover: '发现',
    map: '地图',
    route: '路线',
    saved: '收藏',
    profile: '个人',
    nearby: '附近',
    listen: '收听',
    stopAudio: '停止',
    download: '下载路线',
    downloaded: '可离线使用',
    timeMachine: '时光机',
    lens: '时间之镜',
    sources: '来源',
    languageName: '中文'
  }
} as const;

/**
 * Russian is the product's editorial source language and cold-start default.
 * The user's explicit saved choice overrides it after hydration.
 */
export function detectLanguage(): AppLanguage {
  return DEFAULT_LANGUAGE;
}

export function nextLanguage(language: AppLanguage): AppLanguage {
  const index = SUPPORTED_LANGUAGES.indexOf(language);
  return SUPPORTED_LANGUAGES[(index + 1) % SUPPORTED_LANGUAGES.length] ?? DEFAULT_LANGUAGE;
}

export function speechLocale(language: AppLanguage) {
  if (language === 'zh') return 'zh-CN';
  if (language === 'en') return 'en-US';
  return 'ru-RU';
}

export function t(language: AppLanguage) {
  return copy[language];
}
