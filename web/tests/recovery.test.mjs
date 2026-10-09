import test from 'node:test';
import assert from 'node:assert/strict';
import {genesis} from '../src/lifecycle-model.mjs';
import {makeRecoverySnapshot,holdRecoveryReference,recoverLocalSnapshot,
 recoveryQualificationReport} from '../src/recovery-model.mjs';

const EXPECTED=[
 'RECOVERED_DEMO_UNTRUSTED','REFUSED_ROLLBACK',
 'REFUSED_INVALID_SNAPSHOT','REFUSED_FORK','RECOVERED_DEMO_UNTRUSTED',
 'REFUSED_NO_REFERENCE','REFUSED_INVALID_REFERENCE',
 'REFUSED_UNPINNED_ADVANCE','REFUSED_INVALID_SNAPSHOT',
 'REFUSED_FORK','RECOVERED_DEMO_UNTRUSTED','RECOVERED_DEMO_UNTRUSTED'
];
test('E26 full twelve-case recovery, forged reference and restart replay evidence',async()=>{
 const r=await recoveryQualificationReport();
 assert.deepEqual(r.cases.map(c=>c.verdict.status),EXPECTED);
 assert.deepEqual(r.summary,{
  scenarios:12,recovered_untrusted:4,rollbacks:1,forks:2,
  invalid_snapshots:2,missing_references:1,invalid_references:1,
  unpinned_advances:1,co_rewrite_passed:true,co_rewind_passed:true,
  fresh_genesis_passed:true,reset_replay_accepted:true,
  protected_replay_refused:true,authority_grants:0,external_calls:0
 });
 assert.deepEqual(r.replay_probes,{
  with_matching_epoch_two_state:'REFUSED_REVOKED',
  after_forged_genesis_recovery:'ACCEPTED_DEMO_UNTRUSTED'
 });
 assert.equal(r.real_durable_anti_rollback_anchor,false);
 assert.equal(r.cross_session_automated_persistence,false);
 for(const {verdict:v} of r.cases){
  assert.equal(v.authority_granted,false);
  assert.equal(v.publisher_authenticated,false);
  assert.equal(v.independent_reference_authenticated,false);
  assert.equal(v.secure_persistence_provided,false);
  if(v.status!=='RECOVERED_DEMO_UNTRUSTED')assert.equal(v.state,null);
 }
});
test('E26 signed-state checksum comparison fails closed on altered snapshots',async()=>{
 const current=await makeRecoverySnapshot(genesis(),5);
 const pin=await holdRecoveryReference(current);
 assert.equal((await recoverLocalSnapshot(current,pin)).status,'RECOVERED_DEMO_UNTRUSTED');
 assert.equal((await recoverLocalSnapshot(current,null)).status,'REFUSED_NO_REFERENCE');
 assert.equal((await recoverLocalSnapshot(await makeRecoverySnapshot(genesis(),4),pin)).status,'REFUSED_ROLLBACK');
 assert.equal((await recoverLocalSnapshot(await makeRecoverySnapshot(genesis(),6),pin)).status,'REFUSED_UNPINNED_ADVANCE');
 const altered=structuredClone(current);altered.state.last_sequence=5;
 assert.equal((await recoverLocalSnapshot(altered,pin)).status,'REFUSED_INVALID_SNAPSHOT');
 const recomputed=await makeRecoverySnapshot({...genesis(),last_sequence:5},5);
 assert.equal((await recoverLocalSnapshot(recomputed,pin)).status,'REFUSED_FORK');
 assert.equal((await recoverLocalSnapshot(recomputed,await holdRecoveryReference(recomputed))).status,'RECOVERED_DEMO_UNTRUSTED');
 assert.equal((await recoverLocalSnapshot(current,{...pin,identity_authenticated:true})).status,'REFUSED_INVALID_REFERENCE');
});
