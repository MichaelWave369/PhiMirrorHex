// E9 cross-language independent implementation: exhaustive finite masks.
// Uses E5 synthetic reference trajectories without fetching external systems.
import {buildGearReport} from './gears-model.mjs';

export const FRONTIER_SCHEMA='phimirrorhex.e9.observability-frontier.v1';
export const THRESHOLDS=Object.freeze([0,.001,.01,.05]);
export const DEFAULT_THRESHOLD=.01;
export const READOUTS=Object.freeze(['identity_max','masked_sum']);
export const CONDITIONS=Object.freeze([
  ['coupled_probe',.5,.5,true],
  ['no_probe',.5,0,true],
  ['no_coupling',0,.5,true],
  ['no_conveyor',.5,.5,false]
]);
export const ALL_MASKS=Object.freeze(Array.from({length:64},(_,i)=>i));
const TOTALS=[1,6,15,20,15,6,1];

export function selectedSectors(mask){
  if(!Number.isInteger(mask)||mask<0||mask>=64)throw new RangeError('mask must be integer 0..63');
  return Array.from({length:6},(_,i)=>i).filter(i=>(mask&(1<<i))!==0);
}
export function gaps(a,b,mask){
  if(a.length!==6||b.length!==6)throw new RangeError('states must have 6 sectors');
  const ids=selectedSectors(mask);
  return {
    identity_max:ids.reduce((best,i)=>Math.max(best,Math.abs(a[i]-b[i])),0),
    masked_sum:Math.abs(ids.reduce((s,i)=>s+a[i],0)-ids.reduce((s,i)=>s+b[i],0))
  };
}
function snapshot(frame,threshold) {
  const a=frame.state_a[5],b=frame.state_b[5];
  const by_budget=TOTALS.map((total_masks,budget)=>{
    const masks=ALL_MASKS.filter(mask=>selectedSectors(mask).length===budget);
    const identities=masks.filter(mask=>gaps(a,b,mask).identity_max>threshold);
    const sums=masks.filter(mask=>gaps(a,b,mask).masked_sum>threshold);
    return {
      budget,total_masks,
      identity_detected:identities.length,sum_detected:sums.length,
      identity_fraction:identities.length/masks.length,
      sum_fraction:sums.length/masks.length,
      first_identity_mask:identities.length?identities[0]:null,
      first_sum_mask:sums.length?sums[0]:null
    };
  });
  return {
    step:frame.step,threshold,
    global_sum_gap:Math.abs(a.reduce((s,x)=>s+x,0)-b.reduce((s,x)=>s+x,0)),
    outer_hidden_l1:a.reduce((s,x,i)=>s+Math.abs(x-b[i]),0),
    by_budget
  };
}
function firstDetection(history,threshold,readout){
  const found=history.find(frame=>ALL_MASKS.some(mask=>
    gaps(frame.state_a[5],frame.state_b[5],mask)[readout]>threshold));
  return found?.step??null;
}
export function frontierReport(){
  const worlds=CONDITIONS.map(([condition,coupling,probe_gain,conveyor_enabled])=>{
    const source=buildGearReport(coupling,probe_gain,conveyor_enabled);
    const history=source.history;
    const snapshots=THRESHOLDS.map(threshold=>({
      threshold,frames:history.map(frame=>snapshot(frame,threshold))
    }));
    const onset={
      identity_max:firstDetection(history,DEFAULT_THRESHOLD,'identity_max'),
      masked_sum:firstDetection(history,DEFAULT_THRESHOLD,'masked_sum'),
      global_sum:history.find(frame=>
        Math.abs(frame.outer_a-frame.outer_b)>DEFAULT_THRESHOLD)?.step??null
    };
    return {
      condition,coupling,probe_gain,conveyor_enabled,
      snapshots,
      first_detection_at_default_threshold:onset,
      selected_frames:[10,12].map(step=>({
        step,a:[...history[step].state_a[5]],b:[...history[step].state_b[5]]
      }))
    };
  });
  const base=buildGearReport();
  const identical=base.history.every(frame=>
    ALL_MASKS.every(mask=>{
      const result=gaps(frame.state_a[5],frame.state_a[5],mask);
      return result.identity_max===0&&result.masked_sum===0;
    })
  );
  return {
    schema:FRONTIER_SCHEMA,status:'EXHAUSTIVE_FINITE_SYNTHETIC_MASK_ENUMERATION',
    epistemic_origin:'SIMULATED',physical_measurement:false,
    consciousness_measured:false,agent_data_used:false,
    action_authorized:false,universal_optimality_proven:false,
    protocol:{
      sectors:6,frames:24,all_masks_including_empty:ALL_MASKS.length,
      thresholds:[...THRESHOLDS],default_threshold:DEFAULT_THRESHOLD,
      conditions:CONDITIONS.map(row=>row[0]),readouts:[...READOUTS],
      identity_max:'max absolute sector gap among selected identities',
      masked_sum:'absolute difference between sums over identical selected sectors',
      global_sum:'six-channel aggregate, deliberately different sensor budget',
      detection_rule:'strictly greater than threshold; no inference or training',
      mask_fraction:'fraction of enumerated subsets, NOT probability or predictive accuracy',
      predeclared:true,
      provenance:'read-only synthetic E5 histories; no NBG external call'
    },
    worlds,
    controls:{
      empty_mask_never_detects:true,
      identical_state_never_detects:identical,
      sum_may_cancel_signed_structure:true,
      mask_identity_is_kept:true,
      candidate_selection_on_test:false
    }
  };
}
