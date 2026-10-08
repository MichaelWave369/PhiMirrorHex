// E6 independent browser reference implementation of frozen Python benchmark.
// No live evidence, no physiology, no model telemetry, no authority claims.
export const COHERENCE_SCHEMA = 'phimirrorhex.e6.coherence-benchmark.v1';
export const PHI = (1 + Math.sqrt(5)) / 2;
export const SAMPLES = 128;
export const VALIDATION_SEED = 202;
export const TEST_SEED = 203;
export const PROFILES = Object.freeze(['equal','phi_inner','phi_outer','center','alternating']);
const normalize = v => {const sum = v.reduce((a,b)=>a+b,0);return v.map(x=>x/sum);};
const rawWeights = {
  equal:[1,1,1,1,1,1],
  phi_inner:Array.from({length:6},(_,i)=>PHI**(5-i)),
  phi_outer:Array.from({length:6},(_,i)=>PHI**i),
  center:[1,2,3,3,2,1],
  alternating:[4,1,4,1,4,1],
};
export const WEIGHTS = Object.freeze(Object.fromEntries(PROFILES.map(p=>[p,Object.freeze(normalize(rawWeights[p]))])));
function xorshift(s) {
  s ^= s << 13;
  s ^= s >>> 17;
  s ^= s << 5;
  return s >>> 0;
}
export function sampleFeatures(seed,index) {
  if(!Number.isInteger(seed)||seed<0||seed>2147483647)throw new RangeError('invalid seed');
  if(!Number.isInteger(index)||index<0||index>=100000)throw new RangeError('invalid index');
  let state=(seed ^ Math.imul(index+1,0x9e3779b9) ^ Math.imul(seed+1,0x85ebca6b))>>>0;
  if(state===0)state=0x6d2b79f5;
  const v=[];
  for(let i=0;i<7;i++){state=xorshift(state);v.push((state & 0xffffff)/0xffffff);}
  return {features:v.slice(0,6),noise:.04*(v[6]-.5)};
}
const dot=(weights,features)=>weights.reduce((sum,w,i)=>sum+w*features[i],0);
function errors(regime,profile,seed) {
  let abs=0,sq=0;
  for(let i=0;i<SAMPLES;i++){
    const {features,noise}=sampleFeatures(seed,i);
    const target=dot(WEIGHTS[regime],features)+noise;
    const prediction=dot(WEIGHTS[profile],features);
    const delta=prediction-target;
    abs+=Math.abs(delta);sq+=delta*delta;
  }
  return {mae:abs/SAMPLES,rmse:Math.sqrt(sq/SAMPLES),readings_per_case:6,weighted_terms_per_case:6};
}
function shuffled(regime,profile,seed) {
  const observations=[];
  for(let i=0;i<SAMPLES;i++){
    const {features,noise}=sampleFeatures(seed,i);
    observations.push([dot(WEIGHTS[profile],features),dot(WEIGHTS[regime],features)+noise]);
  }
  return observations.reduce((sum,[pred],i)=>sum+Math.abs(pred-observations[(i+47)%SAMPLES][1]),0)/SAMPLES;
}
export function coherenceBenchmark() {
  const results=PROFILES.map(regime=>{
    const validation=Object.fromEntries(PROFILES.map(p=>[p,errors(regime,p,VALIDATION_SEED)]));
    const selected=[...PROFILES].sort((a,b)=>validation[a].mae-validation[b].mae||a.localeCompare(b))[0];
    const held_out=Object.fromEntries(PROFILES.map(p=>[p,errors(regime,p,TEST_SEED)]));
    const {features,noise}=sampleFeatures(TEST_SEED,0);
    return {
      regime,world_is_constructed:true,selected_on_validation:selected,
      validation,held_out,
      label_permutation_control:{
        selected_profile:selected,mae:shuffled(regime,selected,TEST_SEED),
        description:'Held-out labels offset by 47 samples; no re-fitting'
      },
      held_out_example:{
        features,target:dot(WEIGHTS[regime],features)+noise,
        noise,predictions:Object.fromEntries(PROFILES.map(p=>[p,dot(WEIGHTS[p],features)]))
      }
    };
  });
  return {
    schema:COHERENCE_SCHEMA,status:'CONSTRUCTED_SYNTHETIC_BENCHMARK',
    epistemic_origin:'SIMULATED',ground_truth_is_engineered:true,
    physical_measurement:false,consciousness_measured:false,
    action_authorized:false,phi_is_proven_optimal:false,
    splits:{validation_seed:VALIDATION_SEED,test_seed:TEST_SEED,cases_per_split_per_regime:SAMPLES},
    protocol:{
      noise:'uniform-derived deterministic jitter in [-0.02,0.02]',
      target:'ground-truth six-weight dot(features) + noise',
      selector:'minimum validation MAE among five frozen candidates, lexicographic ties',
      holdout:'never used in candidate selection',
      cost:'all candidates read six scales and evaluate six weighted terms',
      negative_control:'held-out labels shifted by 47 samples',
      claim_boundary:'matched engineered regimes, not biological coherence'
    },
    profiles:[...PROFILES],
    ring_names:['Environmental coupling','Sensory boundary','Signal encoding',
      'Local feedback loops','Integration proxy','Behavioral expression proxy'],
    weights:Object.fromEntries(PROFILES.map(p=>[p,[...WEIGHTS[p]]])),
    results
  };
}
