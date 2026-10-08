import test from 'node:test';
import assert from 'node:assert/strict';
import {transferReport,PROSPECTIVE_SEEDS,TRANSFER_CONDITIONS}
  from '../src/transfer-model.mjs';
import {generalizationReport} from '../src/generalization-model.mjs';
import {selectedSectors} from '../src/frontier-model.mjs';

test('E12 sealed policies share sensor budgets and are reproducible',()=>{
  const r=transferReport(),parent=generalizationReport();
  assert.equal(r.policy_count,14);
  assert.equal(r.summary.comparison_cells,280);
  assert.equal(r.summary.prospective_pairs,240);
  assert.equal(r.protocol.selection_sees_validation,false);
  assert.equal(r.protocol.selection_sees_prospective_test,false);
  for(const [i,p] of r.policies.entries()){
    assert.equal(p.masks.e10,parent.policies[i].train_selected_mask);
    assert.equal(p.masks.first_k,parent.policies[i].fixed_first_k_mask);
    assert.ok(Object.values(p.masks).every(m=>selectedSectors(m).length===p.budget));
    assert.equal(p.prospective_trials.length,20);
    assert.equal(p.validation.length,2);
  }
  assert.deepEqual(r,transferReport());
});
test('E12 all negative controls blind, per-family counts conserved, failures retained',()=>{
  const r=transferReport();
  assert.equal(r.summary.no_coupling_blind,true);
  assert.equal(r.summary.zero_budget_blind,true);
  assert.equal(r.summary.deployment_promotions,0);
  const losing=r.policies.flatMap(p=>p.prospective_trials.filter(t=>t.lost_to_any_baseline));
  assert.equal(losing.length,r.failure_ledger.length);
  for(const p of r.policies){
    const gate=TRANSFER_CONDITIONS.every(s=>p.summary[s].losses_to_any_baseline===0);
    assert.equal(p.descriptive_transfer_gate,gate?'PASS_IN_THIS_TOY':'FAIL_IN_THIS_TOY');
    for(const trial of p.prospective_trials){
      assert.ok(PROSPECTIVE_SEEDS.includes(trial.seed));
      assert.equal(trial.total,48);
      for(const mode of ['robust','e10','first_k']){
        assert.equal(trial.counts[mode],trial.sparse_counts[mode]+trial.dense_counts[mode]);
      }
    }
  }
  assert.equal(r.epistemic_origin,'SIMULATED');
  assert.equal(r.action_authorized,false);
  assert.equal(r.consciousness_measured,false);
});
