import {useState} from 'react';
import {signatureQualificationReport} from './signature-model.mjs';
import './signature-lab.css';

const CASES={
 three_valid_demo_signatures:'Three valid fixture signatures',
 signed_two_to_one_split:'Signed 2-to-1 conflicting histories',
 mutated_after_signing:'Message modified after signing',
 wrong_signer_identity:'Signer labels substituted',
 missing_third_signature:'Third signature missing',
 duplicated_signer_id:'Duplicate key identity',
 expired_epoch:'Signed under an old epoch',
 revoked_demo_signer:'Locally revoked demo signer',
 replayed_sequence:'Repeated signing sequence',
 forged_authentication_field:'Fabricated authentication assertion',
 signed_prefix_fork:'Signed checkpoint versus rewritten prefix',
 signed_rollback:'Signed checkpoint versus shorter history',
 all_public_fixture_signers_reissue_forged_history:'Public keys re-sign a forged history',
 signed_unprotected_suffix_rewrite:'Modified history after signed prefix',
 valid_signatures_different_positions:'Valid claims for different checkpoints'
};
const form=x=>x.replaceAll('_',' ');
function save(result){
 const blob=new Blob([JSON.stringify(result,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='phimirrorhex-e24-ed25519-demonstration.json';
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function Stat({label,value,description}){return <div className="sg-stat"><small>{label}</small><strong>{value}</strong><span>{description}</span></div>;}
export default function SignatureLab(){
 const [report,setReport]=useState(null);
 const [selected,setSelected]=useState(1);
 const [loading,setLoading]=useState(false);
 const [notice,setNotice]=useState('');
 const current=report?.cases[selected];
 async function run(){
  setLoading(true);setNotice('');
  try{
   const result=await signatureQualificationReport();
   setReport(result);setSelected(1);
   setNotice('15 local Ed25519 demonstration scenarios verified. Demo keys remain public and untrusted.');
  }catch(e){setNotice('Verification unavailable: '+e.message+'. Browser WebCrypto Ed25519 support is required.');}
  finally{setLoading(false);}
 }
 return <section className="sg-page">
  <header className="sg-hero">
   <div><div className="eyebrow">E24 / CRYPTOGRAPHIC WITNESS DEMONSTRATION</div>
    <h2>A signature <em>isn't an identity.</em></h2>
    <p>Verify real Ed25519 signatures, then challenge the crucial assumption: a key signature does not automatically establish who owns the key, whether witnesses are independent, or what an agent is authorized to do.</p>
    <div className="sg-pills"><span>15 FROZEN CASES</span><span>ED25519 / WEBCRYPTO</span><span>PUBLIC TEST KEYS</span><span>NO TRUST PROMOTION</span></div>
   </div>
   <aside className="sg-hero-aside"><small>CRYPTOGRAPHIC BOUNDARY</small>
    <strong>Valid bytes.<br/>Unknown people.</strong>
    <p>The reproducible private fixture seeds are public by design. Anyone can forge the demo signers.</p>
   </aside>
  </header>
  <div className="sg-stats">
   <Stat label="SIMULATED SIGNERS" value="3" description="Deterministic, public fixture keys"/>
   <Stat label="ATTACK SCENARIOS" value="15" description="Including revocation and replay"/>
   <Stat label="KNOWN BLIND SPOTS" value="2" description="Re-signed forgery and suffix rewrite"/>
   <Stat label="GRANTED ACTIONS" value="0" description="No identity or permission established"/>
  </div>
  <section className="surface sg-matrix">
   <div className="panel-header"><div><div className="eyebrow">01 / SIGNATURE QUALIFICATION</div><h2>Verify the signed witness boundary</h2></div><span className="panel-badge">PUBLIC DEMO PRIVATE KEYS · NOT TRUSTED IDENTITIES</span></div>
   <div className="sg-inner">
    <p>This is real Ed25519 signature verification, not a simulated checksum. It is still **only a crypto mechanics demonstration** because all signing seeds are available to anyone. Signed disagreement remains unresolved, and forged unanimous signatures made from public seeds can pass.</p>
    <div className="sg-actions">
     <button type="button" onClick={run} disabled={loading}>{loading?'VERIFYING SIGNATURES…':'RUN E24 SIGNATURE TESTS'}</button>
     <button type="button" onClick={()=>save(report)} disabled={!report||loading}>↓ EXPORT FULL RECEIPT</button>
    </div>
    {report&&<>
     <div className="sg-stats">
      <Stat label="VERIFIED DEMO AGREEMENTS" value={report.summary.valid_signature_agreements} description="Never authenticated principals"/>
      <Stat label="CRYPTOGRAPHIC FAILURES" value={report.summary.invalid_signatures} description="Modified or mismatched signatures"/>
      <Stat label="SPLIT VIEWS" value={report.summary.split_views} description="2-to-1 consensus refused"/>
      <Stat label="KEY/SEQUENCE RESTRICTIONS" value={report.summary.revoked+report.summary.stale_epochs+report.summary.replayed} description="In-memory policy exercises"/>
     </div>
     <div className="sg-layout">
      <div className="sg-case-list">{report.cases.map((c,i)=><button type="button" key={c.name} className={selected===i?'active':''} aria-pressed={selected===i} onClick={()=>setSelected(i)}>
       <span>{String(i+1).padStart(2,'0')}</span><b>{CASES[c.name]}</b><small>{form(c.verdict.status)}</small>
      </button>)}</div>
      {current&&<div className="sg-detail">
       <small>CRYPTOGRAPHIC TEST / {selected+1} OF 15</small>
       <h3>{CASES[current.name]}</h3>
       <div className={'sg-verdict '+(current.verdict.status==='SIGNED_AGREEMENT_DEMO_UNTRUSTED'?'matched':'refused')}>{form(current.verdict.status)}</div>
       <p>{form(current.verdict.reason)}</p>
       <div className="sg-lines">
        <span>Signatures verified <b>{current.verdict.signatures_verified} / 3</b></span>
        <span>Matching head claims <b>{current.verdict.all_heads_equal?'YES':'NO'}</b></span>
        <span>Ledger internally consistent <b>{current.ledger_self_consistent?'YES':'NO'}</b></span>
        <span>Keys secret <b>NO</b></span>
        <span>Independent identity verified <b>NO</b></span>
        <span>Authority granted <b>NONE</b></span>
       </div>
       {!!current.verdict.head_groups.length&&<div className="sg-heads">
        <small>SIGNED REFERENCE GROUPS</small>
        {current.verdict.head_groups.map(g=><div key={g.head}><span>{g.count} signatures · {g.signer_ids.join(', ')}</span><code>{g.head}</code></div>)}
       </div>}
       {(selected===12||selected===13)&&<div className="sg-alert"><b>EXPECTED CRYPTOGRAPHIC BLIND SPOT</b>
        <p>{selected===12?'All fixture private keys are public, so a forged history can be signed by all three alleged witnesses.':
         'Signing an old checkpoint does not protect events added or rewritten after its end.'}</p>
       </div>}
      </div>}
     </div>
    </>}
   </div>
  </section>
  <section className="surface sg-bounds">
   <div className="panel-header"><div><div className="eyebrow">02 / SECURITY REALITY</div><h2>Signature verification is only one layer</h2></div><span className="panel-badge">NO AUTHENTICATED TRUST ROOT</span></div>
   <div className="sg-bound-grid">
    <div><small>01 / KEY IDENTITY</small><h3>Who owns the key?</h3><p>A pinned public key only identifies a cryptographic key. Real custody and identity must be established separately.</p></div>
    <div><small>02 / INDEPENDENCE</small><h3>Who controlled each signer?</h3><p>Three signatures can still originate from one actor. Separate domains and custodians need their own evidence.</p></div>
    <div><small>03 / PERMISSION</small><h3>Who may act?</h3><p>No research evidence or valid signature grants a model, tool, or physical device the right to execute.</p></div>
   </div>
  </section>
  <div className="sg-caveat"><b>Real signatures. Public demonstration keys. No real authority.</b>
   <p>Nothing here connects to NBG, BrainC, SuperPhiVessel or a cryptographic identity provider. Epoch, revocation, and sequence controls use local verifier arguments, not durable production services. No physical or consciousness measurement is claimed.</p>
   <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E24_ED25519_DEMO_BOUNDARIES.md" target="_blank" rel="noreferrer">READ E24 CRYPTOGRAPHIC PROTOCOL ↗</a>
  </div>
  {notice&&<p className="sg-notice" role="status">{notice}</p>}
 </section>;
}
