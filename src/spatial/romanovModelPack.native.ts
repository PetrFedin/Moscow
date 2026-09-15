import type { ImageSourcePropType } from 'react-native';
import type { RomanovEra } from './romanov-hotspots';

export type RomanovTrustMode = 'documented' | 'public';
export type RomanovRuntimeMode = 'model3d' | 'ar' | 'vr';

export type RomanovModelVariant = {
  id: string;
  era: RomanovEra;
  trustMode: RomanovTrustMode;
  source: ImageSourcePropType;
  version: number;
  sourceIds: string[];
  allowedRuntimeModes: RomanovRuntimeMode[];
};

/**
 * Authoritative native model pack for the Romanov pilot.
 *
 * A variant can be rendered by the inspection viewer, phone AR or Quest VR,
 * but the underlying GLB is selected here exactly once. This prevents runtime
 * surfaces from silently drifting to different historical model versions.
 */
export const romanovModelPack: RomanovModelVariant[] = [
  {
    id: 'romanov-1857-documented-v1',
    era: '1857',
    trustMode: 'documented',
    source: require('../../assets/models/romanov-1857-documented-v1.glb'),
    version: 1,
    sourceIds: ['timm-1857'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  },
  {
    id: 'romanov-1857-public-v1',
    era: '1857',
    trustMode: 'public',
    source: require('../../assets/models/romanov-1857-public-v1.glb'),
    version: 1,
    sourceIds: ['timm-1857'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  },
  {
    id: 'romanov-1859-documented-v1',
    era: '1859',
    trustMode: 'documented',
    source: require('../../assets/models/romanov-1859-documented-v1.glb'),
    version: 1,
    sourceIds: ['naidenov-46', 'shm-romanov'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  },
  {
    id: 'romanov-1859-public-v1',
    era: '1859',
    trustMode: 'public',
    source: require('../../assets/models/romanov-1859-public-v1.glb'),
    version: 1,
    sourceIds: ['naidenov-46', 'shm-romanov'],
    allowedRuntimeModes: ['model3d', 'ar', 'vr']
  }
];

export function getRomanovModelVariant(era: RomanovEra, trustMode: RomanovTrustMode): RomanovModelVariant {
  const variant = romanovModelPack.find((item) => item.era === era && item.trustMode === trustMode);
  if (!variant) throw new Error(`Romanov model variant missing: ${era}/${trustMode}`);
  return variant;
}

export function getRomanovModelSource(era: RomanovEra, trustMode: RomanovTrustMode): ImageSourcePropType {
  return getRomanovModelVariant(era, trustMode).source;
}
