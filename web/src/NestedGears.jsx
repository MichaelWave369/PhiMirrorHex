import { useEffect, useMemo, useState } from 'react';
import { buildGearReport, COUPLINGS, PROBE_GAINS, LAYER_LABELS, GEAR_RADII } from './gears-model.mjs';
import './nested-gears.css';

const REFERENCE = 'https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E5_NESTED_GEAR_COUPLING.md';
const fmt=x=>Number(x).toFixed(6);
const signed=x=>(x>=0?'+':'')+Number(x).toFixed(5);
const pos=(radius,sector)=>{
  const angle=-Math.PI/2+sector*Math.PI/3;
  return [215+radius*Math.cos(angle),215+radius*Math.sin(angle)];
};
const ringRadius=ring=>30+GEAR_RADII[ring]*11.45;

function GearState({frame,identity,activeRing,showBuffer}) {
  const state=frame[identity==='A'?'state_a':'state_b'];
  const conveyor=frame[identity==='A'?'conveyor_a':'conveyor_b'];
  const outer=frame[identity==='A'?'outer_a':'outer_b'];
  const color=identity==='A'?'#74d9e6':'#efba82';
  const chosen=state[activeRing];
  return <div className="gear-state">
    <div className="gear-state-head"><div><span>TRAJECTORY {identity}</span><h3>{identity==='A'?'Positive-first residue':'Negative-first residue'}</h3></div><strong style={{color}}>{signed(outer)}</strong></div>
    <svg className="gear-state-graphic" viewBox="0 0 430 430" role="img"
      aria-label={'Six concentric gear-like rings representing synthetic '+identity+' state. Outer observable '+signed(outer)+'; selected layer '+activeRing}>
      <defs><radialGradient id={'glow-'+identity}><stop offset="0" stopColor={color} stopOpacity=".14"/><stop offset="1" stopColor={color} stopOpacity="0"/></radialGradient></defs>
      <circle cx="215" cy="215" r="200" fill={'url(#glow-'+identity+')'}/>
      {[...state].map((row,ring)=>{
        const r=ringRadius(ring),active=ring===activeRing;
        const polygon=Array.from({length:6},(_,sector)=>pos(r,sector).map(v=>v.toFixed(2)).join(',')).join(' ');
        const magnitude=row.reduce((s,v)=>s+Math.abs(v),0);
        return <g key={ring}>
          <polygon points={polygon} fill={active?color:'none'} fillOpacity={active?.07:0}
            stroke={active?color:'#3e6174'} strokeWidth={active?2.3:1}
            strokeDasharray={active?undefined:'3 7'}/>
          {row.map((v,sector)=>{
            const [x,y]=pos(r,sector);
            const buffered=conveyor[ring][sector];
            const intensity=Math.min(1,Math.abs(v)*4);
            const signColor=v>0?'#71dfeb':v<0?'#f2b379':'#627f91';
            return <g key={sector}>
              {active&&showBuffer&&buffered!==0&&<circle cx={x} cy={y} r="13" fill="none" stroke="#b09be7" strokeWidth="1.3" strokeDasharray="3 2"/>}
              <circle cx={x} cy={y} r={active?5.3+5*intensity:4.1+3*intensity}
                fill={v===0?'#183041':signColor} stroke={signColor} strokeWidth="1.2"/>
            </g>;
          })}
          <text x="215" y={215-r-9} textAnchor="middle" fontSize="8.5" fill={active?'#e3f2ed':'#6e95a9'}>R{ring}</text>
          {active&&magnitude>0&&<text x="215" y={215+r+17} textAnchor="middle" fontSize="9" fill={color} opacity=".85">∑|x| = {magnitude.toFixed(4)}</text>}
        </g>;
      })}
      <circle cx="215" cy="215" r="24" fill="#0d2031" stroke={color} strokeWidth="1.5"/>
      <text x="215" y="212" fill="#9cbdca" fontSize="9" textAnchor="middle">OUTER</text>
      <text x="215" y="230" fill="#e7f4f5" fontSize="14" fontWeight="700" textAnchor="middle">{fmt(outer)}</text>
      <text x="215" y="18" textAnchor="middle" fontSize="10" fill="#8aabb8" letterSpacing="2">SIX-SCALE GEAR FIELD · SYNTHETIC</text>
    </svg>
    <div className="gear-legend"><span><i className="gear-dot cyan"/> Positive</span><span><i className="gear-dot orange"/> Negative</span><span><i className="gear-dot purple"/> Conveyor buffer</span></div>
    <div className="gear-state-foot"><span>RING {activeRing} STATE</span><code>{chosen.map(signed).join('  ')}</code></div>
  </div>;
}

