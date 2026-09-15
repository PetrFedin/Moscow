export type RomanovControlPoint = {
  id: string;
  labelRu: string;
  labelEn: string;
  purpose: 'alignment' | 'quality-check';
  state: 'pending-survey' | 'measured' | 'verified';
  imagePixel?: [number, number];
  modelPointMeters?: [number, number, number];
  notes: string;
};

/**
 * Stable architectural candidates for the first field survey.
 * Coordinates are deliberately absent until they are measured on site / in the verified model.
 */
export const romanovControlPoints: RomanovControlPoint[] = [
  {
    id: 'main-volume-left-corner',
    labelRu: 'Левый угол основного каменного объёма',
    labelEn: 'Left corner of the main masonry volume',
    purpose: 'alignment',
    state: 'pending-survey',
    notes: 'Use only if the masonry corner is clearly visible from the approved viewpoint.'
  },
  {
    id: 'main-volume-right-corner',
    labelRu: 'Правый угол основного каменного объёма',
    labelEn: 'Right corner of the main masonry volume',
    purpose: 'alignment',
    state: 'pending-survey',
    notes: 'Paired with the opposite corner to constrain scale and horizontal rotation.'
  },
  {
    id: 'stable-window-opening',
    labelRu: 'Стабильный оконный проём фасада',
    labelEn: 'Stable façade window opening',
    purpose: 'alignment',
    state: 'pending-survey',
    notes: 'The exact opening must be selected only after comparing the verified model with the current façade.'
  },
  {
    id: 'plinth-reference-line',
    labelRu: 'Линия цоколя / подклета',
    labelEn: 'Plinth / undercroft reference line',
    purpose: 'quality-check',
    state: 'pending-survey',
    notes: 'Used to validate vertical placement after the primary alignment points are matched.'
  },
  {
    id: 'roof-reference-edge',
    labelRu: 'Устойчивый край кровли',
    labelEn: 'Stable roof reference edge',
    purpose: 'quality-check',
    state: 'pending-survey',
    notes: 'Use as a secondary check only; do not use temporary attachments or vegetation.'
  }
];
