import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import {
  assertRoutePackManifest,
  type RoutePackManifest
} from './routePackManifest';

export type {
  RoutePackAssetKind,
  RoutePackBundledAsset,
  RoutePackDownloadAsset,
  RoutePackManifest
} from './routePackManifest';

const DB_NAME = 'moscow-offline.db';

async function openDb() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS route_packs (
      route_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      version TEXT NOT NULL,
      downloaded_at TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      PRIMARY KEY (route_id, locale)
    );
  `);
  return db;
}

function packDirectory(routeId: string, locale: string, create = true) {
  const directory = new Directory(Paths.document, 'route-packs', routeId, locale);
  if (create && !directory.exists) directory.create({ intermediates: true });
  return directory;
}

export async function downloadRoutePack(manifest: RoutePackManifest) {
  assertRoutePackManifest(manifest);
  const directory = packDirectory(manifest.routeId, manifest.locale);

  try {
    for (const asset of manifest.files) {
      const target = new File(directory, asset.filename);
      if (target.exists) target.delete();
      await File.downloadFileAsync(asset.url, target, { idempotent: true });
    }
  } catch (error) {
    for (const asset of manifest.files) {
      const target = new File(directory, asset.filename);
      if (target.exists) target.delete();
    }
    throw error;
  }

  const db = await openDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO route_packs(route_id, locale, version, downloaded_at, manifest_json)
     VALUES (?, ?, ?, ?, ?)`,
    manifest.routeId,
    manifest.locale,
    manifest.version,
    manifest.downloadedAt,
    JSON.stringify(manifest)
  );

  return directory.uri;
}

export async function getDownloadedRoutePack(routeId: string, locale: 'ru' | 'en') {
  const db = await openDb();
  const row = await db.getFirstAsync<{ manifest_json: string }>(
    'SELECT manifest_json FROM route_packs WHERE route_id = ? AND locale = ?',
    routeId,
    locale
  );
  if (!row) return null;
  const manifest = JSON.parse(row.manifest_json) as RoutePackManifest;
  return assertRoutePackManifest(manifest);
}

export async function getDownloadedRoutePackAssetUri(
  routeId: string,
  locale: 'ru' | 'en',
  assetId: string
) {
  const manifest = await getDownloadedRoutePack(routeId, locale);
  const asset = manifest?.files.find((item) => item.id === assetId);
  if (!asset) return null;

  const directory = packDirectory(routeId, locale, false);
  if (!directory.exists) return null;
  const target = new File(directory, asset.filename);
  return target.exists ? target.uri : null;
}

export async function getDownloadedRoutePackAssetUriWithLocaleFallback(
  routeId: string,
  locale: 'ru' | 'en',
  assetId: string
) {
  const preferred = await getDownloadedRoutePackAssetUri(routeId, locale, assetId);
  if (preferred) return preferred;
  return getDownloadedRoutePackAssetUri(routeId, locale === 'ru' ? 'en' : 'ru', assetId);
}

export async function removeRoutePack(routeId: string, locale: 'ru' | 'en') {
  const directory = packDirectory(routeId, locale, false);
  if (directory.exists) directory.delete();
  const db = await openDb();
  await db.runAsync('DELETE FROM route_packs WHERE route_id = ? AND locale = ?', routeId, locale);
}
