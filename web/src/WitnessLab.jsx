import {useState} from 'react';
import {witnessQualificationReport} from './witness-model.mjs';
import './witness-lab.css';

const TITLES={
 three_matching_untrusted:'Three matching local copies',
 two_matching_one_conflicting:'Two agree, one conflicts',
 three_conflicting_claims:'Three different histories',
 mismatched_checkpoint_counts:'Different checkpoint positions',
 missing_third_claim:'Third witness claim missing',
 duplicated_witness_label:'Duplicate claimed witness',
 false_authenticated_label:'False authenticated identity',
 rehashed_protected_prefix:'Protected history rewritten',
 truncated_consistent_history:'Consistent but truncated history',
 co_rewritten_history_and_all_references:'All copies and ledger forged together',
 rehashed_after_protected_prefix:'Unprotected suffix rewritten'
};
const STATUS={
 AGREEMENT_UNAUTHENTICATED:'AGREEMENT · UNAUTHENTICATED',
 SPLIT_VIEW_DETECTED:'SPLIT VIEW',
 INCOMPARABLE_COUNTS:'INCOMPARABLE',
 INSUFFICIENT_CLAIMS:'INSUFFICIENT',
 INVALID_WITNESS_SET:'CLAIM REFUSED',
 FORK_DETECTED:'FORK DETECTED',
 ROLLBACK_DETECTED:'ROLLBACK DETECTED',
 INVALID_LEDGER:'INVALID LEDGER'
};
function Metric({label,value,desc}){return <div className="wi-metric"><small>{label}</small><strong>{value}</strong><span>{desc}</span></div>;}
function saveJson(report){
 const b=new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(b),a=document.createElement('a');
 a.href=url;a.download='phimirrorhex-e23-witness-audit.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function WitnessLab(){
 const [report,setReport]=useState(null);
 const [busy,setBusy]=useState(false);
 const [selected,setSelected]=useState(1);
 const [notice,setNotice]=useState('');
 const current=report?.cases[selected];
 async function run(){
  setBusy(true);setNotice('');
  try{
   const r=await witnessQualificationReport();
   setReport(r);setSelected(1);
   setNotice('11 local scenarios reproduced. Zero identities authenticated or external actions taken.');
  }catch(e){setNotice('Qualification failed: '+e.message);}
  finally{setBusy(false);}
 }
 return <section className="wi-page">
  <header className="wi-hero"><div>
   <div className="eyebrow">E23 / WITNESS CLAIMS & SPLIT-VIEW AUDIT</div>
   <h2>Three voices.<br/><em>Whose truth?</em></h2>
   <p>A checkpoint can have three different stories. Compare untrusted claims, flag conflicting heads even when two copies agree, and demonstrate why unanimous hashes still do not authenticate their holders.</p>
   <div className="wi-tags"><span>11 CLAIM SCENARIOS</span><span>3 LOCAL LABELS</span><span>2 SPLIT VIEWS</span><span>0 AUTHENTICATED WITNESSES</span></div>
  </div><aside className="wi-aside">
    <small>CONSENSUS FIREWALL</small>
    <strong>Agreement<br/>isn't identity.</strong>
    <p>Two-to-one conflicts still count as conflicts. All three forged copies can agree on a false history.</p>
  </aside></header>
  <div className="wi-metrics">
   <Metric label="WITNESS CLAIM LABELS" value="3" desc="Locally simulated, not independent"/>
   <Metric label="TEST SCENARIOS" value="11" desc="Every result retained"/>
   <Metric label="KNOWN BLIND SPOTS" value="2" desc="Forged unanimous copies and suffix edits"/>
   <Metric label="TRUST OR AUTHORITY GRANTED" value="0" desc="No permissions or authentication"/>
  </div>
  <section className="surface wi-scenarios">
   <div className="panel-header"><div><div className="eyebrow">01 / FIXED CLAIM SETS</div><h2>Run the split-view gauntlet</h2></div><span className="panel-badge">SIMULATED · UNSIGNED</span></div>
   <div className="wi-inner">
    <p>All three local references point to protected event four of the earlier E21 intake chain. This audit refuses to hide disagreement behind a majority vote and retains cases where an attacker can forge complete agreement.</p>
    <div className="wi-actions">
     <button type="button" disabled={busy} onClick={run}>{busy?'VERIFYING…':'RUN E23 WITNESS AUDIT'}</button>
     <button type="button" disabled={!report||busy} onClick={()=>saveJson(report)}>↓ EXPORT FULL RECEIPT</button>
    </div>
    {report&&<>
     <div className="wi-stats">
      <Metric label="UNAUTHENTICATED AGREEMENTS" value={report.summary.agreement_unauthed} desc="Including forged consensus"/>
      <Metric label="SPLIT VIEWS" value={report.summary.split_views} desc="Disagreement never overruled"/>
      <Metric label="FORKS / ROLLBACKS" value={report.summary.forks+report.summary.rollbacks} desc="Against declared reference"/>
      <Metric label="INVALID / UNRESOLVED" value={report.summary.invalid_sets+report.summary.insufficient+report.summary.incomparable} desc="Fail closed"/>
     </div>
     <div className="wi-layout">
      <div className="wi-list">{report.cases.map((row,i)=><button
       type="button" key={row.name} aria-pressed={selected===i}
       className={selected===i?'active':''} onClick={()=>setSelected(i)}>
       <small>{String(i+1).padStart(2,'0')}</small><b>{TITLES[row.name]||row.name}</b>
       <span>{STATUS[row.verdict.status]||row.verdict.status}</span>
      </button>)}</div>
      {current&&<div className="wi-detail">
       <small>CLAIM QUALIFICATION / {String(selected+1).padStart(2,'0')} OF 11</small>
       <h3>{TITLES[current.name]}</h3>
       <div className={'wi-verdict '+(current.verdict.status==='AGREEMENT_UNAUTHENTICATED'?'agreement':'dispute')}>
        {STATUS[current.verdict.status]||current.verdict.status}
       </div>
       <p>{current.verdict.reason.replaceAll('_',' ')}</p>
       <div className="wi-fields">
        <span>Local claim labels <b>{current.verdict.witness_count}</b></span>
        <span>Largest matching group <b>{current.verdict.matching_claims}</b></span>
        <span>Claimed majority groups <b>{current.verdict.majority_claims}</b></span>
        <span>Ledger internally consistent <b>{current.ledger_self_consistent?'YES':'NO'}</b></span>
        <span>Independent identity verified <b>NO</b></span>
        <span>Authority granted <b>NEVER</b></span>
       </div>
       {!!current.verdict.claim_groups.length&&<div className="wi-groups">
        <small>HEAD CLAIM GROUPS · ALL UNSIGNED</small>
        {current.verdict.claim_groups.map(g=><div key={g.head}>
         <span>{g.count} claim{g.count===1?'':'s'} · {g.witness_ids.join(', ')}</span>
         <code>{g.head}</code>
        </div>)}
       </div>}
       {(selected===9||selected===10)&&<div className="wi-warning">
        <strong>KNOWN UNDETECTED MANIPULATION</strong>
        <p>{selected===9?
          'All three references were replaced along with the protected ledger history. Their unanimous match does not detect the attack.':
          'A later event was changed after the protected checkpoint. All saved prefix hashes still agree.'}</p>
       </div>}
       {selected===1&&<div className="wi-warning">
        <strong>TWO TO ONE IS STILL A SPLIT</strong>
        <p>A matching majority may be useful diagnostic information, but it cannot turn unsigned local copies into independently verified testimony.</p>
       </div>}
      </div>}
     </div>
    </>}
   </div>
  </section>
  <section className="surface wi-boundaries">
   <div className="panel-header"><div><div className="eyebrow">02 / WHAT WOULD MAKE THIS REAL?</div><h2>Separate copies from independently verified witnesses</h2></div><span className="panel-badge">NOT CONNECTED</span></div>
   <div className="wi-three">
    <article><small>01 / AUTHENTICITY</small><h3>Who signed?</h3><p>Publisher identities must be authenticated with real cryptographic keys or another trusted channel. Labels in a JSON object are not signatures.</p></article>
    <article><small>02 / INDEPENDENCE</small><h3>Who held the reference?</h3><p>Separate protection domains and independently controlled checkpoint custody must be proven rather than assumed from repeated copies.</p></article>
    <article><small>03 / AUTHORITY</small><h3>Who may act?</h3><p>Even authenticated research evidence must remain separate from agent permissions, memory promotion, routing changes, and device execution.</p></article>
   </div>
  </section>
  <div className="wi-caveat"><b>Three matching hashes are not three trusted witnesses.</b>
   <p>All results here are generated from public deterministic synthetic evidence. There are no real independent signers, externally anchored checkpoints, live integrations or physics measurements. This room grants no ability to control another system.</p>
   <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E23_WITNESS_SPLIT_VIEW_AUDIT.md" target="_blank" rel="noreferrer">READ THE FROZEN E23 PROTOCOL ↗</a>
  </div>
  {notice&&<p className="wi-toast" role="status">{notice}</p>}
 </section>;
}
