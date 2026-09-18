import { pilotRoute } from '../../data/places.ts';
import { romanovModelCatalog, ROMANOV_MODEL_PACK_VERSION } from '../../spatial/romanovModelCatalog.ts';
import { romanovSources } from '../../spatial/romanov-sources.ts';
import {
  assertRoutePackManifest,
  type RoutePackManifest
} from './routePackManifest.ts';

export const VARVARKA_OFFLINE_PACK_VERSION = `varvarka-offline-v1+${ROMANOV_MODEL_PACK_VERSION}`;
export const ROMANOV_ARCHIVE_1857_ASSET_ID = 'romanov-timm-1857';

export const VARVARKA_REQUIRED_BUNDLED_DATA_IDS = [
  'varvarka-route-data-v1',
  'romanov-hotspots-v1',
  'romanov-sources-v1',
  'romanov-narration-contract-v1'
] as const;

export function createVarvarkaRoutePackManifest(
  locale: 'ru' | 'en',
  downloadedAt = new Date().toISOString()
): RoutePackManifest {
  const archive = romanovSources.find((source) => source.id === 'timm-1857');
  if (!archive?.mediaUrl) throw new Error('Romanov 1857 archive media URL is required for offline pack');

  const manifest: RoutePackManifest = {
    routeId: pilotRoute.id,
    version: VARVARKA_OFFLINE_PACK_VERSION,
    downloadedAt,
    locale,
    files: [
      {
        id: ROMANOV_ARCHIVE_1857_ASSET_ID,
        url: archive.mediaUrl,
        filename: 'romanov-timm-1857.jpg',
        kind: 'image',
        required: true
      }
    ],
    bundled: [
      ...romanovModelCatalog.map((model) => ({
        id: model.id,
        kind: 'model' as const,
        assetPath: model.assetPath,
        required: true
      })),
      ...VARVARKA_REQUIRED_BUNDLED_DATA_IDS.map((id) => ({
        id,
        kind: 'data' as const,
        required: true
      }))
    ]
  };

  return assertRoutePackManifest(manifest);
}

export function getVarvarkaOfflineCoverage(manifest: RoutePackManifest) {
  const available = new Set([
    ...manifest.files.map((asset) => asset.id),
    ...(manifest.bundled ?? []).map((asset) => asset.id)
  ]);

  const required = [
    ROMANOV_ARCHIVE_1857_ASSET_ID,
    ...romanovModelCatalog.map((model) => model.id),
    ...VARVARKA_REQUIRED_BUNDLED_DATA_IDS
  ];

  const missing = required.filter((id) => !available.has(id));
  return {
    complete: missing.length === 0,
    missing,
    requiredCount: required.length,
    availableCount: required.length - missing.length
  };
}
