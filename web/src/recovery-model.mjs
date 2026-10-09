// E26: local browser recovery challenge, no secure storage or authenticated writers.
import {canonicalString} from './portable-evidence-model.mjs';
import {genesis,KEY_OLD,signClaim,consumeClaim,lifecycleQualificationReport}
  from './lifecycle-model.mjs';
import {intakeQualificationReport} from './intake-chain-model.mjs';
import {makeCheckpoint} from './checkpoint-model.mjs';
export const RECOVERY_SCHEMA='phimirrorhex.e26.recovery-audit.v1';
export const HELD_SCHEMA='phimirrorhex.e26.held-state-reference.v1';
const E25_SCHEMA='phimirrorhex.e25.key-lifecycle.v1';
const clone=x=>JSON.parse(JSON.stringify(x));
const canon=x=>canonicalString(x);
const toHex=v=>[...new Uint8Array(v)].map(n=>n.toString(16).padStart(2,'0')).join('');
const sha=async x=>toHex(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(canon(x))));
const keys=(v,k)=>v&&typeof v==='object'&&!Array.isArray(v)&&canon(Object.keys(v).sort())===canon([...k].sort());
const isHash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const snapshotKeys=['schema','generation','state','digest'];
const referenceKeys=['schema','minimum_generation','expected_digest','origin',
 'identity_authenticated','durable_anchor_provided','authority_granted'];
