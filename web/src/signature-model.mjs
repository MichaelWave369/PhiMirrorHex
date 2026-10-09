// E24 deterministic Ed25519 *demo* crypto, via WebCrypto (Node 22+/modern browsers).
// Public seeded private fixture keys prove mechanics, never genuine identity.
import {canonicalString} from './portable-evidence-model.mjs';
import {intakeQualificationReport,verifyIntakeChain,ZERO} from './intake-chain-model.mjs';
import {makeCheckpoint,compareCheckpoint} from './checkpoint-model.mjs';
import {WITNESSES} from './witness-model.mjs';

export const SIGNATURE_SCHEMA='phimirrorhex.e24.ed25519-demo-witness.v1';
export const DOMAIN='PhiMirrorHex/E24/UNTRUSTED-DEMO', EPOCH=3, SEQUENCE=7;
const SEEDS={
 'field-a':'0c6dd28ec1abf24b4f7967c45e1264cc55d2c2234577561c128b05a84466727f',
 'field-b':'a297220d6016dd42d148abb1c9803d9c9f8ad570b4d912b195251696372fbf77',
 'field-c':'dd1cfe6b57affa829a5b8f70455f3e429449a73e37276f3746e55cc3f4b9b27f'
};
export const DEMO_PUBLIC_KEYS={
 'field-a':'fe3a47db1b38ab66fa688e0f18752148e27e9ec29422259dbd6680444d5bd2fc',
 'field-b':'156a252c369bf3cf8ba6fdae3196ea83f931fd899bba5323a0474ad7a323abf2',
 'field-c':'d04721bebc278079614d01287e34c7be23796058bd314a0b70a861462029e650'
};
const clone=o=>JSON.parse(JSON.stringify(o));
const fromHex=s=>new Uint8Array(s.match(/.{2}/g).map(n=>parseInt(n,16)));
const toHex=b=>[...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join('');
const wire=o=>new TextEncoder().encode(canonicalString(o));
const digest=async o=>toHex(await globalThis.crypto.subtle.digest('SHA-256',wire(o)));
const keys=['domain','signer_id','epoch','sequence','checkpoint','signature_hex'];
export async function signDemo(id,ref,epoch=EPOCH,sequence=SEQUENCE){
 if(!(id in SEEDS))throw new Error('UNKNOWN_DEMO_SIGNER');
 const body={domain:DOMAIN,signer_id:id,epoch,sequence,checkpoint:clone(ref)};
 const prefix=fromHex('302e020100300506032b657004220420');
 const raw=fromHex(SEEDS[id]);
 const pkcs8=new Uint8Array(prefix.length+raw.length);
 pkcs8.set(prefix);pkcs8.set(raw,prefix.length);
 const privateKey=await globalThis.crypto.subtle.importKey('pkcs8',pkcs8,
  {name:'Ed25519'},false,['sign']);
 const signature=await globalThis.crypto.subtle.sign('Ed25519',privateKey,wire(body));
 return {...body,signature_hex:toHex(signature)};
}
export async function inspectSignatures(ledger,claims,revoked=[],minSequence=0){
 const r={
  schema:SIGNATURE_SCHEMA,status:'INVALID_CLAIMS',reason:'MALFORMED_SIGNED_CLAIM_SET',
  signatures_verified:0,declared_claims:Array.isArray(claims)?claims.length:0,
  head_groups:[],all_heads_equal:false,fixture_public_keys_pinned:true,
  signers_authenticated_in_real_world:false,independent_custody_proven:false,
  public_demo_private_keys:true,authority_granted:false,external_calls:0
 };
 const setStatus=(status,reason)=>{r.status=status;r.reason=reason;return r;};
 if(!Array.isArray(claims))return r;
 if(claims.length<WITNESSES.length)return setStatus('INSUFFICIENT_CLAIMS','THREE_SIGNED_CLAIMS_REQUIRED');
 if(claims.length!==3||claims.some(c=>!c||typeof c!=='object'||Array.isArray(c)||
  canonicalString(Object.keys(c).sort())!==canonicalString([...keys].sort())))return r;
 const ids=claims.map(c=>c.signer_id);
 if(ids.some(id=>typeof id!=='string'||!(id in SEEDS))||new Set(ids).size!==3)return r;
 if(!Number.isInteger(minSequence)||minSequence<0||!Array.isArray(revoked)||
   revoked.some(v=>typeof v!=='string'))return r;
 if(claims.some(c=>c.domain!==DOMAIN))return r;
 if(claims.some(c=>!Number.isInteger(c.epoch)||c.epoch!==EPOCH))
  return setStatus('STALE_EPOCH','FROZEN_EPOCH_REQUIRED');
 if(claims.some(c=>!Number.isInteger(c.sequence)||c.sequence<=minSequence))
  return setStatus('REPLAY_SEQUENCE','SEQUENCE_NOT_FRESH');
 if(claims.some(c=>revoked.includes(c.signer_id)))
  return setStatus('REVOKED_DEMO_KEY','REVOKED_KEY_IN_CLAIM_SET');
 const counts=claims.map(c=>c.checkpoint?.count);
 if(counts.some(v=>!Number.isInteger(v)||v<0))return r;
 if(new Set(counts).size!==1)return setStatus('INCOMPARABLE_COUNTS','CHECKPOINT_POSITIONS_DIFFER');
 for(const c of claims){
  const hex=c.signature_hex;
  if(typeof hex!=='string'||!/^[a-f0-9]{128}$/.test(hex))
   return setStatus('INVALID_SIGNATURE','SIGNATURE_ENCODING_INVALID');
  const {signature_hex,...body}=c;
  let valid=false;
  try{
   const key=await globalThis.crypto.subtle.importKey('raw',fromHex(DEMO_PUBLIC_KEYS[c.signer_id]),
    {name:'Ed25519'},false,['verify']);
   valid=await globalThis.crypto.subtle.verify('Ed25519',key,fromHex(hex),wire(body));
  }catch{}
  if(!valid)return setStatus('INVALID_SIGNATURE','PINNED_DEMO_KEY_VERIFICATION_FAILED');
  r.signatures_verified++;
 }
 const ordered=[...claims].sort((a,b)=>a.signer_id.localeCompare(b.signer_id,'en'));
 const groups=new Map();
 for(const c of ordered){
  const head=c.checkpoint?.head;
  if(typeof head!=='string')return r;
  groups.set(head,[...(groups.get(head)||[]),c.signer_id]);
 }
 r.head_groups=[...groups.keys()].sort().map(head=>({
  head,signer_ids:groups.get(head),count:groups.get(head).length
 }));
 r.all_heads_equal=groups.size===1;
 if(groups.size!==1)return setStatus('SIGNED_SPLIT_VIEW','SIGNED_HEAD_CLAIMS_CONFLICT');
 const cmp=await compareCheckpoint(ledger,ordered[0].checkpoint);
 if(cmp.status==='PREFIX_MATCHES_UNAUTHENTICATED')
  return setStatus('SIGNED_AGREEMENT_DEMO_UNTRUSTED','DEMO_SIGNATURES_VALID_BUT_KEYS_PUBLIC');
 if(cmp.status==='FORK_DETECTED')
  return setStatus('FORK_DETECTED','SIGNED_PREFIX_CONFLICTS_WITH_LEDGER');
 if(cmp.status==='ROLLBACK_DETECTED')
  return setStatus('ROLLBACK_DETECTED','SIGNED_PREFIX_EXCEEDS_LEDGER_LENGTH');
 return setStatus('INVALID_LEDGER_OR_REFERENCE',cmp.status);
}
async function rehash(source,index){
 const ledger=clone(source);
 let prev=index===0?ZERO:ledger.events[index-1].event_hash;
 for(const e of ledger.events.slice(index)){
  e.prev_hash=prev;
  const {event_hash,...body}=e;
  e.event_hash=await digest(body);
  prev=e.event_hash;
 }
 ledger.head=prev;return ledger;
}
export async function signatureQualificationReport(){
 const ledger=(await intakeQualificationReport()).ledger;
 const ref=await makeCheckpoint(ledger,4);
 const honest=await Promise.all(WITNESSES.map(i=>signDemo(i,ref)));
 const conflict=clone(honest);conflict[2]=await signDemo('field-c',{...ref,head:'f'.repeat(64)});
 const tampered=clone(honest);tampered[0].checkpoint.head='f'.repeat(64);
 const wrong=clone(honest);wrong[0].signer_id='field-b';wrong[1].signer_id='field-a';
 const dup=clone(honest);dup[2].signer_id='field-a';
 const old=await Promise.all(WITNESSES.map(i=>signDemo(i,ref,2)));
 const fake=clone(honest);fake[1].identity_authenticated=true;
 let pre=clone(ledger);pre.events[1].reason_codes.push('E24_PRE_CHECKPOINT_REWRITE');
 pre=await rehash(pre,1);
 let after=clone(ledger);after.events[7].reason_codes.push('E24_SUFFIX_REWRITE');
 after=await rehash(after,7);
 const forged=await Promise.all(WITNESSES.map(i=>signDemo(i,{
  ...(await makeCheckpoint(pre,4))
 })));
 const short={schema:ledger.schema,events:clone(ledger.events.slice(0,3)),
  head:ledger.events[2].event_hash};
 const diff=clone(honest);diff[2]=await signDemo('field-c',await makeCheckpoint(ledger,5));
 const scenarios=[
  ['three_valid_demo_signatures',ledger,honest,[],0],
  ['signed_two_to_one_split',ledger,conflict,[],0],
  ['mutated_after_signing',ledger,tampered,[],0],
  ['wrong_signer_identity',ledger,wrong,[],0],
  ['missing_third_signature',ledger,honest.slice(0,2),[],0],
  ['duplicated_signer_id',ledger,dup,[],0],
  ['expired_epoch',ledger,old,[],0],
  ['revoked_demo_signer',ledger,honest,['field-b'],0],
  ['replayed_sequence',ledger,honest,[],7],
  ['forged_authentication_field',ledger,fake,[],0],
  ['signed_prefix_fork',pre,honest,[],0],
  ['signed_rollback',short,honest,[],0],
  ['all_public_fixture_signers_reissue_forged_history',pre,forged,[],0],
  ['signed_unprotected_suffix_rewrite',after,honest,[],0],
  ['valid_signatures_different_positions',ledger,diff,[],0]
 ];
 const cases=[];
 for(const [name,led,claims,revoked,minimum] of scenarios)cases.push({
  name,ledger_self_consistent:(await verifyIntakeChain(led)).valid,
  verdict:await inspectSignatures(led,claims,revoked,minimum)
 });
 const statuses=cases.map(c=>c.verdict.status);
 const cnt=x=>statuses.filter(s=>s===x).length;
 const payload={
  schema:SIGNATURE_SCHEMA,origin:'SIMULATED',algorithm:'Ed25519',
  signature_context:DOMAIN,demo_epoch:EPOCH,demo_sequence:SEQUENCE,
  demo_public_keys:DEMO_PUBLIC_KEYS,secret_private_keys_exist:false,
  trust_roots_authenticated:false,independent_witness_custody:false,
  live_integrations_connected:false,cases,
  summary:{
   scenarios:cases.length,
   valid_signature_agreements:cnt('SIGNED_AGREEMENT_DEMO_UNTRUSTED'),
   split_views:cnt('SIGNED_SPLIT_VIEW'),
   invalid_signatures:cnt('INVALID_SIGNATURE'),
   invalid_claims:cnt('INVALID_CLAIMS'),
   insufficient:cnt('INSUFFICIENT_CLAIMS'),
   stale_epochs:cnt('STALE_EPOCH'),revoked:cnt('REVOKED_DEMO_KEY'),
   replayed:cnt('REPLAY_SEQUENCE'),forks:cnt('FORK_DETECTED'),
   rollbacks:cnt('ROLLBACK_DETECTED'),incomparable:cnt('INCOMPARABLE_COUNTS'),
   public_fixture_forgery_passed:statuses[12]==='SIGNED_AGREEMENT_DEMO_UNTRUSTED',
   suffix_rewrite_passed:statuses[13]==='SIGNED_AGREEMENT_DEMO_UNTRUSTED',
   authority_granted:0,external_calls:0
  },
  limitations:[
   'This demo uses public deterministic Ed25519 private seeds: anyone can forge each fixture signer.',
   'Signature verification proves possession of a key, not its identity or independence.',
   'Revocation, epochs, and sequence counters are in-memory verifier arguments only.',
   'All-signer forgery and unsigned suffix edits can still yield matching signed prefix claims.',
   'No live trust root, durable replay database, external custody, or agent action authority.'
  ]
 };
 return {...payload,sha256:await digest(payload)};
}
