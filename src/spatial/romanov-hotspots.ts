export type RomanovEra = '1857' | '1859';
export type EvidenceStatus = 'documented' | 'reconstructed' | 'hypothesis';

export type RomanovHotspot = {
  id: string;
  era: RomanovEra | 'both';
  position: [number, number, number];
  evidence: EvidenceStatus;
  sourceIds: string[];
  titleRu: string;
  titleEn: string;
  storyRu: string;
  storyEn: string;
};

export const romanovHotspots: RomanovHotspot[] = [
  {
    id: 'masonry-core',
    era: 'both',
    position: [0, -4.25, 2.25],
    evidence: 'documented',
    sourceIds: ['shm-history', 'mos-archaeology', 'mos-plans'],
    titleRu: 'Каменное ядро палат',
    titleEn: 'Stone core of the chambers',
    storyRu: 'Нижние каменные объёмы относятся к наиболее устойчивой части памятника. Именно сохранённая историческая ткань позволяет использовать современный фасад как опорную геометрию для сравнения эпох.',
    storyEn: 'The lower masonry belongs to the most persistent part of the monument. This surviving historic fabric lets the present facade act as the geometric reference for comparing different eras.'
  },
  {
    id: 'pre-restoration-facade',
    era: '1857',
    position: [0, -4.22, 6.1],
    evidence: 'documented',
    sourceIds: ['timm-1857', 'shm-history'],
    titleRu: 'Фасад до реставрации',
    titleEn: 'Facade before restoration',
    storyRu: 'Изображение 1857 года фиксирует Палаты до масштабной реставрации середины XIX века. В приложении это отдельное пространственное состояние, а не декоративный фильтр поверх современной модели.',
    storyEn: 'An 1857 image records the Chambers before the major mid-nineteenth-century restoration. In the app this is a separate spatial state rather than a decorative filter placed over the current building.'
  },
  {
    id: 'richter-windows',
    era: '1859',
    position: [0, -4.22, 6.35],
    evidence: 'reconstructed',
    sourceIds: ['shm-history', 'shm-1859-graphic', 'naidenov-46'],
    titleRu: 'Белокаменное оформление окон',
    titleEn: 'White-stone window treatment',
    storyRu: 'После начала реставрации под руководством Фёдора Рихтера фасад получил выразительное историзирующее оформление. Его точные размеры ещё должны быть сверены с обмерной документацией, поэтому слой отмечен как исследовательская реконструкция.',
    storyEn: 'During the restoration led by Fyodor Richter the facade acquired a more expressive historicising treatment. Exact dimensions still need to be reconciled with measured documentation, so this layer is labelled as a research reconstruction.'
  },
  {
    id: 'timber-terem',
    era: '1859',
    position: [0, -3.72, 9.45],
    evidence: 'reconstructed',
    sourceIds: ['shm-history', 'naidenov-46'],
    titleRu: 'Верхний деревянный терем',
    titleEn: 'Upper timber terem',
    storyRu: 'Верхний деревянный объём является одним из главных визуальных отличий восстановленного облика Палат. Ранние фотографии после реставрации помогают контролировать силуэт, но финальная геометрия должна пройти экспертную и полевую проверку.',
    storyEn: 'The upper timber volume is one of the clearest visual distinctions of the restored Chambers. Early post-restoration photographs help control its silhouette, while final geometry still requires expert and field verification.'
  },
  {
    id: 'porch-stair',
    era: '1859',
    position: [-7.15, -3.95, 4.3],
    evidence: 'reconstructed',
    sourceIds: ['shm-1859-graphic', 'naidenov-46', 'mos-plans'],
    titleRu: 'Крыльцо и парадная лестница',
    titleEn: 'Porch and ceremonial stair',
    storyRu: 'Наружное крыльцо и лестница формируют главный сценарий подхода к палатам. В production candidate их положение и масса восстановлены исследовательски, а точные ступени, пролёты и профиль арки входят в обязательный список полевого уточнения.',
    storyEn: 'The external porch and stair shape the main approach to the Chambers. In the production candidate their placement and massing are research reconstructions; exact steps, flights and arch profile remain mandatory field-verification items.'
  }
];

export function getRomanovHotspots(era: RomanovEra) {
  return romanovHotspots.filter((hotspot) => hotspot.era === 'both' || hotspot.era === era);
}

export const evidenceLabels = {
  ru: {
    documented: 'Подтверждено источником',
    reconstructed: 'Исследовательская реконструкция',
    hypothesis: 'Гипотеза'
  },
  en: {
    documented: 'Documented evidence',
    reconstructed: 'Research reconstruction',
    hypothesis: 'Hypothesis'
  }
} as const;
