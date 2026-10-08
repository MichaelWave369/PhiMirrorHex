import {useMemo,useState} from 'react';
import {driftReport,REGIMES} from './drift-model.mjs';
import './drift-lab.css';

const LABELS={nominal:'Nominal',noise_shift:'Noise shift ×3',recovered:'Recovery'};
const pct=n=>n===null?'N/A':(100*n).toFixed(1)+'%';
const num=n=>Number(n).toFixed(5);
function Metric({title,value,sub}) {
  return <div className="drift-metric"><small>{title}</small><strong>{value}</strong><span>{sub}</span></div>;
}
function Compare({label,first,second,total=48}){
  return <div className="drift-compare">
    <div><b>{label}</b><span>Frozen {first} · Candidate {second}</span></div>
    <div className="drift-track"><div style={{width:(first/total*100)+'%',background:'#88d6dc'}}/></div>
    <div className="drift-track"><div style={{width:(second/total*100)+'%',background:'#dcb58f'}}/></div>
  </div>;
}
export default function DriftLab(){
  const report=useMemo(()=>driftReport(),[]);
  const [budget,setBudget]=useState(3);
  const [readout,setReadout]=useState('identity_max');
  const [regime,setRegime]=useState('noise_shift');
  const [showFailures,setShowFailures]=useState(true);
  const [notice,setNotice]=useState('');
  const policy=report.policies.find(p=>p.budget===budget&&p.readout===readout);
  const row=policy.regimes.find(r=>r.regime===regime);
  const frozen=row.frozen_sealed, candidate=row.candidate_sealed;
  const all=showFailures?report.failure_ledger:
    report.policies.flatMap(p=>p.regimes.map(r=>({
      budget:p.budget,readout:p.readout,regime:r.regime,
      test_seed:r.sealed_test_seed,
      reason_flags:{monitor_missed_test_false_alarm_breach:false,
        candidate_false_alarm_breach:false,coverage_breach:false,
        shadow_signal_loss_vs_frozen:false,no_positive_detections:false}
    }))).slice(0,60);
  async function exportReport(){
    try{
      const payload={...report,view:{budget,readout,regime}};
      const raw=JSON.stringify(payload);
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
      const sum=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
      const blob=new Blob([JSON.stringify({...payload,browser_sha256:sum,
        checksum_note:'SHA-256 of JSON.stringify(payload) before checksum; unsigned'},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='phimirrorhex-e14-drift.json';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Synthetic E14 drift report exported.');
    }catch(e){setNotice('Export failed: '+e.message);}
  }
  return <section className="drift-page">
    <header className="drift-hero"><div>
      <div className="eyebrow">E14 / DRIFT SENTINEL · SHADOW CALIBRATION · REFUSAL</div>
      <h2>When the <em>noise changes.</em></h2>
      <p>E13 calibrated the Keyhole. Now we triple the observation noise, test whether the frozen monitor notices, and evaluate a separately recalibrated candidate without adopting it. Misses, false alarms and lost detections remain visible.</p>
      <div className="drift-tags"><span>14 FROZEN MASKS</span><span>3 NOISE REGIMES</span><span>9 SPLIT SEEDS</span><span>NO AUTO-DEPLOY</span></div>
    </div><div className="drift-hero-aside"><small>SHADOW PROPOSAL ≠ AUTHORITY</small>
      <strong>Observe.<br/>Refuse.<br/>Verify.</strong>
      <p>Even a green simulation gate cannot change a real detector.</p>
    </div></header>

    <div className="drift-stats">
      <Metric title="SEALED POLICY × REGIME CELLS" value={String(report.summary.evaluation_cells)} sub="14 frozen observers × 3 environments"/>
      <Metric title="DRIFT ALARMS" value={String(report.summary.monitor_flags)} sub="Monitor-only exceedances"/>
      <Metric title="RECORDED FAILURE CELLS" value={String(report.summary.failure_cells)} sub="All predefined failure rules"/>
      <Metric title="AUTHORIZED DEPLOYMENTS" value="0" sub="Permanent observation-only gate"/>
    </div>

    <section className="surface drift-configuration">
      <div className="panel-header"><div><div className="eyebrow">01 / FROZEN DETECTOR</div><h2>Choose an observer</h2></div><span className="panel-badge">E13 BASELINE IMMUTABLE</span></div>
      <div className="drift-controls">
        <div><label htmlFor="drift-budget">Sensor budget <b>{budget}/6</b></label>
          <input id="drift-budget" type="range" min="0" max="6" step="1" value={budget} onChange={e=>setBudget(Number(e.target.value))}/></div>
        <div><label htmlFor="drift-mode">Keyhole readout</label>
          <select id="drift-mode" value={readout} onChange={e=>setReadout(e.target.value)}>
            <option value="identity_max">Preserve sector identity</option>
            <option value="masked_sum">Sum selected sectors</option>
          </select></div>
        <div className="drift-mask"><small>FROZEN SIX-CHANNEL MASK</small><strong>{policy.mask.toString(2).padStart(6,'0')}</strong></div>
      </div>
    </section>

    <section className="drift-regimes" aria-label="Select an engineered noise regime">
      {REGIMES.map(([name,amplitude,monitorSeed,shadowSeed,testSeed])=><button key={name} type="button"
        className={regime===name?'active':''} aria-pressed={regime===name} onClick={()=>setRegime(name)}>
        <b>{LABELS[name]}</b><strong>{num(amplitude)}</strong>
        <small>Monitor {monitorSeed} · Shadow {shadowSeed} · Test {testSeed}</small>
      </button>)}
    </section>

    <div className="drift-grid">
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">02 / NULL-ONLY MONITOR</div><h2>Did drift trigger refusal?</h2></div><span className="panel-badge">{row.drift_flagged?'DRIFT ALARM':'NO DRIFT ALARM'}</span></div>
        <div className="drift-body">
          <Metric title="MONITOR FALSE-ALARM FRACTION" value={pct(row.monitor.null_false_alarm_rate)} sub={row.monitor.null_false_alarms+' false alarms / '+row.monitor.attempted+' attempted'}/>
          <div className={'drift-decision'+(row.drift_flagged?' alarm':'')}>
            <small>FROZEN MONITOR DECISION</small>
            <strong>{row.drift_flagged?'ABSTAIN · EVALUATE SHADOW':'KEEP FROZEN · MONITOR'}</strong>
            <p>Noise-only monitoring can request a shadow study, never quietly replace a threshold.</p>
          </div>
          <p className="drift-note">The monitor sees only labeled synthetic null pairs. It does not read the later sealed test cases.</p>
        </div>
      </section>
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">03 / SHADOW CANDIDATE</div><h2>Recalibrate without adopting</h2></div><span className="panel-badge">{row.shadow_calibration?'SEPARATE SHADOW SEED':'NO CHANGE PROPOSED'}</span></div>
        <div className="drift-body">
          <div className="drift-thresholds">
            <Metric title="UNCHANGED E13 FLOOR" value={num(row.frozen_floor)} sub="Remains the reference"/>
            <Metric title="SHADOW CANDIDATE FLOOR" value={num(row.candidate_floor)} sub="Not deployed or authorized"/>
          </div>
          {row.shadow_calibration
            ?<p className="drift-note">Independent null-only calibration observed {row.shadow_calibration.null_exceedances} exceedances out of {row.shadow_calibration.null_cases} cases. This does not guarantee performance on another seed.</p>
            :<p className="drift-note">The monitor did not flag drift. No candidate threshold was fitted, so the comparison retains E13's frozen floor.</p>}
          <div className="drift-integrity"><b>NO LIVE THRESHOLD MUTATION</b><span>All sealed evaluations remain read-only</span></div>
        </div>
      </section>
    </div>

    <section className="surface drift-sealed">
      <div className="panel-header"><div><div className="eyebrow">04 / SEALED TEST COMPARISON</div><h2>Two floors, the same unseen cases</h2></div><span className="panel-badge">TEST SEED {row.sealed_test_seed}</span></div>
      <div className="drift-sealed-inner">
        <div className="drift-sealed-scores">
          <Compare label="Null false alarms" first={frozen.null_false_alarms} second={candidate.null_false_alarms} total={48}/>
          <Compare label="Constructed signal hits" first={frozen.signal_hits} second={candidate.signal_hits} total={48}/>
          <Compare label="Abstentions" first={frozen.abstained} second={candidate.abstained} total={48}/>
          <div className="drift-legend"><span><i style={{background:'#88d6dc'}}/> Frozen E13</span><span><i style={{background:'#dcb58f'}}/> Shadow candidate</span></div>
        </div>
        <div className="drift-sealed-summary">
          <Metric title="FROZEN FALSE-ALARM FRACTION" value={pct(frozen.null_false_alarm_rate)} sub="Test nulls, not monitor nulls"/>
          <Metric title="CANDIDATE FALSE-ALARM FRACTION" value={pct(candidate.null_false_alarm_rate)} sub="Sealed test only"/>
          <Metric title="CANDIDATE COVERAGE" value={pct(candidate.coverage)} sub={candidate.attempted+' of 48 attempted'}/>
          <Metric title="TOY-ONLY GATE" value={row.toy_gate==='PASS_IN_TOY'?'PASS IN TOY':'FAIL IN TOY'} sub="No deployment authority"/>
        </div>
      </div>
    </section>

    <section className="surface drift-failures">
      <div className="panel-header"><div><div className="eyebrow">05 / FAILURE & REFUSAL LEDGER</div><h2>Every inconvenient result stays</h2></div><span className="panel-badge">{report.summary.failure_cells} FAILURE CELLS</span></div>
      <div className="drift-failure-inner">
        <label><input type="checkbox" checked={showFailures} onChange={e=>setShowFailures(e.target.checked)}/> Only show failures against the frozen protocol</label>
        <div className="drift-failure-list">{all.length===0?<p>No failures under these synthetic seeds and thresholds. This does not prove future reliability.</p>:
          all.map((r,i)=><button key={[r.budget,r.readout,r.regime,i].join(':')} type="button"
            onClick={()=>{setBudget(r.budget);setReadout(r.readout);setRegime(r.regime);}}>
            <span><strong>{r.budget}/6</strong><small>SENSORS</small></span>
            <span><strong>{r.readout==='identity_max'?'IDENTITY':'SUM'}</strong><small>READOUT</small></span>
            <span><strong>{LABELS[r.regime]}</strong><small>REGIME</small></span>
            <span><strong>{r.test_seed}</strong><small>TEST SEED</small></span>
            <span><strong>{Object.entries(r.reason_flags).filter(([k,v])=>v).map(([k])=>k.replaceAll('_',' ')).join(', ')||'none'}</strong><small>FAILURE REASONS</small></span>
          </button>)}
        </div>
        {!showFailures&&<p className="drift-note">Preview includes up to 60 cells. Export includes the full failure ledger.</p>}
      </div>
    </section>

    <div className="drift-claim"><div><b>Safe recalibration means tested without authority, not automatically promoted.</b>
      <p>These are programmed noise regimes, labeled synthetic null pairs and deterministic sensor failures. A toy gate isn't physical calibration, an unsupervised detector, a clinical measurement, a consciousness claim, or permission for an agent to change hardware or software.</p>
      <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E14_DRIFT_SHADOW.md" target="_blank" rel="noreferrer">READ FROZEN E14 METHOD ↗</a>
    </div><button className="ghost-button" type="button" onClick={exportReport}>↓ EXPORT FULL DRIFT LEDGER</button></div>
    {notice&&<p className="drift-notice" role="status">{notice}</p>}
  </section>;
}
