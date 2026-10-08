import test from 'node:test';
import assert from 'node:assert/strict';
import {calibrationReport,CALIBRATION_SEED,TEST_SEEDS,SCENARIOS}
  from '../src/calibration-model.mjs';
import {transferReport} from '../src/transfer-model.mjs';

test('E13 frozen masks and separate calibration/holdout samples',()=>{
  const r=calibrationReport(),prior=transferReport();
  assert.equal(CALIBRATION_SEED,1401);
  assert.deepEqual(TEST_SEEDS,[1501,1502,1503,1504,1505]);
  assert.equal(r.policies.length,14);
  assert.equal(r.summary.scored_cells,210);
  assert.equal(r.summary.calibration_cap_respected,true);
  for(let i=0;i<14;i++){
    const p=r.policies[i];
    assert.deepEqual(p.frozen_masks,prior.policies[i].masks);
    assert.equal(p.trials.length,15);
    assert.ok(Object.values(p.calibration).every(c=>
      c.threshold>=.01&&c.calibration_null_detected<=2));
  }
});
test('E13 explicit abstention and null-only controls conserve denominators',()=>{
  const r=calibrationReport();
  assert.equal(r.summary.empty_mask_blind,true);
  assert.equal(r.action_authorized,false);
  assert.equal(r.summary.deployment_promotions,0);
  for(const p of r.policies){
    assert.equal(p.decision_authorized,false);
    for(const t of p.trials){
      assert.ok(SCENARIOS.includes(t.scenario));
      for(const arm of Object.values(t.arms)){
        assert.equal(arm.cases,48);
        assert.equal(arm.attempted+arm.abstained,48);
        assert.equal(arm.null_false_alarms+arm.null_correct_rejections,arm.attempted);
        if(t.scenario==='no_coupling'){
          assert.equal(arm.signal_detected,null);
        }else{
          assert.equal(arm.signal_detected+arm.signal_missed,arm.attempted);
        }
      }
    }
  }
});
test('E13 no negative trial is removed from failure ledger',()=>{
  const r=calibrationReport();
  const failures=r.policies.flatMap(p=>p.trials.filter(t=>{
    const a=t.arms;
    return (a.robust.null_false_alarm_rate!==null&&a.robust.null_false_alarm_rate>.10)||
      (t.scenario!=='no_coupling'&&a.robust.signal_detected<
        Math.max(a.e10.signal_detected,a.first_k.signal_detected));
  }));
  assert.equal(r.summary.failure_cells,failures.length);
  assert.equal(r.failure_ledger.length,failures.length);
  assert.equal(r.epistemic_origin,'SIMULATED');
  assert.equal(r.consciousness_measured,false);
});
