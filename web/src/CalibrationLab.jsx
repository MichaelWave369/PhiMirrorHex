import {useMemo,useState} from 'react';
import {calibrationReport,TEST_SEEDS,SCENARIOS,ARMS} from './calibration-model.mjs';
import './calibration-lab.css';

const NAMES={robust:'E12 robust',e10:'E10 frozen',first_k:'Fixed first-k'};
const SCENARIO_NAMES={matched_probe:'Known probe',shifted_probe:'Shifted probe',no_coupling:'No coupling · null only'};
const COLORS={robust:'#80dfdc',e10:'#b8a7e9',first_k:'#e1b67f'};
const fmt=v=>v===null?'N/A':Number(v).toFixed(4);
const pct=n=>(n*100).toFixed(1)+'%';
function Stat({name,value,sub}){return <div className="cal-stat"><small>{name}</small><strong>{value}</strong><span>{sub}</span></div>;}
function Score({name,value,total,color}){
  return <div className="cal-bar">
    <div><span>{name}</span><strong>{value}/{total}</strong></div>
    <div className="cal-track"><div style={{width:total?pct(value/total):'0%',background:color}}/></div>
  </div>;
}
export default function CalibrationLab(){
  const report=useMemo(()=>calibrationReport(),[]);
  const [budget,setBudget]=useState(3);
  const [readout,setReadout]=useState('identity_max');
  const [scenario,setScenario]=useState('matched_probe');
  const [seed,setSeed]=useState(TEST_SEEDS[0]);
  const [arm,setArm]=useState('robust');
  const [failuresOnly,setFailuresOnly]=useState(true);
  const [notice,setNotice]=useState('');
  const policy=report.policies.find(p=>p.budget===budget&&p.readout===readout);
  const trial=policy.trials.find(t=>t.seed===seed&&t.scenario===scenario);
  const score=trial.arms[arm];
  const cal=policy.calibration[arm];
  const failures=failuresOnly?report.failure_ledger:report.policies.flatMap(p=>
    p.trials.map(t=>({
      seed:t.seed,budget:p.budget,readout:p.readout,scenario:t.scenario,
      false_alarm_limit_exceeded:t.arms.robust.null_false_alarm_rate!==null&&t.arms.robust.null_false_alarm_rate>.10,
      fewer_detections_than_baseline:t.scenario!=='no_coupling'&&t.arms.robust.signal_detected<
        Math.max(t.arms.e10.signal_detected,t.arms.first_k.signal_detected),
      robust_false_alarm_rate:t.arms.robust.null_false_alarm_rate,
      robust_signal_detected:t.arms.robust.signal_detected
    }))
  ).slice(0,80);
  const confirmedFault=score.example_receipts.filter(r=>r.status==='ABSTAIN');
  async function exportReceipt(){
    try{
      const receipt={schema:'phimirrorhex.e13.browser-calibration.v1',
        report_schema:report.schema,epistemic_origin:'SIMULATED',action_authorized:false,
        selection:{budget,readout,scenario,seed,arm},
        calibration:policy.calibration,selected_trial:trial,protocol:report.protocol,
        summary:report.summary,full_failure_ledger:report.failure_ledger};
      const raw=JSON.stringify(receipt);
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
      const checksum=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
      const url=URL.createObjectURL(new Blob([JSON.stringify({...receipt,
        sha256:checksum,hash_note:'SHA256 of original JSON.stringify(receipt), unsigned'},null,2)],
        {type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='phimirrorhex-e13-calibration.json';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Synthetic calibration and full failure ledger exported.');
    }catch(error){setNotice('Export unavailable: '+error.message);}
  }
  return <section className="cal-page">
    <header className="cal-hero">
      <div><div className="eyebrow">E13 / CALIBRATED OBSERVABILITY · REFUSAL EVIDENCE</div>
        <h2>When should a <em>Keyhole</em> refuse?</h2>
        <p>Separate a constructed signal from nuisance noise. Freeze thresholds on null-only calibration data, then hold the same E12 masks through five new test populations. Mark unavailable sensors, abstain explicitly, and count the missed signals alongside the false alarms.</p>
        <div className="cal-chips"><span>48 NULL CALIBRATION PAIRS</span><span>5 SEALED TEST SEEDS</span><span>3 FROZEN MASKS</span><span>3 OUTCOMES</span></div>
      </div>
      <div className="cal-hero-aside"><small>DECISION STATES</small>
        <strong>DETECT<br/>NO DETECT<br/><em>ABSTAIN</em></strong>
        <p>Refusal is neither a detection nor a successful rejection.</p>
      </div>
    </header>

    <div className="cal-stats">
      <Stat name="FROZEN POLICIES" value={String(report.summary.policies)} sub="Seven budgets × two readouts"/>
      <Stat name="SEALED TEST CELLS" value={String(report.summary.scored_cells)} sub="All synthetic comparisons disclosed"/>
      <Stat name="TOY-GATE PASSES" value={report.summary.toy_gate_passes+'/14'} sub="No real-world authority"/>
      <Stat name="RECORDED FAILURE CELLS" value={String(report.summary.failure_cells)} sub="False alarms and relative detection losses"/>
    </div>

    <section className="surface cal-control-panel">
      <div className="panel-header"><div><div className="eyebrow">01 / INSPECT A FROZEN OBSERVER</div><h2>Lock the Keyhole</h2></div><span className="panel-badge">CALIBRATION SEED 1401</span></div>
      <div className="cal-controls">
        <div><label htmlFor="cal-budget">Sensor budget <b>{budget} / 6</b></label>
          <input id="cal-budget" type="range" min="0" max="6" step="1" value={budget} onChange={e=>setBudget(Number(e.target.value))}/></div>
        <div><label htmlFor="cal-readout">Measurement mode</label>
          <select id="cal-readout" value={readout} onChange={e=>setReadout(e.target.value)}>
            <option value="identity_max">Identity-preserving maximum gap</option>
            <option value="masked_sum">Sum-only Keyhole</option>
          </select></div>
        <div><label htmlFor="cal-mask">Frozen policy</label>
          <select id="cal-mask" value={arm} onChange={e=>setArm(e.target.value)}>
            {ARMS.map(name=><option key={name} value={name}>{NAMES[name]}</option>)}
          </select></div>
      </div>
      <div className="cal-mask-summary">
        <div><small>SELECTED SIX-SECTOR MASK</small><strong>{policy.frozen_masks[arm].toString(2).padStart(6,'0')}</strong></div>
        <div><small>NOISE-CALIBRATED FLOOR</small><strong>{fmt(cal.threshold)}</strong></div>
        <div><small>CALIBRATION NULL EXCEEDANCES</small><strong>{cal.calibration_null_detected}/48</strong></div>
        <div><small>POLICY TOY GATE</small><strong>{policy.toy_refusal_gate==='PASS_IN_TOY'?'PASS IN TOY':'FAIL IN TOY'}</strong></div>
      </div>
    </section>
    <div className="cal-main">
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">02 / PROSPECTIVE RUN</div><h2>Choose the test condition</h2></div><span className="panel-badge">NEVER RETUNE THE FLOOR</span></div>
        <div className="cal-body">
          <div className="cal-scenario-list">{SCENARIOS.map(s=><button type="button" key={s}
            className={scenario===s?'active':''} aria-pressed={scenario===s} onClick={()=>setScenario(s)}>
            <b>{SCENARIO_NAMES[s]}</b><small>{s==='no_coupling'?'NULL-ONLY CONTROL':'COUNTERPOSED SYNTHETIC PAIR'}</small>
          </button>)}</div>
          <div className="cal-seed-list">{TEST_SEEDS.map(s=><button key={s} type="button" aria-pressed={seed===s}
            className={seed===s?'active':''} onClick={()=>setSeed(s)}>SEED {s}</button>)}</div>
          <p>The same fixed sensor mask and calibration threshold are carried into each intervention and new seed. The no-coupling condition is evaluated only as a null, never mislabeled a missed positive signal.</p>
        </div>
      </section>
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">03 / NOISE VERSUS SIGNAL</div><h2>What did the sensor report?</h2></div><span className="panel-badge">{NAMES[arm]}</span></div>
        <div className="cal-body">
          <Score name="Null false alarms" value={score.null_false_alarms} total={score.attempted} color="#e4a282"/>
          <Score name="Correct null rejections" value={score.null_correct_rejections} total={score.attempted} color="#7edab6"/>
          {scenario!=='no_coupling'&&<>
            <Score name="Constructed signal detections" value={score.signal_detected} total={score.attempted} color={COLORS[arm]}/>
            <Score name="Signal misses" value={score.signal_missed} total={score.attempted} color="#c6a6e2"/>
          </>}
          <div className="cal-exposure"><div><small>TEST NULL FALSE-ALARM FRACTION</small><strong>{score.null_false_alarm_rate===null?'N/A':pct(score.null_false_alarm_rate)}</strong></div>
            <div><small>ATTEMPTED MEASUREMENTS</small><strong>{score.attempted}/48</strong></div></div>
          <p>Fractions use attempted cases only. Abstentions appear separately and are not silently rewarded as correct classifications.</p>
        </div>
      </section>
    </div>
    <section className="surface cal-refusal">
      <div className="panel-header"><div><div className="eyebrow">04 / REFUSAL RECORD</div><h2>When data is insufficient</h2></div><span className="panel-badge">FAULT EVERY EIGHTH CASE</span></div>
      <div className="cal-refusal-inner">
        <div className="cal-refusal-grid">
          <Stat name="EXPLICIT ABSTENTIONS" value={score.abstained+'/48'} sub="Selected channel marked unavailable"/>
          <Stat name="OBSERVATION COVERAGE" value={pct(score.coverage)} sub="Attempted / total, not accuracy"/>
          <Stat name="SIGNAL DETECTION AMONG ATTEMPTS" value={score.signal_detection_rate===null?'N/A':pct(score.signal_detection_rate)} sub="Conditional on not abstaining"/>
        </div>
        <div className="cal-receipts"><h3>Example measurements</h3>
          {score.example_receipts.map((r,i)=><div key={i} className={r.status==='ABSTAIN'?'cal-abstained':''}>
            <span>CASE {String(r.index).padStart(2,'0')}</span><strong>{r.status}</strong>
            <span>{r.status==='ABSTAIN'?'Unreliable selected sector S'+r.fault_sector:'Null gap '+fmt(r.null_gap)}</span>
          </div>)}
          {score.abstained>confirmedFault.length&&<p>Additional abstentions are counted in the total; only the first four case receipts are previewed.</p>}
        </div>
      </div>
    </section>
    <section className="surface cal-failures">
      <div className="panel-header"><div><div className="eyebrow">05 / COMPLETE FAILURE LEDGER</div><h2>Keep the inconvenient results</h2></div><span className="panel-badge">{report.summary.failure_cells} FAILURE CELLS</span></div>
      <div className="cal-failure-inner">
        <label><input type="checkbox" checked={failuresOnly} onChange={e=>setFailuresOnly(e.target.checked)}/> Show only false-alarm violations and detection losses</label>
        <div className="cal-failure-list">
          {failures.length===0?<p>No failures meeting the prespecified rule among these synthetic seeds. This does not prove reliability.</p>:
            failures.map((r,i)=><button type="button" key={[r.seed,r.budget,r.readout,r.scenario,i].join(':')}
              onClick={()=>{setSeed(r.seed);setBudget(r.budget);setReadout(r.readout);setScenario(r.scenario);setArm('robust');}}>
              <span><b>{r.seed}</b><small>SEED</small></span>
              <span><b>{r.budget} / 6</b><small>SENSORS</small></span>
              <span><b>{r.readout==='identity_max'?'IDENTITY':'SUM'}</b><small>READOUT</small></span>
              <span><b>{SCENARIO_NAMES[r.scenario]}</b><small>CONDITION</small></span>
              <span><b>{r.false_alarm_limit_exceeded?'FALSE ALARM':'RELATIVE LOSS'}</b><small>REASON</small></span>
            </button>)}
        </div>
        {!failuresOnly&&<p>Preview shows the first 80 evaluations. JSON export retains every flagged failure.</p>}
      </div>
    </section>
    <div className="cal-claim"><div><b>Calibrated synthetic evidence is not physical truth.</b>
      <p>A training-null quantile does not guarantee future false-alarm rates. Fault metadata is generated, not a discovered real sensor problem. Pass/fail results concern only these programmed populations, and no outcome provides authority for external actions, biological claims or consciousness measurements.</p>
      <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E13_CALIBRATION_REFUSAL.md" target="_blank" rel="noreferrer">READ E13 METHOD ↗</a></div>
      <button className="ghost-button" type="button" onClick={exportReceipt}>↓ EXPORT FULL E13 RECEIPT</button>
    </div>
    {notice&&<p className="cal-notice" role="status">{notice}</p>}
  </section>;
}
