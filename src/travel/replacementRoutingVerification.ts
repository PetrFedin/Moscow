import {
  projectCitywideRoutingFeed,
  type CitywideRoutingFeed
} from './citywideRoutingAuthority.ts';
import {
  geometryEvidenceToRouteEndpoint,
  resolveCanonicalGeometry
} from './canonicalGeometryAuthority.ts';
import {
  loadCurrentWalkingRoute
} from './currentRoutingClient.ts';
import type {
  DayReplacementProposal,
  DayReplacementRouteRequirement
} from './dayReplacementProposal.ts';
import type {
  LiveDestinationProjectionEntity
} from './liveDestinationAuthority.ts';

export type ReplacementRoutingVerification =
  | {
      status: 'verified';
      projection: ReturnType<typeof projectCitywideRoutingFeed>;
      rawResponseSha256: string[];
      geometryEvidenceRefs: string[];
    }
  | {
      status: 'blocked';
      blocker: 'geometry-missing';
      missingNodeIds: string[];
    };

function requirements(proposal: DayReplacementProposal) {
  return [
    proposal.routeRequirements.inbound,
    proposal.routeRequirements.outbound
  ].filter(
    (value): value is DayReplacementRouteRequirement => Boolean(value)
  );
}

export async function verifyDayReplacementProposalRouting(input: {
  proposal: DayReplacementProposal;
  authorityUrl: string;
  liveEntities?: ReadonlyArray<LiveDestinationProjectionEntity>;
  nowIso: string;
  fetchImpl?: typeof fetch;
}): Promise<ReplacementRoutingVerification> {
  if (!Number.isFinite(Date.parse(input.nowIso))) {
    throw new Error('Replacement routing verification requires a valid nowIso');
  }

  const routeRequirements = requirements(input.proposal);
  if (routeRequirements.length === 0) {
    throw new Error('Replacement proposal has no route requirements to verify');
  }

  const geometryByNodeId = new Map<string, ReturnType<typeof resolveCanonicalGeometry>>();
  const missing = new Set<string>();

  for (const requirement of routeRequirements) {
    for (const nodeId of [requirement.fromNodeId, requirement.toNodeId]) {
      if (geometryByNodeId.has(nodeId)) continue;
      const geometry = resolveCanonicalGeometry({
        canonicalNodeId: nodeId,
        liveEntities: input.liveEntities
      });
      geometryByNodeId.set(nodeId, geometry);
      if (!geometry) missing.add(nodeId);
    }
  }

  if (missing.size > 0) {
    return {
      status: 'blocked',
      blocker: 'geometry-missing',
      missingNodeIds: [...missing].sort()
    };
  }

  const results = [];
  for (const requirement of routeRequirements) {
    const fromGeometry = geometryByNodeId.get(requirement.fromNodeId)!;
    const toGeometry = geometryByNodeId.get(requirement.toNodeId)!;
    if (!fromGeometry || !toGeometry) {
      throw new Error('Replacement routing geometry unexpectedly missing');
    }

    results.push(await loadCurrentWalkingRoute({
      authorityUrl: input.authorityUrl,
      from: geometryEvidenceToRouteEndpoint(fromGeometry),
      to: geometryEvidenceToRouteEndpoint(toGeometry),
      nowIso: input.nowIso,
      ...(input.fetchImpl ? { fetchImpl: input.fetchImpl } : {})
    }));
  }

  const providers = new Map<string, CitywideRoutingFeed['providers'][number]>();
  const observations: CitywideRoutingFeed['observations'] = [];
  const rawResponseSha256: string[] = [];
  const geometryEvidenceRefs = new Set<string>();
  let generatedAtMs = Date.parse(input.nowIso);

  for (const result of results) {
    rawResponseSha256.push(result.snapshot.rawResponseSha256);

    for (const provider of result.snapshot.feed.providers) {
      providers.set(provider.id, provider);
    }
    for (const observation of result.snapshot.feed.observations) {
      observations.push(observation);
      generatedAtMs = Math.max(generatedAtMs, Date.parse(observation.observedAt));
    }

    for (const endpoint of [
      result.snapshot.request.from,
      result.snapshot.request.to
    ]) {
      const geometry = geometryByNodeId.get(endpoint.id);
      if (geometry) geometryEvidenceRefs.add(geometry.source.evidenceRef);
    }
  }

  const feed: CitywideRoutingFeed = {
    schemaVersion: 1,
    destinationId: 'moscow',
    generatedAt: new Date(generatedAtMs).toISOString(),
    providers: [...providers.values()],
    observations
  };

  const projectionAsOf = new Date(generatedAtMs).toISOString();

  return {
    status: 'verified',
    projection: projectCitywideRoutingFeed(feed, projectionAsOf),
    rawResponseSha256,
    geometryEvidenceRefs: [...geometryEvidenceRefs].sort()
  };
}
