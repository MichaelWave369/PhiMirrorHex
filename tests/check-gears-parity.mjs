import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildGearReport} from '../web/src/gears-model.mjs';

const fixture=JSON.parse(readFileSync(process.argv[2]||'e5-gears-fixture.json','utf8'));
assert.equal(fixture.schema,'phimirrorhex.e5.parity-suite.v1');
let checked=0;
for(const entry of fixture.cases){
  const {sha256,...expected}=entry.report;
  assert.equal(sha256.length,64);
  const actual=buildGearReport(entry.coupling,entry.probe_gain,entry.conveyor_enabled);
  assert.deepEqual(actual,expected,'E5 mismatch at '+JSON.stringify({
    coupling:entry.coupling,gain:entry.probe_gain,enabled:entry.conveyor_enabled
  }));
  checked++;
}
assert.equal(checked,32);
console.log('E5 parity PASS: 32 complete configurations × 24 frames with delayed conveyor and negative controls');
