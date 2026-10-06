import type { DemandSignalEvidenceMode } from './demandControlAuthority.ts';

export type AuditEventType =
  | 'DATA_SNAPSHOT_FROZEN'
  | 'MODEL_VERSION_BOUND'
  | 'SCENARIO_CREATED'
  | 'DECISION_PROPOSED'
  | 'APPROVAL_RECORDED'
  | 'CAPITAL_COMMITTED'
  | 'EXECUTION_EVIDENCE_RECORDED'
  | 'OUTCOME_RECORDED'
  | 'LEARNING_RECORDED'
  | 'MODEL_CHANGE_ACCEPTED'
  | 'MODEL_CHANGE_ACTIVATED'
  | 'ROLLBACK_EXECUTED';

export type AuditActor = {
  actorType: 'SYSTEM' | 'ROLE' | 'USER';
  actorId: string;
  role: string | null;
};

export type AuditEvidenceRef = {
  ref: string;
  kind:
    | 'data'
    | 'model'
    | 'scenario'
    | 'approval'
    | 'capital'
    | 'execution'
    | 'outcome'
    | 'learning'
    | 'governance';
};

export type AuditLedgerEventPayload = {
  decisionId: string;
  programmeId: string | null;
  districtId: string | null;
  modelId: string | null;
  modelVersion: string | null;
  policyVersion: string | null;
  scenarioId: string | null;
  amountRub: number | null;
  state: string;
  summary: string;
  evidenceRefs: AuditEvidenceRef[];
};

export type AuditLedgerEvent = {
  ledgerId: string;
  sequence: number;
  eventId: string;
  mode: DemandSignalEvidenceMode;
  eventType: AuditEventType;
  occurredAt: string;
  actor: AuditActor;
  payload: AuditLedgerEventPayload;
  previousHash: string | null;
  eventHash: string;
};

export type AuditLedger = {
  id: string;
  mode: DemandSignalEvidenceMode;
  events: AuditLedgerEvent[];
  headHash: string | null;
};

