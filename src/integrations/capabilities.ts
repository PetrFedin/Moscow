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
    note: 'Нативная карта, маркеры, GeoJSON, поиск, панорамы и пешеходные маршруты. Нужен отдельный MapKit API key владельца проекта.'
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
    provider: 'Expo Audio + Expo Speech fallback',
    status: 'needs-asset',
    note: 'RU/EN scripts and transcripts are versioned. TTS is an explicit fallback only; production readiness requires human master files with narrator/rights evidence, duration and SHA-256.'
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
    note: 'Две локальные GLB-эпохи 1857 и 1859/1883 уже собраны и подключены. Требуются измеренные 5 фасадных точек, полевое совмещение и residual-тест 5/10/15 м.'
  },
  {
    id: 'persistent-anchor',
    title: 'Точная повторяемая привязка сцены',
    provider: 'Viro Cloud Anchors / ARCore provider',
    status: 'field-test',
    note: 'Отдельный gate от карты: сначала complete field matrix минимум на 2 iOS + 2 Android, затем provider credentials и независимый host/resolve тест. MapKit key сам по себе persistent anchor не включает.'
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
