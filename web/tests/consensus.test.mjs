import test from 'node:test';
import assert from 'node:assert/strict';
import {consensusReport,MEMBERS,QUORUMS} from '../src/consensus-model.mjs';
import {sequentialReport} from '../src/sequential-model.mjs';

test('E16 policies reuse E15 limits; shared observations not independent',()=>{
  const r=consensusReport(),prior=sequentialReport();
  assert.equal(r.members.length,3);
  assert.equal(r.summary.evaluation_cells,24);
  assert.equal(r.protocol.witness_independence_assumed,false);
  assert.equal(r.protocol.same_noise_realization_shared_by_all_members,true);
  for(const [i,[budget,readout]] of MEMBERS.entries()){
    const prev=prior.policies.find(p=>p.budget===budget&&p.readout===readout);
    assert.equal(r.members[i].mask,prev.frozen_mask);
    assert.equal(r.members[i].alert_limit,prev.sequential_alert_limit);
  }
  assert.equal(r.overlap_diagnostics.length,3);
  assert.equal(r.co_vote_diagnostics.length,3);
});
test('E16 consensus votes are eligible-frame-local and refuse missing quorums',()=>{
  const r=consensusReport();
  for(const [index,p] of r.policies.entries()){
    const q=QUORUMS[index];
    for(const t of p.trials){
      assert.equal(t.attempted+t.abstained,96);
      const alerts=t.observations.filter(x=>x.new_alert);
      assert.ok(alerts.length<=1);
      assert.equal(t.first_alarm_step,alerts[0]?.step??null);
      for(const frame of t.observations){
        assert.equal(frame.eligible,frame.member_available.filter(Boolean).length);
        assert.equal(frame.votes,frame.member_votes.filter(Boolean).length);
        assert.equal(frame.abstained,frame.eligible<q);
        frame.member_votes.forEach((v,i)=>assert.ok(!v||frame.member_available[i]));
        assert.ok(!frame.new_alert||frame.votes>=q);
      }
    }
  }
  assert.equal(r.action_authorized,false);
  assert.equal(r.consciousness_measured,false);
});
test('E16 all failures remain visible and deterministic',()=>{
  const r=consensusReport();
  const bad=r.policies.flatMap(p=>p.trials.filter(t=>
    t.false_alarm||t.persistent_change_missed||t.coverage<.75));
  assert.equal(bad.length,r.failure_ledger.length);
  assert.equal(bad.length,r.summary.failure_cells);
  assert.equal(r.summary.deployments_authorized,0);
  assert.deepEqual(r,consensusReport());
});
