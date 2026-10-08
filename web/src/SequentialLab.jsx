import {useMemo,useState} from 'react';
import {sequentialReport,TESTS,CHANGE_STEP,LENGTH} from './sequential-model.mjs';
import './sequential-lab.css';

const LABELS={stationary:'Stationary noise',step:'Sudden noise shift',
 ramp:'Gradual ramp',spike:'Brief spike'};
const DESCS={
 stationary:'A negative control: no programmed persistent change occurs anywhere in this stream.',
 step:'At frame 48 the noise amplitude jumps from 0.018 to 0.054 and stays high.',
 ramp:'At frame 48 noise begins increasing gradually, reaching 0.054 by frame 80.',
 spike:'Frames 48–50 have a threefold noise spike before conditions return to nominal. This is NOT a sustained event.'
};
const NAMES={identity_max:'Sector identity max',masked_sum:'Same-mask sum'};
const fixed=n=>Number(n).toFixed(4);
function Tile({label,value,detail}){return <div className="seq-tile"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;}
function Timeline({frames,limit,frame,onFrame,change}){
  const width=900,height=235,margin=14;
  const max=Math.max(.02,limit*1.25,...frames.map(f=>f.cusum));
  const x=i=>margin+(width-2*margin)*i/(LENGTH-1);
  const y=v=>height-28-(height-55)*(v/max);
  const line=frames.map((r,i)=>(i?'L':'M')+x(i).toFixed(3)+','+y(r.cusum).toFixed(3)).join(' ');
  const point=frames[frame];
  const marker=frames.find(f=>f.new_alert);
  return <div className="seq-timeline">
    <div className="seq-legend"><span><i className="seq-line-key"/> Running CUSUM</span><span><i className="seq-limit-key"/> Frozen alarm limit</span><span><i className="seq-abstain-key"/> Sensor abstention</span></div>
    <svg viewBox={'0 0 '+width+' '+height} role="img" aria-label="Sequential CUSUM score, frozen alarm threshold, change point and explicit abstentions" preserveAspectRatio="none">
      {[0,.25,.5,.75,1].map(p=><line key={p} x1={margin} x2={width-margin} y1={y(max*p)} y2={y(max*p)} stroke="#315064" strokeDasharray="4 8"/>)}
      <rect x={x(CHANGE_STEP)} y={y(max)} width={width-x(CHANGE_STEP)-margin} height={height-28-y(max)} fill={change?'#2d4d5340':'#75604720'}/>
      <line x1={margin} x2={width-margin} y1={y(limit)} y2={y(limit)} stroke="#e8b780" strokeDasharray="6 5" strokeWidth="1.5"/>
      <path d={line} fill="none" stroke="#7cdae4" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
      {frames.filter(f=>f.abstained).map(f=><circle key={f.step} cx={x(f.step)} cy={y(f.cusum)} r="3" fill="#c29be6"/>)}
      {marker&&<circle cx={x(marker.step)} cy={y(marker.cusum)} r="7" fill="#f3a58a" stroke="#f0e3d8" strokeWidth="2"/>}
      <line x1={x(frame)} x2={x(frame)} y1={y(max)} y2={height-28} stroke="#eef6f2" strokeDasharray="4 4"/>
      <circle cx={x(frame)} cy={y(point.cusum)} r="5" fill="#e9f7ef"/>
      <text x={margin+4} y="18" fill="#aac3cf" fontSize="12">{fixed(max)}</text>
      <text x={width-margin-8} y={Math.max(y(limit)-7,20)} fill="#f0cc9f" fontSize="12" textAnchor="end">LIMIT {fixed(limit)}</text>
    </svg>
    <div className="seq-axis"><span>t=0</span><span>t=48 {change?'· persistent change':'· no sustained change'}</span><span>t=95</span></div>
    <input type="range" min="0" max="95" step="1" value={frame} onChange={e=>onFrame(Number(e.target.value))}
      aria-label="Scrub the sealed synthetic stream timeline"/>
  </div>;
}
export default function SequentialLab(){
  const report=useMemo(()=>sequentialReport(),[]);
  const [budget,setBudget]=useState(3);
  const [readout,setReadout]=useState('identity_max');
  const [regime,setRegime]=useState('step');
  const [seedIndex,setSeedIndex]=useState(0);
  const [frame,setFrame]=useState(48);
  const [onlyFailures,setOnlyFailures]=useState(true);
  const [notice,setNotice]=useState('');
  const policy=report.policies.find(p=>p.budget===budget&&p.readout===readout);
  const matches=policy.trials.filter(t=>t.regime===regime);
  const selected=matches[seedIndex]||matches[0];
  const f=selected.frames[frame];
  const losses=onlyFailures?report.failure_ledger:report.policies.flatMap(p=>p.trials.map(t=>({
    budget:p.budget,readout:p.readout,regime:t.regime,seed:t.seed,
    first_alarm_step:t.first_alarm_step,detection_delay:t.detection_delay,abstained:t.abstained,
    reason_flags:{false_alert:t.false_alarm,missed_sustained_change:t.persistent_change_missed,
      coverage_below_floor:t.coverage<.75}
  }))).slice(0,70);
  function chooseRegime(next){setRegime(next);setSeedIndex(0);setFrame(48);}
  async function save(){
    try{
      const record={...report,viewer:{budget,readout,regime,seed:selected.seed,frame}};
      const data=JSON.stringify(record);
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data));
      const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
      const url=URL.createObjectURL(new Blob([JSON.stringify({...record,browser_sha256:hash,
        hash_note:'SHA256 of JSON.stringify(record) prior to browser fields, integrity only'},null,2)],
        {type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='phimirrorhex-e15-sequence.json';
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Synthetic E15 timeline and complete failure evidence exported.');
    }catch(err){setNotice('Export failed: '+err.message);}
  }
  return <section className="seq-page">
    <header className="seq-hero"><div>
      <div className="eyebrow">E15 / SEQUENTIAL EVIDENCE · FALSE ALARM BUDGETS · REFUSAL</div>
      <h2>When is the <em>change real?</em></h2>
      <p>Watch 96 synthetic sensor frames unfold. An alarm threshold is frozen on four normal-only development streams, then tested against unseen stable, sudden, gradual, and transient noise. Missed changes and premature warnings remain part of the evidence.</p>
      <div className="seq-hero-tags"><span>96 FRAMES EACH</span><span>4 DEVELOPMENT CONTROLS</span><span>8 SEALED STREAMS</span><span>ONE-SHOT WARNINGS</span></div>
    </div><div className="seq-hero-aside"><small>THE INVESTIGATION</small><strong>Alarm too early?<br/>It's a false alarm.<br/>Never alarm?<br/>It's a miss.</strong><p>Only sustained synthetic changes count as positive events.</p></div></header>

    <div className="seq-metrics">
      <Tile label="SEALED EVALUATIONS" value={String(report.summary.evaluation_cells)} detail="14 masks × 8 streams"/>
      <Tile label="FALSE ALARM CELLS" value={String(report.summary.false_alarm_cells)} detail="Including transient-spike alerts"/>
      <Tile label="MISSED CHANGE CELLS" value={String(report.summary.missed_persistent_cells)} detail="Step and ramp streams only"/>
      <Tile label="AUTHORIZED ACTIONS" value="0" detail="Observation-only simulated detector"/>
    </div>

    <section className="surface seq-controls">
      <div className="panel-header"><div><div className="eyebrow">01 / FROZEN KEYHOLE</div><h2>Choose the observer</h2></div><span className="panel-badge">E13 MASK + FLOOR LOCKED</span></div>
      <div className="seq-control-grid">
        <div><label htmlFor="seq-budget">Sensor budget <b>{budget}/6</b></label>
          <input id="seq-budget" type="range" min="0" max="6" step="1" value={budget}
            onChange={e=>setBudget(Number(e.target.value))}/>
        </div>
        <div><label htmlFor="seq-mode">Readout</label><select id="seq-mode" value={readout} onChange={e=>setReadout(e.target.value)}>
          <option value="identity_max">Preserve channel identity</option><option value="masked_sum">Sum selected channels</option>
        </select></div>
        <div className="seq-frozen"><small>FROZEN SENSOR MASK</small><strong>{policy.frozen_mask.toString(2).padStart(6,'0')}</strong></div>
      </div>
      <div className="seq-frozen-row"><span>E13 CALIBRATED FLOOR <b>{fixed(policy.frozen_e13_floor)}</b></span>
        <span>SEQUENCE ALARM LIMIT <b>{fixed(policy.sequential_alert_limit)}</b></span>
        <span>DEVELOPMENT ALARMS <b>0 OF 4 (BY CONSTRUCTION)</b></span>
        <span>TOY GATE <b>{policy.toy_gate==='PASS_IN_TOY'?'PASS IN TOY':'FAIL IN TOY'}</b></span></div>
    </section>

    <section className="seq-scenarios">
      {['stationary','step','ramp','spike'].map(name=><button type="button" key={name}
        aria-pressed={regime===name} onClick={()=>chooseRegime(name)} className={regime===name?'active':''}>
        <strong>{LABELS[name]}</strong>
        <small>{name==='stationary'?'NO CHANGE':name==='spike'?'TRANSIENT NEGATIVE CONTROL':'PERSISTENT CHANGE AT 48'}</small>
      </button>)}
    </section>
    <section className="surface seq-timeline-panel">
      <div className="panel-header"><div><div className="eyebrow">02 / REPLAY SEALED TIME SERIES</div><h2>{LABELS[regime]}</h2></div><span className="panel-badge">SEED {selected.seed}</span></div>
      <div className="seq-inside">
        <p>{DESCS[regime]}</p>
        <div className="seq-replicates">{matches.map((trial,i)=><button type="button" key={trial.seed} className={i===seedIndex?'active':''}
          onClick={()=>{setSeedIndex(i);setFrame(48);}}>SEALED SEED {trial.seed}</button>)}</div>
        <Timeline frames={selected.frames} limit={policy.sequential_alert_limit} frame={frame}
          onFrame={setFrame} change={selected.true_change_step!==null}/>
        <div className="seq-frame-info">
          <Tile label="SELECTED FRAME" value={'t = '+frame} detail={f.abstained?'Sensor unavailable: ABSTAIN':'Sensor channels available'}/>
          <Tile label="MEASUREMENT GAP" value={f.gap===null?'ABSTAIN':fixed(f.gap)} detail="Selected-mask noise-only difference"/>
          <Tile label="RUNNING CUSUM" value={fixed(f.cusum)} detail="Cumulative evidence, no test-based tuning"/>
          <Tile label="ALARM EVENT" value={f.new_alert?'TRIGGERED':'NONE HERE'} detail="First strict threshold crossing only"/>
        </div>
      </div>
    </section>
    <div className="seq-detail-grid">
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">03 / ALARM & DELAY</div><h2>What did we conclude?</h2></div></div>
        <div className="seq-panel-body">
          <div className={'seq-decision'+(selected.false_alarm?' bad':selected.persistent_change_detected?' good':'')}>
            <small>SEALED STREAM OUTCOME</small>
            <strong>{selected.false_alarm?'FALSE ALARM':
              selected.persistent_change_detected?'PERSISTENT CHANGE DETECTED':
              selected.persistent_change_missed?'PERSISTENT CHANGE MISSED':'NO ALARM'}</strong>
          </div>
          <div className="seq-paired">
            <Tile label="FIRST ALARM FRAME" value={selected.first_alarm_step===null?'NONE':String(selected.first_alarm_step)} detail="One-shot, no re-arming"/>
            <Tile label="DETECTION DELAY" value={selected.detection_delay===null?'N/A':selected.detection_delay+' frames'} detail="Only if first alarm is on/after 48"/>
          </div>
          <p>The evaluator knows the synthetic change point, but the monitoring algorithm sees only incoming selected-channel gaps.</p>
        </div>
      </section>
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">04 / REFUSAL COVERAGE</div><h2>Missing channels still count</h2></div></div>
        <div className="seq-panel-body">
          <div className="seq-paired">
            <Tile label="OBSERVED FRAMES" value={selected.observed+'/96'} detail="CUSUM can update only here"/>
            <Tile label="ABSTAINED FRAMES" value={selected.abstained+'/96'} detail="Declared channel fault, no update"/>
          </div>
          <p>Coverage: <b>{(100*selected.coverage).toFixed(1)}%</b>. Abstaining is neither a correct rejection nor a timely change detection. The alarm statistic stays fixed when a selected sensor is unavailable.</p>
          <div className="seq-refusal-key">CAPABILITY ≠ AUTHORITY · SIMULATED ≠ OBSERVED</div>
        </div>
      </section>
    </div>

    <section className="surface seq-failure-panel">
      <div className="panel-header"><div><div className="eyebrow">05 / FAILURE LEDGER</div><h2>Keep the failures</h2></div><span className="panel-badge">{report.summary.failure_cells} FLAGGED CELLS</span></div>
      <div className="seq-failure-body">
        <label><input type="checkbox" checked={onlyFailures} onChange={e=>setOnlyFailures(e.target.checked)}/> Only show false alarms, missed persistent changes and coverage failures</label>
        <div className="seq-failure-list">{losses.length===0?<p>No failures under these fixed synthetic cases. This is not a future reliability guarantee.</p>:
          losses.map((r,i)=><button type="button" key={[r.budget,r.readout,r.seed,i].join(':')}
            onClick={()=>{setBudget(r.budget);setReadout(r.readout);setRegime(r.regime);setSeedIndex(TESTS.filter(x=>x[0]===r.regime).findIndex(x=>x[1]===r.seed));setFrame(r.first_alarm_step??48);}}>
            <span><b>{r.seed}</b><small>SEALED SEED</small></span>
            <span><b>{r.budget}/6</b><small>SENSORS</small></span>
            <span><b>{NAMES[r.readout]}</b><small>READOUT</small></span>
            <span><b>{LABELS[r.regime]}</b><small>REGIME</small></span>
            <span><b>{Object.entries(r.reason_flags).filter(([name,value])=>value).map(([name])=>name.replaceAll('_',' ')).join(', ')||'none'}</b><small>FAILURE REASON</small></span>
          </button>)}
        </div>
        {!onlyFailures&&<p className="seq-fine">Preview limited to 70 cells. Export contains every flagged failure and full frame traces.</p>}
      </div>
    </section>

    <div className="seq-claim"><div><b>Sequential toy evidence does not imply real-time physical detection.</b>
      <p>The null pairs, fault metadata and change points are programmed. A zero-alarm result on development controls is guaranteed by threshold selection on those controls alone, not a statistical bound. Any green toy gate grants zero device, model, network or biological authority.</p>
      <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E15_SEQUENTIAL_CHANGE.md" target="_blank" rel="noreferrer">READ FROZEN E15 PROTOCOL ↗</a></div>
      <button className="ghost-button" type="button" onClick={save}>↓ EXPORT COMPLETE TIMELINE LEDGER</button>
    </div>
    {notice&&<p className="seq-notice" role="status">{notice}</p>}
  </section>;
}
