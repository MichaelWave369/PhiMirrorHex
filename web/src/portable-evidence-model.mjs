// E19 browser/Node portable packet, independently generated from E18 replay.
// WebCrypto SHA256 proves content consistency, NOT publisher authenticity.
import {prospectiveAuditReport} from './prospective-audit-model.mjs';

export const PACKET_SCHEMA='field-evidence.synthetic-quorum.v1';
export const EXPECTED_CASES=36,FRAME_COUNT=96,MAX_BYTES=200000;
const CONSUMERS=['NestedBubbleGear','BrainC','SuperPhiVessel'];
const LIMITATIONS=[
 'All observations are deterministic simulated noise, not real measurements.',
 'Observers share synthetic noise; agreement does not mean independence.',
 'E17 was reused retrospectively as development evidence.',
 'Content hashes detect byte changes, not authorship, consent or authenticity.',
 'No control, device, model, network or deployment authority is conveyed.'
];
export function canonicalString(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonicalString).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalString(value[k])).join(',')+'}';
}
async function digest(value){
  const input=new TextEncoder().encode(canonicalString(value));
  const result=await globalThis.crypto.subtle.digest('SHA-256',input);
  return Array.from(new Uint8Array(result),x=>x.toString(16).padStart(2,'0')).join('');
}
const mask=(flags)=>flags.reduce((n,v,i)=>n+(v?1<<i:0),0).toString(16);
function frameTokens(observations){
  return observations.map(f=>mask(f.member_available)+mask(f.member_votes)+
    Number(f.abstained)+Number(f.new_alert)).join('');
}
function receiptCase(policy,t){
  return {
    quorum:policy.quorum,family:t.family,seed:t.seed,
    onset:t.true_change_step,first_alarm:t.first_alarm_step,
    false_alarm:t.false_alarm,persistent_missed:t.persistent_change_missed,
    detected:t.persistent_change_detected,detection_delay:t.detection_delay,
    attempted:t.attempted,abstained:t.abstained,
    frame_tokens:frameTokens(t.observations)
  };
}
export function portablePayload(){
  const e18=prospectiveAuditReport();
  const cases=e18.policies.flatMap(p=>p.trials.map(t=>receiptCase(p,t)));
  return {
    schema:PACKET_SCHEMA,
    producer:'PhiMirrorHex',source_experiment:e18.schema,source_stage:'E18',
    origin:'SIMULATED',signature_status:'UNSIGNED',
    consumer_integration_status:'CONTRACT_ONLY_NOT_CONNECTED',
    intended_readonly_consumers:[...CONSUMERS],
    claims:{
      real_measurement:false,independent_witnesses:false,
      consciousness_measured:false,physical_law_discovered:false,
      reliability_certified:false,agent_action_authorized:false
    },
    authority:{
      grant:'NONE',permitted:'INSPECT_ONLY',execution_allowed:false,
      deployment_allowed:false,network_action_allowed:false,must_be_revalidated:true
    },
    lineage:{
      source_selection_stage:'E17_REUSED_AS_RETROSPECTIVE_DEVELOPMENT',
      selection_was_originally_preregistered:false,
      quorum_frozen_before_e18_holdout:true,
      source_seeds:Array.from({length:12},(_,i)=>4101+i),
      frame_count:FRAME_COUNT,
      frame_encoding:'4 hex ASCII per step: available(0-7), yes(0-7), refused(0/1), first-alert(0/1)',
      raw_sensor_samples_exported:false
    },
    selection:{
      chosen_quorum:e18.selection.selected_quorum,
      weights:e18.selection.weights,
      candidate_costs:e18.selection.candidate_costs,
      selection_uses_e18_holdout:false
    },
    cases,
    summary:{
      cases:cases.length,per_quorum:FRAME_COUNT/8,
      total_frames:cases.length*FRAME_COUNT,
      false_alarms:cases.filter(c=>c.false_alarm).length,
      persistent_misses:cases.filter(c=>c.persistent_missed).length,
      total_abstained:cases.reduce((n,c)=>n+c.abstained,0),
      selected_quorum:e18.selection.selected_quorum,
      granted_actions:0
    },
    limitations:[...LIMITATIONS]
  };
}
export async function buildPortablePacket(){
  const payload=portablePayload();
  return {
    payload,
    integrity:{
      algorithm:'SHA-256',sha256:await digest(payload),
      signer:null,authenticity_proven:false
    }
  };
}
function equal(a,b){return canonicalString(a)===canonicalString(b);}
function keysAre(obj,keys){return obj&&typeof obj==='object'&&!Array.isArray(obj)&&
  equal(Object.keys(obj).sort(),[...keys].sort());}
