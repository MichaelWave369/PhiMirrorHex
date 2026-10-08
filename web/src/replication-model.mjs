// E11 independent JS replication of five sealed held-out E10 policy stress tests.
// Uses the E10 generator and readouts, never re-selects masks using replicate data.
import {generalizationReport,sourcePair,outerState,SCENARIOS,TEST_N,FLOOR}
  from './generalization-model.mjs';
import {gaps} from './frontier-model.mjs';

export const REPLICATION_SCHEMA='phimirrorhex.e11.replication-ledger.v1';
export const REPLICATION_SEEDS=Object.freeze([1101,1102,1103,1104,1105]);
export const FAMILIES=Object.freeze(['sparse','dense']);
const sum=values=>values.reduce((a,b)=>a+b,0);
function episode(seed,index){
  const family=index%2===0?'sparse':'dense';
  const initial=sourcePair(seed,index,family);
  const opposite=initial.map(v=>-v);
  const simulate=config=>[
    outerState(initial,config),outerState(opposite,config)
  ];
  return {
    family,
    worlds:{
      matched_probe:simulate({}),
      shifted_probe:simulate({probeSector:3}),
      no_probe:simulate({gain:0}),
      no_coupling:simulate({coupling:0})
    }
  };
}
function count(rows,mask,mode,scenario){
  return rows.reduce((n,row)=>n+(gaps(...row.worlds[scenario],mask)[mode]>FLOOR?1:0),0);
}
export function replicationReport(){
  const e10=generalizationReport();
  const policies=e10.policies;
  const failures=[];
  const replicates=REPLICATION_SEEDS.map(seed=>{
    const population=Array.from({length:TEST_N},(_,i)=>episode(seed,i));
    const strata=Object.fromEntries(FAMILIES.map(f=>[f,population.filter(row=>row.family===f)]));
    const scores=[];
    for(const policy of policies){
      const mask=policy.train_selected_mask,reference=policy.fixed_first_k_mask;
      for(const scenario of SCENARIOS){
        const mode=policy.readout;
        const selected=count(population,mask,mode,scenario);
        const fixed=count(population,reference,mode,scenario);
        scores.push({
          budget:policy.budget,readout:mode,scenario,
          mask,baseline_mask:reference,cases:TEST_N,
          selected_detected:selected,fixed_detected:fixed,
          selected_rate:selected/TEST_N,fixed_rate:fixed/TEST_N,
          delta_count:selected-fixed,
          strata:Object.fromEntries(FAMILIES.map(f=>[f,{
            cases:strata[f].length,
            selected_detected:count(strata[f],mask,mode,scenario),
            fixed_detected:count(strata[f],reference,mode,scenario)
          }]))
        });
        if(selected<fixed){
          failures.push({
            seed,budget:policy.budget,readout:mode,scenario,
            selected_detected:selected,fixed_detected:fixed,
            shortfall:fixed-selected,
            kind:'FROZEN_MASK_LOSES_TO_FIXED_BASELINE'
          });
        }
      }
    }
    return {
      seed,cases:TEST_N,
      family_counts:Object.fromEntries(FAMILIES.map(f=>[f,strata[f].length])),
      scores
    };
  });
  const aggregate=[];
  for(const policy of policies){
    for(const scenario of SCENARIOS){
      const rows=replicates.map(rep=>rep.scores.find(r=>
        r.budget===policy.budget&&r.readout===policy.readout&&r.scenario===scenario));
      const chosen=rows.map(r=>r.selected_detected);
      const baseline=rows.map(r=>r.fixed_detected);
      const delta=rows.map(r=>r.delta_count);
      aggregate.push({
        budget:policy.budget,readout:policy.readout,scenario,
        frozen_mask:policy.train_selected_mask,
        reference_mask:policy.fixed_first_k_mask,
        replicate_seeds:[...REPLICATION_SEEDS],
        selected_counts:chosen,fixed_counts:baseline,delta_counts:delta,
        selected_mean_rate:sum(chosen)/(rows.length*TEST_N),
        fixed_mean_rate:sum(baseline)/(rows.length*TEST_N),
        selected_min_rate:Math.min(...chosen)/TEST_N,
        selected_max_rate:Math.max(...chosen)/TEST_N,
        worst_delta_count:Math.min(...delta),
        losses:delta.filter(d=>d<0).length,
        ties:delta.filter(d=>d===0).length,
        wins:delta.filter(d=>d>0).length,
        interpretation:'finite selected seeds, not uncertainty interval'
      });
    }
  }
  return {
    schema:REPLICATION_SCHEMA,
    status:'FINITE_SYNTHETIC_REPLICATION_AND_FAILURE_LEDGER',
    epistemic_origin:'SIMULATED',
    physical_measurement:false,
    consciousness_measured:false,
    action_authorized:false,
    phi_optimality_proven:false,
    protocol:{
      training_source:'phimirrorhex.e10.generalization.v1',
      replication_seeds:[...REPLICATION_SEEDS],
      cases_per_replication:TEST_N,
      sparse_per_replication:TEST_N/2,
      dense_per_replication:TEST_N/2,
      readout_floor:FLOOR,
      sensor_policy:'E10 training-only selections, frozen across replicates',
      baseline:'E10 fixed first-k masks of identical sensor budget/readout',
      interventions:[...SCENARIOS],
      heldout_oracle_not_used:true,
      replication_test_used_for_selection:false,
      bounds:'min/max over five fixed synthetic seeds; no population CI',
      failure_criterion:'selected count strictly below fixed same-budget count',
      claim_boundary:'method stress test in programmed worlds only'
    },
    policy_count:policies.length,
    replicates,
    aggregate,
    failure_ledger:failures,
    summary:{
      seed_count:REPLICATION_SEEDS.length,
      replicate_cases_total:REPLICATION_SEEDS.length*TEST_N,
      policy_scenario_cells:aggregate.length,
      failure_cells:failures.length,
      every_coupling_off_cell_blind:replicates.every(rep=>rep.scores.every(r=>
        r.scenario!=='no_coupling'||(r.selected_detected===0&&r.fixed_detected===0))),
      empty_mask_never_detects:replicates.every(rep=>rep.scores.every(r=>
        r.budget!==0||(r.selected_detected===0&&r.fixed_detected===0))),
      all_failures_retained:true
    }
  };
}
