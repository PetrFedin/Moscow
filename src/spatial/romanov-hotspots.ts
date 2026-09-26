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
  titleZh: string;
  storyRu: string;
  storyEn: string;
  storyZh: string;
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
    titleZh: '宅邸的石砌核心',
    storyRu: 'Нижние каменные объёмы относятся к наиболее устойчивой части памятника. Именно сохранённая историческая ткань позволяет использовать современный фасад как опорную геометрию для сравнения эпох.',
    storyEn: 'The lower masonry belongs to the most persistent part of the monument. This surviving historic fabric lets the present facade act as the geometric reference for comparing different eras.',
    storyZh: '下部石砌结构属于古迹中保存最稳定的部分。正是这些仍然存在的历史实体，使今天的立面能够成为比较不同时代的几何参照。'
  },
  {
    id: 'pre-restoration-facade',
    era: '1857',
    position: [0, -4.22, 6.1],
    evidence: 'documented',
    sourceIds: ['timm-1857', 'shm-history'],
    titleRu: 'Фасад до реставрации',
    titleEn: 'Facade before restoration',
    titleZh: '修复前的立面',
    storyRu: 'Изображение 1857 года фиксирует Палаты до масштабной реставрации середины XIX века. В приложении это отдельное пространственное состояние, а не декоративный фильтр поверх современной модели.',
    storyEn: 'An 1857 image records the Chambers before the major mid-nineteenth-century restoration. In the app this is a separate spatial state rather than a decorative filter placed over the current building.',
    storyZh: '1857年的图像记录了19世纪中期大规模修复前的宅邸。在应用中，这不是叠加在现代建筑上的装饰滤镜，而是一个独立的历史空间状态。'
  },
  {
    id: 'richter-windows',
    era: '1859',
    position: [0, -4.22, 6.35],
    evidence: 'reconstructed',
    sourceIds: ['shm-history', 'shm-1859-graphic', 'naidenov-46'],
    titleRu: 'Белокаменное оформление окон',
    titleEn: 'White-stone window treatment',
    titleZh: '白石窗饰',
    storyRu: 'После начала реставрации под руководством Фёдора Рихтера фасад получил выразительное историзирующее оформление. Его точные размеры ещё должны быть сверены с обмерной документацией, поэтому слой отмечен как исследовательская реконструкция.',
    storyEn: 'During the restoration led by Fyodor Richter the facade acquired a more expressive historicising treatment. Exact dimensions still need to be reconciled with measured documentation, so this layer is labelled as a research reconstruction.',
    storyZh: '在费奥多尔·里希特主持的修复中，立面获得了更鲜明的历史主义装饰。精确尺寸仍需与测绘资料核对，因此这一层被标记为学术重建。'
  },
  {
    id: 'timber-terem',
    era: '1859',
    position: [0, -3.72, 9.45],
    evidence: 'reconstructed',
    sourceIds: ['shm-history', 'naidenov-46'],
    titleRu: 'Верхний деревянный терем',
    titleEn: 'Upper timber terem',
    titleZh: '上部木构塔楼',
    storyRu: 'Верхний деревянный объём является одним из главных визуальных отличий восстановленного облика Палат. Ранние фотографии после реставрации помогают контролировать силуэт, но финальная геометрия должна пройти экспертную и полевую проверку.',
    storyEn: 'The upper timber volume is one of the clearest visual distinctions of the restored Chambers. Early post-restoration photographs help control its silhouette, while final geometry still requires expert and field verification.',
    storyZh: '上部木构体量是修复后宅邸最显著的视觉特征之一。早期修复后的照片可用于校核轮廓，但最终几何形态仍需专家与现场验证。'
  },
  {
    id: 'porch-stair',
    era: '1859',
    position: [-7.15, -3.95, 4.3],
    evidence: 'reconstructed',
    sourceIds: ['shm-1859-graphic', 'naidenov-46', 'mos-plans'],
    titleRu: 'Крыльцо и парадная лестница',
    titleEn: 'Porch and ceremonial stair',
    titleZh: '门廊与礼仪楼梯',
    storyRu: 'Наружное крыльцо и лестница формируют главный сценарий подхода к палатам. В production candidate их положение и масса восстановлены исследовательски, а точные ступени, пролёты и профиль арки входят в обязательный список полевого уточнения.',
    storyEn: 'The external porch and stair shape the main approach to the Chambers. In the production candidate their placement and massing are research reconstructions; exact steps, flights and arch profile remain mandatory field-verification items.',
    storyZh: '外部门廊与楼梯构成进入宅邸的主要空间路径。在当前 production candidate 中，其位置和体量属于研究性重建；台阶、梯段与拱券轮廓仍必须通过现场验证。'
  }
];

export type RomanovHotspotVisibilityMode = 'documented' | 'public';

export function getRomanovHotspots(
  era: RomanovEra,
  visibility: RomanovHotspotVisibilityMode = 'public'
) {
  return romanovHotspots.filter((hotspot) => {
    const matchesEra = hotspot.era === 'both' || hotspot.era === era;
    const matchesEvidence = visibility === 'public' || hotspot.evidence === 'documented';
    return matchesEra && matchesEvidence;
  });
}

export function getRomanovHotspotById(id: string) {
  return romanovHotspots.find((hotspot) => hotspot.id === id) ?? null;
}

export function romanovHotspotToViroPosition(
  [x, sourceDepth, sourceHeight]: RomanovHotspot['position']
): [number, number, number] {
  // Research-model coordinates are x / depth / height; Viro is x / height / depth.
  return [x, sourceHeight, sourceDepth];
}

export type RomanovHotspotNarrationLanguage = 'ru' | 'en' | 'zh';

export function buildRomanovHotspotNarration(
  hotspot: RomanovHotspot,
  language: RomanovHotspotNarrationLanguage = 'ru'
) {
  const labels = evidenceLabels[language];
  const title = language === 'ru' ? hotspot.titleRu : language === 'zh' ? hotspot.titleZh : hotspot.titleEn;
  const story = language === 'ru' ? hotspot.storyRu : language === 'zh' ? hotspot.storyZh : hotspot.storyEn;
  return `${title}. ${labels[hotspot.evidence]}. ${story}`;
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
  },
  zh: {
    documented: '有文献依据',
    reconstructed: '学术重建',
    hypothesis: '假设'
  }
} as const;
