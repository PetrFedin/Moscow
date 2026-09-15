export type CapabilityStatus = 'ready' | 'needs-key' | 'needs-asset' | 'field-test' | 'later';

export type Capability = {
  id: string;
  title: string;
  provider: string;
  status: CapabilityStatus;
  note: string;
};

export const capabilities: Capability[] = [
  {
    id: 'map',
    title: 'Интерактивная карта Москвы',
    provider: 'Yandex MapKit',
    status: 'needs-key',
    note: 'Нативная карта, маркеры, GeoJSON, поиск, панорамы и пешеходные маршруты.'
  },
  {
    id: 'historical-tiles',
    title: 'Исторические слои карты',
    provider: 'Yandex MapKit UrlTile / GeoJSON',
    status: 'needs-asset',
    note: 'Нужны подготовленные и лицензированные исторические тайлы или векторные данные.'
  },
  {
    id: 'audio',
    title: 'Аудиогид',
    provider: 'Expo Speech + Expo Audio',
    status: 'ready',
    note: 'TTS доступен сразу; мастер-озвучку можно хранить в офлайн-пакете маршрута.'
  },
  {
    id: 'offline',
    title: 'Офлайн-контент',
    provider: 'Expo FileSystem + SQLite',
    status: 'ready',
    note: 'Истории, изображения, аудио и 3D можно скачивать заранее. Офлайн-карта MapKit лицензируется отдельно.'
  },
  {
    id: 'ar',
    title: 'AR и 3D',
    provider: 'ViroReact / ARKit / ARCore',
    status: 'needs-asset',
    note: 'Runtime подключён; нужна первая оптимизированная GLB-сцена и калибровка.'
  },
  {
    id: 'persistent-anchor',
    title: 'Точная повторяемая привязка сцены',
    provider: 'ReactVision visual cloud anchor / ARCore provider',
    status: 'field-test',
    note: 'GPS-якоря недостаточны для точного фасада. Выбор делаем после полевых испытаний.'
  },
  {
    id: 'vr',
    title: 'Иммерсивный VR-эпизод',
    provider: 'ViroReact / Meta Quest OpenXR',
    status: 'needs-asset',
    note: 'Поддерживается той же TypeScript-сценой; Quest build включается после получения Meta App ID.'
  },
  {
    id: 'localization',
    title: 'Русский / английский',
    provider: 'Expo Localization',
    status: 'ready',
    note: 'Язык устройства определяется автоматически; исторические тексты проходят редакционную локализацию.'
  }
];

export const statusLabels: Record<CapabilityStatus, string> = {
  ready: 'Готово к разработке',
  'needs-key': 'Нужен ключ',
  'needs-asset': 'Нужен контент/ассет',
  'field-test': 'Нужен полевой тест',
  later: 'Следующий этап'
};
