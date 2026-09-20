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
    id: 'church-st-barbara',
    title: 'Храм Варвары Великомученицы',
    subtitle: 'Храм, который дал имя Варварке',
    district: 'Китай-город',
    latitude: 55.75232,
    longitude: 37.62594,
    shortStory: 'Западный вход в прогулку: через один участок видно, как Варварка сохраняет память XVI века внутри классицистического города конца XVIII — начала XIX века.',
    tags: ['архитектура', 'торговля', 'Варварка'],
    experienceMinutes: 6,
    arReady: false,
    vrReady: false,
    highlights: [
      'узнать, почему улица получила название Варварка',
      'связать первый каменный храм 1514 года с богатыми сурожскими купцами',
      'увидеть, как новый храм Родиона Казакова сохранил место и фундамент более ранней церкви'
    ],
    sources: [
      { label: 'Мосгорнаследие — историко-культурная экспертиза храма Варвары', url: 'https://www.mos.ru/upload/documents/files/6187/AKT-GIKE-Krasnaya-pl-d5-ispravlennii.pdf' },
      { label: '«Московское наследие» — церкви Варварки', url: 'https://www.mos.ru/upload/documents/files/3331/MN_3_2017_finalfinal.pdf' }
    ],
    periods: [
      {
        id: 'st-barbara-1514',
        label: 'Первый каменный храм',
        year: '1514',
        summary: 'Каменная церковь Варвары была построена Алевизом Новым по заказу богатых сурожских купцов. Именно с этим храмом источники связывают закрепление названия Варварки.',
        confidence: 'documented'
      },
      {
        id: 'st-barbara-1804',
        label: 'Классицистический храм',
        year: '1796–1804',
        summary: 'Существующее здание возвели по проекту Родиона Казакова на основании более раннего храма. Так одна точка соединяет разные архитектурные эпохи улицы.',
        confidence: 'documented'
      }
    ]
  },
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
    shortStory: 'Вторая пространственная сцена пилота: история здания связывает торговую Москву XVI–XVII веков, русско-английские отношения, позднейшие перестройки и реставрационное возвращение памятника.',
    tags: ['торговля', 'Зарядье', 'городская жизнь'],
    experienceMinutes: 8,
    arReady: false,
    vrReady: false,
    highlights: [
      'понять, почему на Варварке появилось официальное английское торговое подворье',
      'увидеть разницу между документированной историей здания и реставрационной реконструкцией его раннего облика',
      'проследить, как памятник из торгового двора превратился в современный музей'
    ],
    sources: [
      { label: 'Парк «Зарядье» — Старый Английский двор', url: 'https://welcome.zaryadyepark.ru/map' },
      { label: 'Музей Москвы — история Старого Английского двора', url: 'https://mosmuseum.ru/news/p/staryiy-angliyskiy-dvor-stanet-chastyu-parka-zaryade/' },
      { label: 'Музей Москвы — реставрация и музейная экспозиция', url: 'https://mosmuseum.ru/news/p/muzey-moskvyi-otkryil-staryiy-angliyskiy-dvor-posle-restavratsii/' }
    ],
    periods: [
      {
        id: 'english-court-1556',
        label: 'Английское подворье',
        year: '1556',
        summary: 'После создания Московской компании английские купцы получили двор на Варварке. Здание стало одной из ключевых точек ранних русско-английских торговых и дипломатических связей.',
        confidence: 'documented'
      },
      {
        id: 'english-court-1960s',
        label: 'Возвращение памятника',
        year: '1960-е',
        summary: 'Пётр Барановский распознал древние палаты за позднейшими перестройками и добился их сохранения. Нынешнее восприятие раннего облика связано с научной реставрацией, поэтому этот слой маркируется как реконструкция.',
        confidence: 'reconstructed'
      },
      {
        id: 'english-court-1994',
        label: 'Открытие музея',
        year: '1994',
        summary: 'В восстановленных палатах открылся музей русско-английских связей; в церемонии открытия участвовала королева Великобритании Елизавета II.',
        confidence: 'documented'
      }
    ]
  },
  {
    id: 'znamensky-cathedral',
    title: 'Знаменский собор',
    subtitle: 'Собор Старого Государева двора',
    district: 'Китай-город',
    latitude: 55.752444,
    longitude: 37.628774,
    shortStory: 'Собор связывает Варварку с Знаменским монастырём, старой усадьбой Романовых и масштабной реставрацией XX века — здесь особенно хорошо видно, как исторический образ города возвращался после утрат.',
    tags: ['архитектура', 'Романовы', 'реставрация'],
    experienceMinutes: 7,
    arReady: false,
    vrReady: false,
    highlights: [
      'увидеть центр ансамбля Знаменского монастыря на территории Старого Государева двора',
      'понять связь монастыря с усадьбой Романовых и царским покровительством',
      'сравнить собор XVII века с его советскими переделками и научной реставрацией 1960–1970-х годов'
    ],
    sources: [
      { label: 'Мосгорнаследие — исторические сведения по Зарядью', url: 'https://www.mos.ru/upload/documents/oiv/zaryade_26062017_.pdf' },
      { label: '«Московское наследие» — Знаменский монастырь', url: 'https://www.mos.ru/upload/documents/files/1/Moskovskoenasledie32.pdf' }
    ],
    periods: [
      {
        id: 'znamensky-1684',
        label: 'Собор XVII века',
        year: '1679–1684',
        summary: 'Существующий собор был построен в 1679–1684 годах и стал композиционным центром Знаменского монастыря.',
        confidence: 'documented'
      },
      {
        id: 'znamensky-1970s',
        label: 'Возвращение исторического облика',
        year: '1960–1970-е',
        summary: 'После утрат и приспособлений советского времени собор прошёл научную реставрацию, ориентированную на образ здания конца XVII века.',
        confidence: 'documented'
      }
    ]
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
  durationMinutes: 55,
  distanceKm: 1.2,
  stopIds: [
    'church-st-barbara',
    'old-english-court',
    'romanov-chambers',
    'znamensky-cathedral',
    'varvarka-gates'
  ]
};
