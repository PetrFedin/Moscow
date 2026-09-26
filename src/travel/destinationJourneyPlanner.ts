import type {
  BookingHandoff,
  DestinationPackage,
  DestinationRoute,
  ExperienceNode,
  ExperienceNodeKind
} from './destinationPackage.ts';

export type DestinationJourneyIntent = {
  budgetMinutes: number;
  themes?: string[];
  requiredNodeIds?: string[];
  preferredKinds?: ExperienceNodeKind[];
};

export type DestinationJourneyPlan =
  | {
      status: 'ready';
      destinationId: string;
      routeId: string;
      estimatedMinutes: number;
      nodeIds: string[];
      bookingHandoffs: Array<{ nodeId: string; booking: BookingHandoff }>;
      explanation: string[];
    }
  | {
      status: 'needs-routing-authority';
      destinationId: string;
      suggestedNodeIds: string[];
      explanation: string[];
    }
  | {
      status: 'no-match';
      destinationId: string;
      explanation: string[];
    };

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU');
}

function overlapScore(values: string[], requested: string[]) {
  if (requested.length === 0) return 0;
  const normalized = new Set(values.map(normalize));
  return requested.reduce((score, value) => score + (normalized.has(normalize(value)) ? 1 : 0), 0);
}

function routeNodes(route: DestinationRoute, nodeById: Map<string, ExperienceNode>) {
  return route.nodeIds
    .map((id) => nodeById.get(id))
    .filter((node): node is ExperienceNode => Boolean(node));
}

function requiredCoverage(route: DestinationRoute, requiredNodeIds: string[]) {
  if (requiredNodeIds.length === 0) return 0;
  const set = new Set(route.nodeIds);
  return requiredNodeIds.reduce((score, id) => score + (set.has(id) ? 1 : 0), 0);
}

function preferredKindCoverage(nodes: ExperienceNode[], preferredKinds: ExperienceNodeKind[]) {
  if (preferredKinds.length === 0) return 0;
  const set = new Set(nodes.map((node) => node.kind));
  return preferredKinds.reduce((score, kind) => score + (set.has(kind) ? 1 : 0), 0);
}

function suggestedNodes(
  pkg: DestinationPackage,
  intent: DestinationJourneyIntent
) {
  const required = new Set(intent.requiredNodeIds ?? []);
  const themes = intent.themes ?? [];
  const preferredKinds = new Set(intent.preferredKinds ?? []);

  return [...pkg.nodes]
    .map((node, index) => ({
      node,
      index,
      score:
        (required.has(node.id) ? 100 : 0)
        + (preferredKinds.has(node.kind) ? 10 : 0)
        + overlapScore(node.tags, themes)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.node.id);
}

/**
 * Builds a journey only from published route authority.
 *
 * It intentionally does not synthesize inter-node travel time from coordinates:
 * that would turn a content model into routing authority. When no published route
 * can satisfy the intent, callers receive needs-routing-authority and may ask a
 * verified routing provider to build/recalculate the journey.
 */
export function planDestinationJourney(
  pkg: DestinationPackage,
  intent: DestinationJourneyIntent
): DestinationJourneyPlan {
  if (!Number.isFinite(intent.budgetMinutes) || intent.budgetMinutes <= 0) {
    throw new Error('Destination journey budget must be a positive number');
  }

  const requiredNodeIds = [...new Set(intent.requiredNodeIds ?? [])];
  const themes = intent.themes ?? [];
  const preferredKinds = intent.preferredKinds ?? [];
  const nodeIds = new Set(pkg.nodes.map((node) => node.id));

  for (const id of requiredNodeIds) {
    if (!nodeIds.has(id)) {
      throw new Error(`Required destination node not found: ${id}`);
    }
  }

  const nodeById = new Map(pkg.nodes.map((node) => [node.id, node]));
  const candidates = pkg.routes
    .filter((route) => route.estimatedMinutes <= intent.budgetMinutes)
    .map((route, index) => {
      const nodes = routeNodes(route, nodeById);
      const required = requiredCoverage(route, requiredNodeIds);
      const allRequiredCovered = required === requiredNodeIds.length;
      return {
        route,
        index,
        allRequiredCovered,
        score:
          required * 100
          + overlapScore(route.themes, themes) * 10
          + preferredKindCoverage(nodes, preferredKinds)
      };
    })
    .filter((entry) => entry.allRequiredCovered)
    .sort((a, b) =>
      b.score - a.score
      || a.route.estimatedMinutes - b.route.estimatedMinutes
      || a.index - b.index
    );

  const selected = candidates[0]?.route;
  if (selected) {
    const bookingHandoffs = routeNodes(selected, nodeById)
      .filter((node) => Boolean(node.booking))
      .map((node) => ({
        nodeId: node.id,
        booking: node.booking!
      }));

    const explanation = [
      `published-route:${selected.id}`,
      `estimated-minutes:${selected.estimatedMinutes}`
    ];
    if (requiredNodeIds.length > 0) explanation.push(`required-covered:${requiredNodeIds.length}`);
    if (themes.length > 0) explanation.push(`theme-matches:${overlapScore(selected.themes, themes)}`);
    if (bookingHandoffs.length > 0) explanation.push(`booking-handoffs:${bookingHandoffs.length}`);

    return {
      status: 'ready',
      destinationId: pkg.destination.id,
      routeId: selected.id,
      estimatedMinutes: selected.estimatedMinutes,
      nodeIds: [...selected.nodeIds],
      bookingHandoffs,
      explanation
    };
  }

  const suggestions = suggestedNodes(pkg, intent);
  if (suggestions.length > 0 || requiredNodeIds.length > 0) {
    return {
      status: 'needs-routing-authority',
      destinationId: pkg.destination.id,
      suggestedNodeIds: suggestions.length > 0 ? suggestions : requiredNodeIds,
      explanation: [
        'no-published-route-satisfies-intent',
        'do-not-synthesize-travel-time-from-content-coordinates'
      ]
    };
  }

  return {
    status: 'no-match',
    destinationId: pkg.destination.id,
    explanation: ['no-published-route-or-matching-node']
  };
}
