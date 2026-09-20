import type { PersistentAnchorProvider } from './persistentAnchor.ts';

export type PersistentAnchorRuntimeConfig = {
  provider: PersistentAnchorProvider;
  configured: boolean;
  ttlDays: number;
};

export function parsePersistentAnchorProvider(value?: string | null): PersistentAnchorProvider {
  return value === 'reactvision' || value === 'arcore' ? value : 'none';
}

export function parsePersistentAnchorTtlDays(value?: string | null) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(1, Math.min(365, Math.round(numeric)));
}

export function getPersistentAnchorRuntimeConfig(
  env: Record<string, string | undefined> = process.env
): PersistentAnchorRuntimeConfig {
  const provider = parsePersistentAnchorProvider(env.EXPO_PUBLIC_SPATIAL_ANCHOR_PROVIDER);
  return {
    provider,
    configured: provider !== 'none',
    ttlDays: parsePersistentAnchorTtlDays(env.EXPO_PUBLIC_SPATIAL_ANCHOR_TTL_DAYS)
  };
}
