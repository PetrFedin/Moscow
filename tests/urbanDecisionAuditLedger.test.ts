import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendAuditEvent,
  auditLedgerCanRewriteHistory,
  auditLedgerIsAppendOnly,
  createAuditLedger,
  decisionAuditCompleteness,
  replayDecision,
  verifyAuditLedger
} from '../src/marketplace/urbanDecisionAuditLedger.ts';
import {
  demoUrbanAuditLedger,
  demoUrbanDecisionCompleteness,
  demoUrbanDecisionReplay
} from '../src/marketplace/urbanDecisionAuditDemo.ts';

test('demo urban audit ledger is valid and complete', () => {
  const integrity = verifyAuditLedger(demoUrbanAuditLedger);
  assert.equal(integrity.valid, true);
  assert.equal(demoUrbanDecisionCompleteness.complete, true);
  assert.ok(demoUrbanDecisionReplay.committedCapitalRub > 0);
});

test('ledger is append-only across valid appends', () => {
  const base = createAuditLedger({ id: 'ledger', mode: 'demo' });
  const next = appendAuditEvent({
    ledger: base,
    eventId: 'e1',
    eventType: 'DATA_SNAPSHOT_FROZEN',
    occurredAt: '2026-10-06T00:00:00+03:00',
    actor: { actorType: 'SYSTEM', actorId: 'system', role: null },
    payload: {
      decisionId: 'd1',
      programmeId: null,
      districtId: null,
      modelId: null,
      modelVersion: null,
      policyVersion: null,
      scenarioId: null,
      amountRub: null,
      state: 'FROZEN',
      summary: 'snapshot',
      evidenceRefs: [{ ref: 'DATA-1', kind: 'data' }]
    }
  });
  assert.equal(auditLedgerIsAppendOnly(base, next), true);
});

test('tampering breaks ledger integrity and replay', () => {
  const tampered = {
    ...demoUrbanAuditLedger,
    events: demoUrbanAuditLedger.events.map((event, index) =>
      index === 2
        ? {
            ...event,
            payload: {
              ...event.payload,
              summary: 'tampered history'
            }
          }
        : event
    )
  };

  const integrity = verifyAuditLedger(tampered);
  assert.equal(integrity.valid, false);
  assert.throws(
    () => replayDecision(tampered, demoUrbanDecisionReplay.decisionId),
    /audit-ledger-integrity-failed/
  );
});

test('incomplete decision replay is detected', () => {
  let ledger = createAuditLedger({ id: 'incomplete', mode: 'demo' });
  ledger = appendAuditEvent({
    ledger,
    eventId: 'e1',
    eventType: 'DATA_SNAPSHOT_FROZEN',
    occurredAt: '2026-10-06T00:00:00+03:00',
    actor: { actorType: 'SYSTEM', actorId: 'system', role: null },
    payload: {
      decisionId: 'd2',
      programmeId: null,
      districtId: null,
      modelId: null,
      modelVersion: null,
      policyVersion: null,
      scenarioId: null,
      amountRub: null,
      state: 'FROZEN',
      summary: 'snapshot',
      evidenceRefs: [{ ref: 'DATA-2', kind: 'data' }]
    }
  });

  const replay = replayDecision(ledger, 'd2');
  const completeness = decisionAuditCompleteness(replay);
  assert.equal(completeness.complete, false);
  assert.ok(completeness.missing.includes('model-version'));
  assert.ok(completeness.missing.includes('approvals'));
});

test('history rewrite is never supported', () => {
  assert.equal(auditLedgerCanRewriteHistory(), false);
});
