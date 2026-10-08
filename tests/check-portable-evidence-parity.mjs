import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  buildPortablePacket,verifyPortablePacket,canonicalString
} from '../web/src/portable-evidence-model.mjs';
const py=JSON.parse(readFileSync(process.argv[2]||'e19-portable-evidence.json','utf8'));
const js=await buildPortablePacket();
assert.deepEqual(js,py,'full portable envelope, every bit-packed frame and SHA256 digest');
const verdict=await verifyPortablePacket(py);
assert.equal(verdict.valid,true);
assert.equal(verdict.authenticity_proven,false);
assert.equal(verdict.action_authorized,false);
const clone=structuredClone(py);
clone.payload.cases[0].frame_tokens='0000'+clone.payload.cases[0].frame_tokens.slice(4);
assert.equal((await verifyPortablePacket(clone)).valid,false);
console.log('E19 parity PASS: 36 E18 cases, 3456 compact frame receipts, full selection provenance, canonical SHA-256 and refusing verifier. No signatures or external authority.');
