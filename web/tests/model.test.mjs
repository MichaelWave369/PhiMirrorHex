import test from 'node:test';
import assert from 'node:assert/strict';
import { PHI, RADII, ABOVE, BELOW, BUDGETS, rankPeerEdges, simulateFrame } from '../../docs/living-hex.mjs';

test('36 named upper/lower channels and exact gate signal', () => {
  const frame = simulateFrame(12, 369, true);
  assert.equal(ABOVE.length * BELOW.length, 36);
  assert.equal(frame.channels.length, 36);
  assert.equal(new Set(frame.channels.map(c => c.id)).size, 36);
  assert.equal(frame.gate.flagged_count, 3);
  assert.equal(frame.gate.alert, true);
  assert.equal(simulateFrame(12, 369, false).gate.flagged_count, 0);
});
test('same input yields the same frame', () => {
  assert.deepEqual(simulateFrame(0), simulateFrame(0));
  assert.notDeepEqual(simulateFrame(0), simulateFrame(1));
});
test('Fibonacci audit budgets maintain 36 mandatory gate links', () => {
  assert.deepEqual([...BUDGETS], [55,89,144,233,377,610,666]);
  assert.deepEqual([...RADII], [1,2,3,5,8,13]);
  assert.equal(BUDGETS.at(-1), (37*36)/2);
  for (const budget of BUDGETS) assert.ok(budget >= 36);
  assert.ok(PHI > 1.618 && PHI < 1.619);
});
test('seeded E1 peer ranking covers 630 unique undirected pairs', async () => {
  const peers = await rankPeerEdges(369, globalThis.crypto.subtle);
  assert.equal(peers.length, 630);
  const keys = peers.map(([i,j]) => {
    assert.ok(i >= 0 && i < 36 && j > i && j < 36);
    return i + ':' + j;
  });
  assert.equal(new Set(keys).size, 630);
  assert.deepEqual(peers, await rankPeerEdges(369, globalThis.crypto.subtle));
});
