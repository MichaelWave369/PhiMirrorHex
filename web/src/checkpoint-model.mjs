// E22 independent browser offline checkpoint comparison, no durable storage.
// A retained unsigned pin alone does not prove identity or protect later suffixes.
import {canonicalString,buildPortablePacket} from './portable-evidence-model.mjs';
import {emptyLedger,intakeEvidence,intakeQualificationReport,verifyIntakeChain,ZERO,INTAKE_SCHEMA}
  from './intake-chain-model.mjs';
export const CHECKPOINT_SCHEMA='phimirrorhex.e22.offline-checkpoint.v1';
const clone=o=>JSON.parse(JSON.stringify(o));
const hashValid=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
async function digest(v){
  const bytes=new TextEncoder().encode(canonicalString(v));
  const buffer=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(buffer)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export async function makeCheckpoint(ledger,count){
  if(!(await verifyIntakeChain(ledger)).valid)throw new Error('INVALID_SOURCE_LEDGER');
  if(!Number.isInteger(count)||count<0||count>ledger.events.length)throw new Error('INVALID_CHECKPOINT_COUNT');
  return {
    schema:CHECKPOINT_SCHEMA,ledger_schema:ledger.schema,count,
    head:count===0?ZERO:ledger.events[count-1].event_hash,
    origin:'UNSIGNED_LOCAL_SNAPSHOT',producer_authenticated:false,
    external_anchor_provided_by_library:false,authority_granted:false
  };
}
export async function compareCheckpoint(ledger,ref){
  let status='INVALID_REFERENCE',reason='CHECKPOINT_SCHEMA_INVALID';
  const valid=ref&&typeof ref==='object'&&!Array.isArray(ref)&&
    canonicalString(Object.keys(ref).sort())===canonicalString([
      'schema','ledger_schema','count','head','origin','producer_authenticated',
      'external_anchor_provided_by_library','authority_granted'].sort())&&
    ref.schema===CHECKPOINT_SCHEMA&&ref.ledger_schema===INTAKE_SCHEMA&&
    Number.isInteger(ref.count)&&ref.count>=0&&hashValid(ref.head)&&
    ref.origin==='UNSIGNED_LOCAL_SNAPSHOT'&&ref.producer_authenticated===false&&
    ref.external_anchor_provided_by_library===false&&ref.authority_granted===false&&
    (ref.count!==0||ref.head===ZERO);
  if(valid){
    const chain=await verifyIntakeChain(ledger);
    if(!chain.valid){status='INVALID_LEDGER';reason=chain.reason;}
    else if(ledger.events.length<ref.count){
      status='ROLLBACK_DETECTED';reason='LEDGER_SHORTER_THAN_RETAINED_CHECKPOINT';
    }else{
      const actual=ref.count===0?ZERO:ledger.events[ref.count-1].event_hash;
      if(actual!==ref.head){status='FORK_DETECTED';reason='CHECKPOINT_PREFIX_HASH_MISMATCH';}
      else{status='PREFIX_MATCHES_UNAUTHENTICATED';reason='RETAINED_PREFIX_MATCHES';}
    }
  }
  return {
    status,reason,prefix_matches:status==='PREFIX_MATCHES_UNAUTHENTICATED',
    origin_authenticated:false,trusted_anchor_created:false,
    after_checkpoint_suffix_protected:false,external_calls:0,authority_granted:false
  };
}
async function rehashFrom(ledger,starting){
  const out=clone(ledger);
  let prev=starting===0?ZERO:out.events[starting-1].event_hash;
  for(const e of out.events.slice(starting)){
    e.prev_hash=prev;
    const {event_hash,...body}=e;
    e.event_hash=await digest(body);
    prev=e.event_hash;
  }
  out.head=prev;
  return out;
}
export async function checkpointQualificationReport(){
  const old=(await intakeQualificationReport()).ledger;
  const ref=await makeCheckpoint(old,4);
  const packet=await buildPortablePacket();
  const extended=await intakeEvidence(old,packet,'BrainC');
  const rollback={schema:old.schema,events:clone(old.events.slice(0,3)),
    head:old.events[2].event_hash};
  let pre=clone(old);pre.events[1].reason_codes.push('REWRITTEN_PRE_CHECKPOINT');
  pre=await rehashFrom(pre,1);
  let post=clone(old);post.events[7].reason_codes.push('REWRITTEN_POST_CHECKPOINT');
  post=await rehashFrom(post,7);
  const changedPin={...ref,head:'f'.repeat(64)};
  const invalidRef={...ref,producer_authenticated:true};
  const corrupt=clone(old);
  corrupt.events[3].reason_codes.push('UNREHASHED_EDIT');
  const cases=[
    ['original',old,ref],['appended_receipt',extended,ref],
    ['truncated_history',rollback,ref],
    ['rebuilt_history_before_checkpoint',pre,ref],
    ['rebuilt_history_after_checkpoint',post,ref],
    ['altered_retained_pin',old,changedPin],
    ['forged_authenticated_checkpoint',old,invalidRef],
    ['inconsistent_ledger',corrupt,ref]
  ];
  const records=[];
  for(const [name,ledger,pin] of cases)records.push({
    name,actual_chain_valid:(await verifyIntakeChain(ledger)).valid,
    verdict:await compareCheckpoint(ledger,pin)
  });
  const payload={
    schema:CHECKPOINT_SCHEMA,producer:'PhiMirrorHex',origin:'SIMULATED',
    checkpoint:ref,source_intake_head:old.head,source_event_count:old.events.length,
    source_checkpoint_count:ref.count,reference_was_externally_anchored:false,
    reference_is_signed:false,consumer_repositories_connected:false,
    durable_storage_enabled:false,scenario_receipts:records,
    summary:{
      scenarios:records.length,
      prefix_matches:records.filter(r=>r.verdict.prefix_matches).length,
      rollbacks:records.filter(r=>r.verdict.status==='ROLLBACK_DETECTED').length,
      forks:records.filter(r=>r.verdict.status==='FORK_DETECTED').length,
      invalid_references:records.filter(r=>r.verdict.status==='INVALID_REFERENCE').length,
      invalid_ledgers:records.filter(r=>r.verdict.status==='INVALID_LEDGER').length,
      known_post_checkpoint_rewrite_missed:
        records[4].verdict.status==='PREFIX_MATCHES_UNAUTHENTICATED',
      authority_grants:0,external_calls:0
    },
    limitations:[
      'An independently saved reference is required to notice a complete rehash.',
      'This checkpoint is unsigned, in-memory and not an independently trusted anchor.',
      'Rewriting both evidence and its comparison pin defeats this check.',
      'A rewrite entirely after the pinned prefix is outside the checkpoint guarantee.',
      'No live agent integrations, physical measurements or action grants exist.'
    ]
  };
  return {...payload,sha256:await digest(payload)};
}
