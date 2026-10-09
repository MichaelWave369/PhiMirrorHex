// E25 deterministic browser Ed25519 key-lifecycle reference: NO persistent security.
import {canonicalString} from './portable-evidence-model.mjs';
import {intakeQualificationReport} from './intake-chain-model.mjs';
import {makeCheckpoint,compareCheckpoint} from './checkpoint-model.mjs';

export const LIFECYCLE_SCHEMA='phimirrorhex.e25.key-lifecycle.v1';
export const CLAIM_DOMAIN='PhiMirrorHex/E25/DEMO-CLAIM';
export const ROTATION_DOMAIN='PhiMirrorHex/E25/DEMO-ROTATION';
export const KEY_OLD='field-a/epoch-1', KEY_NEW='field-a/epoch-2';
const SEEDS={
 [KEY_OLD]:'0c6dd28ec1abf24b4f7967c45e1264cc55d2c2234577561c128b05a84466727f',
 [KEY_NEW]:'c73c359babfd9a92baf4895862aad4dec62d2eb29cb8c9e8c26bce7a03fc3c09'
};
export const FIXTURE_PUBLIC_KEYS={
 [KEY_OLD]:'fe3a47db1b38ab66fa688e0f18752148e27e9ec29422259dbd6680444d5bd2fc',
 [KEY_NEW]:'7f457ad32f7bedc9e20049be7c0207541ab183754495b8062ae8ff9afd4f673a'
};
const clone=o=>JSON.parse(JSON.stringify(o));
const wire=o=>new TextEncoder().encode(canonicalString(o));
const toHex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const fromHex=s=>new Uint8Array(s.match(/.{2}/g).map(x=>parseInt(x,16)));
const sha=async x=>toHex(await globalThis.crypto.subtle.digest('SHA-256',wire(x)));
const claimFields=['schema','domain','key_id','epoch','sequence','checkpoint','signature_hex'];
const rotateFields=['schema','domain','from_key','to_key','from_epoch','to_epoch',
 'effective_at_sequence','checkpoint','old_signature_hex','new_signature_hex'];
