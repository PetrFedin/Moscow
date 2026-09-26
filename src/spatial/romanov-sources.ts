export type RomanovSourceRights = 'public-domain' | 'official-reference' | 'needs-rights-review';

export type RomanovSource = {
  id: string;
  titleRu: string;
  titleEn: string;
  titleZh: string;
  year?: string;
  author?: string;
  sourcePage: string;
  mediaUrl?: string;
  rights: RomanovSourceRights;
  supports: Array<'1857' | '1859' | 'masonry' | 'facade' | 'terem' | 'porch' | 'plans' | 'restoration-history'>;
  noteRu: string;
};

export const romanovSources: RomanovSource[] = [
  {
    id: 'timm-1857',
    titleRu: 'Палаты бояр Романовых до реставрации',
    titleEn: 'Romanov Chambers before restoration',
    titleZh: '修复前的罗曼诺夫贵族宅邸',
    year: '1857',
    author: 'В. Тимм',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Палаты_бояр_Романовых._1857.jpg',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/%D0%9F%D0%B0%D0%BB%D0%B0%D1%82%D1%8B_%D0%B1%D0%BE%D1%8F%D1%80_%D0%A0%D0%BE%D0%BC%D0%B0%D0%BD%D0%BE%D0%B2%D1%8B%D1%85._1857.jpg',
    rights: 'public-domain',
    supports: ['1857', 'facade'],
    noteRu: 'Wikimedia Commons маркирует работу как Public Domain и указывает 1857 год, автора В. Тимма и состояние до реставрации.'
  },
  {
    id: 'naidenov-46',
    titleRu: 'Палаты бояр Романовых на Варварке, фото 46',
    titleEn: 'Romanov House on Varvarka, plate 46',
    titleZh: '瓦尔瓦尔卡街罗曼诺夫宅邸，第46图版',
    year: '1883–1884',
    author: 'Н. А. Найдёнов',
    sourcePage: 'https://commons.wikimedia.org/wiki/Category:Views_of_Moscow_by_Nikolay_Naidenov_(1884)',
    mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/N.A.Naidenov_%281884%29._Views_of_Moscow._46._Varvarka.png',
    rights: 'needs-rights-review',
    supports: ['1859', 'facade', 'terem', 'porch'],
    noteRu: 'Категория Wikimedia Commons идентифицирует plate 46 как Палаты бояр Романовых. Перед включением файла в коммерческий офлайн-пакет статус прав фиксируется по карточке конкретного файла.'
  },
  {
    id: 'shm-history',
    titleRu: 'История Палат Романовых и реставрации Рихтера',
    titleEn: 'Romanov Chambers and Richter restoration history',
    titleZh: '罗曼诺夫宅邸与里希特修复史',
    sourcePage: 'https://shm.ru/kollektsii-i-muzeynyy-kompleks/museum_history/palaty-romanovykh/history/',
    rights: 'official-reference',
    supports: ['masonry', 'restoration-history', '1859'],
    noteRu: 'Официальный ГИМ: исследование и реставрация под руководством Ф. Ф. Рихтера, использование его плана как основы реставрации и открытие музея в 1859 году.'
  },
  {
    id: 'shm-1859-graphic',
    titleRu: 'Архитектурная графика Палат, 1859',
    titleEn: 'Romanov Chambers architectural graphic, 1859',
    titleZh: '罗曼诺夫宅邸建筑图，1859年',
    year: '1859',
    sourcePage: 'https://catalog.shm.ru/entity/OBJECT/6323005',
    rights: 'official-reference',
    supports: ['1859', 'facade', 'restoration-history'],
    noteRu: 'Каталожная карточка ГИМ используется как исследовательская ссылка; права на воспроизведение музейного изображения проверяются отдельно.'
  },
  {
    id: 'mos-archaeology',
    titleRu: 'Официальная архитектурно-археологическая документация Москвы',
    titleEn: 'Official Moscow architectural and archaeological documentation',
    titleZh: '莫斯科官方建筑与考古资料',
    sourcePage: 'https://www.mos.ru/upload/documents/files/614/Romanovperd2_6str3.pdf',
    rights: 'official-reference',
    supports: ['masonry', 'plans'],
    noteRu: 'Используется как контрольный официальный источник. Точные размерные данные считаются подтверждёнными только после явного извлечения и проверки соответствующего листа.'
  },
  {
    id: 'mos-plans',
    titleRu: 'Официальные материалы Москвы с планами объекта',
    titleEn: 'Official Moscow material containing monument plans',
    titleZh: '包含古迹平面图的莫斯科官方资料',
    sourcePage: 'https://www.mos.ru/upload/documents/files/8873/25082020_16-31-570_20_Emelyanov_AA_Rojdestvenskaya_SA.pdf',
    rights: 'official-reference',
    supports: ['plans', 'masonry'],
    noteRu: 'Планы используются для последующего метрического контроля. Текущий v1 остаётся provisional до завершения размерной сверки.'
  }
];

export function getRomanovSourcesFor(support: RomanovSource['supports'][number]) {
  return romanovSources.filter((source) => source.supports.includes(support));
}


export function getRomanovSourceById(id: string) {
  return romanovSources.find((source) => source.id === id) ?? null;
}