function validState(s){
 if(!keys(s,['schema','epoch','active_key','last_sequence','sequence_floor','revoked_keys'])||
    s.schema!==E25_SCHEMA||!Number.isSafeInteger(s.last_sequence)||s.last_sequence<0||
    !Number.isSafeInteger(s.sequence_floor)||s.sequence_floor<1||
    !Array.isArray(s.revoked_keys))return false;
 if(s.epoch===1)return s.active_key==='field-a/epoch-1'&&
  s.revoked_keys.length===0&&s.sequence_floor===1;
 if(s.epoch===2)return s.active_key==='field-a/epoch-2'&&
  canon(s.revoked_keys)===canon(['field-a/epoch-1'])&&
  s.sequence_floor===10&&s.last_sequence>=9;
 return false;
}
export async function makeRecoverySnapshot(state,generation){
 if(!validState(state)||!Number.isSafeInteger(generation)||generation<0)
  throw new Error('INVALID_SNAPSHOT_SOURCE');
 const body={schema:RECOVERY_SCHEMA,generation,state:clone(state)};
 return {...body,digest:await sha(body)};
}
async function validSnapshot(s){
 if(!keys(s,snapshotKeys)||s.schema!==RECOVERY_SCHEMA||
    !Number.isSafeInteger(s.generation)||s.generation<0||
    !isHash(s.digest)||!validState(s.state))return false;
 const {digest,...body}=s;
 return await sha(body)===digest;
}
export async function holdRecoveryReference(snapshot){
 if(!(await validSnapshot(snapshot)))throw new Error('INVALID_REFERENCE_SOURCE');
 return {
  schema:HELD_SCHEMA,minimum_generation:snapshot.generation,
  expected_digest:snapshot.digest,origin:'UNAUTHENTICATED_HELD_COPY',
  identity_authenticated:false,durable_anchor_provided:false,
  authority_granted:false
 };
}
function validReference(ref){
 return keys(ref,referenceKeys)&&ref.schema===HELD_SCHEMA&&
  Number.isSafeInteger(ref.minimum_generation)&&ref.minimum_generation>=0&&
  isHash(ref.expected_digest)&&ref.origin==='UNAUTHENTICATED_HELD_COPY'&&
  ref.identity_authenticated===false&&ref.durable_anchor_provided===false&&
  ref.authority_granted===false;
}
export async function recoverLocalSnapshot(snapshot,reference){
 let status='REFUSED_INVALID_REFERENCE',reason='REFERENCE_FIELDS_INVALID';
 let valid=false;
 if(reference===null||reference===undefined){
  status='REFUSED_NO_REFERENCE';reason='SEPARATE_REFERENCE_REQUIRED';
 }else if(validReference(reference)){
  valid=await validSnapshot(snapshot);
  if(!valid){status='REFUSED_INVALID_SNAPSHOT';reason='SNAPSHOT_STRUCTURE_OR_DIGEST_INVALID';}
  else if(snapshot.generation<reference.minimum_generation){
   status='REFUSED_ROLLBACK';reason='SNAPSHOT_OLDER_THAN_HELD_REFERENCE';
  }else if(snapshot.generation>reference.minimum_generation){
   status='REFUSED_UNPINNED_ADVANCE';reason='NEW_GENERATION_HAS_NO_VALIDATED_CONTINUITY';
  }else if(snapshot.digest!==reference.expected_digest){
   status='REFUSED_FORK';reason='SAME_GENERATION_DIFFERENT_DIGEST';
  }else{
   status='RECOVERED_DEMO_UNTRUSTED';reason='MATCHED_UNAUTHENTICATED_CHECKSUM_ONLY';
  }
 }
 if(!valid)valid=await validSnapshot(snapshot);
 return {
  status,reason,generation:valid?snapshot.generation:null,
  state:status==='RECOVERED_DEMO_UNTRUSTED'?clone(snapshot.state):null,
  independent_reference_authenticated:false,publisher_authenticated:false,
  secure_persistence_provided:false,authority_granted:false,external_calls:0
 };
}
export async function recoveryQualificationReport(){
 const report=await lifecycleQualificationReport();
 const oldState=report.events[11].verdict.state;
 const newState=report.events[12].verdict.state;
 const earlier=await makeRecoverySnapshot(oldState,11);
 const current=await makeRecoverySnapshot(newState,12);
 const pin=await holdRecoveryReference(current);
 const modified=clone(current);modified.state.last_sequence=11;
 const rehashed=await makeRecoverySnapshot({...newState,last_sequence:11},12);
 const coRef=await holdRecoveryReference(rehashed);
 const future=await makeRecoverySnapshot(newState,13);
 const corrupted={...newState,epoch:1};
 const invalid={schema:RECOVERY_SCHEMA,generation:12,state:corrupted};
 invalid.digest=await sha(invalid);
 const empty=await makeRecoverySnapshot(genesis(),0);
 const scenarios=[
  ['exact_retained_snapshot',current,pin],
  ['valid_older_snapshot',earlier,pin],
  ['edited_snapshot_without_rehash',modified,pin],
  ['rehash_same_generation',rehashed,pin],
  ['rewrite_snapshot_and_reference_together',rehashed,coRef],
  ['missing_reference',current,null],
  ['fake_authenticated_reference',current,{...pin,identity_authenticated:true}],
  ['future_snapshot_without_new_pin',future,pin],
  ['impossible_epoch_state_with_valid_hash',invalid,pin],
  ['tampered_held_reference_digest',current,{...pin,expected_digest:'f'.repeat(64)}],
  ['older_snapshot_with_co_rewound_reference',earlier,await holdRecoveryReference(earlier)],
  ['fresh_genesis_with_its_own_reference',empty,await holdRecoveryReference(empty)]
 ];
 const cases=[];
 for(const [name,snapshot,ref] of scenarios)
  cases.push({name,verdict:await recoverLocalSnapshot(snapshot,ref)});
 const ledger=(await intakeQualificationReport()).ledger;
 const ref=await makeCheckpoint(ledger,4);
 const oldSigned=await signClaim(KEY_OLD,9,ref);
 const safe=await consumeClaim(cases[0].verdict.state,oldSigned,ledger);
 const reset=await consumeClaim(cases[11].verdict.state,oldSigned,ledger);
 const statuses=cases.map(c=>c.verdict.status);
 const count=status=>statuses.filter(s=>s===status).length;
 const payload={
  schema:RECOVERY_SCHEMA,origin:'SIMULATED',
  source:'E25_PUBLIC_KEY_LIFECYCLE',retained_reference:pin,example_snapshot:current,
  real_durable_anti_rollback_anchor:false,real_authenticated_state_writer:false,
  cross_session_automated_persistence:false,consumer_repositories_connected:false,
  cases,
  replay_probes:{
   with_matching_epoch_two_state:safe.status,
   after_forged_genesis_recovery:reset.status
  },
  summary:{
   scenarios:cases.length,recovered_untrusted:count('RECOVERED_DEMO_UNTRUSTED'),
   rollbacks:count('REFUSED_ROLLBACK'),forks:count('REFUSED_FORK'),
   invalid_snapshots:count('REFUSED_INVALID_SNAPSHOT'),
   missing_references:count('REFUSED_NO_REFERENCE'),
   invalid_references:count('REFUSED_INVALID_REFERENCE'),
   unpinned_advances:count('REFUSED_UNPINNED_ADVANCE'),
   co_rewrite_passed:statuses[4]==='RECOVERED_DEMO_UNTRUSTED',
   co_rewind_passed:statuses[10]==='RECOVERED_DEMO_UNTRUSTED',
   fresh_genesis_passed:statuses[11]==='RECOVERED_DEMO_UNTRUSTED',
   reset_replay_accepted:reset.status==='ACCEPTED_DEMO_UNTRUSTED',
   protected_replay_refused:safe.status==='REFUSED_REVOKED',
   authority_grants:0,external_calls:0
  },
  limitations:[
   'No reference copy is authenticated or durably protected by this implementation.',
   'Rewriting both state and its held reference defeats the checksum comparison.',
   'A fresh genesis plus a self-issued reference admits old replayed claims.',
   'A valid snapshot hash is not an attestation of its actual writer or provenance.',
   'No secure crash recovery, filesystem persistence, signature trust root or action rights.'
  ]
 };
 return {...payload,sha256:await sha(payload)};
}
