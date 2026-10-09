import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {signatureQualificationReport} from '../web/src/signature-model.mjs';
const py=JSON.parse(readFileSync(process.argv[2]||'e24-signature-qualification.json','utf8'));
const js=await signatureQualificationReport();
assert.deepEqual(js,py,'Python and JS Ed25519 signatures, 15 classifications, full SHA256 report parity');
assert.equal(py.summary.public_fixture_forgery_passed,true);
assert.equal(py.summary.authority_granted,0);
console.log('E24 parity PASS: deterministic Ed25519 signatures, revoked and replay states, invalid signature, split view, 2 blind spots, zero authority.');
