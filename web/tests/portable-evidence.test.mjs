import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
  PACKET_SCHEMA,FRAME_COUNT,canonicalString,portablePayload,
  buildPortablePacket,verifyPortablePacket
} from '../src/portable-evidence-model.mjs';

test('E19 browser packet has full compact timeline and no authority',async()=>{
  const receipt=await buildPortablePacket();
  assert.equal(receipt.payload.schema,PACKET_SCHEMA);
  assert.equal(receipt.payload.origin,'SIMULATED');
  assert.equal(receipt.payload.consumer_integration_status,'CONTRACT_ONLY_NOT_CONNECTED');
  assert.equal(receipt.payload.cases.length,36);
  assert.equal(receipt.payload.summary.total_frames,3456);
  assert.deepEqual(new Set(receipt.payload.cases.map(c=>c.quorum)),new Set([1,2,3]));
  assert.ok(receipt.payload.cases.every(c=>c.frame_tokens.length===FRAME_COUNT*4));
  assert.equal(receipt.payload.authority.execution_allowed,false);
  assert.equal(receipt.payload.claims.real_measurement,false);
  assert.equal(receipt.integrity.authenticity_proven,false);
  const expectedHash=createHash('sha256').update(canonicalString(receipt.payload)).digest('hex');
  assert.equal(receipt.integrity.sha256,expectedHash);
  const verdict=await verifyPortablePacket(receipt);
  assert.equal(verdict.valid,true);
  assert.equal(verdict.authenticity_proven,false);
  assert.equal(verdict.action_authorized,false);
});
test('E19 any modified trace or recomputed forged authority is rejected',async()=>{
  const receipt=await buildPortablePacket();
  const changed=structuredClone(receipt);
  changed.payload.cases[0].frame_tokens='0000'+changed.payload.cases[0].frame_tokens.slice(4);
  assert.equal((await verifyPortablePacket(changed)).valid,false);
  const forged=structuredClone(receipt);
  forged.payload.authority.execution_allowed=true;
  forged.integrity.sha256=createHash('sha256').update(canonicalString(forged.payload)).digest('hex');
  assert.equal((await verifyPortablePacket(forged)).valid,false);
  const signed=structuredClone(receipt);
  signed.integrity.signer='imposter';
  signed.integrity.authenticity_proven=true;
  assert.equal((await verifyPortablePacket(signed)).valid,false);
  const injected=structuredClone(receipt);
  injected.payload.command='execute_some_script';
  injected.integrity.sha256=createHash('sha256').update(canonicalString(injected.payload)).digest('hex');
  assert.equal((await verifyPortablePacket(injected)).valid,false);
});
test('E19 independently derived payload deterministic and malformed inputs reject',async()=>{
  const p=portablePayload();
  assert.deepEqual(p,(await buildPortablePacket()).payload);
  assert.equal((await verifyPortablePacket({})).valid,false);
  assert.equal((await verifyPortablePacket(null)).valid,false);
  const bad=await buildPortablePacket();
  bad.integrity.algorithm='MD5';
  assert.equal((await verifyPortablePacket(bad)).valid,false);
});
