import {useMemo,useState} from 'react';
import {frontierReport,gaps,selectedSectors,THRESHOLDS,CONDITIONS} from './frontier-model.mjs';
import {buildGearReport} from './gears-model.mjs';
import './frontier-lab.css';

const NAMES={
  coupled_probe:'Coupled · Probe',
  no_probe:'Coupled · No Probe',
  no_coupling:'No Coupling',
  no_conveyor:'Conveyor Disabled'
};
const DESCS={
  coupled_probe:'Delayed transport and a fixed outer interface reveal the structure.',
  no_probe:'A hidden sector pattern can arrive, but no programmed global-sum reveal occurs.',
  no_coupling:'No signal passes between inner and outer gears.',
  no_conveyor:'The delayed transport memory is disabled, so the outer ring never receives the inner state.'
};
const fmt=x=>Number(x).toFixed(5),pct=x=>(100*x).toFixed(0)+'%';
const SECTORS=Array.from({length:6},(_,i)=>i);
const COLORS={a:'#70dbe6',b:'#e8b783'};
const seq=Array.from({length:24},(_,i)=>i);

function Metric({name,value,note,kind=''}) {
  return <div className={'frontier-metric '+kind}><span>{name}</span><strong>{value}</strong><small>{note}</small></div>;
}
function SensorHex({selected,frame,onSelect}) {
  const cx=185,cy=185,r=125;
  const point=i=>{
    const theta=-Math.PI/2+2*Math.PI*i/6;
    return [cx+r*Math.cos(theta),cy+r*Math.sin(theta)];
  };
  const points=SECTORS.map(i=>point(i).join(',')).join(' ');
  return <div className="frontier-hex">
    <svg viewBox="0 0 370 370" role="img" aria-label="Six-sector boundary measurement diagram">
      <circle cx={cx} cy={cy} r="160" fill="none" stroke="#294b60" strokeDasharray="4 9"/>
      <polygon points={points} fill="#163448" fillOpacity=".36" stroke="#639eb8" strokeWidth="1.2"/>
      {SECTORS.map(i=>{
        const [x,y]=point(i);
        const enabled=selected.includes(i);
        const diff=Math.abs(frame.state_a[5][i]-frame.state_b[5][i]);
        return <g key={i}>
          <line x1={cx} y1={cy} x2={x} y2={y} stroke="#3a657d" strokeWidth=".8"/>
          <circle cx={x} cy={y} r={enabled?18:14} fill={enabled?'#295c70':'#112a3a'}
            stroke={enabled?'#83e6e8':'#476679'} strokeWidth={enabled?2:1}/>
          <text x={x} y={y+4} fill={enabled?'#f4fbf7':'#93aabc'} fontSize="12" fontWeight="750" textAnchor="middle">{i}</text>
          {enabled&&diff>0&&<circle cx={x+12} cy={y-12} r={Math.min(6,3+diff*14)} fill="#efb683"/>}
        </g>;
      })}
      <circle cx={cx} cy={cy} r="35" fill="#0d2230" stroke="#547d8d"/>
      <text x={cx} y={cy-6} fill="#d5e6e9" fontSize="10" textAnchor="middle">KEYHOLE</text>
      <text x={cx} y={cy+14} fill="#7ad6e5" fontSize="16" fontWeight="750" textAnchor="middle">{selected.length}/6</text>
      <text x={cx} y="23" fill="#92afbd" fontSize="10" textAnchor="middle" letterSpacing="2">OUTER GEAR · SIX IDENTITIES</text>
      <text x={cx} y="360" fill="#829eb0" fontSize="10" textAnchor="middle">SYNTHETIC COORDINATES</text>
    </svg>
    <div className="frontier-sensor-buttons" role="group" aria-label="Choose sensor identities">
      {SECTORS.map(i=><button type="button" key={i} aria-pressed={selected.includes(i)}
        className={selected.includes(i)?'enabled':''} onClick={()=>onSelect(i)}>S{i}</button>)}
    </div>
  </div>;
}
function BudgetRows({frame,onMask,budget}){
  return <div className="frontier-budget-bars">
    {frame.by_budget.map(r=><button key={r.budget} type="button" onClick={()=>onMask(r.first_identity_mask??((1<<r.budget)-1))}
      aria-label={'Choose representative mask with '+r.budget+' channels'}
      className={'frontier-budget-row'+(budget===r.budget?' active':'')}>
      <div className="frontier-budget-label"><b>{r.budget} / 6</b><span>{r.total_masks} masks</span></div>
      <div className="frontier-budget-compare">
        <div className="frontier-budget-track"><div style={{width:pct(r.identity_fraction),background:COLORS.a}}/></div>
        <div className="frontier-budget-track"><div style={{width:pct(r.sum_fraction),background:COLORS.b}}/></div>
      </div>
      <strong>{r.identity_detected}/{r.total_masks}</strong>
    </button>)}
  </div>;
}
function Timeline({snapshot,step,onStep}){
  const width=740, height=160;
  const x=i=>18+(width-36)*i/23;
  const max=Math.max(.01,...snapshot.frames.map(f=>f.outer_hidden_l1),...snapshot.frames.map(f=>f.global_sum_gap));
  const y=v=>140-121*(v/max);
  const line=key=>snapshot.frames.map((frame,i)=>(i?'L':'M')+x(i).toFixed(2)+','+y(frame[key]).toFixed(2)).join(' ');
  return <div className="frontier-timeline">
    <div className="frontier-plot-legend"><span><i style={{background:COLORS.a}}/> Hidden L1 distance</span><span><i style={{background:COLORS.b}}/> Global-sum difference</span></div>
    <svg viewBox={'0 0 '+width+' '+height} preserveAspectRatio="none" aria-label="Synthetic hidden-state difference versus global-sum measurement" role="img">
      {[0,.5,1].map(v=><line key={v} x1="0" y1={y(v*max)} x2={width} y2={y(v*max)} stroke="#2f5368" strokeDasharray="3 7"/>)}
      <path fill="none" stroke={COLORS.a} strokeWidth="2.6" vectorEffect="non-scaling-stroke" d={line('outer_hidden_l1')}/>
      <path fill="none" stroke={COLORS.b} strokeWidth="2.6" vectorEffect="non-scaling-stroke" d={line('global_sum_gap')}/>
      <line x1={x(step)} x2={x(step)} y1="0" y2="152" stroke="#e5f4ed" strokeDasharray="5 4"/>
      <circle cx={x(step)} cy={y(snapshot.frames[step].outer_hidden_l1)} r="5" fill={COLORS.a}/>
      <circle cx={x(step)} cy={y(snapshot.frames[step].global_sum_gap)} r="5" fill={COLORS.b}/>
      <text x="4" y="13" fill="#9aaebe" fontSize="10">{max.toFixed(4)}</text>
    </svg>
    <div className="frontier-timeline-axis"><span>00</span><span>10 · hidden arrival</span><span>12 · probe</span><span>23</span></div>
    <input type="range" min="0" max="23" value={step} aria-label="Select replay frame" onChange={e=>onStep(Number(e.target.value))}/>
  </div>;
}
export default function FrontierLab(){
  const report=useMemo(()=>frontierReport(),[]);
  const source=useMemo(()=>Object.fromEntries(CONDITIONS.map(([name,c,g,en])=>[name,buildGearReport(c,g,en)])),[]);
  const [condition,setCondition]=useState('coupled_probe');
  const [step,setStep]=useState(10);
  const [threshold,setThreshold]=useState(.01);
  const [mask,setMask]=useState(63);
  const [notice,setNotice]=useState('');
  const world=report.worlds.find(x=>x.condition===condition);
  const shot=world.snapshots.find(x=>x.threshold===threshold);
  const frame=shot.frames[step];
  const history=source[condition].history[step];
  const a=history.state_a[5],b=history.state_b[5];
  const ids=selectedSectors(mask);
  const diff=gaps(a,b,mask);
  const seenIdentity=diff.identity_max>threshold,seenSum=diff.masked_sum>threshold;
  const globalGap=frame.global_sum_gap;
  const positiveCase=world.first_detection_at_default_threshold;
  const earliest=positiveCase.identity_max;
  const fullBudget=frame.by_budget[6];
  const fullIdentity=fullBudget.identity_detected===1;
  const maskRow=frame.by_budget[ids.length];
  function toggleSector(i){setMask(m=>m^(1<<i));}
  function chooseMask(m){setMask(m);}
  function changeCondition(x){setCondition(x);setStep(10);setMask(63);}
  async function save(){
    try{
      const record={schema:'phimirrorhex.e9.browser-keyhole.v1',
        epistemic_origin:'SIMULATED',action_authorized:false,consciousness_measured:false,
        condition,step,threshold,mask,sector_indices:ids,state_a:a,state_b:b,
        selected_readouts:diff,global_sum_gap:globalGap,
        complete_atlas_schema:report.schema,controls:report.controls
      };
      const raw=JSON.stringify(record);
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
      const sha=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
      const payload=JSON.stringify({...record,sha256:sha,digest_note:'SHA256 over JSON.stringify(record); integrity only, not a signature.'},null,2)+'\n';
      const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='phimirrorhex-e9-'+condition+'-t'+step+'.json';
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('Synthetic Keyhole receipt saved locally.');
    }catch(error){setNotice('Export unavailable: '+error.message);}
  }
  return <div className="frontier-page">
    <header className="frontier-hero">
      <div><div className="eyebrow">E9 / THE OBSERVABILITY FRONTIER · EXHAUSTIVE MASK ENUMERATION</div>
        <h2>What can the <em>Keyhole</em> see?</h2>
        <p>Examine every combination of six sensors. Compare a channel-identity-preserving readout against a sum-only view using the exact same sensor budget, across time, detection floors, and causal controls.</p>
        <div className="frontier-pills"><span>64 SENSOR MASKS</span><span>4 THRESHOLDS</span><span>24 FRAMES</span><span>4 GEAR CONDITIONS</span></div>
      </div>
      <div className="frontier-equation"><span>THE EXPERIMENT</span><strong>Same sensors.<br/>Different observer.</strong><p>Identity-aware max difference versus aggregate sum difference.</p></div>
    </header>

    <section className="surface frontier-world">
      <div className="panel-header"><div><div className="eyebrow">01 / FROZEN INTERVENTION CONDITIONS</div><h2>Choose a causal control</h2></div><span className="panel-badge">E5 REPLAY · READ ONLY</span></div>
      <div className="frontier-world-options">{CONDITIONS.map(([name])=><button type="button" key={name} className={condition===name?'active':''}
        aria-pressed={condition===name} onClick={()=>changeCondition(name)}><strong>{NAMES[name]}</strong><span>{name==='coupled_probe'?'POSITIVE CONTROL':'NEGATIVE / COMPARISON CONTROL'}</span></button>)}</div>
      <p className="frontier-world-description">{DESCS[condition]}</p>
    </section>

    <div className="frontier-metrics">
      <Metric name="SELECTED CHANNELS" value={ids.length+' / 6'} note="Exact bitmask of six sectors"/>
      <Metric name="IDENTITY GAP" value={fmt(diff.identity_max)} note={seenIdentity?'This Keyhole separates the pair':'Below the selected detection floor'} kind={seenIdentity?'yes':''}/>
      <Metric name="MASKED-SUM GAP" value={fmt(diff.masked_sum)} note={seenSum?'Same-mask sum separates pair':'Same-mask sum cannot separate'} kind={seenSum?'yes':''}/>
      <Metric name="ALL-SIX GLOBAL SUM" value={fmt(globalGap)} note="Six-channel aggregate baseline"/>
    </div>

    <div className="frontier-main">
      <section className="surface frontier-selection-panel">
        <div className="panel-header"><div><div className="eyebrow">02 / BUILD YOUR OWN KEYHOLE</div><h2>Choose the sensors</h2></div><span className="panel-badge">BITMASK {String(mask).padStart(2,'0')}</span></div>
        <SensorHex frame={history} selected={ids} onSelect={toggleSector}/>
        <div className="frontier-preset-buttons">
          <button type="button" onClick={()=>setMask(63)}>ALL SIX</button>
          <button type="button" onClick={()=>setMask(1)}>ONE SENSOR</button>
          <button type="button" onClick={()=>setMask(0)}>NONE (NEGATIVE)</button>
        </div>
        <div className="frontier-readout">
          <div><small>IDENTITY-PRESERVING</small><strong className={seenIdentity?'detected':'muted'}>{seenIdentity?'DIFFERENCE VISIBLE':'NO DIFFERENCE VISIBLE'}</strong><span>Maximum signed-channel gap among selected sensors</span></div>
          <div><small>SUM-ONLY</small><strong className={seenSum?'detected':'muted'}>{seenSum?'DIFFERENCE VISIBLE':'NO DIFFERENCE VISIBLE'}</strong><span>Sum the very same selected channels first</span></div>
        </div>
      </section>
      <section className="surface frontier-coverage-panel">
        <div className="panel-header"><div><div className="eyebrow">03 / BUDGET FRONTIER</div><h2>Every possible sensor subset</h2></div><span className="panel-badge">{64} ENUMERATED MASKS</span></div>
        <div className="frontier-coverage-body">
          <div className="frontier-legend"><span><i style={{background:COLORS.a}}/> Identity max</span><span><i style={{background:COLORS.b}}/> Same-mask sum</span></div>
          <BudgetRows frame={frame} budget={ids.length} onMask={chooseMask}/>
          <div className="frontier-coverage-note">
            <b>Budget {ids.length}:</b> {maskRow.identity_detected} of {maskRow.total_masks} possible subsets reveal the constructed pair with identity-aware readout, while {maskRow.sum_detected} of {maskRow.total_masks} reveal it after summation.
          </div>
          <div className="frontier-control-row">
            <label htmlFor="frontier-floor">Detection floor <strong>{threshold.toFixed(3)}</strong></label>
            <select id="frontier-floor" value={threshold} onChange={e=>setThreshold(Number(e.target.value))}>
              {THRESHOLDS.map(v=><option key={v} value={v}>{v.toFixed(3)} {v===0?'· strict nonzero':''}</option>)}
            </select>
            <p>A mask counts as detecting only when its gap is strictly greater than this threshold. These are fractions of subsets in one engineered pair, not success probabilities.</p>
          </div>
        </div>
      </section>
    </div>

    <section className="surface frontier-history-panel">
      <div className="panel-header"><div><div className="eyebrow">04 / TEMPORAL OBSERVABILITY</div><h2>Hidden arrival versus coarse revelation</h2></div><span className="panel-badge">FRAME {step} / 23</span></div>
      <Timeline step={step} onStep={setStep} snapshot={shot}/>
      <div className="frontier-history-readout">
        <div><small>EARLIEST MASK DETECTION (DEFAULT FLOOR)</small><strong>{earliest===null?'NONE':'t = '+earliest}</strong></div>
        <div><small>EARLIEST GLOBAL-SUM DETECTION</small><strong>{positiveCase.global_sum===null?'NONE':'t = '+positiveCase.global_sum}</strong></div>
        <div><small>FULL SIX IDENTITY AT THIS FRAME</small><strong>{fullIdentity?'DETECTED':'NOT DETECTED'}</strong></div>
      </div>
    </section>

    <div className="frontier-claim"><div><b>Measured here: synthetic observability, not human consciousness.</b><p>We enumerate finite measurement operators on two known E5 simulation trajectories. A mask's detection fraction counts how many of the 64 possible sensor choices reveal that pair, not predictive accuracy, a causal proof in nature, or a probability. No actual external NestedBubbleGear, brain, light, or biological data is read.</p>
      <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E9_OBSERVABILITY_FRONTIER.md" target="_blank" rel="noreferrer">READ THE FROZEN E9 PROTOCOL ↗</a></div>
      <button className="ghost-button" type="button" onClick={save}>↓ EXPORT KEYHOLE RECEIPT</button>
    </div>
    {notice&&<p role="status" className="frontier-notice">{notice}</p>}
  </div>;
}