export type AuditReplay = {
  decisionId: string;
  eventCount: number;
  orderedEvents: AuditLedgerEvent[];
  dataSnapshotRefs: string[];
  modelVersions: Array<{ modelId: string; version: string }>;
  policyVersions: string[];
  scenarioIds: string[];
  approvalRefs: string[];
  committedCapitalRub: number;
  executionEvidenceRefs: string[];
  outcomeRefs: string[];
  learningRefs: string[];
  modelChangeRefs: string[];
  latestState: string | null;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

function fnv1a64(input: string) {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
}

function eventMaterial(
  event: Omit<AuditLedgerEvent, 'eventHash'>
) {
  return stableStringify(event);
}

export function computeAuditEventHash(
  event: Omit<AuditLedgerEvent, 'eventHash'>
) {
  return fnv1a64(eventMaterial(event));
}

export function createAuditLedger({
  id,
  mode
}: {
  id: string;
  mode: DemandSignalEvidenceMode;
}): AuditLedger {
  if (!id.trim()) throw new Error('audit-ledger-id-missing');
  return {
    id,
    mode,
    events: [],
    headHash: null
  };
}

export function appendAuditEvent({
  ledger,
  eventId,
  eventType,
  occurredAt,
  actor,
  payload
}: {
  ledger: AuditLedger;
  eventId: string;
  eventType: AuditEventType;
  occurredAt: string;
  actor: AuditActor;
  payload: AuditLedgerEventPayload;
}): AuditLedger {
  if (!eventId.trim()) throw new Error('audit-event-id-missing');
  if (!actor.actorId.trim()) throw new Error('audit-actor-id-missing');
  if (!payload.decisionId.trim()) throw new Error('audit-decision-id-missing');
  if (!payload.state.trim()) throw new Error('audit-state-missing');
  if (!payload.summary.trim()) throw new Error('audit-summary-missing');

  if (ledger.events.some((event) => event.eventId === eventId)) {
    throw new Error('audit-event-id-duplicate');
  }

  const sequence = ledger.events.length + 1;
  const eventWithoutHash: Omit<AuditLedgerEvent, 'eventHash'> = {
    ledgerId: ledger.id,
    sequence,
    eventId,
    mode: ledger.mode,
    eventType,
    occurredAt,
    actor,
    payload,
    previousHash: ledger.headHash
  };

  const eventHash = computeAuditEventHash(eventWithoutHash);
  const event: AuditLedgerEvent = {
    ...eventWithoutHash,
    eventHash
  };

  return {
    ...ledger,
    events: [...ledger.events, event],
    headHash: eventHash
  };
}

export function verifyAuditLedger(ledger: AuditLedger) {
  const blockers: string[] = [];
  let previousHash: string | null = null;

  for (let index = 0; index < ledger.events.length; index += 1) {
    const event = ledger.events[index]!;
    if (event.sequence !== index + 1) {
      blockers.push(`sequence-invalid:${event.eventId}`);
    }
    if (event.previousHash !== previousHash) {
      blockers.push(`previous-hash-invalid:${event.eventId}`);
    }

    const { eventHash, ...withoutHash } = event;
    const expectedHash = computeAuditEventHash(withoutHash);
    if (eventHash !== expectedHash) {
      blockers.push(`event-hash-invalid:${event.eventId}`);
    }

    previousHash = event.eventHash;
  }

  if (ledger.headHash !== previousHash) {
    blockers.push('head-hash-invalid');
  }

  return {
    valid: blockers.length === 0,
    blockers,
    eventCount: ledger.events.length,
    headHash: ledger.headHash
  };
}

export function auditLedgerIsAppendOnly(
  before: AuditLedger,
  after: AuditLedger
) {
  if (before.id !== after.id || before.mode !== after.mode) return false;
  if (after.events.length < before.events.length) return false;

  for (let index = 0; index < before.events.length; index += 1) {
    if (
      stableStringify(before.events[index])
      !== stableStringify(after.events[index])
    ) {
      return false;
    }
  }

  return true;
}

function refsByKind(
  events: AuditLedgerEvent[],
  kind: AuditEvidenceRef['kind']
) {
  return events.flatMap((event) =>
    event.payload.evidenceRefs
      .filter((item) => item.kind === kind)
      .map((item) => item.ref)
  );
}

export function replayDecision(
  ledger: AuditLedger,
  decisionId: string
): AuditReplay {
  const integrity = verifyAuditLedger(ledger);
  if (!integrity.valid) {
    throw new Error(`audit-ledger-integrity-failed:${integrity.blockers.join(',')}`);
  }

  const orderedEvents = ledger.events.filter(
    (event) => event.payload.decisionId === decisionId
  );

  const committedCapitalRub = orderedEvents
    .filter((event) => event.eventType === 'CAPITAL_COMMITTED')
    .reduce((sum, event) => sum + (event.payload.amountRub ?? 0), 0);

  const modelVersions = orderedEvents
    .filter(
      (event) =>
        event.payload.modelId !== null
        && event.payload.modelVersion !== null
    )
    .map((event) => ({
      modelId: event.payload.modelId!,
      version: event.payload.modelVersion!
    }))
    .filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.modelId === item.modelId
            && candidate.version === item.version
        ) === index
    );

  const policyVersions = orderedEvents
    .map((event) => event.payload.policyVersion)
    .filter((value): value is string => value !== null)
    .filter((value, index, all) => all.indexOf(value) === index);

  const scenarioIds = orderedEvents
    .map((event) => event.payload.scenarioId)
    .filter((value): value is string => value !== null)
    .filter((value, index, all) => all.indexOf(value) === index);

  return {
    decisionId,
    eventCount: orderedEvents.length,
    orderedEvents,
    dataSnapshotRefs: refsByKind(orderedEvents, 'data'),
    modelVersions,
    policyVersions,
    scenarioIds,
    approvalRefs: refsByKind(orderedEvents, 'approval'),
    committedCapitalRub,
    executionEvidenceRefs: refsByKind(orderedEvents, 'execution'),
    outcomeRefs: refsByKind(orderedEvents, 'outcome'),
    learningRefs: refsByKind(orderedEvents, 'learning'),
    modelChangeRefs: refsByKind(orderedEvents, 'model'),
    latestState:
      orderedEvents.length === 0
        ? null
        : orderedEvents[orderedEvents.length - 1]!.payload.state
  };
}

export function decisionAuditCompleteness(
  replay: AuditReplay
) {
  const missing: string[] = [];

  if (replay.dataSnapshotRefs.length === 0) missing.push('data-snapshot');
  if (replay.modelVersions.length === 0) missing.push('model-version');
  if (replay.scenarioIds.length === 0) missing.push('scenario');
  if (replay.approvalRefs.length === 0) missing.push('approvals');
  if (replay.committedCapitalRub <= 0) missing.push('capital-commitment');
  if (replay.executionEvidenceRefs.length === 0) missing.push('execution-evidence');
  if (replay.outcomeRefs.length === 0) missing.push('outcome');
  if (replay.learningRefs.length === 0) missing.push('learning');

  return {
    complete: missing.length === 0,
    missing
  };
}

export function auditLedgerCanRewriteHistory() {
  return false;
}
