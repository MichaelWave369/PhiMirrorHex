import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPortablePacket} from '../src/portable-evidence-model.mjs';
import {emptyLedger,intakeEvidence,verifyIntakeChain,intakeQualificationReport}
 from '../src/intake-chain-model.mjs';

test('E21 all 11 frozen decisions and no trusted authority',async()=>{
 const r=await intakeQualificationReport();
 assert.deepEqual(r.summary,{
   cases:11,quarantined:3,duplicates:1,rejected:6,refused_actions:1,
   authority_grants:0,external_calls:0,source_authenticity_proven:false,
   self_consistent_only:true
 });
 assert.deepEqual(r.ledger.events.map(e=>e.disposition),[
  'QUARANTINED_READ_ONLY','DUPLICATE_QUARANTINED',
  'QUARANTINED_READ_ONLY','QUARANTINED_READ_ONLY',
  'REJECTED','REJECTED','REJECTED','REJECTED',
  'REJECTED','REFUSED_ACTION','REJECTED'
 ]);
 assert.equal(r.chain_verification.valid,true);
 assert.equal(r.chain_verification.authenticity_proven,false);
 assert.equal(r.chain_verification.trusted_anchor_present,false);
 assert.equal(r.durable_storage_enabled,false);
 assert.equal(r.receiver_profiles_connected,false);
 r.ledger.events.forEach((e,i)=>{
  assert.equal(e.index,i);
  assert.equal(e.external_calls,0);
  assert.equal(e.authority_granted,false);
  assert.equal(e.trusted_memory_write,false);
  if(i)assert.equal(e.prev_hash,r.ledger.events[i-1].event_hash);
 });
});
test('E21 deduplicates only verified, same-consumer, same-action replay',async()=>{
 const packet=await buildPortablePacket();
 const empty=emptyLedger(),one=await intakeEvidence(empty,packet,'NestedBubbleGear');
 assert.equal(empty.events.length,0);
 assert.equal(one.events[0].disposition,'QUARANTINED_READ_ONLY');
 const twice=await intakeEvidence(one,packet,'NestedBubbleGear');
 assert.equal(twice.events[1].disposition,'DUPLICATE_QUARANTINED');
 const other=await intakeEvidence(twice,packet,'BrainC');
 assert.equal(other.events[2].disposition,'QUARANTINED_READ_ONLY');
 const pin=await intakeEvidence(other,packet,'BrainC','inspect','f'.repeat(64));
 assert.equal(pin.events[3].disposition,'REJECTED');
 assert.deepEqual(pin.events[3].reason_codes,['PINNED_DIGEST_MISMATCH']);
 const action=await intakeEvidence(pin,packet,'SuperPhiVessel','approve');
 assert.equal(action.events[4].disposition,'REFUSED_ACTION');
 assert.equal((await verifyIntakeChain(action)).valid,true);
});
test('E21 detects mutation before allowing append',async()=>{
 const p=await buildPortablePacket(),one=await intakeEvidence(emptyLedger(),p,'BrainC');
 const corrupt=structuredClone(one);
 corrupt.events[0].disposition='REFUSED_ACTION';
 assert.equal((await verifyIntakeChain(corrupt)).valid,false);
 await assert.rejects(()=>intakeEvidence(corrupt,p,'BrainC'),
  /INTAKE_CHAIN_INTEGRITY_FAILED/);
 assert.equal((await verifyIntakeChain({schema:'bad',events:[],head:'0'.repeat(64)})).valid,false);
});
