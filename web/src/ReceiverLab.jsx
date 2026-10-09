import {useState} from 'react';
import {receiverQualificationReport,receiveEvidence,CONSUMERS,ACTIONS}
  from './receiver-model.mjs';
import {MAX_BYTES} from './portable-evidence-model.mjs';
import './receiver-lab.css';

const LABELS={
 'legitimate-NestedBubbleGear':'NBG research read-only',
 'legitimate-BrainC':'BrainC routing inspection',
 'legitimate-SuperPhiVessel':'Vessie research intake',
 'checksum-mutation':'Corrupted frame checksum',
 'rehash-privilege-escalation':'Rehashed privilege escalation',
 'rehash-injected-instruction':'Rehashed prompt injection',
 'fake-signature':'Fabricated publisher signature',
 'action-request':'Forbidden approval request',
 'unknown-consumer':'Unrecognized recipient'
};
const badgeText={
 QUARANTINED_READ_ONLY:'QUARANTINED · UNSIGNED',
 REJECTED:'REJECTED',
 REFUSED_ACTION:'ACTION REFUSED'
};
function Metric({label,value,desc}){return <div className="rx-metric"><small>{label}</small><strong>{value}</strong><span>{desc}</span></div>;}
export default function ReceiverLab(){
  const [report,setReport]=useState(null);
  const [loading,setLoading]=useState(false);
  const [selected,setSelected]=useState(0);
  const [consumer,setConsumer]=useState('SuperPhiVessel');
  const [action,setAction]=useState('inspect');
  const [pasted,setPasted]=useState('');
  const [decision,setDecision]=useState(null);
  const [message,setMessage]=useState('');
  const chosen=report?.scenarios[selected]||null;
  async function runMatrix(){
    setLoading(true);setMessage('');
    try{
      const value=await receiverQualificationReport();
      setReport(value);setSelected(0);
      setMessage('Local nine-scenario qualification complete. No external applications contacted.');
    }catch(e){setMessage('Qualification could not run: '+e.message);}
    finally{setLoading(false);}
  }
  async function inspectPasted(){
    setLoading(true);setDecision(null);setMessage('');
    try{
      const bytes=new TextEncoder().encode(pasted).length;
      if(bytes>MAX_BYTES)throw Error('Input exceeds 200 KB packet limit');
      const packet=JSON.parse(pasted);
      const result=await receiveEvidence(packet,consumer,action);
      setDecision(result);
      setMessage('Local contract decision only; no remote recipient was contacted.');
    }catch(e){
      setDecision(null);
      setMessage('Rejected input: '+e.message);
    }finally{setLoading(false);}
  }
  function exportMatrix(){
    if(!report)return;
    const blob=new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download='phimirrorhex-e20-receiver-qualification.json';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className="rx-page">
    <header className="rx-hero">
      <div>
        <div className="eyebrow">E20 / GOVERNED EVIDENCE RECEIVERS · LOCAL SIMULATION</div>
        <h2>A receipt is <em>not an order.</em></h2>
        <p>PhiMirrorHex now tests how an agent should receive research without obeying it. Nine frozen trials challenge three proposed read-only consumers with forged authority, altered frames, injected instructions, and forbidden requests.</p>
        <div className="rx-tags"><span>3 CONSUMER PROFILES</span><span>9 QUALIFICATION TRIALS</span><span>6 MISUSE CASES</span><span>NO EXTERNAL ACTIONS</span></div>
      </div>
      <aside className="rx-hero-aside">
        <small>ACCEPTANCE POLICY</small>
        <strong>Verify.<br/>Quarantine.<br/>Never promote.</strong>
        <p>Unsigned content may be replay-consistent while remaining unauthenticated and non-authorizing.</p>
      </aside>
    </header>
    <div className="rx-metrics">
      <Metric label="LEGITIMATE READ-ONLY CASES" value="3" desc="Must quarantine, not trust"/>
      <Metric label="MALICIOUS/MISUSE CASES" value="6" desc="Reject or refuse action"/>
      <Metric label="AUTHORITY PROMOTIONS" value="0" desc="No route, memory or gate writes"/>
      <Metric label="CONNECTED RECEIVERS" value="0" desc="Contract profiles only"/>
    </div>
    <section className="surface rx-contract">
      <div className="panel-header"><div><div className="eyebrow">01 / CONSUMER ISOLATION</div><h2>Three future consumers, no live bridges</h2></div><span className="panel-badge">CONTRACT ONLY</span></div>
      <div className="rx-profiles">
        <div><small>RESEARCH READER</small><h3>NestedBubbleGear</h3><p>Inspect synthetic causal-history statistics. No graph-memory writes or natural-world claims.</p></div>
        <div><small>ROUTING REVIEW</small><h3>BrainC</h3><p>Compare failure counts without changing a routing model or learning policy.</p></div>
        <div><small>REALITY GATE REVIEW</small><h3>SuperPhiVessel</h3><p>See uncertainties without approving a Reality Gate, tool call or deployment.</p></div>
      </div>
    </section>
    <section className="surface rx-matrix">
      <div className="panel-header"><div><div className="eyebrow">02 / MISUSE QUALIFICATION</div><h2>Run the nine-case receiver gauntlet</h2></div><span className="panel-badge">ALL RESULTS RETAINED</span></div>
      <div className="rx-matrix-body">
        <p>All tests run locally against the same E19 synthetic packet. A valid packet is <b>QUARANTINED_READ_ONLY</b>, not approved. Compromised packets and requested actions must be rejected or refused.</p>
        <div className="rx-controls">
          <button type="button" disabled={loading} onClick={runMatrix}>
            {loading?'REPLAYING AND CHECKING…':'RUN RECEIVER QUALIFICATION'}</button>
          <button type="button" disabled={loading||!report} onClick={exportMatrix}>↓ EXPORT FULL REPORT</button>
        </div>
        {report&&<>
          <div className="rx-outcomes">
            <Metric label="QUARANTINED" value={report.summary.quarantined} desc="Unsigned, inspected only"/>
            <Metric label="REJECTED" value={report.summary.rejected} desc="Malformed or unrecognized"/>
            <Metric label="ACTION REFUSED" value={report.summary.refused_actions} desc="No operator authority"/>
            <Metric label="FALSE PROMOTIONS" value={report.summary.false_promotions} desc="Required to remain zero"/>
          </div>
          <div className="rx-cases">
            <div className="rx-case-list">
              {report.scenarios.map((s,i)=><button key={s.id} type="button"
                className={selected===i?'active':''} aria-pressed={selected===i} onClick={()=>setSelected(i)}>
                <b>{LABELS[s.id]||s.id}</b>
                <small className={s.result.disposition==='QUARANTINED_READ_ONLY'?'quarantine':'rejected'}>
                  {badgeText[s.result.disposition]}
                </small>
              </button>)}
            </div>
            {chosen&&<div className="rx-case-detail">
              <small>SCENARIO {selected+1} / {report.scenarios.length}</small>
              <h3>{LABELS[chosen.id]||chosen.id}</h3>
              <div className={'rx-decision '+(chosen.result.disposition==='QUARANTINED_READ_ONLY'?'quarantine':'rejected')}>
                {badgeText[chosen.result.disposition]}
              </div>
              <p>{chosen.result.reasons.join(' · ')}</p>
              <div className="rx-properties">
                <span>Consumer <b>{chosen.result.consumer}</b></span>
                <span>Requested operation <b>{chosen.result.requested_action}</b></span>
                <span>Authenticity established <b>NO</b></span>
                <span>External calls <b>0</b></span>
                <span>Trusted-memory write <b>NO</b></span>
                <span>Action authority <b>NONE</b></span>
              </div>
              {chosen.result.view&&<div className="rx-view">
                <b>Quarantined synthetic-only view</b>
                <p>Cases {chosen.result.view.case_count} · frames {chosen.result.view.frame_count} · false alarms {chosen.result.view.false_alarm_cells} · missed changes {chosen.result.view.persistent_miss_cells}</p>
                <p>Source: {chosen.result.view.synthetic_provenance}</p>
              </div>}
            </div>}
          </div>
        </>}
      </div>
    </section>
    <section className="surface rx-inspect">
      <div className="panel-header"><div><div className="eyebrow">03 / LOCAL RECEIVER SANDBOX</div><h2>Challenge an unsigned packet</h2></div><span className="panel-badge">NO NETWORK OR TOOL DISPATCH</span></div>
      <div className="rx-matrix-body">
        <p>Paste an E19 packet and choose a hypothetical consumer and requested operation. This is a local reference implementation, not an active external integration. Only <b>inspect</b> is potentially allowed, and its successful result is still quarantined.</p>
        <div className="rx-inputs"><label>Consumer<select value={consumer} onChange={e=>setConsumer(e.target.value)}>
          {CONSUMERS.map(c=><option key={c} value={c}>{c}</option>)}
        </select></label>
          <label>Requested operation<select value={action} onChange={e=>setAction(e.target.value)}>
            {ACTIONS.map(a=><option key={a} value={a}>{a}</option>)}
          </select></label></div>
        <label className="rx-paste-label" htmlFor="rx-packet">LOCAL PACKET JSON (200 KB MAX)</label>
        <textarea id="rx-packet" rows="5" spellCheck="false" value={pasted}
          onChange={e=>setPasted(e.target.value)} placeholder='{"payload":{...},"integrity":{...}}'/>
        <button className="rx-inspect-button" type="button" disabled={loading||!pasted.trim()} onClick={inspectPasted}>
          INSPECT UNDER GOVERNED POLICY</button>
        {decision&&<div className={'rx-decision '+(decision.disposition==='QUARANTINED_READ_ONLY'?'quarantine':'rejected')} role="status">
          {badgeText[decision.disposition]} · {decision.reasons.join(' · ')}
        </div>}
      </div>
    </section>
    <div className="rx-limit">
      <b>Passing the contract does not connect the ecosystem.</b>
      <p>No NestedBubbleGear, BrainC, or SuperPhiVessel installation is changed. An unsigned packet can be reproduced but not attributed to a trusted publisher. Production integrations require authenticated identity, provenance anchors, sandboxed parsing, and permissioned operational decisions.</p>
      <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E20_GOVERNED_EVIDENCE_RECEIVERS.md" target="_blank" rel="noreferrer">READ E20 GOVERNED RECEIVER PROTOCOL ↗</a>
    </div>
    {message&&<p className="rx-toast" role="status">{message}</p>}
  </section>;
}
