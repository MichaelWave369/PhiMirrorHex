// E13 independent browser calibration, fault abstention and finite test ledger.
import {sampleFeatures} from './coherence-model.mjs';
import {sourcePair,outerState} from './generalization-model.mjs';
import {gaps} from './frontier-model.mjs';
import {transferReport} from './transfer-model.mjs';

export const CALIBRATION_SCHEMA='phimirrorhex.e13.calibrated-refusal.v1';
export const CALIBRATION_SEED=1401,TEST_SEEDS=Object.freeze([1501,1502,1503,1504,1505]);
export const SCENARIOS=Object.freeze(['matched_probe','shifted_probe','no_coupling']);
export const ARMS=Object.freeze(['robust','e10','first_k']);
const CASES=48,AMPLITUDE=.018,ALLOWED=2,FLOOR=.01,FAULT_EVERY=8;
const MAX_FAR=.10,MIN_COVERAGE=.75;
function population(seed){
  return Array.from({length:CASES},(_,i)=>{
    const family=i%2===0?'sparse':'dense';
    const initial=sourcePair(seed,i,family), opposite=initial.map(v=>-v);
    const pair=config=>[outerState(initial,config),outerState(opposite,config)];
    return {
      worlds:{
        matched_probe:pair({}),
        shifted_probe:pair({probeSector:3}),
        no_coupling:pair({coupling:0})
      }
    };
  });
}
function noise(seed,index){
  const aa=sampleFeatures(seed+20000,index).features;
  const bb=sampleFeatures(seed+21000,index).features;
  return [aa.map(v=>AMPLITUDE*(v-.5)),bb.map(v=>AMPLITUDE*(v-.5))];
}
const observe=(a,b,na,nb)=>[
  a.map((x,i)=>x+na[i]), b.map((x,i)=>x+nb[i])
];
function calibrate(rows,mask,mode){
  const values=rows.map((row,index)=>{
    const a=row.worlds.matched_probe[0];
    const [na,nb]=noise(CALIBRATION_SEED,index);
    return gaps(...observe(a,a,na,nb),mask)[mode];
  });
  const sorted=[...values].sort((a,b)=>b-a);
  const threshold=Math.max(FLOOR,sorted[ALLOWED]);
  return {
    threshold,
    calibration_null_detected:values.filter(v=>v>threshold).length,
    calibration_null_count:CASES,
    rule:'max(floor, third-largest of 48 noise-only gaps), strict >'
  };
}
function evaluate(rows,seed,scenario,mask,mode,threshold){
  let falseAlarms=0, signalHits=0, abstained=0;
  const examples=[];
  rows.forEach((row,index)=>{
    const [na,nb]=noise(seed,index);
    const faulty=index%FAULT_EVERY===0, badSector=(seed+index)%6;
    if(faulty&&(mask&(1<<badSector))!==0){
      abstained++;
      if(examples.length<4)examples.push({index,status:'ABSTAIN',fault_sector:badSector});
      return;
    }
    const [a,b]=row.worlds[scenario];
    const ng=gaps(...observe(a,a,na,nb),mask)[mode];
    falseAlarms+=ng>threshold?1:0;
    let sg=null;
    if(scenario!=='no_coupling'){
      sg=gaps(...observe(a,b,na,nb),mask)[mode];
      signalHits+=sg>threshold?1:0;
    }
    if(examples.length<4)examples.push({
      index,status:'MEASURED',fault_sector:faulty?badSector:null,
      null_gap:ng,signal_gap:sg
    });
  });
  const attempted=CASES-abstained,isSignal=scenario!=='no_coupling';
  return {
    cases:CASES,attempted,abstained,coverage:attempted/CASES,
    null_false_alarms:falseAlarms,
    null_correct_rejections:attempted-falseAlarms,
    null_false_alarm_rate:attempted?falseAlarms/attempted:null,
    signal_detected:isSignal?signalHits:null,
    signal_missed:isSignal?attempted-signalHits:null,
    signal_detection_rate:attempted&&isSignal?signalHits/attempted:null,
    fault_policy:'abstain if selected sensor identity has a declared fault',
    example_receipts:examples
  };
}
export function calibrationReport(){
  const parent=transferReport();
  const calibration=population(CALIBRATION_SEED);
  const tests=Object.fromEntries(TEST_SEEDS.map(s=>[s,population(s)]));
  const failures=[];
  const policies=parent.policies.map(p=>{
    const {budget,readout}=p;
    const cal=Object.fromEntries(ARMS.map(name=>[
      name,calibrate(calibration,p.masks[name],readout)
    ]));
    const trials=[];
    for(const seed of TEST_SEEDS){
      for(const scenario of SCENARIOS){
        const arms=Object.fromEntries(ARMS.map(name=>[
          name,evaluate(tests[seed],seed,scenario,p.masks[name],readout,cal[name].threshold)
        ]));
        const robust=arms.robust;
        const falseFail=robust.null_false_alarm_rate!==null&&robust.null_false_alarm_rate>MAX_FAR;
        const loss=scenario!=='no_coupling'&&robust.signal_detected<
          Math.max(arms.e10.signal_detected,arms.first_k.signal_detected);
        if(falseFail||loss)failures.push({
          seed,budget,readout,scenario,
          false_alarm_limit_exceeded:falseFail,
          fewer_detections_than_baseline:loss,
          robust_signal_detected:robust.signal_detected,
          baseline_e10_signal_detected:arms.e10.signal_detected,
          baseline_first_k_signal_detected:arms.first_k.signal_detected,
          robust_false_alarm_rate:robust.null_false_alarm_rate
        });
        trials.push({seed,scenario,arms});
      }
    }
    const results=trials.map(t=>t.arms.robust);
    const passed=budget>0&&results.every(r=>r.coverage>=MIN_COVERAGE)&&
      results.every(r=>r.null_false_alarm_rate!==null&&r.null_false_alarm_rate<=MAX_FAR)&&
      results.filter(r=>r.signal_detected!==null).every(r=>r.signal_detected>0);
    return {
      budget,readout,frozen_masks:{...p.masks},
      calibration:cal,trials,
      toy_refusal_gate:passed?'PASS_IN_TOY':'FAIL_IN_TOY',
      decision_authorized:false
    };
  });
  return {
    schema:CALIBRATION_SCHEMA,
    status:'SIMULATED_NOISE_CALIBRATION_AND_REFUSAL_LEDGER',
    epistemic_origin:'SIMULATED',
    physical_measurement:false,consciousness_measured:false,
    action_authorized:false,phi_optimality_proven:false,
    protocol:{
      parent_schema:parent.schema,
      calibration_seed:CALIBRATION_SEED,
      prospective_test_seeds:[...TEST_SEEDS],
      cases_per_seed:CASES,
      noise_amplitude:AMPLITUDE,
      calibration_max_false_alarms:ALLOWED,
      calibration_min_floor:FLOOR,
      fault_every_nth_case:FAULT_EVERY,
      fault_sector_rule:'(seed + index) mod 6',
      null_definition:'identical latent A on both sides, independent sensor noise',
      signal_definition:'counterposed simulated outer states, independent sensor noise',
      no_coupling:'null-only negative control; no signal claim',
      calibration:'noise-only cases; no mask reselection',
      test:'new seeds never used for threshold, mask or gate tuning',
      toy_gate_coverage_min:MIN_COVERAGE,
      toy_gate_false_alarm_max:MAX_FAR,
      toy_gate_requires_nonzero_signal_detection:true,
      toy_gate_authorizes_nothing:true,
      detection_metric:'absolute identity-max or masked-sum gap > calibrated floor',
      failure_criterion:'robust false alarms > 10%, or signal hits below either same-budget baseline'
    },
    policies,failure_ledger:failures,
    summary:{
      policies:policies.length,
      scored_cells:policies.length*TEST_SEEDS.length*SCENARIOS.length,
      failure_cells:failures.length,
      toy_gate_passes:policies.filter(p=>p.toy_refusal_gate==='PASS_IN_TOY').length,
      empty_mask_blind:policies.filter(p=>p.budget===0).every(p=>p.trials.every(t=>
        Object.values(t.arms).every(v=>v.null_false_alarms===0&&(v.signal_detected===0||v.signal_detected===null)))),
      calibration_cap_respected:policies.every(p=>Object.values(p.calibration).every(c=>
        c.calibration_null_detected<=ALLOWED)),
      all_failures_retained:true,
      deployment_promotions:0
    }
  };
}
