import test from 'node:test';
import assert from 'node:assert/strict';
import {replicationReport,REPLICATION_SEEDS} from '../src/replication-model.mjs';
import {generalizationReport} from '../src/generalization-model.mjs';

test('E11 sealed masks and separate fixed synthetic replicate seeds',()=>{
  const r=replicationReport(),e10=generalizationReport();
  assert.equal(r.replicates.length,5);
  assert.equal(r.policy_count,14);
  assert.deepEqual(r.protocol.replication_seeds,REPLICATION_SEEDS);
  assert.equal(r.aggregate.length,56);
  assert.equal(r.protocol.replication_test_used_for_selection,false);
  for(const rep of r.replicates){
    assert.equal(rep.scores.length,56);
    assert.deepEqual(rep.family_counts,{sparse:24,dense:24});
    for(const s of rep.scores){
      const trained=e10.policies.find(p=>p.budget===s.budget&&p.readout===s.readout);
      assert.equal(s.mask,trained.train_selected_mask);
      assert.equal(s.baseline_mask,trained.fixed_first_k_mask);
      assert.equal(s.strata.sparse.cases+s.strata.dense.cases,48);
    }
  }
  assert.equal(r.summary.every_coupling_off_cell_blind,true);
  assert.equal(r.summary.empty_mask_never_detects,true);
});
test('E11 failures are disclosed with no synthetic claim escalation',()=>{
  const r=replicationReport();
  const actual=r.replicates.flatMap(rep=>rep.scores.filter(s=>s.delta_count<0));
  assert.equal(r.failure_ledger.length,actual.length);
  assert.equal(r.summary.failure_cells,actual.length);
  for(const a of r.aggregate){
    assert.equal(a.wins+a.ties+a.losses,5);
    assert.ok(a.selected_min_rate<=a.selected_mean_rate);
    assert.ok(a.selected_mean_rate<=a.selected_max_rate);
  }
  assert.equal(r.epistemic_origin,'SIMULATED');
  assert.equal(r.physical_measurement,false);
  assert.equal(r.action_authorized,false);
});
