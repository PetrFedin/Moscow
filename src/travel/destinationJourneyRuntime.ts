export const DESTINATION_JOURNEY_RUNTIME_VERSION = 1 as const;

export type JourneyRuntimeState =
  | 'planned'
  | 'live-verified'
  | 'executing'
  | 'replan-required'
  | 'executed'
  | 'blocked';

export type JourneyBlockKind =
  | 'heritage'
  | 'ar'
  | 'museum'
  | 'food'
  | 'event'
  | 'evening';

export type JourneyBlockAuthority =
  | { kind: 'published'; ref: string }
  | { kind: 'live-destination'; entityId: string; providerId: string; evidenceRef: string };

export type DestinationJourneyRuntimeBlock = {
  id: string;
  kind: JourneyBlockKind;
  title: string;
  plannedStartAt: string;
  plannedEndAt: string;
  authority: JourneyBlockAuthority;
  status: 'planned' | 'verified' | 'executing' | 'completed' | 'skipped' | 'blocked';
};

export type DestinationJourneyRuntime = {
  version: typeof DESTINATION_JOURNEY_RUNTIME_VERSION;
  journeyId: string;
  destinationId: string;
  planVersion: number;
  state: JourneyRuntimeState;
  blocks: DestinationJourneyRuntimeBlock[];
  currentBlockId?: string;
  replanReason?: string;
  routingProofRef?: string;
  audit: Array<{
    at: string;
    action: string;
    ref?: string;
  }>;
};

export type RuntimeEvent =
  | { type: 'verify-live-block'; blockId: string; evidenceRef: string; at: string }
  | { type: 'start-block'; blockId: string; at: string }
  | { type: 'complete-block'; blockId: string; at: string }
  | { type: 'skip-block'; blockId: string; reason: string; at: string }
  | {
      type: 'provider-invalidated';
      blockId: string;
      reason: 'closed' | 'cancelled' | 'rescheduled' | 'sold-out' | 'stale' | 'provider-error';
      evidenceRef: string;
      at: string;
    };