function TraceChart({report,step,onStep}) {
  const history=report.history, x=t=>18+650*t/23;
  const max=Math.max(.01,...history.map(f=>f.outer_hidden_distance),...history.map(f=>f.outer_gap));
  const y=value=>167-142*value/max;
  const hidden=history.map((f,i)=>(i?'L':'M')+x(i).toFixed(3)+' '+y(f.outer_hidden_distance).toFixed(3)).join(' ');
  const visible=history.map((f,i)=>(i?'L':'M')+x(i).toFixed(3)+' '+y(f.outer_gap).toFixed(3)).join(' ');
  return <div className="gear-trace">
    <div className="gear-trace-legend"><span><i className="gear-dot cyan"/> Hidden outer L1 difference</span><span><i className="gear-dot orange"/> Coarse observable gap</span><span><i className="gear-dot purple"/> Fixed probe at t=12</span></div>
    <svg viewBox="0 0 688 190" preserveAspectRatio="none" role="img"
      aria-label={'Synthetic time-series with hidden outer difference and coarse visible gap; current frame '+step}>
      {[0,.25,.5,.75,1].map(v=><line key={v} x1="0" y1={y(v*max)} x2="688" y2={y(v*max)} stroke="#30495a" strokeDasharray="4 8" strokeWidth=".8"/>)}
      <rect x={x(12)-5} y="0" width="10" height="182" fill="#b8a2f3" opacity=".14"/>
      <line x1={x(12)} y1="0" x2={x(12)} y2="180" stroke="#c2a9ed" strokeDasharray="5 5"/>
      <path d={hidden} fill="none" stroke="#78dce5" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>
      <path d={visible} fill="none" stroke="#e8b47c" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>
      <line x1={x(step)} y1="0" x2={x(step)} y2="182" stroke="#f1efe0" strokeDasharray="3 5" opacity=".5"/>
      <circle cx={x(step)} cy={y(history[step].outer_gap)} r="5" fill="#e8b47c" stroke="#142233" strokeWidth="2"/>
      <circle cx={x(step)} cy={y(history[step].outer_hidden_distance)} r="5" fill="#78dce5" stroke="#142233" strokeWidth="2"/>
      <text x="7" y="13" fill="#8da6b6" fontSize="10">{max.toFixed(3)}</text>
    </svg>
    <div className="gear-trace-axis"><span>00</span><span>10 / first hidden arrival</span><span>12 / probe</span><span>23</span></div>
    <input type="range" min="0" max="23" value={step} aria-label="Inspect timeline frame" onChange={e=>onStep(Number(e.target.value))}/>
  </div>;
}

