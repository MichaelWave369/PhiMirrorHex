// E18 independent JS: selection on historical E17 only, sealed new mix32 streams.
// Three members still share synthetic noise. Results never authorize action.
import {gaps} from './frontier-model.mjs';
import {transferConsensusReport} from './consensus-transfer-model.mjs';
import {LENGTH,CHANGE_STEP} from './sequential-model.mjs';
export const AUDIT_SCHEMA='phimirrorhex.e18.prospective-quorum-audit.v1';
export const STREAMS=Object.freeze([
  ['independent_null',4101,null],['independent_null',4102,null],
  ['shared_null',4103,null],['shared_null',4104,null],
  ['lagged_step',4105,CHANGE_STEP],['lagged_step',4106,CHANGE_STEP],
  ['lagged_ramp',4107,CHANGE_STEP],['lagged_ramp',4108,CHANGE_STEP],
  ['burst_null',4109,null],['burst_null',4110,null],
  ['outlier_step',4111,CHANGE_STEP],['outlier_step',4112,CHANGE_STEP]
]);
export const QUORUMS=Object.freeze([1,2,3]);
const NORMAL=.018,SHIFTED=.054,DRIFT=.75,MIN_COVERAGE=.75;
const WEIGHTS={miss:5,false_alarm:4,low_coverage:2};
function uniform(seed,step,lane){
  let x=(Math.imul(seed,0x9e3779b1)+Math.imul(step+1,0x85ebca77)+Math.imul(lane+1,0xc2b2ae3d))>>>0;
  x^=x>>>16;
  x=Math.imul(x,0x7feb352d)>>>0;
  x^=x>>>15;
  x=Math.imul(x,0x846ca68b)>>>0;
  x^=x>>>16;
  return (x>>>0)/4294967296-.5;
}
function amplitude(family,step){
  if(family==='independent_null'||family==='shared_null')return NORMAL;
  if(family==='lagged_step'||family==='outlier_step')return step>=CHANGE_STEP?SHIFTED:NORMAL;
  if(family==='lagged_ramp')return step<CHANGE_STEP?NORMAL:
    NORMAL+(SHIFTED-NORMAL)*Math.min(1,(step-CHANGE_STEP)/32);
  if(family==='burst_null')return step>=48&&step<52?SHIFTED:NORMAL;
  throw new RangeError('unregistered '+family);
}
export function prospectiveNoise(seed,step,family){
  const correlated=family!=='independent_null';
  const lagged=['lagged_step','lagged_ramp','outlier_step'].includes(family);
  const commonA=uniform(seed,step,12),commonB=uniform(seed,step,13);
  const prevA=step?uniform(seed,step-1,12):commonA;
  const prevB=step?uniform(seed,step-1,13):commonB;
  const a=[],b=[];
  for(let sector=0;sector<6;sector++){
    let xa=uniform(seed,step,sector),xb=uniform(seed,step,sector+6);
    if(correlated){xa=.3*xa+.7*commonA;xb=.3*xb+.7*commonB;}
    if(lagged&&step){
      const pa=.3*uniform(seed,step-1,sector)+.7*prevA;
      const pb=.3*uniform(seed,step-1,sector+6)+.7*prevB;
      xa=.6*xa+.4*pa;xb=.6*xb+.4*pb;
    }
    if(family==='outlier_step'&&(step+7*sector)%17===0){xa*=2.5;xb*=2.5;}
    const amp=amplitude(family,step);
    a.push(amp*xa);b.push(amp*xb);
  }
  return [a,b];
}
function frames(seed,family,members){
  const cumulative=[0,0,0],out=[];
  for(let step=0;step<LENGTH;step++){
    const [a,b]=prospectiveNoise(seed,step,family),row=[];
    for(let i=0;i<3;i++){
      const member=members[i];
      const fault=step%8===0||(family==='burst_null'&&step>=48&&step<52);
      const unavailable=fault&&(member.mask&(1<<((seed+step)%6)))!==0;
      let gap=null;
      if(!unavailable){
        gap=gaps(a,b,member.mask)[member.readout];
        cumulative[i]=Math.max(0,cumulative[i]+gap/member.floor-DRIFT);
      }
      row.push({available:!unavailable,gap,cusum:cumulative[i],
        vote:!unavailable&&cumulative[i]>member.alert_limit});
    }
    out.push(row);
  }
  return out;
}
function trial(family,seed,onset,q,source){
  let first=null,availableCount=0;
  const observations=[];
  source.forEach((rows,step)=>{
    const eligible=rows.filter(r=>r.available).length;
    const votes=rows.filter(r=>r.vote).length;
    const abstained=eligible<q;
    if(!abstained)availableCount++;
    const alert=first===null&&!abstained&&votes>=q;
    if(alert)first=step;
    observations.push({
      step,eligible,votes,member_available:rows.map(r=>r.available),
      member_votes:rows.map(r=>r.vote),member_gaps:rows.map(r=>r.gap),
      member_cusum:rows.map(r=>r.cusum),abstained,new_alert:alert
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
    attempted:availableCount,abstained:LENGTH-availableCount,
    coverage:availableCount/LENGTH,observations
  };
}
function selection(parent){
  const candidates=parent.policies.map(p=>{
    const misses=p.trials.filter(t=>t.persistent_change_missed).length;
    const alarms=p.trials.filter(t=>t.false_alarm).length;
    const coverage=p.trials.filter(t=>t.coverage<MIN_COVERAGE).length;
    const refused=p.trials.reduce((n,t)=>n+t.abstained,0);
    return {quorum:p.quorum,miss_cells:misses,false_alarm_cells:alarms,
      coverage_breach_cells:coverage,abstained_frames:refused,
      weighted_loss:WEIGHTS.miss*misses+WEIGHTS.false_alarm*alarms+
        WEIGHTS.low_coverage*coverage};
  });
  const sorted=[...candidates].sort((a,b)=>a.weighted_loss-b.weighted_loss||
    a.abstained_frames-b.abstained_frames||Math.abs(a.quorum-2)-Math.abs(b.quorum-2)||
    a.quorum-b.quorum);
  return {
    selection_source:'E17_REUSED_AS_RETROSPECTIVE_DEVELOPMENT',
    weights:{...WEIGHTS},candidate_costs:candidates,selected_quorum:sorted[0].quorum,
    selection_uses_e18_sealed_data:false,
    selection_is_originally_preregistered_e17_training:false
  };
}
export function prospectiveAuditReport(){
  const parent=transferConsensusReport();
  const selected=selection(parent),members=parent.members;
  const generated=new Map(STREAMS.map(([family,seed])=>[seed,frames(seed,family,members)]));
  const failures=[];
  const policies=QUORUMS.map(quorum=>{
    const trials=STREAMS.map(([family,seed,onset])=>{
      const t=trial(family,seed,onset,quorum,generated.get(seed));
      const reasons={
        false_alert:t.false_alarm,missed_persistent_change:t.persistent_change_missed,
        coverage_below_floor:t.coverage<MIN_COVERAGE
      };
      if(Object.values(reasons).some(Boolean))failures.push({
        quorum,family,seed,first_alarm_step:t.first_alarm_step,abstained:t.abstained,
        detection_delay:t.detection_delay,reason_flags:reasons,
        selected_rule:quorum===selected.selected_quorum
      });
      return t;
    });
    const falseAlarms=trials.filter(t=>t.false_alarm).length;
    const misses=trials.filter(t=>t.persistent_change_missed).length;
    const lowCoverage=trials.filter(t=>t.coverage<MIN_COVERAGE).length;
    return {
      quorum,selected_from_e17:quorum===selected.selected_quorum,trials,
      false_alarm_cells:falseAlarms,missed_persistent_cells:misses,
      coverage_breach_cells:lowCoverage,
      toy_gate:trials.every(t=>!t.false_alarm&&!t.persistent_change_missed&&t.coverage>=MIN_COVERAGE)?
        'PASS_IN_TOY':'FAIL_IN_TOY',
      decision_authorized:false
    };
  });
  const candidate=policies.find(p=>p.quorum===selected.selected_quorum);
  return {
    schema:AUDIT_SCHEMA,status:'SEALED_TOY_SELECTED_QUORUM_PROSPECTIVE_AUDIT',
    epistemic_origin:'SIMULATED',physical_measurement:false,
    consciousness_measured:false,action_authorized:false,phi_optimality_proven:false,
    protocol:{
      parent_schema:parent.schema,development_reuse_disclosed:true,
      selection_score:'5 × missed cells + 4 × false-alarm cells + 2 × coverage-breach cells; ties fewer abstentions, then closest to 2, then smallest quorum',
      frozen_masks_limits_and_members:true,quorum_selected_before_e18_outcomes:true,
      quorums_all_scored:[...QUORUMS],
      sealed_streams:STREAMS.map(([family,seed,onset])=>({
        family,seed,persistent_change_step:onset
      })),
      frames_per_stream:LENGTH,fresh_seed_range:[4101,4112],
      source_generator:'counter-addressed avalanche mix32, temporal lag, distinct from E17 LCG32',
      shared_noise_witnesses:true,independent_physical_witnesses:false,
      noise_amplitudes:[NORMAL,SHIFTED],
      additional_burst_outage:'frames 48–51 under burst_null only',
      fault_sector:'(seed+step)%6',fault_every_nth_frame:8,
      first_alarm_before_onset_is_failure:true,min_coverage:MIN_COVERAGE,
      no_threshold_or_quorum_adaptation_on_sealed_set:true,
      gate:'no false alarms, missed persistent events or low coverage on any of 12 streams; toy descriptive only',
      action_policy:'NO_EXTERNAL_AUTHORITY'
    },
    selection:selected,members,policies,failure_ledger:failures,
    summary:{
      quorum_count:QUORUMS.length,new_streams:STREAMS.length,
      evaluation_cells:QUORUMS.length*STREAMS.length,
      frame_cells:QUORUMS.length*STREAMS.length*LENGTH,
      selected_quorum:selected.selected_quorum,
      selected_false_alarm_cells:candidate.false_alarm_cells,
      selected_missed_persistent_cells:candidate.missed_persistent_cells,
      selected_coverage_breach_cells:candidate.coverage_breach_cells,
      total_failure_cells:failures.length,
      toy_gate_passes:policies.filter(p=>p.toy_gate==='PASS_IN_TOY').length,
      all_failures_retained:true,deployments_authorized:0
    }
  };
}
