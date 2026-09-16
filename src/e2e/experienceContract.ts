export type AppSurface = 'discover' | 'map' | 'story' | 'model3d' | 'spatial';
export type SheetState = 'collapsed' | 'preview' | 'expanded';
export type TrustMode = 'documented' | 'public';
export type RomanovEra = '1857' | '1859';
export type SpatialStage =
  | 'searching'
  | 'candidate'
  | 'anchored'
  | 'calibrated'
  | 'verified'
  | 'portal-preview'
  | 'portal-entered';

export type ExperienceState = {
  selectedPlaceId: string;
  surface: AppSurface;
  sheetState: SheetState;
  timeIndex: number;
  era: RomanovEra;
  trustMode: TrustMode;
  spatialStage: SpatialStage;
  portalEntered: boolean;
};

export type ExperienceEvent =
  | { type: 'SELECT_PLACE'; placeId: string }
  | { type: 'OPEN_MAP' }
  | { type: 'SET_SHEET'; state: SheetState }
  | { type: 'OPEN_STORY' }
  | { type: 'SET_TIME'; index: number; era?: RomanovEra }
  | { type: 'SET_TRUST'; trustMode: TrustMode }
  | { type: 'OPEN_3D' }
  | { type: 'OPEN_SPATIAL' }
  | { type: 'SURFACE_CANDIDATE_FOUND' }
  | { type: 'ANCHOR_CREATED' }
  | { type: 'CALIBRATION_SAVED' }
  | { type: 'FIELD_VERIFIED' }
  | { type: 'OPEN_PORTAL_PREVIEW' }
  | { type: 'ENTER_PORTAL' }
  | { type: 'EXIT_PORTAL' }
  | { type: 'BACK_TO_3D' }
  | { type: 'CLOSE_TO_STORY' };

export const initialExperienceState: ExperienceState = {
  selectedPlaceId: 'romanov-chambers',
  surface: 'discover',
  sheetState: 'preview',
  timeIndex: 0,
  era: '1857',
  trustMode: 'public',
  spatialStage: 'searching',
  portalEntered: false
};

export function eraFromTimeIndex(index: number): RomanovEra {
  return index <= 0 ? '1857' : '1859';
}

export function canEnterPortal(stage: SpatialStage) {
  return stage === 'verified' || stage === 'portal-preview';
}

export function reduceExperience(state: ExperienceState, event: ExperienceEvent): ExperienceState {
  switch (event.type) {
    case 'SELECT_PLACE':
      return {
        ...state,
        selectedPlaceId: event.placeId,
        sheetState: 'preview',
        timeIndex: event.placeId === 'romanov-chambers' ? state.timeIndex : 0,
        spatialStage: 'searching',
        portalEntered: false
      };
    case 'OPEN_MAP':
      return { ...state, surface: 'map' };
    case 'SET_SHEET':
      return { ...state, sheetState: event.state };
    case 'OPEN_STORY':
      return { ...state, surface: 'story' };
    case 'SET_TIME': {
      const index = Math.max(0, Math.round(event.index));
      return {
        ...state,
        timeIndex: index,
        era: event.era ?? eraFromTimeIndex(index)
      };
    }
    case 'SET_TRUST':
      return { ...state, trustMode: event.trustMode };
    case 'OPEN_3D':
      return { ...state, surface: 'model3d' };
    case 'OPEN_SPATIAL':
      return {
        ...state,
        surface: 'spatial',
        spatialStage: 'searching',
        portalEntered: false
      };
    case 'SURFACE_CANDIDATE_FOUND':
      if (state.surface !== 'spatial') return state;
      return { ...state, spatialStage: 'candidate' };
    case 'ANCHOR_CREATED':
      if (state.spatialStage !== 'candidate') return state;
      return { ...state, spatialStage: 'anchored' };
    case 'CALIBRATION_SAVED':
      if (state.spatialStage !== 'anchored') return state;
      return { ...state, spatialStage: 'calibrated' };
    case 'FIELD_VERIFIED':
      if (state.spatialStage !== 'calibrated') return state;
      return { ...state, spatialStage: 'verified' };
    case 'OPEN_PORTAL_PREVIEW':
      if (state.spatialStage !== 'verified') return state;
      return { ...state, spatialStage: 'portal-preview' };
    case 'ENTER_PORTAL':
      if (!canEnterPortal(state.spatialStage)) return state;
      return { ...state, spatialStage: 'portal-entered', portalEntered: true };
    case 'EXIT_PORTAL':
      if (!state.portalEntered) return state;
      return { ...state, spatialStage: 'verified', portalEntered: false };
    case 'BACK_TO_3D':
      return { ...state, surface: 'model3d', portalEntered: false };
    case 'CLOSE_TO_STORY':
      return { ...state, surface: 'story', portalEntered: false };
    default:
      return state;
  }
}

export function assertExperienceInvariant(state: ExperienceState) {
  if (!state.selectedPlaceId) throw new Error('selectedPlaceId must be preserved across the journey');
  if (state.timeIndex < 0 || !Number.isFinite(state.timeIndex)) throw new Error('timeIndex must stay finite and non-negative');
  if (state.portalEntered && state.spatialStage !== 'portal-entered') throw new Error('portalEntered requires portal-entered spatial stage');
  if (state.surface !== 'spatial' && state.portalEntered) throw new Error('portal cannot remain entered outside spatial surface');
  return true;
}