function parseIso(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ISO timestamp: ${value}`);
  return parsed;
}

function clone(runtime: DestinationJourneyRuntime): DestinationJourneyRuntime {
  return {
    ...runtime,
    blocks: runtime.blocks.map((block) => ({ ...block, authority: { ...block.authority } })),
    audit: runtime.audit.map((item) => ({ ...item }))
  };
}

export function createDestinationJourneyRuntime(input: {
  journeyId: string;
  destinationId: string;
  blocks: DestinationJourneyRuntimeBlock[];
  createdAt: string;
  routingProofRef?: string;
}): DestinationJourneyRuntime {
  parseIso(input.createdAt);
  if (!input.journeyId.trim()) throw new Error('Journey runtime requires journeyId');
  if (!input.destinationId.trim()) throw new Error('Journey runtime requires destinationId');
  if (input.blocks.length === 0) throw new Error('Journey runtime requires at least one block');

  let previousEnd = -Infinity;
  const ids = new Set<string>();
  for (const block of input.blocks) {
    if (!block.id.trim()) throw new Error('Journey block id is required');
    if (ids.has(block.id)) throw new Error(`Duplicate journey block: ${block.id}`);
    ids.add(block.id);
    const start = parseIso(block.plannedStartAt);
    const end = parseIso(block.plannedEndAt);
    if (end <= start) throw new Error(`Invalid journey block window: ${block.id}`);
    if (start < previousEnd) throw new Error(`Journey blocks overlap: ${block.id}`);
    previousEnd = end;
    if (block.status !== 'planned') throw new Error('New runtime blocks must start as planned');
    if (block.authority.kind === 'live-destination' && !block.authority.evidenceRef.trim()) {
      throw new Error(`Live block requires provider evidence: ${block.id}`);
    }
  }

  return {
    version: DESTINATION_JOURNEY_RUNTIME_VERSION,
    journeyId: input.journeyId,
    destinationId: input.destinationId,
    planVersion: 1,
    state: 'planned',
    blocks: input.blocks.map((block) => ({ ...block, authority: { ...block.authority } })),
    ...(input.routingProofRef ? { routingProofRef: input.routingProofRef } : {}),
    audit: [{ at: input.createdAt, action: 'journey-planned', ...(input.routingProofRef ? { ref: input.routingProofRef } : {}) }]
  };
}

function deriveState(runtime: DestinationJourneyRuntime): JourneyRuntimeState {
  if (runtime.replanReason) return 'replan-required';
  if (runtime.blocks.every((block) => block.status === 'completed' || block.status === 'skipped')) {
    return 'executed';
  }
  if (runtime.blocks.some((block) => block.status === 'executing')) return 'executing';

  const liveBlocks = runtime.blocks.filter((block) => block.authority.kind === 'live-destination');
  if (liveBlocks.length > 0 && liveBlocks.every((block) => block.status !== 'planned')) {
    return 'live-verified';
  }
  return 'planned';
}

export function applyJourneyRuntimeEvent(
  runtime: DestinationJourneyRuntime,
  event: RuntimeEvent
): DestinationJourneyRuntime {
  parseIso(event.at);
  const next = clone(runtime);
  const block = next.blocks.find((item) => item.id === event.blockId);
  if (!block) throw new Error(`Journey block not found: ${event.blockId}`);

  if (event.type === 'verify-live-block') {
    if (block.authority.kind !== 'live-destination') {
      throw new Error('Only live destination blocks require live verification');
    }
    if (!event.evidenceRef.trim()) throw new Error('Live verification requires evidenceRef');
    if (block.status !== 'planned') throw new Error('Only planned block can be live verified');
    block.status = 'verified';
    block.authority.evidenceRef = event.evidenceRef;
    next.audit.push({ at: event.at, action: `live-verified:${block.id}`, ref: event.evidenceRef });
  }

  if (event.type === 'start-block') {
    if (block.authority.kind === 'live-destination' && block.status !== 'verified') {
      throw new Error('Live block cannot start without fresh verification');
    }
    if (block.status !== 'planned' && block.status !== 'verified') {
      throw new Error('Only planned or verified block can start');
    }
    for (const item of next.blocks) {
      if (item.status === 'executing') throw new Error('Another journey block is already executing');
    }
    block.status = 'executing';
    next.currentBlockId = block.id;
    next.audit.push({ at: event.at, action: `block-started:${block.id}` });
  }

  if (event.type === 'complete-block') {
    if (block.status !== 'executing') throw new Error('Only executing block can complete');
    block.status = 'completed';
    delete next.currentBlockId;
    next.audit.push({ at: event.at, action: `block-completed:${block.id}` });
  }

  if (event.type === 'skip-block') {
    if (block.status === 'completed') throw new Error('Completed block cannot be skipped');
    block.status = 'skipped';
    if (next.currentBlockId === block.id) delete next.currentBlockId;
    next.audit.push({ at: event.at, action: `block-skipped:${block.id}`, ref: event.reason });
  }

  if (event.type === 'provider-invalidated') {
    if (block.authority.kind !== 'live-destination') {
      throw new Error('Provider invalidation applies only to live blocks');
    }
    if (!event.evidenceRef.trim()) throw new Error('Provider invalidation requires evidenceRef');
    if (block.status === 'completed' || block.status === 'skipped') {
      next.audit.push({ at: event.at, action: `provider-invalidated-after-resolution:${block.id}`, ref: event.evidenceRef });
    } else {
      block.status = 'blocked';
      if (next.currentBlockId === block.id) delete next.currentBlockId;
      next.replanReason = `${block.id}:${event.reason}`;
      next.audit.push({ at: event.at, action: `replan-required:${block.id}:${event.reason}`, ref: event.evidenceRef });
    }
  }

  next.state = deriveState(next);
  return next;
}

export function applyVerifiedReplan(input: {
  runtime: DestinationJourneyRuntime;
  replacementBlocks: DestinationJourneyRuntimeBlock[];
  routingProofRef: string;
  at: string;
}): DestinationJourneyRuntime {
  parseIso(input.at);
  if (input.runtime.state !== 'replan-required') throw new Error('Runtime is not awaiting replan');
  if (!input.routingProofRef.trim()) throw new Error('Replan requires routing proof');
  const replacement = createDestinationJourneyRuntime({
    journeyId: input.runtime.journeyId,
    destinationId: input.runtime.destinationId,
    blocks: input.replacementBlocks,
    createdAt: input.at,
    routingProofRef: input.routingProofRef
  });
  return {
    ...replacement,
    planVersion: input.runtime.planVersion + 1,
    audit: [
      ...input.runtime.audit,
      { at: input.at, action: 'journey-replanned', ref: input.routingProofRef }
    ]
  };
}
