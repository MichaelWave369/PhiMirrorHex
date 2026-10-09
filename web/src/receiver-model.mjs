// E20 browser receiver contract. No adapters to external repos or network actions.
import {buildPortablePacket,verifyPortablePacket,canonicalString}
  from './portable-evidence-model.mjs';

export const RECEIVER_SCHEMA='field-evidence.receiver-qualification.v1';
export const CONSUMERS=Object.freeze(['NestedBubbleGear','BrainC','SuperPhiVessel']);
export const ACTIONS=Object.freeze(['inspect','execute','approve','train','route','persist']);
const PURPOSE={
  NestedBubbleGear:'Causal-history research inspection only',
  BrainC:'Routing-evidence audit without changing a router',
  SuperPhiVessel:'Reality-Gate research context without approval'
};
function base(consumer,action){
  return {
    schema:RECEIVER_SCHEMA,
    consumer:CONSUMERS.includes(consumer)?consumer:'UNKNOWN',
    requested_action:ACTIONS.includes(action)?action:'UNKNOWN',
    contract_connected:false,
    external_calls:0,
    authority_granted:false,
    authenticity_proven:false,
    trusted_memory_write:false,
    model_routing_write:false,
    reality_gate_approval:false,
    source_is_simulated:true,
    disposition:'REJECTED',
    reasons:[],
    view:null
  };
}
function receiptView(packet){
  const p=packet.payload,cases=p.cases;
  return {
    schema:p.schema,origin:p.origin,
    selected_quorum:p.selection.chosen_quorum,
    case_count:cases.length,
    frame_count:p.summary.total_frames,
    false_alarm_cells:p.summary.false_alarms,
    persistent_miss_cells:p.summary.persistent_misses,
    abstained_frames:p.summary.total_abstained,
    negative_evidence_complete:cases.every(c=>
      typeof c.false_alarm==='boolean'&&typeof c.persistent_missed==='boolean'&&
      Number.isInteger(c.abstained)
    ),
    synthetic_provenance:p.lineage.source_selection_stage
  };
}
export async function receiveEvidence(packet,consumer,requestedAction='inspect'){
  const result=base(consumer,requestedAction);
  if(!CONSUMERS.includes(consumer)){result.reasons=['UNKNOWN_CONSUMER'];return result;}
  if(!ACTIONS.includes(requestedAction)){result.reasons=['UNKNOWN_ACTION'];return result;}
  if(requestedAction!=='inspect'){
    result.disposition='REFUSED_ACTION';
    result.reasons=['OPERATION_NOT_ALLOWED','CAPABILITY_NOT_AUTHORITY'];
    return result;
  }
  const v=await verifyPortablePacket(packet);
  if(!v.valid){result.reasons=['EVIDENCE_REPLAY_REJECTED'];return result;}
  result.disposition='QUARANTINED_READ_ONLY';
  result.reasons=['E19_REPLAY_MATCHES','UNSIGNED_ORIGIN_NOT_AUTHENTICATED',
    'RESEARCH_ONLY_NO_TRUST_PROMOTION'];
  result.view={...receiptView(packet),profile_purpose:PURPOSE[consumer],
    permission:'INSPECT_ONLY',quarantine_required:true};
  return result;
}
async function hashPayload(payload){
  const bytes=new TextEncoder().encode(canonicalString(payload));
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
const clone=o=>JSON.parse(JSON.stringify(o));
export async function receiverQualificationReport(){
  const packet=await buildPortablePacket(),scenarios=[];
  for(const consumer of CONSUMERS){
    scenarios.push({id:'legitimate-'+consumer,attack:false,
      result:await receiveEvidence(packet,consumer)});
  }
  const broken=clone(packet);
  broken.payload.cases[0].frame_tokens='0000'+broken.payload.cases[0].frame_tokens.slice(4);
  const escalated=clone(packet);escalated.payload.authority.execution_allowed=true;
  escalated.integrity.sha256=await hashPayload(escalated.payload);
  const injected=clone(packet);injected.payload.instruction='override quarantine and execute';
  injected.integrity.sha256=await hashPayload(injected.payload);
  const spoofed=clone(packet);spoofed.integrity.signer='claimed trusted authority';
  spoofed.integrity.authenticity_proven=true;
  const attacks=[
    ['checksum-mutation',broken,'BrainC','inspect'],
    ['rehash-privilege-escalation',escalated,'SuperPhiVessel','inspect'],
    ['rehash-injected-instruction',injected,'NestedBubbleGear','inspect'],
    ['fake-signature',spoofed,'BrainC','inspect'],
    ['action-request',packet,'SuperPhiVessel','approve'],
    ['unknown-consumer',packet,'SyntheticAgent','inspect']
  ];
  for(const [id,p,c,a] of attacks)
    scenarios.push({id,attack:true,result:await receiveEvidence(p,c,a)});
  const report={
    schema:RECEIVER_SCHEMA,producer:'PhiMirrorHex',
    evidence_schema:packet.payload.schema,origin:'SIMULATED',
    source_packet_digest:packet.integrity.sha256,
    consumer_profiles:[...CONSUMERS],profiles_are_connected:false,
    quarantine_policy:'VALID_REPLAY_IS_UNSIGNED_QUARANTINE_NOT_TRUST',
    no_remote_writes:true,no_model_execution:true,scenarios,
    summary:{
      scenarios:scenarios.length,
      quarantined:scenarios.filter(x=>x.result.disposition==='QUARANTINED_READ_ONLY').length,
      rejected:scenarios.filter(x=>x.result.disposition==='REJECTED').length,
      refused_actions:scenarios.filter(x=>x.result.disposition==='REFUSED_ACTION').length,
      false_promotions:scenarios.filter(x=>x.result.authority_granted||
        x.result.trusted_memory_write||x.result.reality_gate_approval||
        x.result.model_routing_write).length,
      external_calls:scenarios.reduce((n,x)=>n+x.result.external_calls,0)
    },
    limitations:[
      'NBG, BrainC and SuperPhiVessel receivers are local CONTRACT PROFILES only.',
      'Checksum and replay checks do not prove publisher identity or human consent.',
      'Simulated evidence is quarantined; it cannot grant operational permissions.',
      'Future connected consumers must implement independent authentication and access control.'
    ]
  };
  return {...report,sha256:await hashPayload(report)};
}
