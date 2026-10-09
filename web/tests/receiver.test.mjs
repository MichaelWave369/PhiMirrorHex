import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPortablePacket} from '../src/portable-evidence-model.mjs';
import {CONSUMERS,ACTIONS,receiveEvidence,receiverQualificationReport}
  from '../src/receiver-model.mjs';

test('E20 positive evidence is ALWAYS unsigned and quarantined',async()=>{
  const packet=await buildPortablePacket();
  for(const name of CONSUMERS){
    const r=await receiveEvidence(packet,name);
    assert.equal(r.disposition,'QUARANTINED_READ_ONLY');
    assert.equal(r.authenticity_proven,false);
    assert.equal(r.authority_granted,false);
    assert.equal(r.trusted_memory_write,false);
    assert.equal(r.model_routing_write,false);
    assert.equal(r.reality_gate_approval,false);
    assert.equal(r.external_calls,0);
    assert.equal(r.contract_connected,false);
    assert.equal(r.view.permission,'INSPECT_ONLY');
    assert.equal(r.view.case_count,36);
    assert.equal(r.view.frame_count,3456);
    assert.equal(r.view.negative_evidence_complete,true);
  }
});
test('E20 every imperative action refused without running',async()=>{
  const packet=await buildPortablePacket();
  for(const consumer of CONSUMERS)for(const action of ACTIONS){
    if(action==='inspect')continue;
    const r=await receiveEvidence(packet,consumer,action);
    assert.equal(r.disposition,'REFUSED_ACTION');
    assert.equal(r.external_calls,0);
    assert.equal(r.view,null);
    assert.equal(r.authority_granted,false);
  }
  assert.equal((await receiveEvidence(packet,'FakeAgent')).disposition,'REJECTED');
  assert.equal((await receiveEvidence(packet,'BrainC','wipe')).disposition,'REJECTED');
});
test('E20 attack matrix is complete and no scenario promotes evidence',async()=>{
  const r=await receiverQualificationReport();
  assert.deepEqual(r.summary,{
    scenarios:9,quarantined:3,rejected:5,refused_actions:1,
    false_promotions:0,external_calls:0
  });
  assert.equal(r.profiles_are_connected,false);
  assert.deepEqual(r.scenarios.map(x=>x.result.disposition),[
    'QUARANTINED_READ_ONLY','QUARANTINED_READ_ONLY','QUARANTINED_READ_ONLY',
    'REJECTED','REJECTED','REJECTED','REJECTED','REFUSED_ACTION','REJECTED'
  ]);
  for(const row of r.scenarios){
    assert.equal(row.result.authenticity_proven,false);
    assert.equal(row.result.authority_granted,false);
    assert.equal(row.result.trusted_memory_write,false);
    assert.equal(row.result.model_routing_write,false);
    assert.equal(row.result.reality_gate_approval,false);
    assert.equal(row.result.external_calls,0);
  }
});
