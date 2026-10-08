// E8: independent JS evaluation of frozen E7 weights under synthetic shifts.
import {adaptiveBenchmark} from './adaptive-model.mjs';
import {PROFILES,WEIGHTS,SAMPLES,TEST_SEED,sampleFeatures} from './coherence-model.mjs';
import {buildGearReport} from './gears-model.mjs';

export const ROBUSTNESS_SCHEMA='phimirrorhex.e8.robustness.v1';
export const SCENARIOS=Object.freeze(['clean','noise','dropout','mean_only']);
export const NOISE_SEED=707,NOISE_AMPLITUDE=.25;
export const DROPPED_RINGS=Object.freeze([1,4]);
const dot=(a,b)=>a.reduce((sum,w,i)=>sum+w*b[i],0);

export function perturb(features,index,scenario){
  if(!SCENARIOS.includes(scenario))throw new RangeError('invalid perturbation');
  if(!Array.isArray(features)||features.length!==6||features.some(x=>!Number.isFinite(x)||x<0||x>1))throw new RangeError('six normalized readings required');
  if(!Number.isInteger(index)||index<0||index>=SAMPLES)throw new RangeError('invalid index');
  if(scenario==='clean')return [...features];
  if(scenario==='noise'){
    const {features:noise}=sampleFeatures(NOISE_SEED,index);
    return features.map((x,k)=>Math.max(0,Math.min(1,x+NOISE_AMPLITUDE*(noise[k]-.5))));
  }
  if(scenario==='dropout')return features.map((x,k)=>DROPPED_RINGS.includes(k) ? 0.5 : x);
  const mean=features.reduce((a,b)=>a+b,0)/6;
  return Array(6).fill(mean);
}
const heldout=world=>Array.from({length:SAMPLES},(_,index)=>{
  const {features,noise}=sampleFeatures(TEST_SEED,index);
  return [features,dot(WEIGHTS[world],features)+noise];
});
const metric=(weights,cases,scenario)=>{
  let abs=0,squared=0;
  cases.forEach(([features,label],index)=>{
    const delta=dot(weights,perturb(features,index,scenario))-label;
    abs+=Math.abs(delta);squared+=delta*delta;
  });
  return {mae:abs/SAMPLES,rmse:Math.sqrt(squared/SAMPLES),
    case_count:SAMPLES,features_read:6,weighted_terms:6};
};
function memoryControl(){
  const r=buildGearReport();
  const cases=[10,12].map(step=>{
    const frame=r.history[step],a=frame.state_a[5],b=frame.state_b[5];
    const sa=a.reduce((s,x)=>s+x,0),sb=b.reduce((s,x)=>s+x,0);
    const coarseEqual=sa===sb,fullDistinct=a.some((x,i)=>x!==b[i]);
    return {
      step,representation_full:'six signed outer-ring sectors',
      representation_coarse:'sum of outer-ring sectors',
      full_state_distinguishable:fullDistinct,
      coarse_state_distinguishable:!coarseEqual,
      full_state_correct_of_two:fullDistinct?2:1,
      sum_only_correct_of_two:coarseEqual?1:2,
      outer_a:sa,outer_b:sb,
      full_state_l1_difference:a.reduce((sum,x,i)=>sum+Math.abs(x-b[i]),0)
    };
  });
  return {
    source_schema:r.schema,
    epistemic_origin:'SIMULATED',fed_to_learner:false,decision_authority:false,
    cases,interpretation:'engineered two-case observability; not learned memory reconstruction'
  };
}
export function robustnessBenchmark(){
  const e7=adaptiveBenchmark();
  const worlds=e7.worlds.map(world=>{
    const test=heldout(world.world);
    const models=Object.fromEntries(PROFILES.map(initial=>[
      initial,{
        weights:[...world.models[initial].final_weights],
        scenarios:Object.fromEntries(SCENARIOS.map(s=>[s,metric(world.models[initial].final_weights,test,s)])),
        fixed_equal_reference:null
      }
    ]));
    const fixedEqual=Object.fromEntries(SCENARIOS.map(s=>[s,metric(WEIGHTS.equal,test,s)]));
    const chosen=models[world.selected_on_validation].scenarios;
    return {
      world:world.world,selected_on_prior_validation:world.selected_on_validation,
      selection_not_changed_after_shifts:true,models,
      fixed_equal_reference:fixedEqual,
      selected_deltas_vs_clean:Object.fromEntries(SCENARIOS.map(s=>[s,chosen[s].mae-chosen.clean.mae]))
    };
  });
  return {
    schema:ROBUSTNESS_SCHEMA,status:'SYNTHETIC_PERTURBATION_BENCHMARK',
    epistemic_origin:'SIMULATED',physical_measurement:false,
    consciousness_measured:false,phi_optimality_demonstrated:false,
    action_authorized:false,labels_preserved_under_shift:true,
    retraining_on_shift:false,
    source:{adaptive_schema:e7.schema,test_seed:TEST_SEED},
    protocol:{
      scenarios:[...SCENARIOS],samples_per_scenario:SAMPLES,
      noise_seed:NOISE_SEED,noise_amplitude:NOISE_AMPLITUDE,
      dropped_rings:[...DROPPED_RINGS],dropout_imputation:.5,
      mean_only:'all six features replaced by their arithmetic mean',
      targets:'original clean E6 programmed target, unchanged by perturbation',
      training:'frozen E7 learned weights, no refit under shift',
      candidate_choice:'E7 validation choice; never reselect on shifted test',
      cost:'six input readings and six weighted terms per inference, all arms',
      fixed_equal:'untrained descriptive comparison, not training-cost matched',
      safety:'synthetic demonstration, no autonomous actions or biology inference'
    },
    profiles:[...PROFILES],worlds,memory_keyhole:memoryControl()
  };
}
