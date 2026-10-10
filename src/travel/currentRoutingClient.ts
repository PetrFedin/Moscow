import type { CitywideRouteEndpoint } from './citywideRoutingAuthority.ts';
import {
  projectCurrentRoutingSnapshot
} from './currentRoutingAuthority.ts';

function sameEndpoint(a: CitywideRouteEndpoint, b: CitywideRouteEndpoint) {
  return a.id === b.id
    && Math.abs(a.latitude - b.latitude) < 1e-9
    && Math.abs(a.longitude - b.longitude) < 1e-9;
}

export function buildCurrentWalkingRouteUrl(input: {
  authorityUrl: string;
  from: CitywideRouteEndpoint;
  to: CitywideRouteEndpoint;
}) {
  if (!/^https:\/\//i.test(input.authorityUrl)) {
    throw new Error('Current routing authority URL must use HTTPS');
  }

  const url = new URL(input.authorityUrl);
  url.searchParams.set('fromId', input.from.id);
  url.searchParams.set('fromLat', String(input.from.latitude));
  url.searchParams.set('fromLon', String(input.from.longitude));
  url.searchParams.set('toId', input.to.id);
  url.searchParams.set('toLat', String(input.to.latitude));
  url.searchParams.set('toLon', String(input.to.longitude));
  return url.toString();
}

export async function loadCurrentWalkingRoute(input: {
  authorityUrl: string;
  from: CitywideRouteEndpoint;
  to: CitywideRouteEndpoint;
  nowIso: string;
  fetchImpl?: typeof fetch;
}) {
  if (!Number.isFinite(Date.parse(input.nowIso))) {
    throw new Error('Current routing client requires a valid nowIso');
  }
  if (!input.from.id.trim() || !input.to.id.trim() || input.from.id === input.to.id) {
    throw new Error('Current routing client endpoints are invalid');
  }

  const url = buildCurrentWalkingRouteUrl(input);
  const response = await (input.fetchImpl ?? fetch)(url, {
    method: 'GET',
    headers: { accept: 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Current routing authority HTTP ${response.status}`);
  }

  const result = projectCurrentRoutingSnapshot(await response.json(), input.nowIso);
  if (
    !sameEndpoint(result.snapshot.request.from, input.from)
    || !sameEndpoint(result.snapshot.request.to, input.to)
  ) {
    throw new Error('Current routing authority returned a different route request');
  }

  return result;
}
