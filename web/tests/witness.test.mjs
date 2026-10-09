import test from 'node:test';
import assert from 'node:assert/strict';
import {witnessQualificationReport,auditWitnesses,localClaim,WITNESSES} from '../src/witness-model.mjs';
import {intakeQualificationReport} from '../src/intake-chain-model.mjs';
import {makeCheckpoint} from '../src/checkpoint-model.mjs';

test('E23 full 11-case witness qualification and two known blind spots',async()=>{
 const r=await witnessQualificationReport();
 assert.deepEqual(r.cases.map(c=>c.verdict.status),[
 'AGREEMENT_UNAUTHENTICATED','SPLIT_VIEW_DETECTED','SPLIT_VIEW_DETECTED',
 'INCOMPARABLE_COUNTS','INSUFFICIENT_CLAIMS','INVALID_WITNESS_SET',
 'INVALID_WITNESS_SET','FORK_DETECTED','ROLLBACK_DETECTED',
 'AGREEMENT_UNAUTHENTICATED','AGREEMENT_UNAUTHENTICATED']);
 assert.deepEqual(r.summary,{
  scenarios:11,agreement_unauthed:3,split_views:2,incomparable:1,
  insufficient:1,invalid_sets:2,forks:1,rollbacks:1,
  co_rewritten_claims_pass_unauthed:true,post_checkpoint_rewrite_pass_unauthed:true,
  false_authority_promotions:0,external_calls:0
 });
 assert.equal(r.authentic_witnesses_present,false);
 assert.equal(r.independently_custodied_references_present,false);
 for(const {verdict:v} of r.cases){
  assert.equal(v.authenticated_quorum,false);
  assert.equal(v.independent_witnesses_established,false);
  assert.equal(v.source_authenticated,false);
  assert.equal(v.authority_granted,false);
  assert.equal(v.trusted_memory_write,false);
 }
});
test('E23 even a 2:1 same-count split is not approved',async()=>{
 const r=await witnessQualificationReport();
 const v=r.cases[1].verdict;
 assert.equal(v.status,'SPLIT_VIEW_DETECTED');
 assert.equal(v.matching_claims,2);
 assert.equal(v.majority_claims,1);
 assert.deepEqual(v.claim_groups.map(c=>c.count),[2,1]);
 assert.equal(r.cases[2].verdict.claim_groups.length,3);
});
test('E23 invalid fake identity and duplicate profiles fail closed',async()=>{
 const ledger=(await intakeQualificationReport()).ledger;
 const ref=await makeCheckpoint(ledger,4);
 const claims=WITNESSES.map(w=>localClaim(w,ref));
 assert.equal((await auditWitnesses(ledger,claims)).status,'AGREEMENT_UNAUTHENTICATED');
 const dup=structuredClone(claims);dup[2].witness_id='field-a';
 assert.equal((await auditWitnesses(ledger,dup)).status,'INVALID_WITNESS_SET');
 const fake=structuredClone(claims);fake[0].identity_authenticated=true;
 assert.equal((await auditWitnesses(ledger,fake)).status,'INVALID_WITNESS_SET');
 const elevated=structuredClone(claims);elevated[0].checkpoint.authority_granted=true;
 assert.equal((await auditWitnesses(ledger,elevated)).status,'INVALID_WITNESS_SET');
 assert.equal((await auditWitnesses(ledger,claims.slice(0,2))).status,'INSUFFICIENT_CLAIMS');
});
