export type RoutePackAssetKind = 'image' | 'audio' | 'model' | 'data';

export type RoutePackDownloadAsset = {
  id: string;
  url: string;
  filename: string;
  kind: RoutePackAssetKind;
  required?: boolean;
};

export type RoutePackBundledAsset = {
  id: string;
  kind: Extract<RoutePackAssetKind, 'model' | 'data'>;
  assetPath?: string;
  required?: boolean;
};

export type RoutePackManifest = {
  routeId: string;
  version: string;
  downloadedAt: string;
  locale: 'ru' | 'en';
  files: RoutePackDownloadAsset[];
  bundled?: RoutePackBundledAsset[];
};

export function validateRoutePackManifest(manifest: RoutePackManifest) {
  const errors: string[] = [];

  if (!manifest.routeId.trim()) errors.push('routeId is required');
  if (!manifest.version.trim()) errors.push('version is required');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(manifest.downloadedAt)) errors.push('downloadedAt must be ISO-like');

  const ids = new Set<string>();
  const filenames = new Set<string>();

  for (const asset of [...manifest.files, ...(manifest.bundled ?? [])]) {
    if (!asset.id.trim()) {
      errors.push('asset id is required');
      continue;
    }
    if (ids.has(asset.id)) errors.push(`duplicate asset id: ${asset.id}`);
    ids.add(asset.id);
  }

  for (const asset of manifest.files) {
    if (!asset.url.startsWith('https://')) errors.push(`download asset must use https: ${asset.id}`);
    if (!asset.filename.trim() || asset.filename.includes('/') || asset.filename.includes('\\') || asset.filename.includes('..')) {
      errors.push(`unsafe filename: ${asset.id}`);
    }
    if (filenames.has(asset.filename)) errors.push(`duplicate filename: ${asset.filename}`);
    filenames.add(asset.filename);
  }

  return errors;
}

export function assertRoutePackManifest(manifest: RoutePackManifest) {
  const errors = validateRoutePackManifest(manifest);
  if (errors.length > 0) throw new Error(`Invalid route pack manifest: ${errors.join('; ')}`);
  return manifest;
}
