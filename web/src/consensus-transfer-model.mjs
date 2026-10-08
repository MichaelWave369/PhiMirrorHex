// E17 independent browser engine: new LCG32 noise families and sealed quorum
// transfer with frozen E16 witnesses. Shared noise is NOT independent evidence.
import {gaps} from './frontier-model.mjs';
import {consensusReport,MEMBERS,QUORUMS} from './consensus-model.mjs';
import {LENGTH,CHANGE_STEP} from './sequential-model.mjs';
export const TRANSFER_CONSENSUS_SCHEMA='phimirrorhex.e17.out-of-family-consensus.v1';
export const TRANSFER_STREAMS=Object.freeze([
  ['iid_stationary',3101,null],['iid_stationary',3102,null],
  ['correlated_stationary',3103,null],['correlated_stationary',3104,null],
  ['correlated_step',3105,CHANGE_STEP],['correlated_step',3106,CHANGE_STEP],
  ['correlated_ramp',3107,CHANGE_STEP],['correlated_ramp',3108,CHANGE_STEP],
  ['impulse_stationary',3109,null],['impulse_stationary',3110,null],
  ['outlier_step',3111,CHANGE_STEP],['outlier_step',3112,CHANGE_STEP],
]);
const NORMAL=.018,SHIFTED=.054,CUSUM_DRIFT=.75,FAULT_EVERY=8,MIN_COVERAGE=.75;
function amplitude(family,step){
  if(family==='iid_stationary'||family==='correlated_stationary')return NORMAL;
  if(family==='correlated_step'||family==='outlier_step')return step>=CHANGE_STEP?SHIFTED:NORMAL;
  if(family==='correlated_ramp')return step<CHANGE_STEP?NORMAL:
    NORMAL+(SHIFTED-NORMAL)*Math.min(1,(step-CHANGE_STEP)/32);
  if(family==='impulse_stationary')
    return step>=CHANGE_STEP&&step<CHANGE_STEP+3?SHIFTED:NORMAL;
  throw new RangeError('Unregistered family: '+family);
}
export function transferNoise(seed,step,family){
  let state=(Math.imul(seed,1664525)^Math.imul(step+1,1013904223))>>>0;
  const u=[];
  for(let i=0;i<14;i++){
    state=(Math.imul(1664525,state)+1013904223)>>>0;
    u.push(state/4294967296-.5);
  }
  const amp=amplitude(family,step),correlated=family!=='iid_stationary';
  const a=[],b=[];
  for(let sector=0;sector<6;sector++){
    let va=correlated?.35*u[sector]+.65*u[12]:u[sector];
    let vb=correlated?.35*u[sector+6]+.65*u[13]:u[sector+6];
    if(family==='outlier_step'&&(step+sector*7)%19===0){va*=3;vb*=3;}
    a.push(amp*va);b.push(amp*vb);
  }
  return [a,b];
}
function memberFrames(seed,family,members){
  const cumulative=members.map(()=>0),frames=[];
  for(let step=0;step<LENGTH;step++){
    const [a,b]=transferNoise(seed,step,family),frame=[];
    for(let i=0;i<members.length;i++){
      const m=members[i],fault=(seed+step)%6;
      const unavailable=step%FAULT_EVERY===0&&(m.mask&(1<<fault))!==0;
      let gap=null;
      if(!unavailable){
        gap=gaps(a,b,m.mask)[m.readout];
        cumulative[i]=Math.max(0,cumulative[i]+gap/m.floor-CUSUM_DRIFT);
      }
      frame.push({
        available:!unavailable,gap,cusum:cumulative[i],
        vote:!unavailable&&cumulative[i]>m.alert_limit
      });
    }
    frames.push(frame);
  }
  return frames;
}
function trial(family,seed,onset,q,frames){
  let first=null,attempted=0,refused=0;
  const observations=[];
  frames.forEach((rows,step)=>{
    const eligible=rows.filter(r=>r.available).length;
    const votes=rows.filter(r=>r.vote).length;
    const abstained=eligible<q;
    if(abstained)refused++;else attempted++;
    const alert=first===null&&!abstained&&votes>=q;
    if(alert)first=step;
    observations.push({
      step,
      member_available:rows.map(r=>r.available),
      member_votes:rows.map(r=>r.vote),
      member_cusum:rows.map(r=>r.cusum),
      member_gaps:rows.map(r=>r.gap),
      eligible,votes,abstained,new_alert:alert
    });
  });
  const persistent=onset!==null;
  const falseAlarm=first!==null&&(!persistent||first<onset);
  const detected=persistent&&first!==null&&first>=onset;
  return {
    family,seed,quorum:q,frames:LENGTH,true_change_step:onset,
    first_alarm_step:first,false_alarm:falseAlarm,
    persistent_change_detected:detected,
    persistent_change_missed:persistent&&!detected,
    detection_delay:detected?first-onset:null,
    attempted,abstained:refused,coverage:attempted/LENGTH,
    observations
  };
}
export function transferConsensusReport(){
  const e16=consensusReport(),members=e16.members;
  const frames=new Map(TRANSFER_STREAMS.map(([family,seed])=>[
    seed,memberFrames(seed,family,members)
  ]));
  const failures=[];
  const policies=QUORUMS.map(q=>{
    const trials=TRANSFER_STREAMS.map(([family,seed,onset])=>{
      const t=trial(family,seed,onset,q,frames.get(seed));
      const reasons={
        false_alert:t.false_alarm,missed_persistent_change:t.persistent_change_missed,
        coverage_below_floor:t.coverage<MIN_COVERAGE
      };
      if(Object.values(reasons).some(Boolean))failures.push({
        quorum:q,family,seed,first_alarm_step:t.first_alarm_step,
        detection_delay:t.detection_delay,abstained:t.abstained,reason_flags:reasons
      });
      return t;
    });
    const old=e16.policies.find(p=>p.quorum===q);
    return {
      quorum:q,rule:q+'_OF_3_FROZEN',trials,
      legacy_e16_context:{
        seeds_reused:false,
        e16_false_alarm_cells:old.trials.filter(t=>t.false_alarm).length,
        e16_missed_persistent_cells:old.trials.filter(t=>t.persistent_change_missed).length,
        e16_coverage_min:Math.min(...old.trials.map(t=>t.coverage))
      },
      toy_gate:trials.every(t=>!t.false_alarm&&!t.persistent_change_missed&&t.coverage>=MIN_COVERAGE)?
        'PASS_IN_TOY':'FAIL_IN_TOY',
      decision_authorized:false
    };
  });
  return {
    schema:TRANSFER_CONSENSUS_SCHEMA,
    status:'SYNTHETIC_OUT_OF_FAMILY_FROZEN_CONSENSUS_TRANSFER',
    epistemic_origin:'SIMULATED',
    physical_measurement:false,consciousness_measured:false,
    action_authorized:false,phi_optimality_proven:false,
    protocol:{
      parent_schema:e16.schema,
      frozen_members:MEMBERS.map(([budget,readout])=>({budget,readout})),
      frozen_quorums:[...QUORUMS],
      new_sealed_streams:TRANSFER_STREAMS.map(([family,seed,onset])=>({
        family,seed,persistent_change_step:onset
      })),
      frames_per_stream:LENGTH,
      new_generator:'LCG32 1664525/1013904223 with 14 frame draws; unlike E15 xorshift',
      noise_families:['iid_stationary','correlated_stationary','correlated_step',
        'correlated_ramp','impulse_stationary','outlier_step'],
      normal_amplitude:NORMAL,shift_amplitude:SHIFTED,
      pairwise_member_independence:false,shared_noise_draws:true,
      fault_every_nth_frame:FAULT_EVERY,fault_sector:'(seed+step)%6',
      abstentions_do_not_advance_member_cusum:true,
      no_quorum_selected_after_test:true,
      e15_thresholds_mutated:false,
      new_streams_disjoint_from_e15:true,
      first_alarm_rule:'frame-local quorum; one-shot; early alarm cannot count as persistent detection',
      negative_controls:'stationary and three-frame impulse; false alarms counted',
      toy_gate:'no false alarms, no misses, coverage >=0.75 on all 12 streams; descriptive only',
      no_external_actions:true,
      evidence_boundary:'new procedural toy families; not independent physical witnesses or validation'
    },
    members,mask_overlap:e16.overlap_diagnostics,
    policies,failure_ledger:failures,
    summary:{
      member_count:members.length,quorum_count:QUORUMS.length,
      sealed_stream_count:TRANSFER_STREAMS.length,
      evaluation_cells:TRANSFER_STREAMS.length*QUORUMS.length,
      total_frame_evaluations:LENGTH*TRANSFER_STREAMS.length*QUORUMS.length,
      false_alarm_cells:policies.reduce((n,p)=>n+p.trials.filter(t=>t.false_alarm).length,0),
      missed_persistent_cells:policies.reduce((n,p)=>n+p.trials.filter(t=>t.persistent_change_missed).length,0),
      failure_cells:failures.length,
      toy_gate_passes:policies.filter(p=>p.toy_gate==='PASS_IN_TOY').length,
      all_failures_retained:true,deployments_authorized:0
    }
  };
}
