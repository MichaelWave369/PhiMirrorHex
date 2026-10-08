// E12: independent finite synthetic transfer-gate implementation.
// Mask selection only sees development seeds. Evaluation cannot rewrite it.
import {sourcePair,outerState,generalizationReport,SCENARIOS,TEST_N,FLOOR}
  from './generalization-model.mjs';
import {ALL_MASKS,selectedSectors,gaps} from './frontier-model.mjs';

export const TRANSFER_SCHEMA='phimirrorhex.e12.sensor-transfer-gate.v1';
export const DEVELOPMENT_SEEDS=Object.freeze([1201,1202,1203]);
export const VALIDATION_SEED=1204;
export const PROSPECTIVE_SEEDS=Object.freeze([1301,1302,1303,1304,1305]);
export const TRANSFER_CONDITIONS=Object.freeze(['matched_probe','shifted_probe']);
const N=TEST_N;
const sum=arr=>arr.reduce((a,b)=>a+b,0);
function makeEpisode(seed,index){
  const family=index%2===0?'sparse':'dense';
  const initial=sourcePair(seed,index,family),other=initial.map(x=>-x);
  const paired=cfg=>[outerState(initial,cfg),outerState(other,cfg)];
  return {family,worlds:{
    matched_probe:paired({}),
    shifted_probe:paired({probeSector:3}),
    no_probe:paired({gain:0}),
    no_coupling:paired({coupling:0})
  }};
}
const population=seed=>Array.from({length:N},(_,index)=>makeEpisode(seed,index));
const count=(rows,mask,readout,scenario)=>rows.reduce(
  (num,row)=>num+(gaps(...row.worlds[scenario],mask)[readout]>FLOOR?1:0),0
);
function choose(development,budget,readout){
  const candidates=ALL_MASKS.filter(mask=>selectedSectors(mask).length===budget);
  const computed=candidates.map(mask=>{
    const by=Object.fromEntries(TRANSFER_CONDITIONS.map(s=>[
      s,development.reduce((n,rows)=>n+count(rows,mask,readout,s),0)
    ]));
    const worst=Math.min(...Object.values(by));
    return {mask,worst,total:sum(Object.values(by)),by};
  });
  computed.sort((a,b)=>b.worst-a.worst||b.total-a.total||a.mask-b.mask);
  const best=computed[0];
  return {
    mask:best.mask,development_worst_count:best.worst,
    development_total_count:best.total,
    development_by_condition:best.by,
    candidate_masks_evaluated:candidates.length
  };
}
function score(rows,masks,readout,scenario,seed){
  const counts=Object.fromEntries(Object.entries(masks).map(([name,mask])=>[
    name,count(rows,mask,readout,scenario)
  ]));
  const sparse=rows.filter(r=>r.family==='sparse');
  const dense=rows.filter(r=>r.family==='dense');
  const sparse_counts=Object.fromEntries(Object.entries(masks).map(([name,mask])=>[
    name,count(sparse,mask,readout,scenario)
  ]));
  const dense_counts=Object.fromEntries(Object.entries(masks).map(([name,mask])=>[
    name,count(dense,mask,readout,scenario)
  ]));
  return {
    seed,scenario,total:rows.length,counts,sparse_counts,dense_counts,
    delta_vs_e10:counts.robust-counts.e10,
    delta_vs_first_k:counts.robust-counts.first_k,
    lost_to_any_baseline:counts.robust<counts.e10||counts.robust<counts.first_k
  };
}
export function transferReport(){
  const e10=generalizationReport();
  const development=DEVELOPMENT_SEEDS.map(population);
  const validation=population(VALIDATION_SEED);
  const prospective=PROSPECTIVE_SEEDS.map(population);
  const failures=[];
  const policies=e10.policies.map(parent=>{
    const {budget,readout}=parent;
    const selection_receipt=choose(development,budget,readout);
    const masks={
      robust:selection_receipt.mask,
      e10:parent.train_selected_mask,
      first_k:parent.fixed_first_k_mask
    };
    const validationScores=TRANSFER_CONDITIONS.map(s=>
      score(validation,masks,readout,s,VALIDATION_SEED));
    const trials=[];
    PROSPECTIVE_SEEDS.forEach((seed,i)=>{
      for(const scenario of SCENARIOS){
        const trial=score(prospective[i],masks,readout,scenario,seed);
        trials.push(trial);
        if(trial.lost_to_any_baseline){
          failures.push({
            seed,budget,readout,scenario,counts:trial.counts,
            delta_vs_e10:trial.delta_vs_e10,
            delta_vs_first_k:trial.delta_vs_first_k,
            kind:'ROBUST_MASK_LOSES_TO_FROZEN_BASELINE'
          });
        }
      }
    });
    const summary=Object.fromEntries(SCENARIOS.map(scenario=>{
      const rows=trials.filter(t=>t.scenario===scenario);
      return [scenario,{
        replicate_seeds:[...PROSPECTIVE_SEEDS],
        robust_counts:rows.map(r=>r.counts.robust),
        e10_counts:rows.map(r=>r.counts.e10),
        first_k_counts:rows.map(r=>r.counts.first_k),
        mean_robust_rate:sum(rows.map(r=>r.counts.robust))/(rows.length*N),
        worst_margin_vs_e10:Math.min(...rows.map(r=>r.delta_vs_e10)),
        worst_margin_vs_first_k:Math.min(...rows.map(r=>r.delta_vs_first_k)),
        losses_to_any_baseline:rows.filter(r=>r.lost_to_any_baseline).length
      }];
    }));
    const gate=TRANSFER_CONDITIONS.every(s=>summary[s].losses_to_any_baseline===0);
    return {
      budget,readout,sensor_readings_per_pair:budget,
      policy_selection_split:'development_only',
      masks,selection_receipt,
      validation:validationScores,
      prospective_trials:trials,
      summary,
      descriptive_transfer_gate:gate?'PASS_IN_THIS_TOY':'FAIL_IN_THIS_TOY',
      gate_is_deployment_authority:false
    };
  });
  return {
    schema:TRANSFER_SCHEMA,status:'SEALED_FINITE_SYNTHETIC_TRANSFER_STRESS_TEST',
    epistemic_origin:'SIMULATED',physical_measurement:false,
    consciousness_measured:false,action_authorized:false,phi_optimality_proven:false,
    protocol:{
      parent_schema:e10.schema,
      development_seeds:[...DEVELOPMENT_SEEDS],
      validation_seed:VALIDATION_SEED,
      prospective_seeds:[...PROSPECTIVE_SEEDS],
      cases_per_seed:N,population_family:'alternating_sparse_dense',
      sparse_per_seed:N/2,dense_per_seed:N/2,
      fixed_detection_floor:FLOOR,
      development_conditions:[...TRANSFER_CONDITIONS],
      evaluation_conditions:[...SCENARIOS],
      selection:'maximize minimum development detection count between known/shifted probes; then total count; then smallest mask',
      selection_sees_validation:false,selection_sees_prospective_test:false,
      all_three_policies_same_budget_and_readout:true,
      baseline_e10:'unchanged E10 train-selected mask',
      baseline_first_k:'unchanged deterministic first-k mask',
      gate_rule:'no losses vs either baseline in any of five prospective replicates under BOTH matching and shifted probes',
      gate_is_descriptive_not_authority:true,
      uncertainty:'finite seed extremes only, no confidence interval'
    },
    policy_count:policies.length,policies,failure_ledger:failures,
    summary:{
      prospective_pairs:PROSPECTIVE_SEEDS.length*N,
      distinct_prospective_seeds:PROSPECTIVE_SEEDS.length,
      comparison_cells:policies.length*PROSPECTIVE_SEEDS.length*SCENARIOS.length,
      failure_cells:failures.length,
      descriptive_gate_passes:policies.filter(p=>p.descriptive_transfer_gate==='PASS_IN_THIS_TOY').length,
      no_coupling_blind:policies.every(p=>p.prospective_trials.filter(t=>t.scenario==='no_coupling')
        .every(t=>Object.values(t.counts).every(v=>v===0))),
      zero_budget_blind:policies.filter(p=>p.budget===0).every(p=>
        p.prospective_trials.every(t=>Object.values(t.counts).every(v=>v===0))),
      failure_ledger_exhaustive:true,
      deployment_promotions:0
    }
  };
}
