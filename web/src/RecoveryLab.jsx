import {useState} from 'react';
import {recoverLocalSnapshot,recoveryQualificationReport} from './recovery-model.mjs';
import './recovery-lab.css';

const scenarios={
 exact_retained_snapshot:'Recover matching latest snapshot',
 valid_older_snapshot:'Attempt to restore older history',
 edited_snapshot_without_rehash:'Tamper without recomputing hash',
 rehash_same_generation:'Rehash a diverging state',
 rewrite_snapshot_and_reference_together:'Forge state and reference together',
 missing_reference:'Recover without held reference',
 fake_authenticated_reference:'Reference falsely asserts identity',
 future_snapshot_without_new_pin:'New snapshot without new pinned proof',
 impossible_epoch_state_with_valid_hash:'Impossible E25 state, valid checksum',
 tampered_held_reference_digest:'Alter expected held digest',
 older_snapshot_with_co_rewound_reference:'Rewind state and reference together',
 fresh_genesis_with_its_own_reference:'Reissue reference from fresh genesis'
};
const isBlind=i=>[4,10,11].includes(i);
function Metric({label,value,note}){return <div className="rc-metric"><small>{label}</small><strong>{value}</strong><span>{note}</span></div>;}
function download(name,obj){
 const blob=new Blob([JSON.stringify(obj,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function RecoveryLab(){
 const [report,setReport]=useState(null),[chosen,setChosen]=useState(1),[busy,setBusy]=useState(false);
 const [snapshot,setSnapshot]=useState(''),[pin,setPin]=useState('');
 const [checked,setChecked]=useState(null),[notice,setNotice]=useState('');
 const selected=report?.cases[chosen];
 async function run(){
  setBusy(true);setNotice('');setChecked(null);
  try{const r=await recoveryQualificationReport();setReport(r);setChosen(1);
   setNotice('Twelve local recovery challenges completed with all known blind spots retained.');}
  catch(e){setNotice('Qualification failed: '+e.message);}
  finally{setBusy(false);}
 }
 async function verify(){
  setBusy(true);setNotice('');setChecked(null);
  try{
   if(new TextEncoder().encode(snapshot).length>100000||
    new TextEncoder().encode(pin).length>100000)throw new Error('100 KB maximum per input');
   const state=JSON.parse(snapshot),held=JSON.parse(pin);
   const answer=await recoverLocalSnapshot(state?.example_snapshot??state,
     held?.retained_reference??held);
   setChecked(answer);
   setNotice('Local comparison only. No external anchor or authority has been verified.');
  }catch(e){setChecked({status:'REFUSED_INVALID_JSON',reason:e.message});
   setNotice('Cannot compare input: '+e.message);}
  finally{setBusy(false);}
 }
 return <section className="rc-page">
  <header className="rc-hero">
   <div><div className="eyebrow">E26 / RECOVERY · ROLLBACK QUALIFICATION</div>
    <h2>Can memory <em>survive a restart?</em></h2>
    <p>Challenge a recovered signing-key state against a separately retained checksum. Detect rewinds and conflicting snapshots, and make the failure of self-issued or jointly forged references impossible to ignore.</p>
    <div className="rc-tags"><span>12 FROZEN CASES</span><span>3 KNOWN BLIND SPOTS</span><span>2 REPLAY PROBES</span><span>NO TRUST ROOT</span></div>
   </div>
   <aside className="rc-hero-note"><small>STATE ≠ PROVENANCE</small>
    <strong>A checksum<br/>is not custody.</strong>
    <p>The code never saves protected state across sessions. You must independently protect any reference you intend to rely on.</p>
   </aside>
  </header>
  <div className="rc-metrics">
   <Metric label="RECOVERY TRIALS" value="12" note="Every refusal and success retained"/>
   <Metric label="EXPECTED REFUSALS" value="8" note="Corruption, fork and rollback"/>
   <Metric label="UNTRUSTED MATCHES" value="4" note="Three deliberately unsafe cases"/>
   <Metric label="EXTERNAL WRITES" value="0" note="No live agents or durable state"/>
  </div>
  <section className="surface rc-surface">
   <div className="panel-header"><div><div className="eyebrow">01 / CRASH-RECOVERY SIMULATION</div><h2>Protect the state or rewrite history</h2></div>
    <span className="panel-badge">IN MEMORY · UNSIGNED · UNAUTHENTICATED</span></div>
   <div className="rc-inner">
    <p>The demonstrated epoch-two sequence-12 state is paired with an equally unsigned reference. A mismatch produces a refusal. Replacing the reference too can defeat that comparison, so the final three positive matches must never be treated as production security.</p>
    <div className="rc-actions">
     <button type="button" disabled={busy} onClick={run}>{busy?'VERIFYING…':'RUN E26 RECOVERY QUALIFICATION'}</button>
     <button type="button" disabled={!report||busy} onClick={()=>download('e26-recovery-full-report.json',report)}>↓ EXPORT FULL REPORT</button>
    </div>
    {report&&<>
     <div className="rc-metrics">
      <Metric label="UNTRUSTED RECOVERIES" value={report.summary.recovered_untrusted} note="Not identity or authority"/>
      <Metric label="FORKS / ROLLBACKS" value={report.summary.forks+report.summary.rollbacks} note="Disagreement surfaced"/>
      <Metric label="INVALID INPUTS" value={report.summary.invalid_snapshots+report.summary.invalid_references+report.summary.missing_references} note="Fail closed"/>
      <Metric label="UNPINNED ADVANCES" value={report.summary.unpinned_advances} note="No inferred continuity"/>
     </div>
     <div className="rc-grid">
      <div className="rc-list">{report.cases.map((caseRow,i)=><button key={caseRow.name} type="button"
       className={chosen===i?'active':''} aria-pressed={chosen===i} onClick={()=>setChosen(i)}>
       <small>{String(i+1).padStart(2,'0')}</small><b>{scenarios[caseRow.name]}</b>
       <span className={isBlind(i)?'blind':caseRow.verdict.status==='RECOVERED_DEMO_UNTRUSTED'?'matched':'refused'}>
        {isBlind(i)?'KNOWN BLIND SPOT':caseRow.verdict.status.replaceAll('_',' ')}
       </span></button>)}</div>
      {selected&&<div className="rc-detail">
       <small>CHALLENGE {chosen+1} / 12</small><h3>{scenarios[selected.name]}</h3>
       <div className={'rc-decision '+(isBlind(chosen)?'blind':selected.verdict.status==='RECOVERED_DEMO_UNTRUSTED'?'matched':'refused')}>
        {isBlind(chosen)?'UNTRUSTED MATCH · ATTACK NOT DETECTED':selected.verdict.status.replaceAll('_',' ')}
       </div>
       <p>{selected.verdict.reason.replaceAll('_',' ')}</p>
       <div className="rc-facts">
        <span>Snapshot revision <b>{selected.verdict.generation??'INVALID'}</b></span>
        <span>Reconstructed state <b>{selected.verdict.state?'RETURNED, NOT TRUSTED':'REFUSED'}</b></span>
        <span>Authentic reference <b>NOT ESTABLISHED</b></span>
        <span>Durable storage <b>NONE</b></span>
        <span>Authorized agent actions <b>ZERO</b></span>
       </div>
       {isBlind(chosen)&&<div className="rc-warning"><strong>DEMONSTRATED FAILURE · NOT SECURE RECOVERY</strong>
        <p>{chosen===11?'A newly invented genesis state and newly invented reference agree, but restore the retired key and admit an old signed claim again.':
         'When the attacker controls the held reference as well as the snapshot, matching checksums cannot detect the history rewrite.'}</p></div>}
      </div>}
     </div>
     <div className="rc-probes">
      <div><small>REPLAY WITH RETAINED EPOCH-TWO STATE</small><strong>{report.replay_probes.with_matching_epoch_two_state.replaceAll('_',' ')}</strong></div>
      <div className="weak"><small>REPLAY AFTER SELF-ISSUED GENESIS RECOVERY</small><strong>{report.replay_probes.after_forged_genesis_recovery.replaceAll('_',' ')}</strong></div>
     </div>
    </>}
   </div>
  </section>
  <section className="surface rc-surface">
   <div className="panel-header"><div><div className="eyebrow">02 / SEPARATE THE RECORDS</div><h2>Export or compare local JSON</h2></div><span className="panel-badge">NO BROWSER STORAGE · NO NETWORK</span></div>
   <div className="rc-inner">
    <p>Download the E26 snapshot and its held reference as separate files, or paste JSON from a local record. A successful comparison establishes checksum agreement only, not an independently trusted checkpoint.</p>
    <div className="rc-actions">
     <button type="button" disabled={!report||busy} onClick={()=>download('e26-snapshot.json',report.example_snapshot)}>↓ EXPORT SNAPSHOT</button>
     <button type="button" disabled={!report||busy} onClick={()=>download('e26-held-reference.json',report.retained_reference)}>↓ EXPORT REFERENCE</button>
     <button type="button" disabled={!report||busy} onClick={()=>{
      setSnapshot(JSON.stringify(report.example_snapshot));setPin(JSON.stringify(report.retained_reference));setChecked(null);
     }}>LOAD EXAMPLE PAIR</button>
    </div>
    <div className="rc-inputs">
     <label htmlFor="rc-snapshot">RECOVERY SNAPSHOT JSON<textarea id="rc-snapshot" rows="6" value={snapshot}
       spellCheck="false" onChange={e=>setSnapshot(e.target.value)} placeholder='{"schema":"phimirrorhex.e26.recovery-audit.v1",...}'/></label>
     <label htmlFor="rc-held">SEPARATELY HELD REFERENCE JSON<textarea id="rc-held" rows="6" value={pin}
       spellCheck="false" onChange={e=>setPin(e.target.value)} placeholder='{"schema":"phimirrorhex.e26.held-state-reference.v1",...}'/></label>
    </div>
    <div className="rc-actions"><button type="button" disabled={busy||!snapshot.trim()||!pin.trim()}
     onClick={verify}>COMPARE LOCAL RECORDS</button></div>
    {checked&&<div className={'rc-decision '+(checked.status==='RECOVERED_DEMO_UNTRUSTED'?'matched':'refused')} role="status">
      {checked.status.replaceAll('_',' ')} · {checked.reason.replaceAll('_',' ')}. No authenticated custody.</div>}
   </div>
  </section>
  <div className="rc-caveat"><b>Recovery of a valid checksum is not recovery of trusted state.</b>
   <p>All keys, agents and signal sources are synthetic; the verifier operates in memory without durable anti-rollback protection. A co-rewritten snapshot and held reference can pass. Real recovery requires independently protected storage and an authenticated chain of state transitions, neither of which is implemented here.</p>
   <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E26_RECOVERY_ROLLBACK.md" target="_blank" rel="noreferrer">READ FROZEN E26 PROTOCOL ↗</a>
  </div>
  {notice&&<p role="status" className="rc-toast">{notice}</p>}
 </section>;
}
