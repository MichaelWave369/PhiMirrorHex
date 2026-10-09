import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lifecycleQualificationReport} from '../web/src/lifecycle-model.mjs';
const py=JSON.parse(readFileSync(process.argv[2]||'e25-key-lifecycle.json','utf8'));
const js=await lifecycleQualificationReport();
assert.deepEqual(js,py,'Python-WebCrypto fixture signatures, transitions, receipts and SHA-256 parity');
assert.deepEqual(js.summary,{
 trials:17,accepted_untrusted:5,rotated_untrusted:1,refused:11,
 public_seed_forgery_accepted:true,replay_after_state_reset_accepted:true,
 final_active_epoch:2,final_sequence:12,authority_grants:0,external_calls:0
});
console.log('E25 PASS: full Python/WebCrypto Ed25519 dual-signature and 17-case key lifecycle parity, explicit forgery and state-reset blind spots.');
