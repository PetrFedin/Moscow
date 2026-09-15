export type EvidenceLevel = 'documented' | 'reconstructed' | 'hypothesis';

export type HistoricalPeriod = {
  id: string;
  label: string;
  year: string;
  summary: string;
  confidence: EvidenceLevel;
};

export type PlaceSource = {
  label: string;
  url: string;
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
  experienceMinutes: number;
  arReady: boolean;
  vrReady: boolean;
  highlights: string[];
  sources: PlaceSource[];
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
    experienceMinutes: 9,
    arReady: false,
    vrReady: false,
    highlights: [
      'сравнить фасады до и после реставрационных преобразований XIX века',
      'увидеть, какие элементы подтверждены архивными изображениями',
      'связать историю дома с историей самой Варварки'
    ],
    sources: [
      { label: 'Государственный исторический музей', url: 'https://shm.ru/museum/pbr/' },
      { label: 'Wikimedia Commons — архивный вид 1857', url: 'https://commons.wikimedia.org/wiki/File:Палаты_бояр_Романовых._1857.jpg' },
      { label: 'Wikimedia Commons — Найдёнов, 1884', url: 'https://commons.wikimedia.org/wiki/File:N.A.Naidenov_(1884)._Views_of_Moscow._46._Varvarka.png' }
    ],
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
    experienceMinutes: 8,
    arReady: false,
    vrReady: false,
    highlights: [
      'понять, почему здесь появился английский торговый двор',
      'увидеть связь здания с международной торговлей Москвы',
      'перейти от истории архитектуры к истории повседневной жизни'
    ],
    sources: [
      { label: 'Парк Зарядье — музей Старый Английский двор', url: 'https://www.zaryadyepark.ru/services/angliyskiy-dvor/' }
    ],
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
    experienceMinutes: 7,
    arReady: false,
    vrReady: false,
    highlights: [
      'увидеть утраченный элемент городской границы в масштабе современного пространства',
      'понять, где проходила стена Китай-города',
      'сопоставить старую структуру улиц с сегодняшней площадью'
    ],
    sources: [
      { label: 'Узнай Москву — городской исторический проект', url: 'https://um.mos.ru/' }
    ],
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
