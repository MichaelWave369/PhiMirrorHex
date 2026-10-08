// E10 independent JavaScript counterpart of frozen Python generalization engine.
// No network/biological data. Test cases cannot influence selected sensor policies.
import {ALL_MASKS,selectedSectors,gaps} from './frontier-model.mjs';

export const GENERALIZATION_SCHEMA='phimirrorhex.e10.generalization.v1';
export const MODES=Object.freeze(['identity_max','masked_sum']);
export const SCENARIOS=Object.freeze(['matched_probe','shifted_probe','no_probe','no_coupling']);
export const TRAIN_SEED=901,VALIDATION_SEED=902,TEST_SEED=903;
export const TRAIN_N=48,VALIDATION_N=24,TEST_N=48;
export const FLOOR=.01,HORIZON=12,COUPLING=.5,GAIN=.5;
const SECTORS=6,RINGS=6,PROBE_STEP=12,RETENTION=.5;
const U32=0xffffffff;
const zero=()=>Array.from({length:RINGS},()=>Array(SECTORS).fill(0));
const sum=values=>values.reduce((a,b)=>a+b,0);
const next=previous=>{
  let state=previous>>>0;
  state^=state<<13;state^=state>>>17;state^=state<<5;
  return state>>>0;
};
export function sourcePair(seed,index,family){
  if(!Number.isInteger(seed)||seed<0||seed>2147483647)throw new RangeError('invalid seed');
  if(!Number.isInteger(index)||index<0||index>=100000)throw new RangeError('invalid index');
  if(!['sparse','dense'].includes(family))throw new RangeError('invalid family');
  let state=(seed^Math.imul(index+1,0x9e3779b9)^Math.imul(seed+1,0x85ebca6b))>>>0;
  if(state===0)state=0x6d2b79f5;
  const draws=[];
  for(let i=0;i<8;i++){state=next(state);draws.push(state);}
  if(family==='sparse'){
    const a=draws[0]%SECTORS,b=(a+1+draws[1]%5)%SECTORS;
    const strength=.5*(1+draws[2]%4);
    const out=Array(SECTORS).fill(0);
    out[a]=strength;out[b]=-strength;
    return out;
  }
  const values=draws.slice(0,SECTORS).map(d=>(d%7)-3);
  const avg=sum(values)/SECTORS;
  const result=values.map(v=>(v-avg)*.5);
  return result.some(v=>v!==0)?result:[1,-1,0,0,0,0];
}
export function outerState(initial,{coupling=COUPLING,probeSector=0,gain=GAIN}={}){
  if(!Number.isInteger(probeSector)||probeSector<0||probeSector>=6)throw new RangeError('invalid probe sector');
  let state=zero(),conveyor=zero();
  state[0]=[...initial];
  for(let t=1;t<=HORIZON;t++){
    const future=zero();
    for(let ring=0;ring<RINGS;ring++){
      const values=state[ring];
      const rotated=ring%2===0?[values.at(-1),...values.slice(0,-1)]:[...values.slice(1),values[0]];
      for(let sector=0;sector<SECTORS;sector++){
        future[ring][sector]=RETENTION*rotated[sector]+coupling*conveyor[ring][sector];
      }
    }
    const buffer=zero();
    for(let ring=1;ring<RINGS;ring++)buffer[ring]=[...state[ring-1]];
    if(t===PROBE_STEP)future[RINGS-1][probeSector]*=1+gain;
    state=future;conveyor=buffer;
  }
  return state[5];
}
function episode(seed,index,family){
  const initial=sourcePair(seed,index,family),opposite=initial.map(v=>-v);
  const world=(config)=>[
    outerState(initial,config),outerState(opposite,config)
  ];
  return {
    id:seed+'-'+String(index).padStart(3,'0'),
    family,initial,
    worlds:{
      matched_probe:world({}),
      shifted_probe:world({probeSector:3}),
      no_probe:world({gain:0}),
      no_coupling:world({coupling:0})
    }
  };
}
function dataset(seed,count,test){
  return Array.from({length:count},(_,i)=>episode(seed,i,test&&i%2===1?'dense':'sparse'));
}
const count=(rows,mask,mode,scenario)=>
  rows.reduce((total,row)=>total+(gaps(...row.worlds[scenario],mask)[mode]>FLOOR?1:0),0);
