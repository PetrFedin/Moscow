import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

export type RoutePackManifest = {
  routeId: string;
  version: string;
  downloadedAt: string;
  locale: 'ru' | 'en';
  files: Array<{ id: string; url: string; filename: string; kind: 'image' | 'audio' | 'model' | 'data' }>;
};

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

function packDirectory(routeId: string, locale: string) {
  const directory = new Directory(Paths.document, 'route-packs', routeId, locale);
  if (!directory.exists) directory.create({ intermediates: true });
  return directory;
}

export async function downloadRoutePack(manifest: RoutePackManifest) {
  const directory = packDirectory(manifest.routeId, manifest.locale);

  for (const asset of manifest.files) {
    const target = new File(directory, asset.filename);
    if (target.exists) target.delete();
    await File.downloadFileAsync(asset.url, target, { idempotent: true });
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
  return row ? (JSON.parse(row.manifest_json) as RoutePackManifest) : null;
}

export async function removeRoutePack(routeId: string, locale: 'ru' | 'en') {
  const directory = new Directory(Paths.document, 'route-packs', routeId, locale);
  if (directory.exists) directory.delete();
  const db = await openDb();
  await db.runAsync('DELETE FROM route_packs WHERE route_id = ? AND locale = ?', routeId, locale);
}
