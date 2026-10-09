import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {receiverQualificationReport} from '../web/src/receiver-model.mjs';
const py=JSON.parse(readFileSync(process.argv[2]||'e20-receiver-qualification.json','utf8'));
const js=await receiverQualificationReport();
assert.deepEqual(js,py,
  'exact quarantine, attack refusal, view projection, and canonical SHA256 parity');
assert.equal(js.summary.scenarios,9);
assert.equal(js.summary.quarantined,3);
assert.equal(js.summary.rejected,5);
assert.equal(js.summary.refused_actions,1);
assert.equal(js.summary.false_promotions,0);
assert.equal(js.summary.external_calls,0);
console.log('E20 PASS: 3 quarantined unsigned profiles; 6 attacks safely refused/rejected; byte-exact Python/JS qualification receipts; no external connectors or actions.');
