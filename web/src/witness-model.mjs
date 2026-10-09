// E23 separate JS witness claim audit. Labels never authenticate custody.
import {canonicalString} from './portable-evidence-model.mjs';
import {ZERO,INTAKE_SCHEMA,intakeQualificationReport,verifyIntakeChain}
  from './intake-chain-model.mjs';
import {makeCheckpoint,compareCheckpoint} from './checkpoint-model.mjs';
export const WITNESS_SCHEMA='phimirrorhex.e23.witness-claim-audit.v1';
export const WITNESSES=Object.freeze(['field-a','field-b','field-c']);
const copy=o=>JSON.parse(JSON.stringify(o));
async function digest(x){
 const data=new TextEncoder().encode(canonicalString(x));
 const res=await globalThis.crypto.subtle.digest('SHA-256',data);
 return [...new Uint8Array(res)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export function localClaim(id,ref){
 if(!WITNESSES.includes(id))throw new Error('UNKNOWN_LOCAL_WITNESS_LABEL');
 return {witness_id:id,checkpoint:copy(ref),claim_kind:'UNAUTHENTICATED_LOCAL_COPY',
  identity_authenticated:false,independence_verified:false,authority_granted:false};
}
export async function auditWitnesses(ledger,claims){
 const result={
  schema:WITNESS_SCHEMA,status:'INVALID_WITNESS_SET',reason:'WITNESS_CONTRACT_INVALID',
  witness_count:Array.isArray(claims)?claims.length:0,
  witness_checks:[],claim_groups:[],matching_claims:0,majority_claims:0,
  all_claims_match:false,authenticated_quorum:false,
  independent_witnesses_established:false,source_authenticated:false,
  authority_granted:false,trusted_memory_write:false,external_calls:0
 };
 if(!Array.isArray(claims))return result;
 if(claims.length<3){
  result.status='INSUFFICIENT_CLAIMS';result.reason='THREE_CLAIMS_REQUIRED';return result;
 }
 if(claims.length!==3)return result;
 const seen=new Set();
 const keys=['witness_id','checkpoint','claim_kind','identity_authenticated',
  'independence_verified','authority_granted'];
 for(const item of claims){
  if(!item||typeof item!=='object'||Array.isArray(item)||
    canonicalString(Object.keys(item).sort())!==canonicalString([...keys].sort()))
    return result;
  const id=item.witness_id;
  if(typeof id!=='string'||!WITNESSES.includes(id)||seen.has(id)||
    item.claim_kind!=='UNAUTHENTICATED_LOCAL_COPY'||item.identity_authenticated!==false||
    item.independence_verified!==false||item.authority_granted!==false||
    !item.checkpoint||typeof item.checkpoint!=='object'||Array.isArray(item.checkpoint))
    return result;
  seen.add(id);
 }
 const ordered=[...claims].sort((a,b)=>a.witness_id.localeCompare(b.witness_id,'en'));
 const counts=ordered.map(item=>item.checkpoint.count);
 if(counts.some(c=>!Number.isInteger(c)||c<0))return result;
 if(new Set(counts).size!==1){
  result.status='INCOMPARABLE_COUNTS';result.reason='CHECKPOINT_POSITIONS_DIFFER';
  return result;
 }
 const checks=[];
 for(const item of ordered)checks.push({
  witness_id:item.witness_id,claimed_head:item.checkpoint.head??null,
  checkpoint_count:item.checkpoint.count,
  comparison:await compareCheckpoint(ledger,item.checkpoint)
 });
 result.witness_checks=checks;
 if(checks.some(c=>c.comparison.status==='INVALID_REFERENCE')){
  result.reason='MALFORMED_CHECKPOINT';return result;
 }
 const map=new Map();
 for(const c of checks){
  if(typeof c.claimed_head!=='string')return result;
  map.set(c.claimed_head,[...(map.get(c.claimed_head)||[]),c.witness_id]);
 }
 result.claim_groups=[...map.keys()].sort().map(head=>({
  head,witness_ids:map.get(head),count:map.get(head).length
 }));
 result.matching_claims=Math.max(...result.claim_groups.map(g=>g.count));
 result.majority_claims=result.claim_groups.filter(g=>g.count>=2).length;
 result.all_claims_match=map.size===1;
 if(map.size!==1){
  result.status='SPLIT_VIEW_DETECTED';result.reason='CLAIMED_HEADS_DISAGREE';return result;
 }
 const chain=await verifyIntakeChain(ledger);
 if(!chain.valid){result.status='INVALID_LEDGER';result.reason=chain.reason;return result;}
 const check=checks[0].comparison;
 if(check.status==='ROLLBACK_DETECTED'){
  result.status='ROLLBACK_DETECTED';result.reason=check.reason;
 }else if(check.status==='FORK_DETECTED'){
  result.status='FORK_DETECTED';result.reason=check.reason;
 }else if(check.status==='PREFIX_MATCHES_UNAUTHENTICATED'){
  result.status='AGREEMENT_UNAUTHENTICATED';
  result.reason='SAME_UNSIGNED_PREFIX_CLAIM';
 }else{result.reason='UNEXPECTED_COMPARISON';}
 return result;
}
async function rehash(ledger,start){
 const candidate=copy(ledger);
 let prev=start===0?ZERO:candidate.events[start-1].event_hash;
 for(const e of candidate.events.slice(start)){
  e.prev_hash=prev;
  const {event_hash,...body}=e;
  e.event_hash=await digest(body);prev=e.event_hash;
 }
 candidate.head=prev;return candidate;
}
export async function witnessQualificationReport(){
 const base=(await intakeQualificationReport()).ledger;
 const pin=await makeCheckpoint(base,4);
 const honest=WITNESSES.map(w=>localClaim(w,pin));
 const oneBad=copy(honest);oneBad[2].checkpoint.head='f'.repeat(64);
 const threeWay=copy(honest);threeWay[1].checkpoint.head='e'.repeat(64);
 threeWay[2].checkpoint.head='f'.repeat(64);
 const differentCount=copy(honest);differentCount[2].checkpoint=await makeCheckpoint(base,5);
 const dup=copy(honest);dup[2].witness_id='field-a';
 const falseAuth=copy(honest);falseAuth[1].identity_authenticated=true;
 let pre=copy(base);pre.events[1].reason_codes.push('REWRITTEN_PROTECTED_PREFIX');
 pre=await rehash(pre,1);
 let after=copy(base);after.events[7].reason_codes.push('REWRITTEN_UNPROTECTED_SUFFIX');
 after=await rehash(after,7);
 const truncated={schema:base.schema,events:copy(base.events.slice(0,3)),
  head:base.events[2].event_hash};
 const allForged=WITNESSES.map(()=>null);
 const forgedRef=await makeCheckpoint(pre,4);
 for(let i=0;i<WITNESSES.length;i++)allForged[i]=localClaim(WITNESSES[i],forgedRef);
 const scenarios=[
  ['three_matching_untrusted',base,honest],
  ['two_matching_one_conflicting',base,oneBad],
  ['three_conflicting_claims',base,threeWay],
  ['mismatched_checkpoint_counts',base,differentCount],
  ['missing_third_claim',base,honest.slice(0,2)],
  ['duplicated_witness_label',base,dup],
  ['false_authenticated_label',base,falseAuth],
  ['rehashed_protected_prefix',pre,honest],
  ['truncated_consistent_history',truncated,honest],
  ['co_rewritten_history_and_all_references',pre,allForged],
  ['rehashed_after_protected_prefix',after,honest]
 ];
 const outcomes=[];
 for(const [name,ledger,copies] of scenarios)outcomes.push({
  name,ledger_self_consistent:(await verifyIntakeChain(ledger)).valid,
  verdict:await auditWitnesses(ledger,copies)
 });
 const count=s=>outcomes.filter(x=>x.verdict.status===s).length;
 const payload={
  schema:WITNESS_SCHEMA,origin:'SIMULATED',source:'E22_OFFLINE_CHECKPOINT',
  witness_labels:[...WITNESSES],authentic_witnesses_present:false,
  independently_custodied_references_present:false,source_packet_signed:false,
  receiver_repositories_connected:false,checkpoint_count:4,cases:outcomes,
  summary:{
   scenarios:outcomes.length,
   agreement_unauthed:count('AGREEMENT_UNAUTHENTICATED'),
   split_views:count('SPLIT_VIEW_DETECTED'),
   incomparable:count('INCOMPARABLE_COUNTS'),
   insufficient:count('INSUFFICIENT_CLAIMS'),
   invalid_sets:count('INVALID_WITNESS_SET'),
   forks:count('FORK_DETECTED'),rollbacks:count('ROLLBACK_DETECTED'),
   co_rewritten_claims_pass_unauthed:
    outcomes[9].verdict.status==='AGREEMENT_UNAUTHENTICATED',
   post_checkpoint_rewrite_pass_unauthed:
    outcomes[10].verdict.status==='AGREEMENT_UNAUTHENTICATED',
   false_authority_promotions:0,external_calls:0
  },
  limitations:[
   'Three labels are not three independently authenticated witnesses.',
   'A two-of-three majority never overrides a conflicting head claim.',
   'Forging all copies and their referenced history can produce agreement.',
   'After-checkpoint suffix rewrites remain outside pinned prefix protection.',
   'No transport, signatures, durable custody, independent operators or authority.'
  ]
 };
 return {...payload,sha256:await digest(payload)};
}
