import test from 'node:test';
import assert from 'node:assert/strict';
import {intakeQualificationReport,verifyIntakeChain}
 from '../src/intake-chain-model.mjs';
import {ZERO,makeCheckpoint,compareCheckpoint,checkpointQualificationReport}
 from '../src/checkpoint-model.mjs';

test('E22 eight exact scenarios and honest post-anchor rewrite blindspot',async()=>{
 const r=await checkpointQualificationReport();
 assert.equal(r.source_event_count,11);
 assert.equal(r.source_checkpoint_count,4);
 assert.deepEqual(r.summary,{
   scenarios:8,prefix_matches:3,rollbacks:1,forks:2,
   invalid_references:1,invalid_ledgers:1,
   known_post_checkpoint_rewrite_missed:true,
   authority_grants:0,external_calls:0
 });
 assert.deepEqual(r.scenario_receipts.map(row=>row.verdict.status),[
   'PREFIX_MATCHES_UNAUTHENTICATED','PREFIX_MATCHES_UNAUTHENTICATED',
   'ROLLBACK_DETECTED','FORK_DETECTED','PREFIX_MATCHES_UNAUTHENTICATED',
   'FORK_DETECTED','INVALID_REFERENCE','INVALID_LEDGER'
 ]);
 assert.equal(r.reference_was_externally_anchored,false);
 assert.equal(r.reference_is_signed,false);
 for(const row of r.scenario_receipts){
   assert.equal(row.verdict.origin_authenticated,false);
   assert.equal(row.verdict.after_checkpoint_suffix_protected,false);
   assert.equal(row.verdict.trusted_anchor_created,false);
   assert.equal(row.verdict.authority_granted,false);
 }
});
test('E22 saved full prefix detects truncation; empty checkpoint binds genesis only',async()=>{
 const ledger=(await intakeQualificationReport()).ledger;
 const empty=await makeCheckpoint(ledger,0);
 assert.equal(empty.head,ZERO);
 assert.equal((await compareCheckpoint(ledger,empty)).prefix_matches,true);
 const full=await makeCheckpoint(ledger,ledger.events.length);
 assert.equal((await compareCheckpoint(ledger,full)).prefix_matches,true);
 const shortened={schema:ledger.schema,events:ledger.events.slice(0,-1),
   head:ledger.events[ledger.events.length-2].event_hash};
 assert.equal((await verifyIntakeChain(shortened)).valid,true);
 assert.equal((await compareCheckpoint(shortened,full)).status,'ROLLBACK_DETECTED');
});
test('E22 rejects false authentication and bad input',async()=>{
 const ledger=(await intakeQualificationReport()).ledger;
 const ref=await makeCheckpoint(ledger,4);
 assert.equal((await compareCheckpoint(ledger,{...ref,producer_authenticated:true})).status,'INVALID_REFERENCE');
 assert.equal((await compareCheckpoint(ledger,{...ref,head:'f'.repeat(64)})).status,'FORK_DETECTED');
 assert.equal((await compareCheckpoint(ledger,{...ref,count:true})).status,'INVALID_REFERENCE');
 assert.equal((await compareCheckpoint(ledger,null)).status,'INVALID_REFERENCE');
 const bad=structuredClone(ledger);bad.events[0].reason_codes.push('TAMPER');
 assert.equal((await compareCheckpoint(bad,ref)).status,'INVALID_LEDGER');
 await assert.rejects(makeCheckpoint(ledger,-1),/INVALID_CHECKPOINT_COUNT/);
});
