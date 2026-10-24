import { test } from 'node:test';
import assert from 'node:assert/strict';
import seed from '../db/seed.json';
import { respond } from '../netlify/functions/network.mts';
import { investigate } from '../db/analytics.js';

const request = (path: string, method = 'GET') => new Request(`https://example.test${path}`, { method });
const load = async () => structuredClone(seed);

test('network endpoint returns all existing demo collections', async () => {
  const response = await respond(request('/api/data'), load);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type')!, /application\/json/);
  const data = await response.json();
  assert.deepEqual(data, seed);
  assert.ok(data.batches.length && data.users.length && data.recalls.length);
});

test('trends and investigations support every seeded batch', async () => {
  const trendResponse = await respond(request('/api/trends'), load);
  const trends = await trendResponse.json();
  assert.equal(trends.metrics.totalBatches, seed.batches.length);
  for (const batch of seed.batches) {
    const result = investigate(seed, batch.id);
    assert.equal(result!.batch.id, batch.id);
    assert.ok(result!.riskScore >= 15 && result!.riskScore <= 100);
    assert.ok(Array.isArray(result!.bullseye.ring1_evidence));
    const response = await respond(request(`/api/bullseye/${batch.id}`), load);
    assert.equal(response.status, 200);
  }
});

test('missing batches, invalid methods, and service failures return JSON errors', async () => {
  assert.equal((await respond(request('/api/bullseye/missing'), load)).status, 404);
  assert.equal((await respond(request('/api/data', 'POST'), load)).status, 405);
  const failed = await respond(request('/api/data'), async () => { throw new Error('private connection detail'); });
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes('private connection detail'));
});

 test('seed rows include stable unique IDs for telemetry without IDs', async () => {
  const { seedRecords } = await import('../db/index.js');
  const rows = seedRecords();
  assert.equal(rows.length, Object.values(seed).reduce((sum, records) => sum + records.length, 0));
  assert.ok(rows.every(row => row.id && row.collection && row.payload));
  assert.equal(new Set(rows.map(row => `${row.collection}:${row.id}`)).size, rows.length);
  assert.deepEqual(seedRecords(), rows);
});