function trainPolicy(rows,budget,mode){
  const options=ALL_MASKS.filter(mask=>selectedSectors(mask).length===budget);
  if(!options.length)throw new Error('bad budget');
  const scored=options.map(mask=>[count(rows,mask,mode,'matched_probe'),mask]);
  scored.sort((a,b)=>b[0]-a[0]||a[1]-b[1]);
  return scored[0];
}
export function generalizationReport(){
  const training=dataset(TRAIN_SEED,TRAIN_N,false);
  const validation=dataset(VALIDATION_SEED,VALIDATION_N,false);
  const holdout=dataset(TEST_SEED,TEST_N,true);
  const policies=[];
  for(let budget=0;budget<=6;budget++){
    for(const mode of MODES){
      const [score,selected]=trainPolicy(training,budget,mode);
      const fixed=(1<<budget)-1;
      const cases=Object.fromEntries(SCENARIOS.map(s=>[s,count(holdout,selected,mode,s)]));
      const reference=Object.fromEntries(SCENARIOS.map(s=>[s,count(holdout,fixed,mode,s)]));
      const posthoc=Math.max(...ALL_MASKS.filter(m=>selectedSectors(m).length===budget)
        .map(m=>count(holdout,m,mode,'matched_probe')));
      policies.push({
        budget,readout:mode,train_selected_mask:selected,train_detected:score,
        train_total:TRAIN_N,
        validation_detected:count(validation,selected,mode,'matched_probe'),
        validation_total:VALIDATION_N,
        heldout_detected:cases,heldout_total:TEST_N,
        fixed_first_k_mask:fixed,fixed_first_k_heldout:reference,
        posthoc_best_test_count_diagnostic_only:posthoc,
        sensor_readings:budget,selection_split:'train_only',
        reoptimized_on_test:false
      });
    }
  }
  const examples=holdout.slice(0,6).map(row=>({
    id:row.id,family:row.family,initial:[...row.initial],
    outer_by_scenario:Object.fromEntries(SCENARIOS.map(s=>{
      const [a,b]=row.worlds[s];
      return [s,{a:[...a],b:[...b],global_sum_gap:Math.abs(sum(a)-sum(b))}];
    }))
  }));
  return {
    schema:GENERALIZATION_SCHEMA,status:'SYNTHETIC_HELDOUT_CAUSAL_GENERALIZATION_TOY',
    epistemic_origin:'SIMULATED',physical_measurement:false,
    consciousness_measured:false,action_authorized:false,phi_optimality_proven:false,
    protocol:{
      train_seed:TRAIN_SEED,validation_seed:VALIDATION_SEED,holdout_seed:TEST_SEED,
      train_count:TRAIN_N,validation_count:VALIDATION_N,holdout_count:TEST_N,
      heldout_families:['sparse','dense'],train_families:['sparse'],
      holdout_dense_count:TEST_N/2,readout_floor:FLOOR,horizon:HORIZON,
      same_mask_same_budget:true,masks_total:ALL_MASKS.length,
      selection_rule:'max training matched-probe detection, smallest-mask tie-break',
      matched_probe_sector:0,shifted_probe_sector:3,intervention_at_step:PROBE_STEP,
      coupling:COUPLING,probe_gain:GAIN,retention:RETENTION,
      negative_controls:['no_probe','no_coupling'],
      sources_are_generated_not_empirical:true,heldout_used_for_selection:false,
      validation_used_for_selection:false,posthoc_diagnostic_never_selected:true,
      no_conveyor_modification:'not tested separately: see E5/E9',
      claim_boundary:'held-out toy episodes; no real causal generalization claim'
    },
    policies,heldout_examples:examples,
    controls:{
      full_mask_readings:6,
      empty_mask_always_blind:policies.filter(p=>p.budget===0)
        .every(p=>p.heldout_detected.matched_probe===0),
      no_coupling_always_blind:policies.every(p=>p.heldout_detected.no_coupling===0),
      no_probe_can_still_separate_partial_sums:policies.some(p=>
        p.readout==='masked_sum'&&p.heldout_detected.no_probe>0)
    }
  };
}
