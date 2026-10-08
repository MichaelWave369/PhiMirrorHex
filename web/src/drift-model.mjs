// E14: independent browser implementation of monitor/shape/holdout separation.
// Frozen E13 masks and floors are never changed or granted deployment authority.
import {sampleFeatures} from './coherence-model.mjs';
import {sourcePair,outerState} from './generalization-model.mjs';
import {gaps} from './frontier-model.mjs';
import {calibrationReport} from './calibration-model.mjs';

export const DRIFT_SCHEMA='phimirrorhex.e14.drift-shadow.v1';
export const REGIMES=Object.freeze([
  ['nominal',.018,1601,1701,1801],
  ['noise_shift',.054,1602,1702,1802],
  ['recovered',.018,1603,1703,1803]
]);
const ARM='robust',CASES=48,MIN_FLOOR=.01,MAX_EXCEEDANCES=2;
const FALSE_ALARM_LIMIT=.10,COVERAGE_MIN=.75,FAULT_EVERY=8;
function population(seed){
  return Array.from({length:CASES},(_,index)=>{
    const family=index%2?'dense':'sparse';
    const initial=sourcePair(seed,index,family),opposite=initial.map(v=>-v);
    return {worlds:{matched_probe:[outerState(initial),outerState(opposite)]}};
  });
}
function noises(seed,index,amplitude){
  const a=sampleFeatures(seed+20000,index).features;
  const b=sampleFeatures(seed+21000,index).features;
  return [
    a.map(v=>amplitude*(v-.5)),
    b.map(v=>amplitude*(v-.5))
  ];
}
const observed=(a,b,noise)=>[
  a.map((v,i)=>v+noise[0][i]),
  b.map((v,i)=>v+noise[1][i])
];
function metrics(rows,seed,amplitude,mask,readout,floor,withSignal){
  let attempted=0,abstained=0,falseAlarms=0,signalHits=0;
  rows.forEach((row,index)=>{
    const sector=(seed+index)%6;
    if(index%FAULT_EVERY===0 && (mask&(1<<sector))!==0){
      abstained++;return;
    }
    attempted++;
    const [a,b]=row.worlds.matched_probe,noise=noises(seed,index,amplitude);
    const ng=gaps(...observed(a,a,noise),mask)[readout];
    if(ng>floor)falseAlarms++;
    if(withSignal){
      const signal=gaps(...observed(a,b,noise),mask)[readout];
      if(signal>floor)signalHits++;
    }
  });
  return {
    cases:CASES,attempted,abstained,coverage:attempted/CASES,
    null_false_alarms:falseAlarms,
    null_false_alarm_rate:attempted?falseAlarms/attempted:null,
    signal_hits:withSignal?signalHits:null,
    signal_misses:withSignal?attempted-signalHits:null,
    signal_detection_rate:withSignal&&attempted?signalHits/attempted:null
  };
}
function shadowCalibration(rows,seed,amplitude,mask,readout){
  const values=rows.map((row,index)=>{
    const a=row.worlds.matched_probe[0];
    return gaps(...observed(a,a,noises(seed,index,amplitude)),mask)[readout];
  });
  const floor=Math.max(MIN_FLOOR,[...values].sort((a,b)=>b-a)[MAX_EXCEEDANCES]);
  return {
    floor,null_exceedances:values.filter(v=>v>floor).length,
    null_cases:CASES,calibration_only:true
  };
}
export function driftReport(){
  const parent=calibrationReport();
  const cache=Object.fromEntries(REGIMES.map(([name,amplitude,monitorSeed,shadowSeed,testSeed])=>[
    name,{
      monitor:population(monitorSeed),
      shadow:population(shadowSeed),
      sealed:population(testSeed)
    }
  ]));
  const failures=[];
  const policies=parent.policies.map(prior=>{
    const {budget,readout}=prior;
    const mask=prior.frozen_masks[ARM];
    const frozenFloor=prior.calibration[ARM].threshold;
    const regimes=REGIMES.map(([name,amplitude,monitorSeed,shadowSeed,testSeed])=>{
      const data=cache[name];
      const monitor=metrics(data.monitor,monitorSeed,amplitude,mask,readout,frozenFloor,false);
      const flagged=monitor.null_false_alarm_rate!==null &&
        monitor.null_false_alarm_rate>FALSE_ALARM_LIMIT;
      const shadow=flagged?shadowCalibration(data.shadow,shadowSeed,amplitude,mask,readout):null;
      const candidateFloor=shadow?shadow.floor:frozenFloor;
      const frozen=metrics(data.sealed,testSeed,amplitude,mask,readout,frozenFloor,true);
      const candidate=metrics(data.sealed,testSeed,amplitude,mask,readout,candidateFloor,true);
      const missed=!flagged&&frozen.null_false_alarm_rate!==null &&
        frozen.null_false_alarm_rate>FALSE_ALARM_LIMIT;
      const falseAlarmBreach=candidate.null_false_alarm_rate===null ||
        candidate.null_false_alarm_rate>FALSE_ALARM_LIMIT;
      const coverageBreach=candidate.coverage<COVERAGE_MIN;
      const signalLoss=candidate.signal_hits<frozen.signal_hits;
      const zeroSignal=budget>0&&candidate.signal_hits===0;
      const passed=budget>0&&!missed&&!falseAlarmBreach&&!coverageBreach&&!signalLoss&&!zeroSignal;
      const row={
        regime:name,noise_amplitude:amplitude,monitor_seed:monitorSeed,
        shadow_seed:shadowSeed,sealed_test_seed:testSeed,
        frozen_floor:frozenFloor,monitor,drift_flagged:flagged,
        monitor_decision:flagged?'ABSTAIN_AND_EVALUATE_SHADOW':'KEEP_FROZEN_MONITORING',
        shadow_calibration:shadow,candidate_floor:candidateFloor,
        frozen_sealed:frozen,candidate_sealed:candidate,
        frozen_threshold_mutated:false,decision_authorized:false,
        toy_gate:passed?'PASS_IN_TOY':'FAIL_IN_TOY'
      };
      const reasonFlags={
        monitor_missed_test_false_alarm_breach:missed,
        candidate_false_alarm_breach:falseAlarmBreach,
        coverage_breach:coverageBreach,
        shadow_signal_loss_vs_frozen:signalLoss,
        no_positive_detections:zeroSignal
      };
      if(Object.values(reasonFlags).some(Boolean))failures.push({
        budget,readout,regime:name,test_seed:testSeed,
        reason_flags:reasonFlags,
        frozen_false_alarms:frozen.null_false_alarms,
        candidate_false_alarms:candidate.null_false_alarms,
        frozen_hits:frozen.signal_hits,
        candidate_hits:candidate.signal_hits,
        candidate_abstained:candidate.abstained
      });
      return row;
    });
    return {
      budget,readout,mask,frozen_e13_threshold:frozenFloor,
      regimes,authority:'OBSERVATION_ONLY'
    };
  });
  return {
    schema:DRIFT_SCHEMA,status:'FINITE_SYNTHETIC_DRIFT_AND_SHADOW_CALIBRATION',
    epistemic_origin:'SIMULATED',
    physical_measurement:false,consciousness_measured:false,
    action_authorized:false,phi_optimality_proven:false,
    protocol:{
      parent_schema:parent.schema,
      arm:ARM,
      regimes:REGIMES.map(([name,amplitude,monitorSeed,shadowSeed,testSeed])=>({
        name,amplitude,monitor_seed:monitorSeed,shadow_seed:shadowSeed,sealed_test_seed:testSeed
      })),
      cases_per_split:CASES,
      monitor:'null-only, uses frozen E13 threshold; triggers when observed false alarm fraction > 0.10',
      shadow:'only if monitor flags; fresh null-only seed; third-largest gap, floor 0.01',
      sealed_test:'separate from monitor and shadow calibration; never influences thresholds',
      fault_rule:'every eighth case; if selected sector (seed+index)%6 faulty, abstain',
      candidate:'evaluation only, never adopted or deployed',
      candidate_gate:'budget>0, no monitor miss of observed test breach, test false alarms<=0.10, coverage>=0.75, signal hits>0 and no signal loss versus frozen',
      strict_threshold:true,false_alarm_limit:FALSE_ALARM_LIMIT,
      minimum_coverage:COVERAGE_MIN,
      test_data_for_policy_or_threshold_selection:false,
      actual_external_sensor_input:false
    },
    policies,failure_ledger:failures,
    summary:{
      policy_count:policies.length,
      evaluation_cells:policies.length*REGIMES.length,
      regime_count:REGIMES.length,
      monitor_flags:policies.reduce((n,p)=>n+p.regimes.filter(r=>r.drift_flagged).length,0),
      toy_passes:policies.reduce((n,p)=>n+p.regimes.filter(r=>r.toy_gate==='PASS_IN_TOY').length,0),
      failure_cells:failures.length,
      zero_budget_blind:policies.filter(p=>p.budget===0).every(p=>p.regimes.every(r=>
        r.candidate_sealed.signal_hits===0&&r.candidate_sealed.null_false_alarms===0)),
      all_failures_retained:true,deployments_authorized:0
    }
  };
}
