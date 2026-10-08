import test from 'node:test';
import assert from 'node:assert/strict';
import {driftReport,REGIMES} from '../src/drift-model.mjs';
import {calibrationReport} from '../src/calibration-model.mjs';

test('E14 independent calibration, monitor and sealed split provenance',()=>{
  const r=driftReport(),parent=calibrationReport();
  assert.equal(r.policies.length,14);
  assert.equal(r.summary.evaluation_cells,42);
  const seeds=REGIMES.flatMap(([,,m,s,t])=>[m,s,t]);
  assert.equal(new Set(seeds).size,9);
  assert.equal(r.protocol.test_data_for_policy_or_threshold_selection,false);
  for(const [i,p] of r.policies.entries()){
    assert.equal(p.mask,parent.policies[i].frozen_masks.robust);
    assert.equal(p.frozen_e13_threshold,parent.policies[i].calibration.robust.threshold);
    for(const row of p.regimes){
      assert.equal(row.frozen_floor,p.frozen_e13_threshold);
      assert.equal(row.frozen_threshold_mutated,false);
      assert.equal(row.decision_authorized,false);
      assert.equal(row.monitor.signal_hits,null);
      assert.equal(row.monitor.attempted+row.monitor.abstained,48);
      if(row.drift_flagged){
        assert.ok(row.shadow_calibration);
        assert.ok(row.shadow_calibration.null_exceedances<=2);
      }else{
        assert.equal(row.shadow_calibration,null);
        assert.equal(row.candidate_floor,row.frozen_floor);
      }
    }
  }
});
test('E14 abstentions are not correct detections and all failures persist',()=>{
  const r=driftReport();
  const failures=r.policies.flatMap(p=>p.regimes.filter(row=>{
    const frozen=row.frozen_sealed,candidate=row.candidate_sealed;
    assert.equal(candidate.attempted+candidate.abstained,48);
    assert.equal(candidate.signal_hits+candidate.signal_misses,candidate.attempted);
    assert.equal(candidate.abstained,frozen.abstained);
    return (!row.drift_flagged&&frozen.null_false_alarm_rate>.10)||
      candidate.null_false_alarm_rate>.10||candidate.coverage<.75||
      candidate.signal_hits<frozen.signal_hits||
      (p.budget>0&&candidate.signal_hits===0);
  }));
  assert.equal(r.failure_ledger.length,failures.length);
  assert.equal(r.summary.failure_cells,failures.length);
  assert.equal(r.summary.zero_budget_blind,true);
  assert.equal(r.summary.deployments_authorized,0);
  assert.equal(r.epistemic_origin,'SIMULATED');
  assert.equal(r.action_authorized,false);
});
