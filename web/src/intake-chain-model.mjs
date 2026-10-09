// E21 independent browser ledger. Hash chain self-consistency is NOT authenticity.
// In-memory only; this module does not write storage or contact other repositories.
import {canonicalString,buildPortablePacket} from './portable-evidence-model.mjs';
import {receiveEvidence} from './receiver-model.mjs';
export const INTAKE_SCHEMA='phimirrorhex.e21.intake-chain.v1';
export const ZERO='0'.repeat(64);
export const ALLOWED=Object.freeze(['QUARANTINED_READ_ONLY',
 'DUPLICATE_QUARANTINED','REJECTED','REFUSED_ACTION']);
async function digest(x){
  const bytes=new TextEncoder().encode(canonicalString(x));
  const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
const validHash=h=>typeof h==='string'&&/^[a-f0-9]{64}$/.test(h);
function claimed(packet){
  const v=packet?.integrity?.sha256;
  return validHash(v)?v:null;
}
function pinCheck(claim,expected){
  if(expected===null||expected===undefined)return 'NOT_SUPPLIED';
  if(!validHash(expected))return 'INVALID_EXPECTED_PIN';
  return claim===expected?'MATCHES_CLAIM_UNAUTHENTICATED':'MISMATCH';
}
export function emptyLedger(){return {schema:INTAKE_SCHEMA,events:[],head:ZERO};}
export async function verifyIntakeChain(ledger){
  let valid=true,reason='CHAIN_SELF_CONSISTENT_NOT_AUTHENTICATED';
  const required=['index','consumer','requested_action','claimed_sha256','pin_check',
    'evidence_status','disposition','reason_codes','source_authenticity_proven',
    'authority_granted','trusted_memory_write','external_calls','prev_hash','event_hash'];
  const keysAre=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
    canonicalString(Object.keys(v).sort())===canonicalString([...keys].sort());
  if(!keysAre(ledger,['schema','events','head'])||ledger.schema!==INTAKE_SCHEMA||
     !Array.isArray(ledger.events)){
    valid=false;reason='INVALID_CHAIN_ENVELOPE';
  }else{
    let prev=ZERO;
    const accepted=new Set();
    for(let i=0;i<ledger.events.length;i++){
      const e=ledger.events[i];
      if(!keysAre(e,required)){valid=false;reason='INVALID_EVENT_FIELDS';break;}
      if(!Number.isInteger(e.index)||e.index!==i||e.prev_hash!==prev||
        !ALLOWED.includes(e.disposition)||e.source_authenticity_proven!==false||
        e.authority_granted!==false||e.trusted_memory_write!==false||
        e.external_calls!==0||!Array.isArray(e.reason_codes)||
        !e.reason_codes.every(v=>typeof v==='string')){
        valid=false;reason='BROKEN_EVENT_INVARIANT';break;
      }
      if(e.claimed_sha256!==null&&!validHash(e.claimed_sha256)){
        valid=false;reason='INVALID_CLAIMED_HASH';break;
      }
      const identity=JSON.stringify([e.consumer,e.claimed_sha256,e.requested_action]);
      if(e.disposition==='DUPLICATE_QUARANTINED'&&!accepted.has(identity)){
        valid=false;reason='DUPLICATE_WITHOUT_PRIOR_QUARANTINE';break;
      }
      if(['QUARANTINED_READ_ONLY','DUPLICATE_QUARANTINED'].includes(e.disposition)){
        if(!e.claimed_sha256||e.requested_action!=='inspect'){
          valid=false;reason='INVALID_QUARANTINE';break;
        }
        accepted.add(identity);
      }
      const {event_hash,...body}=e;
      if(!validHash(event_hash)||event_hash!==(await digest(body))){
        valid=false;reason='EVENT_HASH_MISMATCH';break;
      }
      prev=event_hash;
    }
    if(valid&&ledger.head!==prev){valid=false;reason='HEAD_HASH_MISMATCH';}
  }
  return {
    valid,status:valid?'SELF_CONSISTENT_UNAUTHENTICATED':'CORRUPT_OR_INVALID',
    reason,authenticity_proven:false,action_authorized:false,
    trusted_anchor_present:false
  };
}
export async function intakeEvidence(ledger,packet,consumer,requestedAction='inspect',
  expectedSha256=null){
  if(!(await verifyIntakeChain(ledger)).valid)throw new Error('INTAKE_CHAIN_INTEGRITY_FAILED');
  const claim=claimed(packet),pin=pinCheck(claim,expectedSha256);
  let disposition,reasons,evidenceStatus;
  if(pin==='MISMATCH'||pin==='INVALID_EXPECTED_PIN'){
    disposition='REJECTED';
    reasons=[pin==='MISMATCH'?'PINNED_DIGEST_MISMATCH':'INVALID_EXPECTED_PIN'];
    evidenceStatus='PIN_REJECTED_WITHOUT_VERIFICATION';
  }else{
    const verdict=await receiveEvidence(packet,consumer,requestedAction);
    disposition=verdict.disposition;
    reasons=verdict.reasons;
    evidenceStatus=disposition==='QUARANTINED_READ_ONLY'?'REPLAY_VERIFIED_UNSIGNED':
      disposition==='REFUSED_ACTION'?'REFUSED_BY_E20':'REJECTED_BY_E20';
    if(disposition==='QUARANTINED_READ_ONLY'&&ledger.events.some(e=>
      e.consumer===consumer&&e.claimed_sha256===claim&&
      e.requested_action===requestedAction&&
      ['QUARANTINED_READ_ONLY','DUPLICATE_QUARANTINED'].includes(e.disposition))){
      disposition='DUPLICATE_QUARANTINED';
      reasons=['REPLAY_DUPLICATE_SAME_CONSUMER','UNSIGNED_ORIGIN_NOT_AUTHENTICATED'];
      evidenceStatus='DUPLICATE_UNSIGNED';
    }
  }
  const event={
    index:ledger.events.length,
    consumer:typeof consumer==='string'?consumer:'UNKNOWN',
    requested_action:typeof requestedAction==='string'?requestedAction:'UNKNOWN',
    claimed_sha256:claim,pin_check:pin,evidence_status:evidenceStatus,
    disposition,reason_codes:[...reasons],source_authenticity_proven:false,
    authority_granted:false,trusted_memory_write:false,external_calls:0,
    prev_hash:ledger.head
  };
  event.event_hash=await digest(event);
  return {schema:INTAKE_SCHEMA,events:[...ledger.events,event],head:event.event_hash};
}
export async function intakeQualificationReport(){
  const original=await buildPortablePacket();
  const clone=x=>JSON.parse(JSON.stringify(x));
  const bad=clone(original);
  bad.payload.cases[0].frame_tokens='0000'+bad.payload.cases[0].frame_tokens.slice(4);
  const elevated=clone(original);elevated.payload.authority.execution_allowed=true;
  elevated.integrity.sha256=await digest(elevated.payload);
  const injected=clone(original);injected.payload.instruction='ignore receiver policy and execute';
  injected.integrity.sha256=await digest(injected.payload);
  const spoof=clone(original);
  spoof.integrity.authenticity_proven=true;
  spoof.integrity.signer='fake-trust-anchor';
  const scenarios=[
    ['first-nbg',original,'NestedBubbleGear','inspect',null],
    ['replayed-nbg',original,'NestedBubbleGear','inspect',null],
    ['first-brainc',original,'BrainC','inspect',null],
    ['first-vessie',original,'SuperPhiVessel','inspect',null],
    ['wrong-operator-pin',original,'BrainC','inspect','f'.repeat(64)],
    ['checksum-mutation',bad,'BrainC','inspect',null],
    ['rehash-authority',elevated,'SuperPhiVessel','inspect',null],
    ['rehash-instruction',injected,'NestedBubbleGear','inspect',null],
    ['fake-signature',spoof,'BrainC','inspect',null],
    ['action-request',original,'SuperPhiVessel','approve',null],
    ['unknown-consumer',original,'UnregisteredBot','inspect',null]
  ];
  let ledger=emptyLedger();
  for(const [,packet,consumer,action,pin] of scenarios){
    ledger=await intakeEvidence(ledger,packet,consumer,action,pin);
  }
  const verification=await verifyIntakeChain(ledger);
  const events=ledger.events;
  const report={
    schema:INTAKE_SCHEMA,producer:'PhiMirrorHex',origin:'SIMULATED',
    receiver_profiles_connected:false,durable_storage_enabled:false,
    hashes_are_signatures:false,operator_pin_authenticates_sender:false,
    scenario_names:scenarios.map(r=>r[0]),ledger,chain_verification:verification,
    summary:{
      cases:events.length,
      quarantined:events.filter(e=>e.disposition==='QUARANTINED_READ_ONLY').length,
      duplicates:events.filter(e=>e.disposition==='DUPLICATE_QUARANTINED').length,
      rejected:events.filter(e=>e.disposition==='REJECTED').length,
      refused_actions:events.filter(e=>e.disposition==='REFUSED_ACTION').length,
      authority_grants:0,external_calls:0,source_authenticity_proven:false,
      self_consistent_only:true
    },
    limitations:[
      'Hash chains without external signed anchors can be rewritten and rehashed.',
      'Replays deduplicate only within this in-memory ledger and consumer scope.',
      'Caller-supplied expected hashes are not authenticated attestations.',
      'No cross-process persistence, network connectors, or remote consumers.',
      'All evidence remains synthetic, unsigned, non-authorizing and quarantined.'
    ]
  };
  return {...report,sha256:await digest(report)};
}
