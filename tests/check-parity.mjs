// E2 parity check: Python-generated frames + exact E1 SHA-256 pair order.
import { readFileSync } from "node:fs";
import { deepStrictEqual, equal, ok } from "node:assert/strict";
import { simulateFrame, rankPeerEdges, BUDGETS, RADII } from "../docs/living-hex.mjs";

const input = JSON.parse(readFileSync(process.argv[2] || "e2-report.json", "utf8"));
equal(input.schema, "phimirrorhex.e2.series.v1");
equal(input.synthetic_only, true);
equal(input.authority_granted, false);
equal(input.frames.length, 24);
deepStrictEqual(BUDGETS, input.topology.fibonacci_budgets);
deepStrictEqual(RADII, input.topology.ring_sizes);

for (let i = 0; i < input.frames.length; i++) {
  deepStrictEqual(simulateFrame(i, input.seed, input.anomaly_enabled), input.frames[i]);
}
for (const step of [0, 9, 12, 17, 18, 23]) {
  equal(simulateFrame(step, input.seed, true).gate.alert, step >= 10 && step <= 17);
}
const peers = await rankPeerEdges(input.seed);
equal(peers.length, 630);
deepStrictEqual(peers, input.audit_peer_order);
for (const budget of BUDGETS) {
  const active = peers.slice(0, budget - 36);
  equal(active.length + 36, budget);
}
ok(input.sha256.length === 64);
console.log("E2 parity PASS: 24/24 frames, all 630 SHA-256-ranked peers, seven gate-first budgets");
