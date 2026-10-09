import test from 'node:test';
import assert from 'node:assert/strict';
import {LIFECYCLE_SCHEMA,KEY_OLD,KEY_NEW,genesis,signClaim,signRotation,
  consumeClaim,rotateKey,lifecycleQualificationReport}
  from '../src/lifecycle-model.mjs';
import {intakeQualificationReport} from '../src/intake-chain-model.mjs';
import {makeCheckpoint} from '../src/checkpoint-model.mjs';

const EXPECTED=[
 'ACCEPTED_DEMO_UNTRUSTED','REFUSED_REPLAY','REFUSED_BAD_SIGNATURE',
 'REFUSED_BAD_ROTATION_PROOF','REFUSED_BAD_ROTATION_PROOF','ROTATED_DEMO_UNTRUSTED',
 'REFUSED_REVOKED','REFUSED_SEQUENCE_FLOOR','ACCEPTED_DEMO_UNTRUSTED',
 'REFUSED_REPLAY','REFUSED_STALE_ROTATION','ACCEPTED_DEMO_UNTRUSTED',
 'ACCEPTED_DEMO_UNTRUSTED','REFUSED_BAD_DOMAIN','REFUSED_BAD_SIGNATURE',
 'REFUSED_CHECKPOINT','ACCEPTED_DEMO_UNTRUSTED'
];
test('E25 17 deterministic lifecycle cases, forgery and reset blind spots',async()=>{
 const r=await lifecycleQualificationReport();
 assert.equal(r.schema,LIFECYCLE_SCHEMA);
 assert.deepEqual(r.events.map(x=>x.verdict.status),EXPECTED);
 assert.deepEqual(r.summary,{
  trials:17,accepted_untrusted:5,rotated_untrusted:1,refused:11,
  public_seed_forgery_accepted:true,replay_after_state_reset_accepted:true,
  final_active_epoch:2,final_sequence:12,authority_grants:0,external_calls:0
 });
 assert.equal(r.authenticated_identity_present,false);
 assert.equal(r.durable_anti_replay_storage_present,false);
 assert.equal(r.rotation_old_signature.length,128);
 assert.equal(r.rotation_new_signature.length,128);
 for(const {verdict:x} of r.events){
  assert.equal(x.authority_granted,false);
  assert.equal(x.signers_authenticated,false);
  assert.equal(x.state_is_durable,false);
  assert.equal(x.external_calls,0);
 }
});
test('E25 dual signatures really required; old key refuses after rotation',async()=>{
 const ledger=(await intakeQualificationReport()).ledger;
 const ref=await makeCheckpoint(ledger,4);
 const first=await signClaim(KEY_OLD,9,ref);
 const initial=genesis(),accepted=await consumeClaim(initial,first,ledger);
 assert.equal(initial.last_sequence,0);
 assert.equal(accepted.status,'ACCEPTED_DEMO_UNTRUSTED');
 assert.equal((await consumeClaim(accepted.state,first,ledger)).status,'REFUSED_REPLAY');
 assert.equal((await rotateKey(accepted.state,await signRotation(ref,true,false),ledger)).status,'REFUSED_BAD_ROTATION_PROOF');
 const rotated=await rotateKey(accepted.state,await signRotation(ref),ledger);
 assert.equal(rotated.status,'ROTATED_DEMO_UNTRUSTED');
 assert.equal(rotated.signatures_verified,2);
 assert.equal(rotated.state.active_key,KEY_NEW);
 assert.deepEqual(rotated.state.revoked_keys,[KEY_OLD]);
 assert.equal((await consumeClaim(rotated.state,await signClaim(KEY_OLD,10,ref),ledger)).status,'REFUSED_REVOKED');
 assert.equal((await consumeClaim(rotated.state,await signClaim(KEY_NEW,9,ref),ledger)).status,'REFUSED_SEQUENCE_FLOOR');
 assert.equal((await consumeClaim(rotated.state,await signClaim(KEY_NEW,10,ref),ledger)).status,'ACCEPTED_DEMO_UNTRUSTED');
});
test('E25 wrong signed checkpoint is not accepted just for having valid signature',async()=>{
 const ledger=(await intakeQualificationReport()).ledger;
 const s=genesis(),other=await makeCheckpoint(ledger,5);
 assert.equal((await consumeClaim(s,await signClaim(KEY_OLD,1,other),ledger)).status,'REFUSED_CHECKPOINT');
 const ref=await makeCheckpoint(ledger,4);
 assert.equal((await consumeClaim({...s,epoch:2},await signClaim(KEY_OLD,1,ref),ledger)).status,'REFUSED_INVALID_STATE');
});
