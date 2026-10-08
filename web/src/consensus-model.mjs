// E16 independent browser quorum model. Same underlying synthetic noise,
// explicitly correlated witnesses. Decisions are read-only and one-shot.
import {sequentialReport,TESTS,LENGTH} from './sequential-model.mjs';
export const CONSENSUS_SCHEMA='phimirrorhex.e16.quorum-consensus.v1';
export const MEMBERS=Object.freeze([[2,'identity_max'],[3,'masked_sum'],[4,'identity_max']]);
export const QUORUMS=Object.freeze([1,2,3]);
const CHANGE_STEP=48,MIN_COVERAGE=.75;
function jaccard(a,b){
  const bits=x=>x.toString(2).split('').filter(d=>d==='1').length;
  const intersection=bits(a&b),union=bits(a|b);
  return {intersection,union,jaccard:union?intersection/union:1,disjoint:intersection===0};
}
function trace(members,threshold,regime,seed,change){
  let first=null,eligibleCount=0,abstained=0;
  const observations=[];
  for(let step=0;step<LENGTH;step++){
    const frames=members.map(m=>m.trace.frames[step]);
    const available=frames.map(f=>!f.abstained);
    const votes=frames.map((f,i)=>available[i]&&f.cusum>members[i].alert_limit);
    const eligible=available.filter(Boolean).length,positive=votes.filter(Boolean).length;
    const refusal=eligible<threshold;
    if(refusal)abstained++;else eligibleCount++;
    const newAlert=!refusal&&first===null&&positive>=threshold;
    if(newAlert)first=step;
    observations.push({
      step,eligible,votes:positive,member_available:available,member_votes:votes,
      member_cusum:frames.map(f=>f.cusum),abstained:refusal,new_alert:newAlert
    });
  }
  const persistent=regime==='step'||regime==='ramp';
  const early=first!==null&&(!persistent||first<CHANGE_STEP);
  const detected=persistent&&first!==null&&first>=CHANGE_STEP;
  return {
    regime,seed,quorum:threshold,frames:LENGTH,true_change_step:change,
    first_alarm_step:first,false_alarm:early,
    persistent_change_detected:detected,
    persistent_change_missed:persistent&&!detected,
    detection_delay:detected?first-CHANGE_STEP:null,
    attempted:eligibleCount,abstained,coverage:eligibleCount/LENGTH,
    observations
  };
}
export function consensusReport(){
  const e15=sequentialReport();
  const selected=MEMBERS.map(([budget,readout])=>e15.policies.find(
    p=>p.budget===budget&&p.readout===readout
  ));
  const members=selected.map(p=>({
    id:'k'+p.budget+'-'+p.readout,
    budget:p.budget,readout:p.readout,
    mask:p.frozen_mask,alert_limit:p.sequential_alert_limit,
    floor:p.frozen_e13_floor
  }));
  const overlap=[];
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)
    overlap.push({pair:[members[i].id,members[j].id],...jaccard(members[i].mask,members[j].mask)});
  const failures=[];
  const policies=QUORUMS.map(q=>{
    const trials=TESTS.map(([regime,seed,onset],index)=>{
      const current=selected.map(p=>({
        alert_limit:p.sequential_alert_limit,
        trace:p.trials[index]
      }));
      const t=trace(current,q,regime,seed,onset);
      const reasons={
        false_alert:t.false_alarm,missed_persistent_change:t.persistent_change_missed,
        coverage_below_floor:t.coverage<MIN_COVERAGE
      };
      if(Object.values(reasons).some(Boolean))failures.push({
        quorum:q,regime,seed,first_alarm_step:t.first_alarm_step,
        detection_delay:t.detection_delay,abstained:t.abstained,reason_flags:reasons
      });
      return t;
    });
    const pass=trials.every(t=>!t.false_alarm&&!t.persistent_change_missed&&t.coverage>=MIN_COVERAGE);
    return {quorum:q,rule:q+'_OF_3_SAME_STREAM',trials,
      toy_gate:pass?'PASS_IN_TOY':'FAIL_IN_TOY',decision_authorized:false};
  });
  const coVotes=[];
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){
    let valid=0,both=0,eachI=0,eachJ=0;
    for(const t of policies[0].trials)for(const f of t.observations){
      if(f.member_available[i]&&f.member_available[j]){
        valid++;
        const vi=f.member_votes[i],vj=f.member_votes[j];
        if(vi&&vj)both++;
        if(vi)eachI++;
        if(vj)eachJ++;
      }
    }
    coVotes.push({
      pair:[members[i].id,members[j].id],
      both_available_frames:valid,joint_positive_frames:both,
      first_positive_frames:eachI,second_positive_frames:eachJ,
      empirical_independence_claimed:false
    });
  }
  return {
    schema:CONSENSUS_SCHEMA,
    status:'SYNTHETIC_CORRELATED_QUORUM_AND_REFUSAL_LEDGER',
    epistemic_origin:'SIMULATED',physical_measurement:false,
    consciousness_measured:false,action_authorized:false,phi_optimality_proven:false,
    protocol:{
      parent_schema:e15.schema,
      frozen_members:MEMBERS.map(([budget,readout])=>({budget,readout})),
      quorums:[...QUORUMS],
      sealed_scenarios:TESTS.map(([regime,seed,onset])=>({
        regime,seed,persistent_change_step:onset
      })),
      frames_per_stream:LENGTH,
      same_noise_realization_shared_by_all_members:true,
      witness_independence_assumed:false,
      calibration_sees_sealed_data:false,
      rule:"frame-local votes: available and CUSUM strictly above member's frozen E15 limit",
      abstain:'fewer than quorum available readings => abstain; never treat as no-detect',
      alarm:'first frame with quorum affirmative currently available votes; one-shot',
      first_alarm_before_onset:'false alarm and missed sustained change, no retroactive success',
      transient_spikes:'negative controls for sustained-event definition',
      toy_gate:'no false alarms, no missed step/ramp changes, coverage>=0.75 across eight sealed streams',
      claim_boundary:'correlated procedural simulator; not independent replication or external deployment'
    },
    members,overlap_diagnostics:overlap,co_vote_diagnostics:coVotes,
    policies,failure_ledger:failures,
    summary:{
      member_count:MEMBERS.length,quorum_count:QUORUMS.length,
      sealed_streams:TESTS.length,
      evaluation_cells:QUORUMS.length*TESTS.length,
      false_alarm_cells:policies.reduce((n,p)=>n+p.trials.filter(t=>t.false_alarm).length,0),
      missed_persistent_cells:policies.reduce((n,p)=>n+p.trials.filter(t=>t.persistent_change_missed).length,0),
      failure_cells:failures.length,toy_passes:policies.filter(p=>p.toy_gate==='PASS_IN_TOY').length,
      all_failures_retained:true,deployments_authorized:0
    }
  };
}
