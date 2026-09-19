export type RomanovControlPointPurpose = 'alignment' | 'quality-check';

export type RomanovControlPoint = {
  id: string;
  labelRu: string;
  labelEn: string;
  purpose: RomanovControlPointPurpose;
  state: 'pending-survey' | 'measured' | 'verified';
  notes: string;
};

export const ROMANOV_CONTROL_POINT_SET = {
  id: 'romanov-facade-control-points-v1',
  version: 1,
  requiredPoints: 5,
  requiredAlignmentPoints: 3
} as const;

export type RomanovControlPointBinding = {
  controlPointSetId: typeof ROMANOV_CONTROL_POINT_SET.id;
  controlPointSetVersion: typeof ROMANOV_CONTROL_POINT_SET.version;
};

export const currentRomanovControlPointBinding: RomanovControlPointBinding = {
  controlPointSetId: ROMANOV_CONTROL_POINT_SET.id,
  controlPointSetVersion: ROMANOV_CONTROL_POINT_SET.version
};

export function isCurrentRomanovControlPointBinding(
  value?: Partial<RomanovControlPointBinding> | null
) {
  return Boolean(
    value
    && value.controlPointSetId === currentRomanovControlPointBinding.controlPointSetId
    && value.controlPointSetVersion === currentRomanovControlPointBinding.controlPointSetVersion
  );
}

/**
 * Pre-registered façade features for the first field survey.
 *
 * They are deliberately NOT marked measured or verified here. Their geometry becomes
 * release-authoritative only when a survey packet contains measured model/world
 * coordinates and the packet passes the survey gate.
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
