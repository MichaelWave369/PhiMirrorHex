import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkpointQualificationReport} from '../web/src/checkpoint-model.mjs';
const py=JSON.parse(readFileSync(process.argv[2]||'e22-checkpoint-qualification.json','utf8'));
const js=await checkpointQualificationReport();
assert.deepEqual(js,py,'Python and JS checkpoint comparison, eight scenarios and SHA must match');
assert.equal(js.summary.known_post_checkpoint_rewrite_missed,true);
assert.equal(js.summary.authority_grants,0);
console.log('E22 parity PASS: 8 scenarios, prefix match, truncation, complete rehash fork, post-prefix blind spot, invalid pins, zero external authority.');
