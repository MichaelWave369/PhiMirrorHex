// E15 independent browser replay of sequential synthetic noise change detection.
import {sampleFeatures} from './coherence-model.mjs';
import {calibrationReport} from './calibration-model.mjs';
import {gaps} from './frontier-model.mjs';

export const SEQUENTIAL_SCHEMA='phimirrorhex.e15.sequential-change.v1';
export const DEVELOPMENT_SEEDS=Object.freeze([1901,1902,1903,1904]);
export const TESTS=Object.freeze([
  ['stationary',2201,null],['stationary',2202,null],
  ['step',2203,48],['step',2204,48],
  ['ramp',2205,48],['ramp',2206,48],
  ['spike',2207,null],['spike',2208,null]
]);
export const LENGTH=96,CHANGE_STEP=48;
const NORMAL_AMPLITUDE=.018,SHIFT_AMPLITUDE=.054,REFERENCE_DRIFT=.75;
const RAMP_END=80,SPIKE_END=51,FAULT_EVERY=8,MIN_COVERAGE=.75;
function amplitude(regime,step){
  if(regime==='stationary')return NORMAL_AMPLITUDE;
  if(regime==='step')return step>=CHANGE_STEP?SHIFT_AMPLITUDE:NORMAL_AMPLITUDE;
  if(regime==='ramp')return step<CHANGE_STEP?NORMAL_AMPLITUDE:
    NORMAL_AMPLITUDE+(SHIFT_AMPLITUDE-NORMAL_AMPLITUDE)*Math.min(1,(step-CHANGE_STEP)/(RAMP_END-CHANGE_STEP));
  if(regime==='spike')return step>=CHANGE_STEP&&step<SPIKE_END?SHIFT_AMPLITUDE:NORMAL_AMPLITUDE;
  throw new RangeError('unknown regime');
}
function noises(seed,step,amp){
  const a=sampleFeatures(seed+20000,step).features;
  const b=sampleFeatures(seed+21000,step).features;
  return [a.map(x=>amp*(x-.5)),b.map(x=>amp*(x-.5))];
}
export function sequentialTrace(seed,regime,mask,mode,floor,limit=null){
  let statistic=0,maximum=0,firstAlert=null,observed=0,abstained=0;
  const frames=[];
  for(let step=0;step<LENGTH;step++){
    const sector=(seed+step)%6;
    const unavailable=step%FAULT_EVERY===0&&(mask&(1<<sector))!==0;
    let gap=null;
    if(unavailable)abstained++;
    else{
      observed++;
      gap=gaps(...noises(seed,step,amplitude(regime,step)),mask)[mode];
      statistic=Math.max(0,statistic+gap/floor-REFERENCE_DRIFT);
    }
    maximum=Math.max(maximum,statistic);
    const alertNow=limit!==null&&firstAlert===null&&statistic>limit;
    if(alertNow)firstAlert=step;
    frames.push({step,gap,cusum:statistic,abstained:unavailable,new_alert:alertNow});
  }
  const isPersistent=regime==='step'||regime==='ramp';
  const early=firstAlert!==null&&(!isPersistent||firstAlert<CHANGE_STEP);
  const detected=isPersistent&&firstAlert!==null&&firstAlert>=CHANGE_STEP;
  return {
    seed,regime,length:LENGTH,
    true_change_step:isPersistent?CHANGE_STEP:null,
    observed,abstained,coverage:observed/LENGTH,
    first_alarm_step:firstAlert,false_alarm:early,
    persistent_change_detected:detected,
    persistent_change_missed:isPersistent&&!detected,
    detection_delay:detected?firstAlert-CHANGE_STEP:null,
    maximum_cusum:maximum,frames
  };
}
export function sequentialReport(){
  const parent=calibrationReport(),failures=[];
  const policies=parent.policies.map(prior=>{
    const mask=prior.frozen_masks.robust,mode=prior.readout;
    const floor=prior.calibration.robust.threshold;
    const controls=DEVELOPMENT_SEEDS.map(seed=>
      sequentialTrace(seed,'stationary',mask,mode,floor));
    const limit=Math.max(...controls.map(t=>t.maximum_cusum))+1e-9;
    const trials=TESTS.map(([regime,seed])=>sequentialTrace(seed,regime,mask,mode,floor,limit));
    for(const trial of trials){
      const issues={
        false_alert:trial.false_alarm,
        missed_sustained_change:trial.persistent_change_missed,
        coverage_below_floor:trial.coverage<MIN_COVERAGE
      };
      if(Object.values(issues).some(Boolean))failures.push({
        budget:prior.budget,readout:mode,regime:trial.regime,seed:trial.seed,
        reason_flags:issues,
        first_alarm_step:trial.first_alarm_step,
        detection_delay:trial.detection_delay,
        abstained:trial.abstained
      });
    }
    const noIssues=trials.every(t=>!t.false_alarm&&!t.persistent_change_missed&&t.coverage>=MIN_COVERAGE);
    return {
      budget:prior.budget,readout:mode,frozen_mask:mask,frozen_e13_floor:floor,
      development_maxima:controls.map(t=>t.maximum_cusum),
      sequential_alert_limit:limit,development_alerts:0,trials,
      toy_gate:prior.budget>0&&noIssues?'PASS_IN_TOY':'FAIL_IN_TOY',
      decision_authorized:false
    };
  });
  return {
    schema:SEQUENTIAL_SCHEMA,status:'SEALED_SYNTHETIC_SEQUENTIAL_CHANGE_AND_REFUSAL',
    epistemic_origin:'SIMULATED',physical_measurement:false,
    consciousness_measured:false,action_authorized:false,phi_optimality_proven:false,
    protocol:{
      parent_schema:parent.schema,
      development_seeds:[...DEVELOPMENT_SEEDS],
      sealed_scenarios:TESTS.map(([regime,seed,onset])=>({
        regime,seed,persistent_change_step:onset
      })),
      frames_per_stream:LENGTH,
      normal_noise_amplitude:NORMAL_AMPLITUDE,
      changed_noise_amplitude:SHIFT_AMPLITUDE,
      change_step:CHANGE_STEP,ramp_saturates_at_step:RAMP_END,
      spike_interval:[CHANGE_STEP,SPIKE_END],
      cusum_increment:'null_gap / frozen_e13_floor - 0.75',
      cusum_reset:'max(0, previous + increment)',
      alert_rule:'first strict exceedance of maximum CUSUM from four nominal development streams plus 1e-9',
      one_shot_alarm:true,
      fault_every_nth_frame:FAULT_EVERY,
      fault_sector_rule:'(seed+step)%6',
      abstentions_do_not_update_cusum:true,
      false_alarm_definition:'alarm in stationary/spike stream, or before change_step in persistent stream',
      positive_detection_definition:'first alarm on/after change_step in step/ramp only',
      miss_definition:'no on-time first alarm for step/ramp (early alarm cannot count as detection)',
      test_data_used_for_calibration:false,candidate_adoption:false,
      toy_gate_requires:'nonzero budget; no false alarms or missed persistent changes on any sealed stream, coverage>=0.75',
      evidence_boundary:'finite synthetic null streams, not certified online change-point detection'
    },
    policies,failure_ledger:failures,
    summary:{
      policies:policies.length,sealed_streams_per_policy:TESTS.length,
      evaluation_cells:policies.length*TESTS.length,
      false_alarm_cells:policies.reduce((n,p)=>n+p.trials.filter(t=>t.false_alarm).length,0),
      missed_persistent_cells:policies.reduce((n,p)=>n+p.trials.filter(t=>t.persistent_change_missed).length,0),
      failure_cells:failures.length,
      toy_passes:policies.filter(p=>p.toy_gate==='PASS_IN_TOY').length,
      all_development_controls_have_zero_alarms:true,
      zero_budget_never_alarms:policies.filter(p=>p.budget===0).every(p=>
        p.trials.every(t=>t.first_alarm_step===null)),
      all_failures_retained:true,deployments_authorized:0
    }
  };
}