const stateFields=['schema','epoch','active_key','last_sequence','sequence_floor','revoked_keys'];
const sameKeys=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 canonicalString(Object.keys(o).sort())===canonicalString([...keys].sort());
async function sign(keyId,body){
 const prefix=fromHex('302e020100300506032b657004220420');
 const seed=fromHex(SEEDS[keyId]);
 const encoded=new Uint8Array(prefix.length+seed.length);
 encoded.set(prefix);encoded.set(seed,prefix.length);
 const key=await globalThis.crypto.subtle.importKey('pkcs8',encoded,{name:'Ed25519'},false,['sign']);
 return toHex(await globalThis.crypto.subtle.sign('Ed25519',key,wire(body)));
}
async function verify(keyId,body,signature){
 if(!(keyId in FIXTURE_PUBLIC_KEYS)||typeof signature!=='string'||
    !/^[a-f0-9]{128}$/.test(signature))return false;
 try{
  const key=await globalThis.crypto.subtle.importKey('raw',fromHex(FIXTURE_PUBLIC_KEYS[keyId]),
   {name:'Ed25519'},false,['verify']);
  return await globalThis.crypto.subtle.verify('Ed25519',key,fromHex(signature),wire(body));
 }catch{return false;}
}
export function genesis(){
 return {schema:LIFECYCLE_SCHEMA,epoch:1,active_key:KEY_OLD,
  last_sequence:0,sequence_floor:1,revoked_keys:[]};
}
function validState(s){
 if(!sameKeys(s,stateFields)||s.schema!==LIFECYCLE_SCHEMA||
    !Number.isSafeInteger(s.last_sequence)||s.last_sequence<0||
    !Number.isSafeInteger(s.sequence_floor)||s.sequence_floor<1)return false;
 if(s.epoch===1)return s.active_key===KEY_OLD&&s.revoked_keys.length===0&&s.sequence_floor===1;
 if(s.epoch===2)return s.active_key===KEY_NEW&&
  canonicalString(s.revoked_keys)===canonicalString([KEY_OLD])&&
  s.sequence_floor===10&&s.last_sequence>=9;
 return false;
}
export async function signClaim(keyId,sequence,ref,domain=CLAIM_DOMAIN){
 if(!(keyId in SEEDS))throw new Error('UNKNOWN_PUBLIC_FIXTURE_KEY');
 const body={schema:LIFECYCLE_SCHEMA,domain,key_id:keyId,
  epoch:keyId===KEY_OLD?1:2,sequence,checkpoint:clone(ref)};
 return {...body,signature_hex:await sign(keyId,body)};
}
export async function signRotation(ref,old=true,fresh=true){
 const body={schema:LIFECYCLE_SCHEMA,domain:ROTATION_DOMAIN,
  from_key:KEY_OLD,to_key:KEY_NEW,from_epoch:1,to_epoch:2,
  effective_at_sequence:10,checkpoint:clone(ref)};
 return {...body,old_signature_hex:old?await sign(KEY_OLD,body):null,
  new_signature_hex:fresh?await sign(KEY_NEW,body):null};
}
function decision(s,status,reason,signatures=0){
 return {status,reason,signatures_verified:signatures,state:clone(s),
  signers_authenticated:false,state_is_durable:false,
  authority_granted:false,external_calls:0};
}
export async function consumeClaim(s,claim,ledger){
 if(!validState(s))return decision(s,'REFUSED_INVALID_STATE','STATE_INVARIANTS_FAILED');
 if(!sameKeys(claim,claimFields)||claim.schema!==LIFECYCLE_SCHEMA)
  return decision(s,'REFUSED_MALFORMED_CLAIM','CLAIM_FIELDS_INVALID');
 if(claim.domain!==CLAIM_DOMAIN)return decision(s,'REFUSED_BAD_DOMAIN','DOMAIN_SEPARATION_REQUIRED');
 if(s.revoked_keys.includes(claim.key_id))
  return decision(s,'REFUSED_REVOKED','RETIRED_KEY_NO_LONGER_ACTIVE');
 if(claim.key_id!==s.active_key||!Number.isSafeInteger(claim.epoch)||claim.epoch!==s.epoch)
  return decision(s,'REFUSED_INACTIVE_KEY','ACTIVE_EPOCH_KEY_MISMATCH');
 const seq=claim.sequence;
 if(!Number.isSafeInteger(seq)||seq<s.sequence_floor)
  return decision(s,'REFUSED_SEQUENCE_FLOOR','BELOW_ROTATION_SEQUENCE_FLOOR');
 if(seq<=s.last_sequence)
  return decision(s,'REFUSED_REPLAY','SEQUENCE_NOT_STRICTLY_INCREASING');
 const {signature_hex,...body}=claim;
 if(!(await verify(claim.key_id,body,signature_hex)))
  return decision(s,'REFUSED_BAD_SIGNATURE','ED25519_VERIFY_FAILED');
 if((await compareCheckpoint(ledger,claim.checkpoint)).status!=='PREFIX_MATCHES_UNAUTHENTICATED')
  return decision(s,'REFUSED_CHECKPOINT','UNSIGNED_PREFIX_REFERENCE_NOT_MATCHED',1);
 return decision({...s,last_sequence:seq},'ACCEPTED_DEMO_UNTRUSTED',
  'VALID_FIXTURE_SIGNATURE_NO_AUTHORITY',1);
}
export async function rotateKey(s,record,ledger){
 if(!validState(s))return decision(s,'REFUSED_INVALID_STATE','STATE_INVARIANTS_FAILED');
 if(!sameKeys(record,rotateFields)||record.schema!==LIFECYCLE_SCHEMA)
  return decision(s,'REFUSED_MALFORMED_ROTATION','ROTATION_FIELDS_INVALID');
 if(record.domain!==ROTATION_DOMAIN)return decision(s,'REFUSED_BAD_DOMAIN','ROTATION_DOMAIN_REQUIRED');
 if(s.epoch!==1)return decision(s,'REFUSED_STALE_ROTATION','ROTATION_ALREADY_APPLIED');
 if(record.from_key!==KEY_OLD||record.to_key!==KEY_NEW||
  record.from_epoch!==1||record.to_epoch!==2||
  record.effective_at_sequence!==10||record.effective_at_sequence<=s.last_sequence)
  return decision(s,'REFUSED_ROTATION_POLICY','NONMONOTONIC_OR_WRONG_KEY_TRANSITION');
 const {old_signature_hex,new_signature_hex,...body}=record;
 const old=await verify(KEY_OLD,body,old_signature_hex),
  fresh=await verify(KEY_NEW,body,new_signature_hex);
 if(!old||!fresh)return decision(s,'REFUSED_BAD_ROTATION_PROOF',
  'BOTH_KEY_SIGNATURES_REQUIRED',Number(old)+Number(fresh));
 if((await compareCheckpoint(ledger,record.checkpoint)).status!=='PREFIX_MATCHES_UNAUTHENTICATED')
  return decision(s,'REFUSED_CHECKPOINT','UNSIGNED_ROTATION_REFERENCE_NOT_MATCHED',2);
 return decision({...s,epoch:2,active_key:KEY_NEW,sequence_floor:10,revoked_keys:[KEY_OLD]},
  'ROTATED_DEMO_UNTRUSTED','PUBLIC_FIXTURE_DUAL_SIGNED_NO_IDENTITY',2);
}
export async function lifecycleQualificationReport(){
 const ledger=(await intakeQualificationReport()).ledger;
 const ref=await makeCheckpoint(ledger,4);
 let state=genesis();
 const events=[];
 async function observe(name,handler,material){
  const verdict=await handler(state,material,ledger);
  state=verdict.state;events.push({name,verdict});
 }
 const old9=await signClaim(KEY_OLD,9,ref);
 await observe('first_epoch_one_claim',consumeClaim,old9);
 await observe('old_claim_replayed',consumeClaim,old9);
 const altered=await signClaim(KEY_OLD,11,ref);altered.sequence=10;
 await observe('tampered_sequence_after_signing',consumeClaim,altered);
 await observe('only_old_key_signed_rotation',rotateKey,await signRotation(ref,true,false));
 const forged=await signRotation(ref);forged.new_signature_hex='0'.repeat(128);
 await observe('wrong_new_key_rotation_signature',rotateKey,forged);
 const dual=await signRotation(ref);
 await observe('valid_public_fixture_rotation',rotateKey,dual);
 await observe('old_key_after_rotation',consumeClaim,await signClaim(KEY_OLD,10,ref));
 await observe('new_key_below_rotation_floor',consumeClaim,await signClaim(KEY_NEW,9,ref));
 const new10=await signClaim(KEY_NEW,10,ref);
 await observe('first_new_key_claim',consumeClaim,new10);
 await observe('new_key_replay',consumeClaim,new10);
 await observe('reapply_old_rotation',rotateKey,dual);
 await observe('next_monotonic_new_key_claim',consumeClaim,await signClaim(KEY_NEW,11,ref));
 await observe('public_seed_can_forge_signature',consumeClaim,await signClaim(KEY_NEW,12,ref));
 await observe('wrong_domain_signature',consumeClaim,await signClaim(KEY_NEW,13,ref,'PhiMirrorHex/E24/UNTRUSTED-DEMO'));
 const changed=await signClaim(KEY_NEW,13,ref);changed.checkpoint.head='f'.repeat(64);
 await observe('checkpoint_mutated_after_signing',consumeClaim,changed);
 await observe('valid_signature_wrong_checkpoint',consumeClaim,await signClaim(KEY_NEW,13,await makeCheckpoint(ledger,5)));
 events.push({name:'restart_with_lost_state_accepts_old_claim',
  verdict:await consumeClaim(genesis(),old9,ledger)});
 const statuses=events.map(e=>e.verdict.status);
 const tally=s=>statuses.filter(v=>v===s).length;
 const payload={
  schema:LIFECYCLE_SCHEMA,origin:'SIMULATED',algorithm:'Ed25519',
  fixture_public_keys:FIXTURE_PUBLIC_KEYS,public_private_seeds:true,
  authenticated_identity_present:false,durable_anti_replay_storage_present:false,
  external_credential_provisioning:false,real_key_custody:false,
  rotation_old_signature:dual.old_signature_hex,
  rotation_new_signature:dual.new_signature_hex,
  first_old_claim_signature:old9.signature_hex,
  first_new_claim_signature:new10.signature_hex,
  events,
  summary:{
   trials:events.length,accepted_untrusted:tally('ACCEPTED_DEMO_UNTRUSTED'),
   rotated_untrusted:tally('ROTATED_DEMO_UNTRUSTED'),
   refused:statuses.filter(s=>s.startsWith('REFUSED_')).length,
   public_seed_forgery_accepted:statuses[12]==='ACCEPTED_DEMO_UNTRUSTED',
   replay_after_state_reset_accepted:statuses[16]==='ACCEPTED_DEMO_UNTRUSTED',
   final_active_epoch:state.epoch,final_sequence:state.last_sequence,
   authority_grants:0,external_calls:0
  },
  limitations:[
   'All private signing seeds are public; fixture signatures can be forged by anyone.',
   'This is one locally simulated signer, not independently trusted identity or custody.',
   'Memory-only epoch, revocation and sequence checks vanish on state reset.',
   'The verifier cannot safely recover monotonic state without authenticated durable storage.',
   'No agent or device permission is derived from any successful signature or rotation.'
  ]
 };
 return {...payload,sha256:await sha(payload)};
}
