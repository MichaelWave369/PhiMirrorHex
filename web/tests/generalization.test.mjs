import test from 'node:test';
import assert from 'node:assert/strict';
import {sourcePair,outerState,generalizationReport,SCENARIOS} from '../src/generalization-model.mjs';
import {selectedSectors} from '../src/frontier-model.mjs';

test('E10 independent synthetic source draws and probe guards',()=>{
  assert.deepEqual(sourcePair(901,2,'sparse'),sourcePair(901,2,'sparse'));
  assert.notDeepEqual(sourcePair(901,2,'sparse'),sourcePair(903,2,'dense'));
  assert.throws(()=>sourcePair(-1,2,'sparse'));
  assert.throws(()=>sourcePair(901,2,'weird'));
  assert.throws(()=>outerState([1,-1,0,0,0,0],{probeSector:6}));
});
test('E10 full train selection frozen before OOD episodes',()=>{
  const r=generalizationReport();
  assert.equal(r.policies.length,14);
  assert.equal(r.protocol.heldout_count,48);
  assert.equal(r.protocol.holdout_dense_count,24);
  assert.equal(r.protocol.heldout_used_for_selection,false);
  assert.equal(r.protocol.validation_used_for_selection,false);
  assert.equal(r.controls.empty_mask_always_blind,true);
  assert.equal(r.controls.no_coupling_always_blind,true);
  assert.equal(r.controls.no_probe_can_still_separate_partial_sums,true);
  assert.deepEqual(r,generalizationReport());
  for(const p of r.policies){
    assert.equal(selectedSectors(p.train_selected_mask).length,p.budget);
    assert.deepEqual(Object.keys(p.heldout_detected),SCENARIOS);
    assert.equal(p.heldout_detected.no_coupling,0);
    assert.equal(p.reoptimized_on_test,false);
    assert.ok(p.posthoc_best_test_count_diagnostic_only>=p.heldout_detected.matched_probe);
  }
});
test('E10 full-six masked-sum cannot separate without fixed probe',()=>{
  const r=generalizationReport();
  const p=r.policies.find(p=>p.budget===6&&p.readout==='masked_sum');
  assert.equal(p.heldout_detected.no_probe,0);
  assert.equal(r.epistemic_origin,'SIMULATED');
  assert.equal(r.consciousness_measured,false);
  assert.equal(r.action_authorized,false);
});