function Metric({label,value,detail,highlight=false}){
  return <div className={'gear-metric'+(highlight?' standout':'')}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

export default function NestedGears() {
  const [coupling,setCoupling]=useState(.5);
  const [gain,setGain]=useState(.5);
  const [conveyorEnabled,setConveyorEnabled]=useState(true);
  const [step,setStep]=useState(12);
  const [ring,setRing]=useState(5);
  const [showBuffer,setShowBuffer]=useState(true);
  const [playing,setPlaying]=useState(false);
  const [notice,setNotice]=useState('');
  const report=useMemo(()=>buildGearReport(coupling,gain,conveyorEnabled),[coupling,gain,conveyorEnabled]);
  const frame=report.history[step];
  const witness=report.witness;
  useEffect(()=>{
    if(!playing)return;
    const id=setInterval(()=>setStep(x=>(x+1)%24),520);
    return()=>clearInterval(id);
  },[playing]);
  const seek=x=>{setPlaying(false);setStep(x);};
  const setConfig=(setter,value)=>{setPlaying(false);setStep(12);setter(value);};
  async function exportFrame(){
    try{
      const receipt={
        schema:'phimirrorhex.e5.browser-frame.v1',source_schema:report.schema,
        epistemic_origin:'SIMULATED',physical_measurement:false,
        consciousness_measured:false,action_authorized:false,
        configuration:report.configuration,witness:report.witness,frame
      };
      const value=JSON.stringify(receipt);
      const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
      const sha=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
      const data=JSON.stringify({...receipt,sha256:sha,hash_note:'Digest of JSON.stringify(receipt) excluding digest fields, not authenticated'},null,2)+'\n';
      const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='phimirrorhex-e5-t'+step+'.json';
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Synthetic frame exported locally with integrity digest.');
    } catch(error){setNotice('Export unavailable: '+error.message);}
  }
  return <div className="nested-gears-page">
    <div className="gear-hero"><div>
      <div className="eyebrow">E5 / COUPLED GEAR DYNAMICS · SYNTHETIC KEYHOLES</div>
      <h2>When hidden structure <em>travels.</em></h2>
      <p>Six rotating domains. Six sectors each. A one-step transport buffer. Two different histories that look identical through the outer measurement, until a controlled interface makes the distinction visible.</p>
      </div><div className="gear-hero-formula"><span>THE OBSERVATION WINDOW</span><strong>t<sub>arrival</sub> ≠ t<sub>visible</sub></strong><p>Hidden propagation precedes coarse disclosure.</p><div>Gear rotation → conveyor → interface probe</div></div></div>

    <div className="gear-metrics">
      <Metric label="FIRST HIDDEN ARRIVAL" value={witness.first_outer_hidden_arrival===null?'NONE':String(witness.first_outer_hidden_arrival).padStart(2,'0')} detail="Outer ring internal difference"/>
      <Metric label="FIRST COARSE WITNESS" value={witness.first_coarse_separation===null?'NONE':String(witness.first_coarse_separation).padStart(2,'0')} detail="Restricted outer-ring sum" highlight={witness.exists}/>
      <Metric label="OUTER L1 DIFFERENCE" value={fmt(frame.outer_hidden_distance)} detail={'At frame '+step}/>
      <Metric label="COARSE OBSERVABLE GAP" value={fmt(frame.outer_gap)} detail={frame.coarse_equal?'Equal through Keyhole':'States distinguished'} highlight={!frame.coarse_equal}/>
    </div>

    <div className="gear-dual">
      <GearState frame={frame} identity="A" activeRing={ring} showBuffer={showBuffer}/>
      <GearState frame={frame} identity="B" activeRing={ring} showBuffer={showBuffer}/>
    </div>

    <div className="gear-bottom">
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">01 / EXPERIMENT OPERATORS</div><h2>Coupling console</h2></div><span className="panel-badge">24 EXACT FRAMES</span></div>
        <div className="gear-control-body">
          <div className="gear-transport"><button className="primary-button" onClick={()=>setPlaying(p=>!p)}>{playing?'Ⅱ Pause':'▶ Play'} history</button><button className="ghost-button" onClick={()=>{setPlaying(false);setStep(0);}}>↺ Reset to zero</button><button className="ghost-button" onClick={exportFrame}>↓ Export frame</button></div>
          <div className="gear-control"><label htmlFor="gear-step">Temporal Keyhole <b>{String(step).padStart(2,'0')} / 23</b></label><input id="gear-step" type="range" min="0" max="23" value={step} onChange={e=>seek(Number(e.target.value))}/><p>Freeze any moment. Look for hidden arrival at frame 10 and coarse separation at frame 12.</p></div>
          <div className="gear-control-grid">
            <div><label htmlFor="gear-coupling">Conveyor coupling</label><select id="gear-coupling" value={coupling} onChange={e=>setConfig(setCoupling,Number(e.target.value))}>{COUPLINGS.map(n=><option key={n} value={n}>{n.toFixed(2)} {n===0?'· zero-coupling control':''}</option>)}</select></div>
            <div><label htmlFor="gear-gain">Fixed probe gain</label><select id="gear-gain" value={gain} onChange={e=>setConfig(setGain,Number(e.target.value))}>{PROBE_GAINS.map(n=><option key={n} value={n}>{n.toFixed(2)} {n===0?'· no-probe control':''}</option>)}</select></div>
          </div>
          <div className="gear-switches">
            <label><input type="checkbox" checked={conveyorEnabled} onChange={e=>setConfig(setConveyorEnabled,e.target.checked)}/> Enable delayed conveyor</label>
            <label><input type="checkbox" checked={showBuffer} onChange={e=>setShowBuffer(e.target.checked)}/> Show buffer activity</label>
          </div>
          <div className={'gear-status'+(frame.coarse_equal?'':' revealed')}><b>{frame.coarse_equal?'HIDDEN THROUGH CURRENT KEYHOLE':'KEYHOLE SEPARATION DETECTED'}</b><p>Frame {step} · outer A {signed(frame.outer_a)} · outer B {signed(frame.outer_b)}. {frame.probe_applied?'The fixed probe was applied at this frame.':'No new probe is applied at this frame.'}</p></div>
        </div>
      </section>
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">02 / SELECT A NESTED DOMAIN</div><h2>Gear hierarchy</h2></div><span className="panel-badge">6 DOMAINS × 6 SECTORS</span></div>
        <div className="gear-layer-list">
          {LAYER_LABELS.map((label,index)=>{
            const a=frame.state_a[index],b=frame.state_b[index];
            const distance=a.reduce((s,x,i)=>s+Math.abs(x-b[i]),0);
            return <button key={label} type="button" aria-pressed={ring===index}
              className={'gear-layer-item'+(ring===index?' chosen':'')} onClick={()=>setRing(index)}>
              <span className="gear-layer-index">{String(index).padStart(2,'0')}</span><span className="gear-layer-name">{label}<small>{index%2===0?'CLOCKWISE ROTATION':'COUNTERCLOCKWISE ROTATION'}</small></span>
              <strong>{distance.toFixed(4)}</strong>
            </button>;
          })}
        </div>
        <p className="gear-layer-foot">Values are sector-wise L1 differences between synthetic state A and B. The layer names are analogies, not validated anatomical compartments.</p>
      </section>
    </div>

    <section className="surface gear-history-panel">
      <div className="panel-header"><div><div className="eyebrow">03 / MEASUREMENT CHRONOLOGY</div><h2>Hidden arrival vs visible separation</h2></div><span className="panel-badge">FROZEN REPLAY</span></div>
      <TraceChart report={report} step={step} onStep={seek}/>
      <div className="gear-prediction">
        <div><span>SUM-ONLY AT INITIAL FRAME</span><strong>{report.two_case_prediction.sum_only_initial_correct} / 2</strong><small>Cannot distinguish balanced cases</small></div>
        <div><span>FULL STATE AT INITIAL FRAME</span><strong>{report.two_case_prediction.full_initial_state_correct} / 2</strong><small>Identity-preserving baseline</small></div>
        <div><span>OUTER KEYHOLE AFTER PROBE</span><strong>{report.two_case_prediction.outer_after_probe_correct} / 2</strong><small>Constructed two-case test only</small></div>
      </div>
    </section>

    <div className="gear-claim">
      <b>Evidence boundary: SIMULATED ≠ OBSERVED.</b>
      <p>This is a constructed NBG-style delayed-information toy. It shows transport, coarse cancellation and a chosen separating probe under explicitly defined rules. It does not measure a person, consciousness, photons, physical geometry or the optimality of Φ/Fibonacci. There is no network, hardware or agent execution authority.</p>
      <a href={REFERENCE} target="_blank" rel="noreferrer">Read the E5 frozen protocol ↗</a>
    </div>
    {notice&&<p className="gear-notice" role="status">{notice}</p>}
  </div>;
}
