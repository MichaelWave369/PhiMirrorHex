import {useState} from 'react';
import {lifecycleQualificationReport} from './lifecycle-model.mjs';
import './lifecycle-lab.css';

const TITLES=[
 'First epoch-one signature','Old signature replay','Sequence mutated after signing',
 'One-sided rotation proof','Invalid second rotation signature','Dual-signed fixture rollover',
 'Retired key tries to sign','New key below sequence floor','First epoch-two signature',
 'Epoch-two replay','Reapply the old rollover','Next monotonic signature',
 'Anyone can forge the public test key','Wrong signing domain',
 'Checkpoint changed after signing','Correct signature, wrong checkpoint',
 'Lost verifier state accepts old signature'
];
const knownFailure=i=>i===12||i===16;
const format=x=>x.replaceAll('_',' ');
function Tile({label,value,note}){return <div className="kl-tile"><small>{label}</small><strong>{value}</strong><span>{note}</span></div>;}
function download(value){
 const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob);const link=document.createElement('a');
 link.href=url;link.download='phimirrorhex-e25-key-lifecycle.json';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function LifecycleLab(){
 const [data,setData]=useState(null),[selected,setSelected]=useState(5);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function run(){
  setBusy(true);setMessage('');
  try{
   const report=await lifecycleQualificationReport();
   setData(report);setSelected(5);
   setMessage('All 17 local cryptographic trials replayed. No agent authority or external calls.');
  }catch(e){setMessage('Ed25519 qualification unavailable: '+e.message);}
  finally{setBusy(false);}
 }
 const caseRow=data?.events[selected],verdict=caseRow?.verdict,state=verdict?.state;
 return <section className="kl-page">
  <header className="kl-hero">
   <div><div className="eyebrow">E25 / KEY LIFECYCLE · REPLAY DEFENSE</div>
    <h2>A key can change.<br/><em>Can trust survive?</em></h2>
    <p>Rotate real Ed25519 fixture keys with both generations' signatures, refuse retired keys and replayed sequences, and expose why public secrets and lost memory defeat production security.</p>
    <div className="kl-tags"><span>17 QUALIFICATION TRIALS</span><span>DUAL-SIGNED ROTATION</span><span>2 INTENTIONAL BLIND SPOTS</span><span>NO AGENT AUTHORITY</span></div>
   </div>
   <aside className="kl-aside"><small>CRITICAL BOUNDARY</small>
    <strong>Rotation is<br/>not identity.</strong>
    <p>Both signing seeds are publicly available. The anti-replay ledger exists only in memory, not across restarts.</p>
   </aside>
  </header>
  <div className="kl-stats">
   <Tile label="FROZEN TRIALS" value="17" note="All outcomes recorded"/>
   <Tile label="REFUSED INPUTS" value="11" note="Tampering, stale keys and replay"/>
   <Tile label="KNOWN FAILURES" value="2" note="Forgery and memory reset"/>
   <Tile label="EXTERNAL CALLS" value="0" note="No live integrations"/>
  </div>
  <section className="surface kl-surface">
   <div className="panel-header"><div><div className="eyebrow">01 / CRYPTOGRAPHIC LIFECYCLE</div><h2>Follow every signed transition</h2></div><span className="panel-badge">PUBLIC TEST KEYS · LOCAL STATE</span></div>
   <div className="kl-body">
    <p>The old key signs at sequence 9. Both key generations must sign the transition effective at sequence 10. A retired key and an old sequence are refused, but resetting the verifier demonstrates loss of replay protection.</p>
    <div className="kl-actions">
     <button type="button" disabled={busy} onClick={run}>{busy?'VERIFYING…':'RUN E25 LIFECYCLE QUALIFICATION'}</button>
     <button type="button" disabled={busy||!data} onClick={()=>download(data)}>↓ EXPORT FULL RECEIPT</button>
    </div>
    {data&&<>
     <div className="kl-stats">
      <Tile label="UNTRUSTED ACCEPTS" value={data.summary.accepted_untrusted} note="Includes two failures"/>
      <Tile label="ROTATIONS" value={data.summary.rotated_untrusted} note="Two fixture signatures"/>
      <Tile label="REFUSALS" value={data.summary.refused} note="No privileged action"/>
      <Tile label="FINAL EPOCH / SEQUENCE" value={String(data.summary.final_active_epoch)+' / '+String(data.summary.final_sequence)} note="Memory only"/>
     </div>
     <div className="kl-grid">
      <div className="kl-list">
       {data.events.map((e,i)=><button key={e.name} type="button" aria-pressed={selected===i}
        className={selected===i?'active':''} onClick={()=>setSelected(i)}>
        <span>{String(i+1).padStart(2,'0')}</span><b>{TITLES[i]}</b>
        <small className={knownFailure(i)?'vuln':e.verdict.status.startsWith('REFUSED_')?'refused':'accepted'}>
         {knownFailure(i)?'KNOWN FAILURE':format(e.verdict.status)}
        </small>
       </button>)}
      </div>
      {verdict&&<div className="kl-detail">
       <small>RESEARCH TRIAL {selected+1} / 17</small>
       <h3>{TITLES[selected]}</h3>
       <div className={'kl-status '+(knownFailure(selected)?'vuln':verdict.status.startsWith('REFUSED_')?'refused':'accepted')}>
        {knownFailure(selected)?'EXPECTED VULNERABILITY':format(verdict.status)}
       </div>
       <p>{format(verdict.reason)}</p>
       <div className="kl-properties">
        <span>Signatures verified <b>{verdict.signatures_verified}</b></span>
        <span>Active demo key <b>{state.active_key}</b></span>
        <span>Epoch / sequence <b>{state.epoch} / {state.last_sequence}</b></span>
        <span>Minimum sequence <b>{state.sequence_floor}</b></span>
        <span>Retired keys <b>{state.revoked_keys.join(', ')||'NONE'}</b></span>
        <span>Real signer authenticated <b>NO</b></span>
        <span>Authority granted <b>NONE</b></span>
       </div>
       {knownFailure(selected)&&<div className="kl-warning"><b>SECURITY FAILURE RETAINED IN EVIDENCE</b>
        <p>{selected===12?
         'Anyone can use the public private seed to create an apparently valid signature. Signature validity is not identity.':
         'Reinitializing in-memory state restores the old key and forgets accepted sequences. Old signed evidence passes again without durable monotonic state.'}</p>
       </div>}
      </div>}
     </div>
    </>}
   </div>
  </section>
  <div className="kl-caveat"><b>Real Ed25519 signatures. Public demonstration secrets. No trust promotion.</b>
   <p>Neither authentic identities nor durable anti-replay storage exist in this rung. Production protection would require guarded private keys, persistent independently verified key state, revocation, rollback protection and separate operator-authorized actions. Every experiment remains synthetic.</p>
   <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E25_KEY_LIFECYCLE.md" target="_blank" rel="noreferrer">READ E25 PROTOCOL ↗</a>
  </div>
  {message&&<p role="status" className="kl-toast">{message}</p>}
 </section>;
}
