import test from 'node:test';
import assert from 'node:assert/strict';
import {perturb,robustnessBenchmark,SCENARIOS} from '../src/robustness-model.mjs';

test('E8 perturbation controls preserve clean inputs and identity loss',()=>{
  const f=[.05,.2,.4,.6,.8,.95];
  assert.deepEqual(perturb(f,0,'clean'),f);
  assert.deepEqual(perturb(f,0,'mean_only'),Array(6).fill(f.reduce((a,b)=>a+b)/6));
  assert.equal(perturb(f,0,'dropout')[1],.5);
  assert.equal(perturb(f,0,'dropout')[4],.5);
  assert.deepEqual(perturb(f,9,'noise'),perturb(f,9,'noise'));
  assert.notDeepEqual(perturb(f,9,'noise'),f);
  assert.throws(()=>perturb(f,0,'fake'));
  assert.throws(()=>perturb(f,-1,'noise'));
});
test('E8 does not retune on shifted labels, preserves synthetic boundaries',()=>{
  const report=robustnessBenchmark();
  assert.equal(report.worlds.length,5);
  assert.equal(report.retraining_on_shift,false);
  assert.equal(report.labels_preserved_under_shift,true);
  assert.equal(report.action_authorized,false);
  assert.equal(report.consciousness_measured,false);
  for(const row of report.worlds){
    assert.equal(row.selection_not_changed_after_shifts,true);
    for(const init of report.profiles){
      const scenarios=row.models[init].scenarios;
      assert.deepEqual(Object.keys(scenarios),SCENARIOS);
      assert.ok(SCENARIOS.every(s=>scenarios[s].case_count===128));
    }
  }
});
test('E8 E5 Keyhole compression gives an intentionally failing coarse baseline at t10',()=>{
  const [ten,twelve]=robustnessBenchmark().memory_keyhole.cases;
  assert.equal(ten.sum_only_correct_of_two,1);
  assert.equal(ten.full_state_correct_of_two,2);
  assert.equal(twelve.sum_only_correct_of_two,2);
});
