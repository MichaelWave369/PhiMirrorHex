import test from 'node:test';
import assert from 'node:assert/strict';
import {PROFILES} from '../src/coherence-model.mjs';
import {adaptiveBenchmark,trainAdaptive,CHECKPOINTS} from '../src/adaptive-model.mjs';

test('E7 training consumes exactly 128 same-cost online updates and stores six weight checkpoints',()=>{
  for(const profile of PROFILES){
    const t=trainAdaptive('phi_outer',profile);
    assert.equal(t.train_updates,128);
    assert.equal(t.train_readings,768);
    assert.equal(t.gradient_terms,768);
    assert.equal(t.exponential_terms,768);
    assert.equal(t.updated_parameters,6);
    assert.deepEqual(t.snapshots.map(x=>x.updates),CHECKPOINTS);
    for(const snap of t.snapshots){
      assert.ok(Math.abs(snap.weights.reduce((a,b)=>a+b,0)-1)<1e-12);
      assert.ok(snap.weights.every(w=>w>0));
    }
  }
});
test('E7 feedback is not a decorative toggle',()=>{
  const a=trainAdaptive('phi_outer','equal');
  const b=trainAdaptive('phi_outer','equal',{shuffled:true});
  assert.notDeepEqual(a.final_weights,b.final_weights);
  assert.deepEqual(a,trainAdaptive('phi_outer','equal'));
});
test('E7 all five synthetic worlds and validation selection are disclosed',()=>{
  const r=adaptiveBenchmark();
  assert.equal(r.worlds.length,5);
  for(const world of r.worlds){
    const chosen=[...PROFILES].sort((a,b)=>world.models[a].validation.mae-world.models[b].validation.mae||a.localeCompare(b))[0];
    assert.equal(world.selected_on_validation,chosen);
    assert.equal(world.matched_label_shuffle_control.same_update_count,128);
    assert.equal(world.matched_label_shuffle_control.trained.train_updates,128);
  }
  assert.equal(r.epistemic_origin,'SIMULATED');
  assert.equal(r.phi_optimality_demonstrated,false);
  assert.equal(r.action_authorized,false);
  assert.equal(r.causal_audit.fed_to_learner,false);
  assert.equal(r.causal_audit.step_10.coarse_gap,0);
  assert.ok(r.causal_audit.step_10.outer_hidden_difference>0);
  assert.ok(r.causal_audit.step_12.coarse_gap>0);
});
test('E7 unknown world and bad shuffle input rejected',()=>{
  assert.throws(()=>trainAdaptive('no','equal'));
  assert.throws(()=>trainAdaptive('equal','no'));
  assert.throws(()=>trainAdaptive('equal','equal',{shuffled:1}));
});
