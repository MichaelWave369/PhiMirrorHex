import {useMemo,useState} from 'react';
import {replicationReport,REPLICATION_SEEDS,FAMILIES} from './replication-model.mjs';
import {SCENARIOS} from './generalization-model.mjs';
import './replication-lab.css';

const SCENE_LABEL={
  matched_probe:'Known probe',
  shifted_probe:'Shifted probe',
  no_probe:'No probe',
  no_coupling:'No coupling'
};
const READOUT_LABEL={identity_max:'Keep identities',masked_sum:'Sum channels'};
const pct=x=>(100*x).toFixed(1)+'%';
const pad=n=>String(n).padStart(2,'0');
function Metric({title,value,detail}){
  return <div className="rep-metric"><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>;
}
function Bars({selected,fixed,total,highlight=false}){
  return <div className={'rep-bars'+(highlight?' is-loser':'')}>
    <div className="rep-bar-label"><span>Frozen observer</span><b>{selected}/{total}</b></div>
    <div className="rep-bar-track"><div style={{width:pct(selected/total)}}/></div>
    <div className="rep-bar-label"><span>Fixed first-k</span><b>{fixed}/{total}</b></div>
    <div className="rep-bar-track baseline"><div style={{width:pct(fixed/total)}}/></div>
  </div>;
}
function SeedTable({series,activeSeed,onSelect}){
  return <div className="rep-seed-list">
    {series.map((row,index)=><button type="button" key={row.seed}
      className={'rep-seed'+(row.seed===activeSeed?' current':'')}
      aria-pressed={row.seed===activeSeed} onClick={()=>onSelect(row.seed)}>
      <span className="rep-seed-number">{pad(index+1)}</span>
      <span className="rep-seed-title"><b>SEED {row.seed}</b><small>{row.delta_count<0?'Below fixed baseline':row.delta_count>0?'Above fixed baseline':'Tied with baseline'}</small></span>
      <span className="rep-seed-score">{row.selected_detected}/{row.cases}</span>
      <span className={'rep-seed-delta'+(row.delta_count<0?' bad':row.delta_count>0?' good':'')}>
        {row.delta_count>0?'+':''}{row.delta_count}
      </span>
    </button>)}
  </div>;
}
export default function ReplicationLab(){
  const report=useMemo(()=>replicationReport(),[]);
  const [budget,setBudget]=useState(3);
  const [readout,setReadout]=useState('identity_max');
  const [scenario,setScenario]=useState('shifted_probe');
  const [seed,setSeed]=useState(REPLICATION_SEEDS[0]);
  const [failuresOnly,setFailuresOnly]=useState(true);
  const [notice,setNotice]=useState('');
  const aggregate=report.aggregate.find(r=>r.budget===budget&&r.readout===readout&&r.scenario===scenario);
  const series=report.replicates.map(rep=>({
    seed:rep.seed,...rep.scores.find(r=>r.budget===budget&&r.readout===readout&&r.scenario===scenario)
  }));
  const current=series.find(r=>r.seed===seed);
  const failureRows=(failuresOnly?report.failure_ledger:report.replicates.flatMap(rep=>
    rep.scores.filter(x=>x.budget>0).map(x=>({
      seed:rep.seed,budget:x.budget,readout:x.readout,scenario:x.scenario,
      selected_detected:x.selected_detected,fixed_detected:x.fixed_detected,
      shortfall:Math.max(0,-x.delta_count)
    }))
  )).slice(0,65);
  const stratum=FAMILIES.map(f=>({
    family:f,
    selected:current.strata[f].selected_detected,
    fixed:current.strata[f].fixed_detected,
    cases:current.strata[f].cases
  }));
  const failureCount=report.summary.failure_cells;

  async function save(){
    try{
      const payload={schema:'phimirrorhex.e11.browser-replication.v1',
        report_schema:report.schema,epistemic_origin:'SIMULATED',
        action_authorized:false,physical_measurement:false,
        protocol:report.protocol,summary:report.summary,
        selection:{budget,readout,scenario,seed},selected_aggregate:aggregate,
        selected_replication:current,full_failure_ledger:report.failure_ledger};
      const serialized=JSON.stringify(payload);
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serialized));
      const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      const blob=new Blob([JSON.stringify({...payload,sha256:hash,
        hash_note:'SHA-256 of JSON.stringify(payload) before digest fields; not authenticated'},null,2)+'\n'],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=url;link.download='phimirrorhex-e11-replication.json';
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Synthetic replication and complete failure ledger exported.');
    }catch(err){setNotice('Export unavailable: '+err.message);}
  }
  return <section className="rep-page">
    <header className="rep-hero">
      <div><div className="eyebrow">E11 / INDEPENDENT REPLICATION · FAILED CASES PRESERVED</div>
        <h2>Do the results <em>repeat?</em></h2>
        <p>Five new deterministic held-out seeds. The same E10 training-selected Keyhole masks. The same four interventions. No re-selection, and no quietly dropping an inconvenient run.</p>
        <div className="rep-chips"><span>05 SEEDS</span><span>240 HELD-OUT PAIRS</span><span>14 FROZEN POLICIES</span><span>56 COMPARISON CELLS</span></div>
      </div>
      <div className="rep-hero-panel"><span>THE EXPERIMENT RULE</span><strong>Hold the policy.<br/>Vary the cases.</strong><p>Selected on E10 training only. Tested repeatedly on new synthetic pairs.</p></div>
    </header>
    <div className="rep-metrics">
      <Metric title="REPLICATION SEEDS" value="05" detail="Independent deterministic input seeds"/>
      <Metric title="HELD-OUT PAIRS" value="240" detail="Half sparse, half dense per replicate"/>
      <Metric title="LOSING COMPARISON CELLS" value={String(failureCount)} detail="All runs included, no cherry-picked winners"/>
      <Metric title="COUPLING-OFF CONTROL" value={report.summary.every_coupling_off_cell_blind?'PASS':'FAIL'} detail="No outer signal without transport"/>
    </div>
    <section className="surface rep-controls">
      <div className="panel-header"><div><div className="eyebrow">01 / THE FROZEN PROTOCOL</div><h2>Explore the replication space</h2></div><span className="panel-badge">NO RETRAINING OR RESELECTION</span></div>
      <div className="rep-control-inner">
        <div className="rep-control">
          <label htmlFor="rep-budget">Sensor budget <b>{budget} / 6</b></label>
          <input id="rep-budget" type="range" min="0" max="6" step="1" value={budget}
            onChange={e=>setBudget(Number(e.target.value))}/>
          <p>Each budget retains its own independently train-selected E10 mask.</p>
        </div>
        <div className="rep-control">
          <label htmlFor="rep-readout">Observer type</label>
          <select id="rep-readout" value={readout} onChange={e=>setReadout(e.target.value)}>
            <option value="identity_max">Preserve signed channel identity</option>
            <option value="masked_sum">Collapse channels by summation</option>
          </select>
          <p>Both use the same sensor count, not necessarily equal processing cost.</p>
        </div>
        <div className="rep-control">
          <label htmlFor="rep-scenario">Intervention scenario</label>
          <select id="rep-scenario" value={scenario} onChange={e=>setScenario(e.target.value)}>
            {SCENARIOS.map(s=><option key={s} value={s}>{SCENE_LABEL[s]}</option>)}
          </select>
          <p>All four E10 interventions are evaluated with fixed masks.</p>
        </div>
      </div>
    </section>
    <div className="rep-grid">
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">02 / REPLICATION LEDGER</div><h2>Every independent seed</h2></div><span className="panel-badge">SELECT A RUN</span></div>
        <div className="rep-body">
          <div className="rep-summary-row"><span>TRAIN-SELECTED MASK</span><strong>{aggregate.frozen_mask.toString(2).padStart(6,'0')}</strong><span>SAME-BUDGET BASELINE</span><strong>{aggregate.reference_mask.toString(2).padStart(6,'0')}</strong></div>
          <SeedTable series={series} activeSeed={seed} onSelect={setSeed}/>
          <p className="rep-fine">Each fraction counts detections among 48 generated pairs. The signed difference on the right is frozen mask minus baseline detections.</p>
        </div>
      </section>
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">03 / SELECTED RUN DETAIL</div><h2>Where the differences land</h2></div><span className="panel-badge">SEED {seed}</span></div>
        <div className="rep-body">
          <div className="rep-detail-top"><div><span>FROZEN MASK</span><strong>{current.selected_detected}/48</strong><small>{pct(current.selected_rate)} detectable pairs</small></div>
            <div><span>FIXED BASELINE</span><strong>{current.fixed_detected}/48</strong><small>{pct(current.fixed_rate)} detectable pairs</small></div></div>
          {stratum.map(row=><div className="rep-stratum" key={row.family}>
            <h3>{row.family==='dense'?'Unseen dense patterns':'Previously seen sparse family'} <small>{row.cases} pairs</small></h3>
            <Bars selected={row.selected} fixed={row.fixed} total={row.cases}
              highlight={row.selected<row.fixed}/>
          </div>)}
          <p className="rep-fine">Dense means the generator uses a new balanced six-sector pattern, not a biological density measurement.</p>
        </div>
      </section>
    </div>
    <section className="surface rep-aggregate">
      <div className="panel-header"><div><div className="eyebrow">04 / WORST-CASE REPORT</div><h2>No comfortable averages without the extremes</h2></div><span className="panel-badge">FIVE FIXED REPLICATIONS</span></div>
      <div className="rep-aggregate-grid">
        <Metric title="FROZEN MASK MEAN" value={pct(aggregate.selected_mean_rate)} detail="Mean of all 240 synthetic pairs"/>
        <Metric title="FIXED BASELINE MEAN" value={pct(aggregate.fixed_mean_rate)} detail="Same budget and readout"/>
        <Metric title="OBSERVED RANGE" value={pct(aggregate.selected_min_rate)+' – '+pct(aggregate.selected_max_rate)} detail="Minimum to maximum across five seeds"/>
        <Metric title="WORST COUNT DIFFERENCE" value={(aggregate.worst_delta_count>0?'+':'')+aggregate.worst_delta_count} detail="Frozen mask minus baseline"/>
      </div>
      <div className="rep-tally"><span>WIN <b>{aggregate.wins}</b></span><span>TIE <b>{aggregate.ties}</b></span><span>LOSS <b>{aggregate.losses}</b></span></div>
      <p className="rep-fine rep-aggregate-note">These extremes are descriptive bounds across five intentionally chosen synthetic seeds, not statistical confidence intervals or real-world reliability guarantees.</p>
    </section>
    <section className="surface rep-failures">
      <div className="panel-header"><div><div className="eyebrow">05 / REFUSAL & FAILURE EVIDENCE</div><h2>Keep every losing run</h2></div><span className="panel-badge">FAILURES ARE PART OF THE RESULTS</span></div>
      <div className="rep-failure-content">
        <label><input type="checkbox" checked={failuresOnly} onChange={e=>setFailuresOnly(e.target.checked)}/> Only show runs where the chosen policy loses</label>
        <div className="rep-failure-list">
          {failureRows.length===0?<p>No failures meeting this comparison rule for the fixed replication seeds. This does not guarantee success on new data.</p>:
            failureRows.map((f,i)=><button type="button" key={[f.seed,f.budget,f.readout,f.scenario,i].join(':')}
              onClick={()=>{setSeed(f.seed);setBudget(f.budget);setReadout(f.readout);setScenario(f.scenario);}}>
              <span><b>{f.seed}</b><small>SEED</small></span>
              <span><b>{f.budget}/6</b><small>BUDGET</small></span>
              <span><b>{READOUT_LABEL[f.readout]}</b><small>READOUT</small></span>
              <span><b>{SCENE_LABEL[f.scenario]}</b><small>SCENARIO</small></span>
              <span><b>{f.selected_detected} vs {f.fixed_detected}</b><small>DETECTIONS</small></span>
              {f.shortfall>0?<span className="rep-loss"><b>−{f.shortfall}</b><small>SHORTFALL</small></span>:<span><b>0</b><small>SHORTFALL</small></span>}
            </button>)}
        </div>
        {!failuresOnly&&<p className="rep-fine">Preview limited to 65 cells. Export the full report to retain the complete failure ledger.</p>}
      </div>
    </section>
    <div className="rep-claim">
      <div><b>Replication inside a programmed toy is not replication in nature.</b>
        <p>E11 repeats E10's synthetic measurement procedure across five new fixed generator seeds. Reported mask differences are finite counts, not inferred probability, neural or consciousness measurements, or evidence of a golden-ratio advantage. Negative controls must pass; every losing observation remains in the ledger. CAPABILITY ≠ AUTHORITY.</p>
        <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E11_REPLICATION_FAILURE_LEDGER.md" rel="noreferrer" target="_blank">READ FROZEN E11 PROTOCOL ↗</a></div>
      <button className="ghost-button" onClick={save}>↓ EXPORT COMPLETE FAILURE LEDGER</button>
    </div>
    {notice&&<p className="rep-notice" role="status">{notice}</p>}
  </section>;
}
