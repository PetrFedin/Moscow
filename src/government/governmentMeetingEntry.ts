export type GovernmentMeetingEntryMode =
  | 'overview'
  | 'guided'
  | 'package';

export function parseGovernmentMeetingEntryUrl(
  rawUrl: string | null | undefined
): GovernmentMeetingEntryMode | null {
  if (!rawUrl?.trim()) return null;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const raw = url.searchParams.get('cityPilot');
  if (raw === null) return null;

  const value = raw.trim().toLowerCase();
  if (value === '' || value === '1' || value === 'true' || value === 'overview') {
    return 'overview';
  }
  if (value === 'guided' || value === 'meeting') return 'guided';
  if (value === 'package' || value === 'data-room' || value === 'dataroom') {
    return 'package';
  }
  return null;
}

export function buildGovernmentMeetingUrl(
  origin: string,
  mode: GovernmentMeetingEntryMode
) {
  const url = new URL(origin);
  url.searchParams.set('cityPilot', mode);
  return url.toString();
}
