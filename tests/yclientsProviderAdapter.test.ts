import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeYclientsWebhookReceipt
} from '../src/integrations/yclientsProviderAdapter.ts';

test('YCLIENTS record webhook normalizes to provider receipt', () => {
  const receipt = normalizeYclientsWebhookReceipt({
    company_id: 1,
    resource: 'record',
    resource_id: 1561921428,
    status: 'update',
    data: {
      id: 1561921428,
      confirmed: 1,
      last_change_date: '2026-09-30T15:30:00+03:00'
    }
  });

  assert.equal(receipt.providerId, 'yclients');
  assert.equal(receipt.providerEntityId, '1561921428');
  assert.equal(receipt.outcome, 'confirmed');
  assert.match(receipt.receiptId, /^yclients-record-/);
});

test('YCLIENTS deleted record webhook becomes cancelled outcome', () => {
  const receipt = normalizeYclientsWebhookReceipt({
    company_id: 1,
    resource: 'record',
    resource_id: 1561921428,
    status: 'delete',
    data: {
      id: 1561921428,
      deleted: true,
      last_change_date: '2026-09-30T15:31:00+03:00'
    }
  });

  assert.equal(receipt.outcome, 'cancelled');
});

test('non-record webhook is rejected as booking receipt evidence', () => {
  assert.throws(
    () => normalizeYclientsWebhookReceipt({
      company_id: 1,
      resource: 'service',
      resource_id: 2,
      status: 'update',
      data: { last_change_date: '2026-09-30T15:31:00+03:00' }
    }),
    /record webhook/
  );
});
