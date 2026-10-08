import test from 'node:test';
import assert from 'node:assert/strict';
import {transferConsensusReport,transferNoise,TRANSFER_STREAMS}
  from '../src/consensus-transfer-model.mjs';
import {consensusReport} from '../src/consensus-model.mjs';

test('E17 new procedural LCG seeds, unchanged E16 quorum members',()=>{
  const report=transferConsensusReport(),old=consensusReport();
  assert.deepEqual(report.members,old.members);
  assert.equal(report.summary.evaluation_cells,36);
  assert.equal(report.summary.total_frame_evaluations,3456);
  assert.equal(new Set(TRANSFER_STREAMS.map(x=>x[1])).size,12);
  assert.deepEqual(transferNoise(3105,4,'correlated_step'),transferNoise(3105,4,'correlated_step'));
  assert.notDeepEqual(transferNoise(3105,4,'correlated_step'),transferNoise(3106,4,'correlated_step'));
  assert.equal(report.protocol.no_quorum_selected_after_test,true);
  assert.equal(report.protocol.pairwise_member_independence,false);
  assert.equal(report.protocol.new_streams_disjoint_from_e15,true);
});
test('E17 full 96-step votes, missing sensor refusal and one-shot alarms',()=>{
  const r=transferConsensusReport();
  for(const policy of r.policies){
    const q=policy.quorum;
    assert.equal(policy.trials.length,12);
    for(const t of policy.trials){
      assert.equal(t.attempted+t.abstained,96);
      assert.equal(t.observations.length,96);
      const alerts=t.observations.filter(f=>f.new_alert);
      assert.ok(alerts.length<=1);
      assert.equal(t.first_alarm_step,alerts[0]?.step??null);
      for(const f of t.observations){
        assert.equal(f.eligible,f.member_available.filter(Boolean).length);
        assert.equal(f.votes,f.member_votes.filter(Boolean).length);
        assert.equal(f.abstained,f.eligible<q);
        f.member_votes.forEach((v,i)=>assert.ok(!v||f.member_available[i]));
        f.member_gaps.forEach((v,i)=>{if(!f.member_available[i])assert.equal(v,null);});
      }
    }
  }
});
test('E17 complete failure disclosure, zero external authorization',()=>{
  const r=transferConsensusReport();
  const failing=r.policies.flatMap(p=>p.trials.filter(t=>
    t.false_alarm||t.persistent_change_missed||t.coverage<.75));
  assert.equal(r.failure_ledger.length,failing.length);
  assert.equal(r.summary.failure_cells,failing.length);
  assert.equal(r.summary.deployments_authorized,0);
  assert.equal(r.epistemic_origin,'SIMULATED');
  assert.equal(r.physical_measurement,false);
  assert.equal(r.action_authorized,false);
  assert.equal(r.consciousness_measured,false);
});
