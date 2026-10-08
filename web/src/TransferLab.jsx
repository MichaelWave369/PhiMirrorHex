import {useMemo,useState} from 'react';
import {transferReport,PROSPECTIVE_SEEDS,TRANSFER_CONDITIONS}
  from './transfer-model.mjs';
import {SCENARIOS} from './generalization-model.mjs';
import './transfer-lab.css';

const LABELS={matched_probe:'Known probe',shifted_probe:'Shifted probe',
  no_probe:'No probe',no_coupling:'No coupling'};
const MODES={identity_max:'Identity-preserving',masked_sum:'Summed Keyhole'};
const COLORS={robust:'#80e0e5',e10:'#d1b3ed',first_k:'#edbc86'};
const formatMask=x=>Number(x).toString(2).padStart(6,'0');
const percent=(n,d)=>((100*n)/d).toFixed(1)+'%';

function Statistic({name,value,note}){return <div className="transfer-stat"><span>{name}</span><strong>{value}</strong><small>{note}</small></div>;}
function ScoreBar({label,value,total,color}){
  return <div className="transfer-scorebar">
    <div><span>{label}</span><b>{value}/{total}</b></div>
    <div className="transfer-scorebar-track"><div style={{width:percent(value,total),background:color}}/></div>
  </div>;
}
function ChooseRow({label,value,onChange,values}) {
  return <div className="transfer-select">
    <label htmlFor={label}>{label}</label>
    <select id={label} value={value} onChange={e=>onChange(e.target.value)}>
      {values.map(([v,title])=><option key={v} value={v}>{title}</option>)}
    </select>
  </div>;
}
export default function TransferLab(){
  const report=useMemo(()=>transferReport(),[]);
  const [budget,setBudget]=useState(3);
  const [readout,setReadout]=useState('identity_max');
  const [scenario,setScenario]=useState('shifted_probe');
  const [seed,setSeed]=useState(1301);
  const [onlyFailures,setOnlyFailures]=useState(true);
  const [notice,setNotice]=useState('');
  const policy=report.policies.find(p=>p.budget===budget&&p.readout===readout);
  const run=policy.prospective_trials.find(t=>t.seed===seed&&t.scenario===scenario);
  const summary=policy.summary[scenario];
  const winners=report.summary.descriptive_gate_passes;
  const losses=report.failure_ledger;
  const visible=onlyFailures?losses:report.policies.flatMap(p=>p.prospective_trials.filter(t=>t.scenario===scenario).map(t=>({
    seed:t.seed,budget:p.budget,readout:p.readout,scenario:t.scenario,counts:t.counts,
    delta_vs_e10:t.delta_vs_e10,delta_vs_first_k:t.delta_vs_first_k
  }))).slice(0,70);
  async function exportSelected(){
    try{
      const data={schema:'phimirrorhex.e12.browser-policy-receipt.v1',
        report_schema:report.schema,epistemic_origin:'SIMULATED',action_authorized:false,
        selection:{budget,readout,scenario,seed},protocol:report.protocol,
        policy,trial:run,summary:report.summary,full_failure_ledger:report.failure_ledger};
      const raw=JSON.stringify(data);
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))),
        b=>b.toString(16).padStart(2,'0')).join('');
      const blob=new Blob([JSON.stringify({...data,sha256:hash,
        digest_note:'SHA-256 of JSON.stringify(data) prior to digest fields; integrity only'},null,2)+'\n'],
        {type:'application/json'});
      const uri=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=uri;link.download='phimirrorhex-e12-transfer-ledger.json';
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(uri),1000);
      setNotice('Synthetic E12 result and complete failure ledger exported.');
    }catch(e){setNotice('Export unavailable: '+e.message);}
  }
  return <section className="transfer-page">
    <header className="transfer-hero">
      <div><div className="eyebrow">E12 / SENSOR ECONOMY · PROSPECTIVE TRANSFER GATE</div>
        <h2>Can one <em>Keyhole</em> survive change?</h2>
        <p>Pick a six-sector sensor mask on separate development populations. Optimize for the weaker of two probe conditions. Freeze it, then score five untouched synthetic test populations against the old E10 choice and the simplest first-k baseline.</p>
        <div className="transfer-chips"><span>3 DEVELOPMENT SEEDS</span><span>1 VALIDATION SEED</span><span>5 SEALED TEST SEEDS</span><span>NO RESELECTION</span></div>
      </div><div className="transfer-hero-aside"><small>THE GOVERNANCE RULE</small>
        <strong>Strong in development.<br/>Prove it on transfer.</strong>
        <p>Not all green metrics should become permission to act.</p></div>
    </header>

    <div className="transfer-stats">
      <Statistic name="SEALED TEST PAIRS" value="240" note="Five populations × 48 A/B pairs"/>
      <Statistic name="POLICY / SCENARIO CELLS" value="280" note="Four interventions × fourteen policies × five seeds"/>
      <Statistic name="TOY-GATE PASSES" value={winners+'/14'} note="Never grants real-world authority"/>
      <Statistic name="LOSING CELLS" value={String(report.summary.failure_cells)} note="Every loss remains in the ledger"/>
    </div>

    <section className="surface transfer-controls">
      <div className="panel-header"><div><div className="eyebrow">01 / FROZEN SENSOR POLICY</div><h2>Choose a measurement strategy</h2></div><span className="panel-badge">DEVELOPMENT ONLY</span></div>
      <div className="transfer-control-grid">
        <div><label htmlFor="transfer-budget">Measurement budget <b>{budget}/6</b></label>
          <input id="transfer-budget" type="range" min="0" max="6" step="1" value={budget}
            onChange={e=>setBudget(Number(e.target.value))}/>
          <p>Each budget searches every eligible mask; no test case is used for selection.</p></div>
        <ChooseRow label="Observer type" value={readout} onChange={setReadout}
          values={Object.entries(MODES)}/>
        <ChooseRow label="Intervention" value={scenario} onChange={setScenario}
          values={Object.entries(LABELS)}/>
      </div>
      <div className="transfer-mask-strip">
        {Object.entries(policy.masks).map(([name,mask])=><div key={name}>
          <small>{name==='robust'?'NEW ROBUST MASK':name==='e10'?'E10 TRAINED MASK':'FIXED FIRST-K MASK'}</small>
          <strong>{formatMask(mask)}</strong>
          <span>{mask.toString()} · {budget} sensors</span>
        </div>)}
      </div>
    </section>

    <div className="transfer-main">
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">02 / LOCKED TEST POPULATIONS</div><h2>Every seed counts</h2></div><span className="panel-badge">5 PROSPECTIVE TESTS</span></div>
        <div className="transfer-body">
          <div className="transfer-seed-list">
            {PROSPECTIVE_SEEDS.map(s=>{
              const score=policy.prospective_trials.find(t=>t.seed===s&&t.scenario===scenario);
              return <button type="button" key={s} onClick={()=>setSeed(s)} aria-pressed={seed===s} className={s===seed?'chosen':''}>
                <b>SEED {s}</b><span>{score.counts.robust}/48</span>
                <small>{score.lost_to_any_baseline?'LOSS VS BASELINE': 'NO LOSS VS BASELINES'}</small>
              </button>;
            })}
          </div>
          <p>The selected mask is not updated between seeds. Results use the same 48 paired synthetic states as both baselines within each seed.</p>
        </div>
      </section>
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">03 / HELD-OUT DETECTION</div><h2>Three same-budget observers</h2></div><span className="panel-badge">SEED {seed}</span></div>
        <div className="transfer-body">
          <ScoreBar label="New maximin-selected mask" value={run.counts.robust} total={48} color={COLORS.robust}/>
          <ScoreBar label="Earlier E10 mask" value={run.counts.e10} total={48} color={COLORS.e10}/>
          <ScoreBar label="Fixed first-k mask" value={run.counts.first_k} total={48} color={COLORS.first_k}/>
          <div className="transfer-pair-detail">
            <div><small>SPARSE FAMILY · 24 CASES</small><strong>{run.sparse_counts.robust}/24</strong></div>
            <div><small>DENSE FAMILY · 24 CASES</small><strong>{run.dense_counts.robust}/24</strong></div>
          </div>
          <p>Counts show whether the two constructed counterposed states are distinguishable at the frozen detection floor of 0.01. They are not prediction probabilities.</p>
        </div>
      </section>
    </div>

    <section className="surface transfer-gate">
      <div className="panel-header"><div><div className="eyebrow">04 / PREDECLARED TRANSFER CHECK</div><h2>Results that include the worst seed</h2></div><span className="panel-badge">DESCRIPTIVE, NEVER AUTHORIZING</span></div>
      <div className="transfer-gate-inner">
        <div className="transfer-gate-grid">
          <Statistic name="MEAN HELD-OUT DETECTION" value={percent(summary.mean_robust_rate*48,48)} note="Across the five selected seeds"/>
          <Statistic name="WORST MARGIN VS E10" value={(summary.worst_margin_vs_e10>0?'+':'')+summary.worst_margin_vs_e10} note="Detection counts, not a confidence bound"/>
          <Statistic name="WORST MARGIN VS FIRST-K" value={(summary.worst_margin_vs_first_k>0?'+':'')+summary.worst_margin_vs_first_k} note="A negative margin is a recorded loss"/>
          <Statistic name="LOSING SEEDS" value={summary.losses_to_any_baseline+'/5'} note="This intervention and sensor budget"/>
        </div>
        <div className={'transfer-gate-result'+(policy.descriptive_transfer_gate==='PASS_IN_THIS_TOY'?' passed':' failed')}>
          <div><small>FROZEN TWO-PROBE TOY GATE</small><strong>{policy.descriptive_transfer_gate==='PASS_IN_THIS_TOY'?'PASS IN TOY':'FAIL IN TOY'}</strong></div>
          <p>Pass requires no losses against either baseline on <b>every one of five sealed seeds under BOTH matched and shifted probes</b>. A pass remains a synthetic observation, not permission to operate in the real world.</p>
        </div>
      </div>
    </section>

    <section className="surface transfer-failures">
      <div className="panel-header"><div><div className="eyebrow">05 / FAILURE EVIDENCE</div><h2>Do not erase the losses</h2></div><span className="panel-badge">{report.summary.failure_cells} FAILING CELLS</span></div>
      <div className="transfer-failure-inner">
        <label><input type="checkbox" checked={onlyFailures} onChange={e=>setOnlyFailures(e.target.checked)}/> Show only losses against either frozen baseline</label>
        <div className="transfer-failure-list">
          {visible.length===0?<p>No losses occurred in these fixed synthetic seeds. This does not establish general robustness.</p>:
            visible.map((r,i)=><button type="button" key={[r.seed,r.budget,r.readout,r.scenario,i].join(':')}
              onClick={()=>{setSeed(r.seed);setBudget(r.budget);setReadout(r.readout);setScenario(r.scenario);}}>
              <span><b>{r.seed}</b><small>SEED</small></span>
              <span><b>{r.budget}/6</b><small>SENSORS</small></span>
              <span><b>{MODES[r.readout]}</b><small>READOUT</small></span>
              <span><b>{LABELS[r.scenario]}</b><small>INTERVENTION</small></span>
              <span><b>{r.counts.robust} / {r.counts.e10} / {r.counts.first_k}</b><small>ROBUST / E10 / FIXED</small></span>
              <span className={r.delta_vs_e10<0||r.delta_vs_first_k<0?'transfer-loss':''}>
                <b>{r.delta_vs_e10>=0?'+':''}{r.delta_vs_e10}</b><small>VS E10</small>
              </span>
            </button>)}
        </div>
        {!onlyFailures&&<p className="transfer-fine">The preview is capped at 70 rows. Export includes every losing cell with no omissions.</p>}
      </div>
    </section>

    <div className="transfer-claim"><div>
      <b>A passed toy gate is not a verified causal capability.</b>
      <p>All sources, interventions, masks and scores here are generated within fixed six-sector mathematical machinery. Prospective seeds are isolated from selection, but they are not independently observed populations. No universal Φ advantage, human consciousness measurement, physical effect, sensor integration or agent action authorization is established.</p>
      <a target="_blank" rel="noreferrer" href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E12_SENSOR_TRANSFER_GATE.md">READ E12 FROZEN PROTOCOL ↗</a>
    </div><button className="ghost-button" type="button" onClick={exportSelected}>↓ EXPORT COMPLETE E12 RECEIPT</button></div>
    {notice&&<p role="status" className="transfer-notice">{notice}</p>}
  </section>;
}
