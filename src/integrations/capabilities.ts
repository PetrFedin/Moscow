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
    note: 'Нативная карта, маркеры, GeoJSON, поиск, панорамы и пешеходные маршруты. Нужен ключ владельца проекта.'
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
    title: 'AR и 3D · Палаты Романовых',
    provider: 'ViroReact / ARKit / ARCore',
    status: 'field-test',
    note: 'Две локальные GLB-эпохи 1857 и 1859/1883 уже собраны и подключены. Требуются обмеры, полевое совмещение и измерение ошибки.'
  },
  {
    id: 'persistent-anchor',
    title: 'Точная повторяемая привязка сцены',
    provider: 'ReactVision visual cloud anchor / ARCore provider',
    status: 'field-test',
    note: 'GPS-якоря недостаточны для точного фасада. Persistent anchor выбираем после manual field-test на Варварке.'
  },
  {
    id: 'vr',
    title: 'Иммерсивный VR-эпизод',
    provider: 'ViroReact / Meta Quest OpenXR',
    status: 'field-test',
    note: 'Тот же model pack и portal runtime уже подготовлены; нужны Quest build, Meta App ID и устройство для проверки.'
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
  ready: 'Готово',
  'needs-key': 'Нужен ключ',
  'needs-asset': 'Нужен контент/ассет',
  'field-test': 'Нужен полевой тест',
  later: 'Следующий этап'
};