function reject(message){throw new Error(message);}
function validateFrames(c){
  const tokens=c.frame_tokens;
  if(typeof tokens!=='string'||tokens.length!==FRAME_COUNT*4)reject('Missing complete frame trace');
  let first=null,attempted=0;
  for(let t=0;t<FRAME_COUNT;t++){
    const a=tokens[t*4],v=tokens[t*4+1],r=tokens[t*4+2],n=tokens[t*4+3];
    if(!/^[0-7]$/.test(a)||!/^[0-7]$/.test(v)||!/^[01]$/.test(r)||!/^[01]$/.test(n))
      reject('Invalid frame token');
    const availability=parseInt(a,16),votes=parseInt(v,16);
    if((votes&~availability)!==0)reject('Unavailable member cast a vote');
    const eligible=availability.toString(2).split('1').length-1;
    const refuse=eligible<c.quorum;
    if(refuse!==(r==='1'))reject('Refusal mismatch');
    if(!refuse)attempted++;
    const count=votes.toString(2).split('1').length-1;
    const trigger=first===null&&!refuse&&count>=c.quorum;
    if(trigger!==(n==='1'))reject('First-alarm sequence mismatch');
    if(trigger)first=t;
  }
  if(attempted!==c.attempted||FRAME_COUNT-attempted!==c.abstained)
    reject('Coverage mismatch');
  if(first!==c.first_alarm)reject('First-alarm mismatch');
}
export async function verifyPortablePacket(packet){
  try{
    if(!keysAre(packet,['payload','integrity']))reject('Invalid envelope keys');
    if(new TextEncoder().encode(canonicalString(packet)).length>MAX_BYTES)
      reject('Packet exceeds 200000 bytes');
    const {payload,integrity}=packet;
    if(!keysAre(integrity,['algorithm','sha256','signer','authenticity_proven']))
      reject('Unexpected integrity fields');
    if(integrity.algorithm!=='SHA-256'||typeof integrity.sha256!=='string'||
      !/^[a-f0-9]{64}$/.test(integrity.sha256))reject('Invalid checksum metadata');
    if(await digest(payload)!==integrity.sha256)reject('Checksum mismatch');
    if(integrity.signer!==null||integrity.authenticity_proven!==false)
      reject('Unsigned packets cannot claim authenticity');
    const expected=portablePayload();
    if(!keysAre(payload,Object.keys(expected)))reject('Unexpected evidence fields');
    for(const key of ['schema','producer','source_experiment','source_stage','origin',
      'signature_status','consumer_integration_status','intended_readonly_consumers',
      'claims','authority','lineage','selection','limitations']){
      if(!equal(payload[key],expected[key]))reject('Contract/provenance mismatch: '+key);
    }
    if(!Array.isArray(payload.cases)||payload.cases.length!==EXPECTED_CASES)
      reject('Case-count mismatch');
    if(!equal(payload.cases,expected.cases)||!equal(payload.summary,expected.summary))
      reject('Evidence replay mismatch');
    payload.cases.forEach(validateFrames);
    return {valid:true,integrity_checked:true,authenticity_proven:false,
      action_authorized:false,status:'READ_ONLY_VERIFIED',errors:[]};
  }catch(error){return {valid:false,integrity_checked:false,
    authenticity_proven:false,action_authorized:false,
    status:'REJECTED',errors:[String(error.message||error)]};}
}
