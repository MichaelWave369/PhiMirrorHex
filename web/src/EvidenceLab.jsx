import {useState} from 'react';
import {
  PACKET_SCHEMA,MAX_BYTES,buildPortablePacket,verifyPortablePacket
} from './portable-evidence-model.mjs';
import './evidence-lab.css';

const TARGETS=[
  {name:'NestedBubbleGear',label:'Research-memory handoff',detail:'Candidate future reader for causal-observability evidence, not an installed adapter.'},
  {name:'BrainC',label:'Routing provenance',detail:'Candidate future evidence source for routing reviews, never automatic model authority.'},
  {name:'SuperPhiVessel',label:'Reality Gate inspection',detail:'Candidate future read-only inspection of simulated reports, never automatic approval.'}
];
function Indicator({label,value,note}){
  return <div className="ev-indicator"><small>{label}</small><strong>{value}</strong><span>{note}</span></div>;
}
export default function EvidenceLab(){
  const [packet,setPacket]=useState(null);
  const [loading,setLoading]=useState(false);
  const [incoming,setIncoming]=useState('');
  const [receiptStatus,setReceiptStatus]=useState(null);
  const [message,setMessage]=useState('');
  async function makePacket(){
    setLoading(true);setMessage('');
    try{
      const generated=await buildPortablePacket();
      const result=await verifyPortablePacket(generated);
      if(!result.valid)throw new Error(result.errors.join(', ')||'Local self-verification failed');
      setPacket(generated);
      setReceiptStatus(result);
      setMessage('E19 receipt generated and replay-verified locally. Not authenticated or authorized.');
    }catch(error){setMessage('Could not build packet: '+error.message);}
    finally{setLoading(false);}
  }
  async function verifyPasted(){
    setLoading(true);setMessage('');
    try{
      const bytes=new TextEncoder().encode(incoming).length;
      if(bytes>MAX_BYTES)throw new Error('200 KB maximum size exceeded');
      const obj=JSON.parse(incoming);
      const result=await verifyPortablePacket(obj);
      setReceiptStatus(result);
      setMessage(result.valid
        ?'Packet matches the local frozen E18 simulator, but remains unsigned and non-authorizing.'
        :'Packet rejected: '+result.errors.join('; '));
    }catch(error){
      setReceiptStatus({valid:false,status:'REJECTED',errors:[error.message]});
      setMessage('Rejected: '+error.message);
    }finally{setLoading(false);}
  }
  function download(){
    if(!packet)return;
    const blob=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download='phimirrorhex-e19-portable-evidence.json';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className="ev-page">
    <header className="ev-hero">
      <div><div className="eyebrow">E19 / PORTABLE RESEARCH EVIDENCE · READ ONLY</div>
        <h2>The <em>Evidence Bridge.</em></h2>
        <p>A shared language for synthetic research. Freeze the E18 decision traces, preserve failed cases, and carry provenance in an unsigned, locally verifiable JSON packet. Consumers must inspect rather than execute.</p>
        <div className="ev-tags"><span>36 CASES</span><span>3,456 FRAMES</span><span>SHA-256 CONTENT CHECK</span><span>NO EXTERNAL CONNECTION</span></div>
      </div>
      <aside className="ev-hero-aside">
        <small>TRUST BOUNDARY</small>
        <strong>Evidence<br/>isn't authority.</strong>
        <p>Unsigned content cannot prove who created it. Synthetic observations are never actual sensor measurements.</p>
      </aside>
    </header>
    <div className="ev-metrics">
      <Indicator label="WIRE CONTRACT" value="v1" note={PACKET_SCHEMA}/>
      <Indicator label="COMPACT FRAME RECORDS" value="3,456" note="96 frames × 36 cases"/>
      <Indicator label="PACKET AUTHENTICATION" value="NONE" note="Content digest only, no signature"/>
      <Indicator label="ACTION GRANTS" value="0" note="Inspection only, never execution"/>
    </div>
    <section className="surface ev-export">
      <div className="panel-header"><div><div className="eyebrow">01 / PRODUCER</div><h2>Generate a research receipt</h2></div><span className="panel-badge">SOURCE: FROZEN E18 REPLAY</span></div>
      <div className="ev-export-body">
        <p>Export a compact JSON packet assembled from the existing deterministic E18 simulator. It includes all 36 cases, complete decision/abstention bitmaps, frozen quorum-selection provenance, the failed cases, and a SHA-256 digest of its canonical payload. No live data is collected or transmitted.</p>
        <div className="ev-actions">
          <button type="button" disabled={loading} onClick={makePacket}>{loading?'REPLAYING RESEARCH…':'BUILD & VERIFY PACKET'}</button>
          <button type="button" disabled={!packet||loading} onClick={download}>↓ EXPORT JSON</button>
        </div>
        {packet&&<div className="ev-hash">
          <span>LOCAL CONTENT DIGEST · SHA-256</span>
          <code>{packet.integrity.sha256}</code>
          <small>The hash is unsigned. It does not authenticate the producer.</small>
        </div>}
      </div>
    </section>
    <section className="surface ev-verifier">
      <div className="panel-header"><div><div className="eyebrow">02 / RECEIVE & CHALLENGE</div><h2>Verify a packet without trusting it</h2></div><span className="panel-badge">200 KB INPUT LIMIT</span></div>
      <div className="ev-verifier-body">
        <p>Paste a local JSON packet to check its checksum, schema, safe claims, frozen E18 selection, all decisions and complete receipt replay. Verification makes no network requests. The text is parsed as data, never executed.</p>
        <label htmlFor="ev-incoming">LOCAL EVIDENCE JSON</label>
        <textarea id="ev-incoming" rows="6" value={incoming} onChange={e=>setIncoming(e.target.value)}
          placeholder='{"payload":{"schema":"field-evidence.synthetic-quorum.v1", ...},"integrity":{...}}'
          spellCheck="false"/>
        <div className="ev-actions">
          <button type="button" disabled={loading||!incoming.trim()} onClick={verifyPasted}>VERIFY INPUT</button>
          <button type="button" disabled={loading||!packet} onClick={()=>{setIncoming(JSON.stringify(packet));setMessage('Locally generated packet loaded into verifier.');}}>USE GENERATED PACKET</button>
          <button type="button" disabled={loading||!incoming} onClick={()=>{setIncoming('');setReceiptStatus(null);setMessage('');}}>CLEAR</button>
        </div>
        {receiptStatus&&<div className={'ev-verdict '+(receiptStatus.valid?'accepted':'rejected')} role="status">
          <strong>{receiptStatus.valid?'READ-ONLY REPLAY VERIFIED':'REJECTED · NOT VERIFIED'}</strong>
          <p>{receiptStatus.valid
            ?'Checksum and local frozen experiment replay agree. Source authenticity is NOT established; no action is authorized.'
            :receiptStatus.errors?.join('; ')||'Invalid evidence packet.'}</p>
        </div>}
        {message&&<p className="ev-message" role="status">{message}</p>}
      </div>
    </section>
    <section className="surface ev-consumers">
      <div className="panel-header"><div><div className="eyebrow">03 / POTENTIAL RECEIVERS</div><h2>One receipt, three future destinations</h2></div><span className="panel-badge">CONTRACT ONLY · NOT CONNECTED</span></div>
      <div className="ev-consumer-grid">{TARGETS.map(t=><div key={t.name}>
        <small>FUTURE READ-ONLY ADAPTER</small>
        <h3>{t.name}</h3>
        <b>{t.label}</b>
        <p>{t.detail}</p>
        <span>NO TOKEN · NO API CALL · NO AUTHORITY</span>
      </div>)}</div>
    </section>
    <div className="ev-foot">
      <div><b>Content integrity is not publisher authentication.</b>
        <p>A malicious actor could rewrite a JSON packet and recompute its unsigned checksum. This lab additionally verifies the original frozen E18 replay, but a future cross-app consumer needs trusted transport, identity verification and its own authorization system before accepting operational evidence. No physical or consciousness result is claimed.</p>
        <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E19_PORTABLE_EVIDENCE_BRIDGE.md" target="_blank" rel="noreferrer">E19 CONSUMER PROTOCOL ↗</a>
      </div>
    </div>
  </section>;
}
