import test from 'node:test';
import assert from 'node:assert/strict';
import {prospectiveAuditReport,prospectiveNoise,STREAMS}
  from '../src/prospective-audit-model.mjs';
import {transferConsensusReport} from '../src/consensus-transfer-model.mjs';

test('E18 E17-only selection freezes rules before fresh test scores',()=>{
  const r=prospectiveAuditReport(),parent=transferConsensusReport();
  assert.equal(r.summary.evaluation_cells,36);
  assert.equal(r.summary.frame_cells,3456);
  assert.equal(new Set(STREAMS.map(s=>s[1])).size,12);
  assert.deepEqual(r.members,parent.members);
  assert.equal(r.protocol.development_reuse_disclosed,true);
  assert.equal(r.selection.selection_uses_e18_sealed_data,false);
  assert.equal(r.selection.selection_is_originally_preregistered_e17_training,false);
  assert.equal(r.protocol.no_threshold_or_quorum_adaptation_on_sealed_set,true);
  assert.deepEqual(r.policies.map(p=>p.quorum),[1,2,3]);
  assert.equal(r.policies.filter(p=>p.selected_from_e17).length,1);
  assert.equal(r.summary.selected_quorum,r.selection.selected_quorum);
  const c=r.selection.candidate_costs;
  assert.equal(c.length,3);
  c.forEach(row=>assert.equal(row.weighted_loss,5*row.miss_cells+4*row.false_alarm_cells+2*row.coverage_breach_cells));
});
test('E18 new generator is exact-replay and distinct across seeds',()=>{
  assert.deepEqual(prospectiveNoise(4105,50,'lagged_step'),
    prospectiveNoise(4105,50,'lagged_step'));
  assert.notDeepEqual(prospectiveNoise(4105,50,'lagged_step'),
    prospectiveNoise(4106,50,'lagged_step'));
  assert.equal(prospectiveNoise(4109,2,'burst_null')[0].length,6);
});
test('E18 each vote is eligible, one-shot, and faults explicitly abstain',()=>{
  const r=prospectiveAuditReport();
  for(const p of r.policies)for(const t of p.trials){
    assert.equal(t.observations.length,96);
    assert.equal(t.attempted+t.abstained,96);
    const alerts=t.observations.filter(f=>f.new_alert);
    assert.ok(alerts.length<=1);
    assert.equal(t.first_alarm_step,alerts[0]?.step??null);
    for(const f of t.observations){
      assert.equal(f.eligible,f.member_available.filter(Boolean).length);
      assert.equal(f.votes,f.member_votes.filter(Boolean).length);
      assert.equal(f.abstained,f.eligible<p.quorum);
      f.member_votes.forEach((v,i)=>assert.ok(!v||f.member_available[i]));
      f.member_gaps.forEach((v,i)=>{if(!f.member_available[i])assert.equal(v,null)});
    }
    assert.ok(!(t.false_alarm&&t.persistent_change_detected));
  }
});
test('E18 full failure ledger and zero external authority',()=>{
  const r=prospectiveAuditReport();
  const bad=r.policies.flatMap(p=>p.trials.filter(t=>
    t.false_alarm||t.persistent_change_missed||t.coverage<.75));
  assert.equal(r.failure_ledger.length,bad.length);
  assert.equal(r.summary.total_failure_cells,bad.length);
  assert.equal(r.summary.deployments_authorized,0);
  assert.equal(r.epistemic_origin,'SIMULATED');
  assert.equal(r.action_authorized,false);
  assert.equal(r.physical_measurement,false);
  assert.equal(r.consciousness_measured,false);
});
