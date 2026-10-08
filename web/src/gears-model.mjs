// E5: exact browser counterpart of phimirrorhex/gears.py.
// All values are synthetic toy signals; no biological/agent telemetry.
export const GEAR_SCHEMA = 'phimirrorhex.e5.gear-coupling.v1';
export const COUPLINGS = Object.freeze([0, .25, .5, 1]);
export const PROBE_GAINS = Object.freeze([0, .25, .5, 1]);
export const LAYER_LABELS = Object.freeze([
  'Environmental coupling', 'Sensory boundary', 'Signal encoding',
  'Local feedback loops', 'Integration proxy', 'Behavioral expression proxy'
]);
export const GEAR_RADII = Object.freeze([1, 2, 3, 5, 8, 13]);
export const GEAR_FRAMES = 24;
export const GEAR_PROBE_STEP = 12;
const N = 6;
const zero = () => Array.from({length:N},()=>Array(N).fill(0));
const initial = sign => {
  const out=zero();
  out[0]=[sign,-sign,0,0,0,0];
  return out;
};
const rotate = (values, ring) => ring%2===0
  ? [values.at(-1),...values.slice(0,-1)]
  : [...values.slice(1),values[0]];
const sum = a => a.reduce((s,v)=>s+v,0);
const distance = (a,b) => a.reduce((total,row,i)=>total+row.reduce((s,v,j)=>s+Math.abs(v-b[i][j]),0),0);
const advance = (state, conveyor, coupling, gain, nextStep, enabled) => {
  const future=state.map((ringValues,ring)=>rotate(ringValues,ring).map(
    (val,sector)=>.5*val+(enabled?coupling*conveyor[ring][sector]:0)
  ));
  if(nextStep===GEAR_PROBE_STEP&&gain>0)future[5][0]*=1+gain;
  const nextConveyor=state.map((_,ring)=>enabled&&ring>0?state[ring-1].slice():Array(N).fill(0));
  return [future,nextConveyor];
};

export function buildGearReport(coupling=.5,probeGain=.5,conveyorEnabled=true) {
  if(typeof coupling!=='number'||!COUPLINGS.includes(coupling))throw new RangeError('invalid coupling');
  if(typeof probeGain!=='number'||!PROBE_GAINS.includes(probeGain))throw new RangeError('invalid probe gain');
  if(typeof conveyorEnabled!=='boolean')throw new TypeError('invalid conveyor status');
  let a=initial(1),b=initial(-1),ac=zero(),bc=zero();
  const history=[];
  for(let step=0;step<GEAR_FRAMES;step++){
    const outerA=sum(a[5]),outerB=sum(b[5]);
    history.push({
      step,
      state_a:a.map(x=>x.slice()),state_b:b.map(x=>x.slice()),
      conveyor_a:ac.map(x=>x.slice()),conveyor_b:bc.map(x=>x.slice()),
      outer_a:outerA,outer_b:outerB,outer_gap:Math.abs(outerA-outerB),
      coarse_equal:outerA===outerB,
      outer_hidden_distance:a[5].reduce((s,x,j)=>s+Math.abs(x-b[5][j]),0),
      full_state_distance:distance(a,b),
      conveyor_distance:distance(ac,bc),
      probe_applied:step===GEAR_PROBE_STEP&&probeGain>0
    });
    if(step<GEAR_FRAMES-1){
      [a,ac]=advance(a,ac,coupling,probeGain,step+1,conveyorEnabled);
      [b,bc]=advance(b,bc,coupling,probeGain,step+1,conveyorEnabled);
    }
  }
  const firstArrival=history.find(f=>f.outer_hidden_distance>0);
  const firstSplit=history.find(f=>!f.coarse_equal);
  const exists=Boolean(firstSplit);
  return {
    schema:GEAR_SCHEMA,status:'FINITE_SYNTHETIC_TOY_ONLY',
    epistemic_origin:'SIMULATED',physical_measurement:false,human_data:false,
    consciousness_measured:false,action_authorized:false,
    configuration:{
      coupling,probe_gain:probeGain,conveyor_enabled:conveyorEnabled,
      ring_count:N,sector_count:N,frames:GEAR_FRAMES,retention:.5,
      probe_step:GEAR_PROBE_STEP,probe_ring:5,probe_sector:0,
      ring_radii:[...GEAR_RADII],layer_labels:[...LAYER_LABELS],
      keyhole:'sum(outer ring sector values)',
      interface:'alternating_sector_rotation_then_delayed_conveyor_transfer'
    },
    initial:{
      state_a_ring_0:[1,-1,0,0,0,0],state_b_ring_0:[-1,1,0,0,0,0],
      same_coarse_observable:true
    },
    history,
    witness:{
      first_outer_hidden_arrival:firstArrival?.step??null,
      first_coarse_separation:firstSplit?.step??null,
      exists,gate_kept_closed:!exists
    },
    controls:{
      no_coupling:coupling===0,no_probe:probeGain===0,conveyor_disabled:!conveyorEnabled,
      identity_preserved:true,observation_only:true
    },
    two_case_prediction:{
      task:'recover the sign of initial sector zero of ring zero for balanced A/B',
      sum_only_initial_correct:1,full_initial_state_correct:2,
      outer_after_probe_correct:exists?2:1,cases:2,
      note:'Constructed, balanced two-case sanity check; no held-out predictive claim.'
    }
  };
}
