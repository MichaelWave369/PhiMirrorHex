// CI exact cross-language value/semantics parity over every prescribed scenario.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {buildVesselReport} from '../web/src/vessel-model.mjs';

const input = JSON.parse(readFileSync(process.argv[2] || 'e4-vessel-fixture.json','utf8'));
assert.equal(input.schema, 'phimirrorhex.e4.parity-suite.v1');
let checked = 0;
for (const entry of input.cases) {
  const r = buildVesselReport(entry.probe_layer,entry.gain,entry.observer_depth);
  const {sha256, ...expected}=entry.report;
  assert.equal(sha256.length,64);
  assert.deepEqual(r,expected, 'Mismatch '+JSON.stringify(entry));
  checked++;
}
assert.equal(checked,80);
console.log('E4 cross-language parity PASS: '+checked+' cases (5 probe layers × 4 gains × 4 observer depths)');
