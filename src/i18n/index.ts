import { getLocales } from 'expo-localization';

export type AppLanguage = 'ru' | 'en';

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
    sources: 'Источники'
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
    sources: 'Sources'
  }
} as const;

export function detectLanguage(): AppLanguage {
  const languageCode = getLocales()[0]?.languageCode?.toLowerCase();
  return languageCode === 'ru' ? 'ru' : 'en';
}

export function t(language: AppLanguage) {
  return copy[language];
}
