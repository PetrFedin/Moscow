export type HistoricalPeriod = {
  id: string;
  label: string;
  year: string;
  summary: string;
  confidence: 'documented' | 'reconstructed' | 'hypothesis';
};

export type Place = {
  id: string;
  title: string;
  subtitle: string;
  district: string;
  latitude: number;
  longitude: number;
  shortStory: string;
  tags: string[];
  periods: HistoricalPeriod[];
};

export const places: Place[] = [
  {
    id: 'romanov-chambers',
    title: 'Палаты бояр Романовых',
    subtitle: 'Дом, который менялся вместе с Варваркой',
    district: 'Китай-город',
    latitude: 55.75193,
    longitude: 37.62845,
    shortStory: 'Стартовая точка пилота: история здания раскрывается через документированные состояния, архивные изображения и будущую пространственную реконструкцию.',
    tags: ['архитектура', 'XVII век', 'Варварка'],
    periods: [
      {
        id: 'romanov-1857',
        label: 'До реставрации',
        year: '1857',
        summary: 'Архивный вид используется как документальное основание для сравнения состояния палат до реставрационных изменений.',
        confidence: 'documented'
      },
      {
        id: 'romanov-1883',
        label: 'После преобразований XIX века',
        year: '1883',
        summary: 'Фотографическое состояние конца XIX века позволяет показать изменения фасадов и городского окружения.',
        confidence: 'documented'
      }
    ]
  },
  {
    id: 'old-english-court',
    title: 'Старый Английский двор',
    subtitle: 'Торговая Москва и международные связи',
    district: 'Зарядье',
    latitude: 55.75139,
    longitude: 37.62788,
    shortStory: 'Вторая пространственная сцена пилота: не только архитектура, но и история торговли, людей, предметов и городской повседневности.',
    tags: ['торговля', 'Зарядье', 'городская жизнь'],
    periods: []
  },
  {
    id: 'varvarka-gates',
    title: 'Варварские ворота',
    subtitle: 'Исчезнувшая граница Китай-города',
    district: 'Китай-город',
    latitude: 55.7541,
    longitude: 37.6325,
    shortStory: 'Точка для демонстрации исчезнувшей городской структуры и связи исторической карты с современным пространством.',
    tags: ['утрачено', 'городская стена', 'AR'],
    periods: []
  }
];

export const pilotRoute = {
  id: 'varvarka-zaryadye-pilot',
  title: 'Варварка: улица, которая помнит несколько Москв',
  durationMinutes: 45,
  distanceKm: 1.2,
  stopIds: ['romanov-chambers', 'old-english-court', 'varvarka-gates']
};
