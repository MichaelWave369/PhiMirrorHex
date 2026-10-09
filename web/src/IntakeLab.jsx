import {useState} from 'react';
import {intakeQualificationReport,verifyIntakeChain,INTAKE_SCHEMA}
  from './intake-chain-model.mjs';
import './intake-lab.css';

const descriptions={
 'first-nbg':'First evidence packet to NestedBubbleGear',
 'replayed-nbg':'Same packet replayed to NBG',
 'first-brainc':'First evidence packet to BrainC',
 'first-vessie':'First evidence packet to SuperPhiVessel',
 'wrong-operator-pin':'Wrong caller-supplied checksum pin',
 'checksum-mutation':'Changed frame without new checksum',
 'rehash-authority':'Forged execution permission + new checksum',
 'rehash-instruction':'Injected instruction + new checksum',
 'fake-signature':'Fake publisher signature',
 'action-request':'Forbidden Reality Gate approval',
 'unknown-consumer':'Unknown recipient identity'
};
const labels={
 QUARANTINED_READ_ONLY:'QUARANTINED',
 DUPLICATE_QUARANTINED:'REPLAY DUPLICATE',
 REJECTED:'REJECTED',
 REFUSED_ACTION:'ACTION REFUSED'
};
function Stat({label,value,desc}){
 return <div className="ic-stat"><small>{label}</small><strong>{value}</strong><span>{desc}</span></div>;
}
export default function IntakeLab(){
 const [report,setReport]=useState(null);
 const [selected,setSelected]=useState(0);
 const [busy,setBusy]=useState(false);
 const [pasted,setPasted]=useState('');
 const [verification,setVerification]=useState(null);
 const [notice,setNotice]=useState('');
 const event=report?.ledger?.events[selected]||null;
 async function run(){
  setBusy(true);setNotice('');setVerification(null);
  try{
   const result=await intakeQualificationReport();
   const checked=await verifyIntakeChain(result.ledger);
   if(!checked.valid)throw Error('Local chain failed self-consistency verification');
   setReport(result);setSelected(0);
   setNotice('11 synthetic intake decisions replayed; no network, trust promotion or durable storage.');
  }catch(err){setNotice('Qualification failed: '+err.message);}
  finally{setBusy(false);}
 }
 function exportJson(){
  if(!report)return;
  const blob=new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='phimirrorhex-e21-intake-chain.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function inspect(){
  setBusy(true);setVerification(null);setNotice('');
  try{
   if(new TextEncoder().encode(pasted).length>200000)
     throw Error('Input exceeds 200 KB size ceiling');
   const candidate=JSON.parse(pasted);
   const ledger=candidate?.ledger??candidate;
   const result=await verifyIntakeChain(ledger);
   setVerification(result);
   setNotice(result.valid?
     'Local chain is internally consistent. This does not authenticate its author.':
     'Chain rejected: '+result.reason);
  }catch(err){
   setVerification({valid:false,reason:err.message});
   setNotice('Cannot verify this JSON: '+err.message);
  }finally{setBusy(false);}
 }
 return <section className="ic-page">
  <header className="ic-hero">
   <div><div className="eyebrow">E21 / PROVENANCE & REPLAY DEFENSE · UNTRUSTED RECEIPTS</div>
    <h2>Every receipt <em>leaves a trace.</em></h2>
    <p>Inspect an in-memory hash-linked record of every research intake. Verified-but-unsigned evidence is quarantined, repeated packets are flagged, and changed or privilege-bearing data gets rejected without dispatch.</p>
    <div className="ic-tags"><span>11 INTAKE SCENARIOS</span><span>3 LOCAL RECEIVERS</span><span>REPLAY-SCOPED</span><span>0 ACTION GRANTS</span></div>
   </div>
   <aside className="ic-hero-aside">
    <small>TRUST RULE</small>
    <strong>Chain ≠ signature.<br/>Pin ≠ identity.<br/>Data ≠ order.</strong>
    <p>Anyone with control of an unsigned ledger can rewrite and rehash the entire history.</p>
   </aside>
  </header>
  <div className="ic-metrics">
   <Stat label="EXPECTED QUARANTINES" value={report?report.summary.quarantined:'3'} desc="Inspection only"/>
   <Stat label="REPLAY DUPLICATES" value={report?report.summary.duplicates:'1'} desc="Scoped to one consumer"/>
   <Stat label="REJECTIONS" value={report?report.summary.rejected:'6'} desc="Corrupt or untrusted claims"/>
   <Stat label="GRANTED ACTIONS" value="0" desc="No agent, device or memory writes"/>
  </div>
  <section className="surface ic-matrix">
   <div className="panel-header">
    <div><div className="eyebrow">01 / REPLAY THE INTAKE</div><h2>Eleven decisions, one evidence chain</h2></div>
    <span className="panel-badge">LOCAL CONTRACT TEST · NO LIVE AGENTS</span>
   </div>
   <div className="ic-inner">
    <p>The same E19 packet is reused deliberately: the first valid receipt is quarantined, the second receipt to the same consumer becomes a duplicate, and other consumers can inspect independently. Six malformed or untrusted cases are rejected and one forbidden action is refused.</p>
    <div className="ic-buttons">
     <button type="button" onClick={run} disabled={busy}>{busy?'VERIFYING…':'RUN E21 INTAKE QUALIFICATION'}</button>
     <button type="button" onClick={exportJson} disabled={!report||busy}>↓ EXPORT FULL CHAIN JSON</button>
    </div>
    {report&&<>
     <div className="ic-summary">
      <Stat label="INTAKE ATTEMPTS" value={report.summary.cases} desc="All preserved"/>
      <Stat label="QUARANTINED" value={report.summary.quarantined} desc="Unsigned receipts"/>
      <Stat label="REPLAY DUPLICATES" value={report.summary.duplicates} desc="Same receiver scope"/>
      <Stat label="REFUSED ACTIONS" value={report.summary.refused_actions} desc="No dispatch"/>
     </div>
     <div className="ic-chain">
      <div className="ic-case-list">
       {report.ledger.events.map((e,i)=><button type="button" key={i}
        aria-pressed={selected===i} className={selected===i?'active':''} onClick={()=>setSelected(i)}>
        <span className="ic-index">{String(i+1).padStart(2,'0')}</span>
        <span className="ic-case-name">{descriptions[report.scenario_names[i]]}</span>
        <small className={e.disposition==='QUARANTINED_READ_ONLY'?'ok':e.disposition==='DUPLICATE_QUARANTINED'?'duplicate':'failure'}>
         {labels[e.disposition]}
        </small></button>)}
      </div>
      {event&&<div className="ic-detail">
       <small>LEDGER EVENT #{event.index+1}</small>
       <h3>{descriptions[report.scenario_names[selected]]}</h3>
       <div className={'ic-status '+(event.disposition==='QUARANTINED_READ_ONLY'?'ok':
        event.disposition==='DUPLICATE_QUARANTINED'?'duplicate':'failure')}>
        {labels[event.disposition]}
       </div>
       <p>{event.reason_codes.join(' · ')}</p>
       <div className="ic-fields">
        <span>Consumer <b>{event.consumer}</b></span>
        <span>Action <b>{event.requested_action}</b></span>
        <span>Checksum pin <b>{event.pin_check.replaceAll('_',' ')}</b></span>
        <span>Evidence <b>{event.evidence_status.replaceAll('_',' ')}</b></span>
        <span>Authenticated source <b>NO</b></span>
        <span>Authority granted <b>NEVER</b></span>
       </div>
       <div className="ic-hashes">
        <small>PREVIOUS LINK</small><code>{event.prev_hash}</code>
        <small>THIS EVENT HASH</small><code>{event.event_hash}</code>
       </div>
      </div>}
     </div>
     <div className="ic-head"><small>SELF-CONSISTENT CHAIN HEAD · UNSIGNED</small>
      <code>{report.ledger.head}</code>
      <b>{report.chain_verification.status.replaceAll('_',' ')}</b>
     </div>
    </>}
   </div>
  </section>
  <section className="surface ic-inspector">
   <div className="panel-header"><div><div className="eyebrow">02 / CHECK AN UNTRUSTED CHAIN</div><h2>Detect local edits, not identity</h2></div>
    <span className="panel-badge">NO SIGNATURE · NO TRUST ANCHOR</span>
   </div>
   <div className="ic-inner">
    <p>Paste either an E21 ledger object or the complete E21 qualification report. This check detects broken links or invalid decisions within that submitted chain. A fully rewritten and recomputed chain could still pass because there is no external trusted signature or anchor.</p>
    <label htmlFor="ic-json">LOCAL JSON (200 KB MAX)</label>
    <textarea id="ic-json" value={pasted} onChange={e=>setPasted(e.target.value)} rows="6"
     placeholder='{"schema":"phimirrorhex.e21.intake-chain.v1","events":[],"head":"000..."}'/>
    <div className="ic-buttons">
     <button type="button" disabled={busy||!pasted.trim()} onClick={inspect}>VERIFY INTERNAL CHAIN</button>
     <button type="button" disabled={busy||!report} onClick={()=>{
      setPasted(JSON.stringify(report.ledger));setVerification(null);}}>USE LOCAL QUALIFICATION CHAIN</button>
     <button type="button" disabled={busy||!pasted} onClick={()=>{setPasted('');setVerification(null);}}>CLEAR</button>
    </div>
    {verification&&<div role="status" className={'ic-status '+(verification.valid?'ok':'failure')}>
     {verification.valid?'SELF-CONSISTENT · NOT AUTHENTICATED':'CORRUPT OR INVALID · '+verification.reason}
    </div>}
   </div>
  </section>
  <div className="ic-caveat"><b>No real trust anchor or persistent ledger exists in E21.</b>
   <p>The chain is generated and checked locally in memory, with no cross-session replay cache, signed publisher identity, or remote receiver connection. A claimed digest and matching caller-supplied pin do not prove authenticity. These are synthetic procedures, not physical or consciousness measurements.</p>
   <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E21_UNTRUSTED_INTAKE_CHAIN.md" target="_blank" rel="noreferrer">READ E21 PROTOCOL ↗</a>
  </div>
  {notice&&<p className="ic-notice" role="status">{notice}</p>}
 </section>;
}
