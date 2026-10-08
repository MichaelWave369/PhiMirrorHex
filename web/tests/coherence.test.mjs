import test from 'node:test';
import assert from 'node:assert/strict';
import {coherenceBenchmark,sampleFeatures,WEIGHTS,PROFILES,TEST_SEED,VALIDATION_SEED} from '../src/coherence-model.mjs';

test('six input readings and five same-cost weighting profiles',()=>{
  for(const p of PROFILES) {
    assert.equal(WEIGHTS[p].length,6);
    assert.ok(Math.abs(WEIGHTS[p].reduce((a,b)=>a+b,0)-1)<1e-12);
  }
  assert.notDeepEqual(WEIGHTS.phi_inner,WEIGHTS.phi_outer);
});
test('independent split seeds and replay exact',()=>{
  assert.deepEqual(sampleFeatures(TEST_SEED,0),sampleFeatures(TEST_SEED,0));
  assert.notDeepEqual(sampleFeatures(TEST_SEED,0),sampleFeatures(VALIDATION_SEED,0));
});
test('every engineered world prefers matching candidate on holdout',()=>{
  const b=coherenceBenchmark();
  assert.equal(b.results.length,5);
  for(const row of b.results) {
    assert.equal(row.selected_on_validation,row.regime);
    assert.equal(row.world_is_constructed,true);
    assert.equal(row.held_out[row.regime].weighted_terms_per_case,6);
    assert.equal(Object.keys(row.held_out).length,5);
    const best=[...PROFILES].sort((a,b)=>row.held_out[a].mae-row.held_out[b].mae)[0];
    assert.equal(best,row.regime);
  }
  assert.equal(b.epistemic_origin,'SIMULATED');
  assert.equal(b.phi_is_proven_optimal,false);
  assert.equal(b.action_authorized,false);
});
test('invalid feature arguments fail',()=>{
  for(const seed of [-1,true,NaN,2**31])assert.throws(()=>sampleFeatures(seed,0));
  for(const index of [-1,true,100000])assert.throws(()=>sampleFeatures(202,index));
});
