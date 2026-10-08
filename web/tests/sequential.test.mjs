import test from 'node:test';
import assert from 'node:assert/strict';
import {sequentialReport,sequentialTrace,DEVELOPMENT_SEEDS,TESTS,LENGTH}
  from '../src/sequential-model.mjs';
import {calibrationReport} from '../src/calibration-model.mjs';

test('E15 masks/floors frozen, development alarms prohibited',()=>{
  const r=sequentialReport(),parent=calibrationReport();
  assert.equal(r.summary.evaluation_cells,112);
  assert.equal(r.policies.length,14);
  assert.equal(r.protocol.test_data_used_for_calibration,false);
  const holdout=new Set(TESTS.map(t=>t[1]));
  assert.ok(DEVELOPMENT_SEEDS.every(s=>!holdout.has(s)));
  r.policies.forEach((p,i)=>{
    assert.equal(p.frozen_mask,parent.policies[i].frozen_masks.robust);
    assert.equal(p.frozen_e13_floor,parent.policies[i].calibration.robust.threshold);
    assert.ok(p.sequential_alert_limit>Math.max(...p.development_maxima));
    assert.equal(p.trials.length,TESTS.length);
    assert.equal(p.development_alerts,0);
    for(const seed of DEVELOPMENT_SEEDS){
      const dev=sequentialTrace(seed,'stationary',p.frozen_mask,
        p.readout,p.frozen_e13_floor,p.sequential_alert_limit);
      assert.equal(dev.first_alarm_step,null);
    }
  });
});
test('E15 one-shot alerts and fault abstention do not advance CUSUM',()=>{
  const r=sequentialReport();
  for(const p of r.policies)for(const t of p.trials){
    assert.equal(t.frames.length,LENGTH);
    assert.equal(t.observed+t.abstained,LENGTH);
    const alerts=t.frames.filter(f=>f.new_alert);
    assert.ok(alerts.length<=1);
    assert.equal(t.first_alarm_step,alerts[0]?.step??null);
    for(let i=1;i<t.frames.length;i++){
      const f=t.frames[i];
      if(f.abstained){
        assert.equal(f.gap,null);
        assert.equal(f.cusum,t.frames[i-1].cusum);
      }
    }
    assert.ok(!(t.false_alarm&&t.persistent_change_detected));
  }
  assert.equal(r.summary.zero_budget_never_alarms,true);
});
test('E15 never censors negative outcomes or promotes toy result',()=>{
  const r=sequentialReport();
  const failures=r.policies.flatMap(p=>p.trials.filter(t=>
    t.false_alarm||t.persistent_change_missed||t.coverage<.75));
  assert.equal(r.failure_ledger.length,failures.length);
  assert.equal(r.summary.failure_cells,failures.length);
  assert.equal(r.summary.deployments_authorized,0);
  assert.equal(r.action_authorized,false);
  assert.equal(r.physical_measurement,false);
  assert.equal(r.consciousness_measured,false);
});
