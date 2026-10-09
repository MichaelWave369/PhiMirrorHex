import {useState} from 'react';
import {checkpointQualificationReport,compareCheckpoint,makeCheckpoint} from './checkpoint-model.mjs';
import {intakeQualificationReport} from './intake-chain-model.mjs';
import './checkpoint-lab.css';
const name={
 original:'Original complete ledger',
 appended_receipt:'Valid later receipt appended',
 truncated_history:'Rollback to three events',
 rebuilt_history_before_checkpoint:'Rewrite and rehash the protected prefix',
 rebuilt_history_after_checkpoint:'Rewrite only AFTER the checkpoint',
 altered_retained_pin:'Alter the retained checkpoint hash',
 forged_authenticated_checkpoint:'Reference claims false authentication',
 inconsistent_ledger:'Alter event without rehashing'
};
const status={
 PREFIX_MATCHES_UNAUTHENTICATED:'PREFIX MATCHES · UNSIGNED',
 ROLLBACK_DETECTED:'ROLLBACK DETECTED',
 FORK_DETECTED:'FORK DETECTED',
 INVALID_REFERENCE:'REFERENCE REFUSED',
 INVALID_LEDGER:'LEDGER REFUSED'
};
function NumberCard({label,value,desc}){return <div className="cp-stat"><small>{label}</small><strong>{value}</strong><span>{desc}</span></div>;}
function save(name,value){
 const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function CheckpointLab(){
 const [report,setReport]=useState(null),[ledger,setLedger]=useState(null);
 const [chosen,setChosen]=useState(4),[selected,setSelected]=useState(0);
 const [chainText,setChainText]=useState(''),[referenceText,setReferenceText]=useState('');
 const [checked,setChecked]=useState(null),[busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const scenario=report?.scenario_receipts[selected];
 async function build(){
  setBusy(true);setMessage('');setChecked(null);
  try{
   const [result,source]=await Promise.all([checkpointQualificationReport(),intakeQualificationReport()]);
   setReport(result);setLedger(source.ledger);setSelected(0);setChosen(4);
   setMessage('Eight synthetic checkpoint cases completed. No external trust anchor exists.');
  }catch(e){setMessage('Could not generate checkpoint report: '+e.message);}
  finally{setBusy(false);}
 }
 async function customCompare(){
  setBusy(true);setMessage('');setChecked(null);
  try{
   if(new TextEncoder().encode(chainText).length>200000||
      new TextEncoder().encode(referenceText).length>200000)throw Error('200 KB maximum per input');
   const chain=JSON.parse(chainText),anchor=JSON.parse(referenceText);
   const verdict=await compareCheckpoint(chain?.ledger??chain,anchor?.checkpoint??anchor);
   setChecked(verdict);
   setMessage('Checked in memory, not against an authenticated authority.');
  }catch(e){setChecked({status:'INVALID_INPUT',reason:e.message,prefix_matches:false});
   setMessage('Invalid JSON: '+e.message);}
  finally{setBusy(false);}
 }
 async function saveCheckpoint(){
  if(!ledger)return;
  try{const anchor=await makeCheckpoint(ledger,chosen);
   save('phimirrorhex-e22-checkpoint.json',anchor);
   setMessage('Unsigned checkpoint downloaded separately. Protect its custody independently.');}
  catch(e){setMessage('Checkpoint export failed: '+e.message);}
 }
 return <section className="cp-page">
  <header className="cp-hero">
   <div><div className="eyebrow">E22 / OFFLINE CHECKPOINTS · ROLLBACK DEFENSE</div>
    <h2>Who guards <em>the ledger?</em></h2>
    <p>A perfectly rehashed history can be false. Compare a ledger to a separately retained reference, detect truncation and old-history forks, and expose changes that a fixed checkpoint simply cannot see.</p>
    <div className="cp-tags"><span>8 PREDECLARED CASES</span><span>SHA-256 PREFIX PIN</span><span>KNOWN BLIND SPOT</span><span>ZERO ACTION GRANTS</span></div>
   </div>
   <aside className="cp-aside"><small>THE SECURITY LESSON</small>
    <strong>Same hash chain.<br/>Different history.</strong>
    <p>A checkpoint helps only when an independent holder protects it from the attacker who can change the ledger.</p>
   </aside>
  </header>
  <div className="cp-metrics">
   <NumberCard label="CHECKPOINTED EVENTS" value="4" desc="Of 11 E21 intake decisions"/>
   <NumberCard label="SCENARIOS" value="8" desc="Includes realistic rehash attacks"/>
   <NumberCard label="EXPECTED FORK / ROLLBACK" value="3" desc="2 forks and 1 truncated history"/>
   <NumberCard label="AUTHENTICATED ANCHORS" value="0" desc="Human-held unsigned reference only"/>
  </div>
  <section className="surface cp-cases">
   <div className="panel-header"><div><div className="eyebrow">01 / CHECKPOINT QUALIFICATION</div><h2>Challenge the retained prefix</h2></div><span className="panel-badge">SYNTHETIC · READ ONLY</span></div>
   <div className="cp-inner">
    <p>The reference pins event four in the eleven-event E21 chain. The eight fixed cases test unchanged history, extension, rollback, before/after-checkpoint rewrites and malformed claims. All outcomes are preserved, including the **undetected rewritten suffix**.</p>
    <div className="cp-controls">
     <button disabled={busy} onClick={build}>{busy?'REPLAYING…':'RUN E22 QUALIFICATION'}</button>
     <button disabled={!report||busy} onClick={()=>save('phimirrorhex-e22-qualification.json',report)}>↓ EXPORT AUDIT</button>
    </div>
    {report&&<>
     <div className="cp-totals">
      <NumberCard label="PREFIX MATCHES" value={report.summary.prefix_matches} desc="Includes known blind spot"/>
      <NumberCard label="ROLLBACKS DETECTED" value={report.summary.rollbacks} desc="Ledger shorter than protected count"/>
      <NumberCard label="FORKS DETECTED" value={report.summary.forks} desc="Protected prefix hash mismatch"/>
      <NumberCard label="INVALID STRUCTURES" value={report.summary.invalid_ledgers+report.summary.invalid_references} desc="Malformed evidence or reference"/>
     </div>
     <div className="cp-layout">
      <div className="cp-case-list">{report.scenario_receipts.map((s,i)=><button type="button" key={s.name}
       aria-pressed={selected===i} className={selected===i?'active':''} onClick={()=>setSelected(i)}>
       <span>{String(i+1).padStart(2,'0')}</span><b>{name[s.name]}</b><small>{status[s.verdict.status]}</small>
      </button>)}</div>
      {scenario&&<div className="cp-detail">
       <small>CASE {selected+1} / 8</small>
       <h3>{name[scenario.name]}</h3>
       <div className={'cp-verdict '+(scenario.verdict.prefix_matches?'pass':'fail')}>{status[scenario.verdict.status]}</div>
       <p>{scenario.verdict.reason.replaceAll('_',' ')}.</p>
       <div className="cp-property"><span>Internal ledger chain</span><b>{scenario.actual_chain_valid?'SELF-CONSISTENT':'INVALID'}</b></div>
       <div className="cp-property"><span>Prefix matches saved reference</span><b>{scenario.verdict.prefix_matches?'YES':'NO'}</b></div>
       <div className="cp-property"><span>Source authenticated</span><b>NO</b></div>
       <div className="cp-property"><span>Suffix after checkpoint protected</span><b>NO</b></div>
       {scenario.name==='rebuilt_history_after_checkpoint'&&<div className="cp-warning">
        <strong>KNOWN MISSED REWRITE</strong>
        <p>The attacker changed a later event and repaired its hashes. The original prefix still matches, so this check passes. A newer independently held checkpoint would be needed to detect that particular history change.</p>
       </div>}
      </div>}
     </div>
    </>}
   </div>
  </section>
  <section className="surface cp-export">
   <div className="panel-header"><div><div className="eyebrow">02 / MANUAL INDEPENDENT CUSTODY</div><h2>Export evidence and checkpoint separately</h2></div><span className="panel-badge">NO AUTO STORAGE · NO SIGNATURE</span></div>
   <div className="cp-inner">
    <p>Choose how much of the original ledger to pin, then export the reference and ledger as separate JSON files. Only independently protecting the reference makes a future mismatch useful. The browser itself does not establish a trusted anchor.</p>
    <div className="cp-controls cp-export-controls"><label htmlFor="cp-count">Protected event count
      <select id="cp-count" value={chosen} disabled={!ledger||busy} onChange={e=>setChosen(Number(e.target.value))}>
       {Array.from({length:12},(_,n)=><option value={n} key={n}>{n} {n===11?'(whole ledger)':n===0?'(genesis only)':''}</option>)}
      </select></label>
     <button disabled={!ledger||busy} onClick={saveCheckpoint}>↓ EXPORT CHECKPOINT</button>
     <button disabled={!ledger||busy} onClick={()=>save('phimirrorhex-e21-intake-ledger.json',ledger)}>↓ EXPORT LEDGER</button>
    </div>
    {report&&<div className="cp-digest"><small>DEMONSTRATION CHECKPOINT HEAD · FIRST FOUR EVENTS</small>
     <code>{report.checkpoint.head}</code><span>Unsigned, reproducible and publicly computable. Not an identity credential.</span>
    </div>}
   </div>
  </section>
  <section className="surface cp-compare">
   <div className="panel-header"><div><div className="eyebrow">03 / LOCAL INDEPENDENT COMPARISON</div><h2>Check a ledger against a held reference</h2></div><span className="panel-badge">PARSE DATA ONLY · NO REMOTE CALLS</span></div>
   <div className="cp-inner">
    <p>Paste an E21 ledger and an E22 checkpoint separately, then compare them in memory. A matching result is **PREFIX_MATCHES_UNAUTHENTICATED**, never permission to act.</p>
    <div className="cp-textareas">
     <label htmlFor="cp-ledger">E21 LEDGER JSON<textarea id="cp-ledger" rows="6" spellCheck="false" value={chainText}
      onChange={e=>setChainText(e.target.value)} placeholder='{"schema":"phimirrorhex.e21.intake-chain.v1", ...}'/></label>
     <label htmlFor="cp-anchor">SEPARATELY RETAINED E22 CHECKPOINT<textarea id="cp-anchor" rows="6" spellCheck="false" value={referenceText}
      onChange={e=>setReferenceText(e.target.value)} placeholder='{"schema":"phimirrorhex.e22.offline-checkpoint.v1", ...}'/></label>
    </div>
    <div className="cp-controls">
     <button disabled={!chainText.trim()||!referenceText.trim()||busy} onClick={customCompare}>COMPARE LOCAL RECORDS</button>
     <button disabled={!ledger||!report||busy} onClick={()=>{
      setChainText(JSON.stringify(ledger));setReferenceText(JSON.stringify(report.checkpoint));setChecked(null);
     }}>USE DEMO RECORDS</button>
    </div>
    {checked&&<div className={'cp-verdict '+(checked.prefix_matches?'pass':'fail')} role="status">
     {status[checked.status]||checked.status} · {checked.reason.replaceAll('_',' ')}. Not authenticated.
    </div>}
   </div>
  </section>
  <div className="cp-caveat"><strong>A protected checkpoint is a comparison reference, not a signature.</strong>
   <p>E22 provides no trusted key, independent attestation, persistent server ledger, cross-session replay protection or live agent integration. Rewriting both ledger and checkpoint can conceal a forgery. Modifications after the saved checkpoint are outside its guarantee. Every research signal remains simulated and non-authorizing.</p>
   <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E22_OFFLINE_CHECKPOINTS.md" target="_blank" rel="noreferrer">READ FROZEN E22 CHECKPOINT PROTOCOL ↗</a>
  </div>
  {message&&<p role="status" className="cp-notice">{message}</p>}
 </section>;
}
