import { useCallback, useEffect, useMemo, useState } from 'react';
import { ABOVE, BELOW, BUDGETS, PHI, rankPeerEdges, simulateFrame } from '../../docs/living-hex.mjs';
import { PyramidScene, NexusScene } from './visuals.jsx';
import NestedVessel from './NestedVessel.jsx';
import NestedGears from './NestedGears.jsx';
import CoherenceLab from './CoherenceLab.jsx';
import AdaptiveLab from './AdaptiveLab.jsx';
import RobustnessLab from './RobustnessLab.jsx';
import FrontierLab from './FrontierLab.jsx';
import GeneralizationLab from './GeneralizationLab.jsx';
import ReplicationLab from './ReplicationLab.jsx';
import TransferLab from './TransferLab.jsx';
import CalibrationLab from './CalibrationLab.jsx';
import DriftLab from './DriftLab.jsx';
import SequentialLab from './SequentialLab.jsx';
import ConsensusLab from './ConsensusLab.jsx';
import ConsensusTransferLab from './ConsensusTransferLab.jsx';
import ProspectiveAuditLab from './ProspectiveAuditLab.jsx';
import EvidenceLab from './EvidenceLab.jsx';
import ReceiverLab from './ReceiverLab.jsx';
import IntakeLab from './IntakeLab.jsx';
import CheckpointLab from './CheckpointLab.jsx';
import WitnessLab from './WitnessLab.jsx';
import SignatureLab from './SignatureLab.jsx';
import LifecycleLab from './LifecycleLab.jsx';

const REPO = 'https://github.com/MichaelWave369/PhiMirrorHex';
const SCHEMA = 'phimirrorhex.e3.browser-snapshot.v1';
const nf = x => Number(x).toFixed(3);
const percentage = x => (x * 100).toFixed(1) + '%';

function SmallIcon({name}) {
  const d = {
    play: 'M8 5v14l11-7z',
    pause: 'M7 5h3v14H7zm7 0h3v14h-3z',
    reset: 'M3 12a9 9 0 1 0 3-6M3 3v6h6',
    export: 'M12 3v12m0 0-5-5m5 5 5-5M5 17v3h14v-3',
    link: 'M7 17 17 7M7 7h10v10',
    layers: 'm12 2 9 5-9 5-9-5 9-5zm-9 10 9 5 9-5m-18 5 9 5 9-5',
    flask: 'M9 3h6M10 3v7l-6 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-9V3',
    diamond: 'M12 2 21 12 12 22 3 12z',
    chevron: 'm9 18 6-6-6-6'
  }[name] || '';
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}

function MiniMetric({label,value,sub,accent='blue'}) {
  return <div className={'metric metric-'+accent}>
    <div className="metric-label">{label}</div>
    <div className="metric-number">{value}</div>
    <div className="metric-note">{sub}</div>
  </div>;
}

function SectionLabel({eyebrow,title,sub}) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div></div>;
}

function InlineLineChart({series,step}) {
  const w=660,h=175,padX=16,padY=20;
  const x=i=>padX+(w-2*padX)*i/Math.max(series.length-1,1);
  const y=c=>padY+(h-2*padY)*(1-c);
  const scorePath=series.map((frame,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(frame.gate.candidate_score).toFixed(1)).join(' ');
  const clean=series.map((frame,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(1-frame.gate.mean_disagreement).toFixed(1)).join(' ');
  const selected=series[step];
  return <div className="timeline-graph">
    <div className="chart-legend"><span><i className="legend-dot" />Φ candidate score</span><span><i className="legend-dot gold" />Mean signal alignment</span></div>
    <svg role="img" aria-label={'Deterministic 24-step candidate score chart. Current frame '+step+', candidate score '+nf(selected.gate.candidate_score)} viewBox={'0 0 '+w+' '+h} preserveAspectRatio="none">
      {[.25,.5,.75,1].map(v=><line key={v} x1="0" y1={y(v)} x2={w} y2={y(v)} stroke="#294359" strokeDasharray="3 7" />)}
      <rect x={x(10)-7} y="0" width={x(17)-x(10)+14} height={h} fill="#ff936e" opacity=".045"/>
      <path d={clean} stroke="#d6aa72" strokeWidth="2" strokeDasharray="5 5" fill="none" vectorEffect="non-scaling-stroke"/>
      <path d={scorePath} stroke="#68dae4" strokeWidth="2.8" fill="none" vectorEffect="non-scaling-stroke"/>
      <line x1={x(step)} x2={x(step)} y1="0" y2={h} stroke="#dae9ef" strokeWidth="1" strokeDasharray="3 4" opacity=".6"/>
      <circle cx={x(step)} cy={y(selected.gate.candidate_score)} r="5" stroke="#071523" strokeWidth="2" fill="#7de7ed" />
      <text x="8" y="15" fill="#8da5b9" fontSize="11">1.0</text>
      <text x="8" y={h-6} fill="#8da5b9" fontSize="11">0.0</text>
    </svg>
    <div className="axis"><span>FRAME 00</span><span>SYNTHETIC INJECTION 10–17</span><span>FRAME 23</span></div>
  </div>;
}

function MatrixView({frame,selected,onSelect}) {
  return <section className="surface matrix-section">
    <SectionLabel eyebrow="Six by six cross-plane map" title="The channel matrix" sub="Choose any channel. The detailed reading and both visualizations will follow your selection." />
    <div className="matrix-layout">
      <div className="matrix-wrap">
        <div className="matrix-grid" role="group" aria-label="36 selectable simulated channels">
          <div className="matrix-empty">ABOVE ↓ / BELOW →</div>
          {BELOW.map((name,j)=><div className="matrix-column" key={name}><span>{('0'+(j+1)).slice(-2)}</span>{name}</div>)}
          {ABOVE.map((name,i)=><div className="matrix-row" key={name}>
            <div className="matrix-row-title"><span>{('0'+(i+1)).slice(-2)}</span>{name}</div>
            {BELOW.map((lower,j)=>{
              const k=i*6+j,c=frame.channels[k];
              const intensity=Math.round(c.activity*100);
              return <button key={c.id} type="button" title={c.upper+' → '+lower+' | disagreement '+nf(c.disagreement)}
                aria-pressed={selected===k}
                className={'matrix-cell '+(selected===k?'chosen ':'')+(c.flagged?'anomaly':'')}
                style={{'--intensity':intensity+'%'}}
                onClick={()=>onSelect(k)}>
                <strong>{c.activity.toFixed(2)}</strong><small>{c.id}</small>
              </button>;
            })}
          </div>)}
        </div>
      </div>
      <div className="matrix-aside">
        <h3>Identity before aggregation</h3>
        <p>Every cell retains a named upper/lower channel, simulated claim, simulated observation, and disagreement. These identities matter when equal-and-opposite signals cancel in aggregate.</p>
        <div className="matrix-key"><span><i className="key-dot"/></span><span>Ordinary synthetic activity</span></div>
        <div className="matrix-key"><span><i className="key-dot bad"/></span><span>Controlled injected contradiction</span></div>
        <div className="matrix-key"><span><i className="key-dot current"/></span><span>Selected channel</span></div>
        <div className="info-box">36 channels + 1 central gate = 37 logical records.<br/><strong>C(37, 2) = 666</strong> unique possible pair checks.</div>
      </div>
    </div>
  </section>;
}

function MethodsView() {
  return <section className="surface methodology">
    <SectionLabel eyebrow="Experiment boundary" title="Beauty is not evidence." sub="This is an executable visualization of a research hypothesis, not a claim of a universal numerical law." />
    <div className="methods-grid">
      <article><span className="method-index">01 / GEOMETRY</span><h3>One real solid</h3><p>Two six-sided pyramids share a hexagonal equator. The physical bipyramid has <b>8 vertices, 18 edges, 12 faces</b>. The visible φ-height is an experimental proportion, not a necessary geometric property.</p></article>
      <article><span className="method-index">02 / GRAPH</span><h3>Thirty-six pathways</h3><p>Six upper functions × six lower functions produce 36 labeled channels. Adding one gate creates 37 logical records and exactly 666 possible undirected comparisons.</p></article>
      <article><span className="method-index">03 / SAMPLING</span><h3>Fibonacci audit</h3><p>The budgets <b>55, 89, 144, 233, 377, 610, 666</b> are candidate compute schedules. Every budget includes 36 mandatory gate relations. Peer links are SHA-256-ranked for deterministic replay.</p></article>
      <article><span className="method-index">04 / COHERENCE</span><h3>Experimental φ penalty</h3><p>Candidate C = (E × R × U)^(1/3) × exp(−φD). In E2 the plotted inputs come from synthetic signal agreement, not actual evidence provenance, calibration or system safety.</p></article>
      <article><span className="method-index">05 / CAUSALITY</span><h3>Keep the hidden channels</h3><p>Channel-preserving memory may recover information lost by sum-only compression. The existing repository includes toy positive and negative controls; broad causal recovery is unproven.</p></article>
      <article><span className="method-index">06 / GOVERNANCE</span><h3>Capability ≠ authority</h3><p>Nothing here grants permissions to an agent. Future adapters must be read-only by default, authenticated, and subject to the destination runtime's independent approval rules.</p></article>
    </div>
    <div className="methods-bottom"><span>REFERENCE SOURCE</span><a href={REPO+'/blob/main/docs/E2_CONTRACT.md'} target="_blank" rel="noreferrer">Read the E2 frozen simulation contract <SmallIcon name="link"/></a></div>
  </section>;
}

export default function App() {
  const [tab,setTab]=useState('LAB');
  const [step,setStep]=useState(0);
  const [stage,setStage]=useState(2);
  const [selected,setSelected]=useState(0);
  const [seed,setSeed]=useState(369);
  const [seedText,setSeedText]=useState('369');
  const [anomaly,setAnomaly]=useState(true);
  const [playing,setPlaying]=useState(false);
  const [spin,setSpin]=useState(true);
  const [ranked,setRanked]=useState([]);
  const [rankStatus,setRankStatus]=useState('CALCULATING SHA-256 PAIRS');
  const [toast,setToast]=useState('');
  const frame=useMemo(()=>simulateFrame(step,seed,anomaly),[step,seed,anomaly]);
  const series=useMemo(()=>Array.from({length:24},(_,i)=>simulateFrame(i,seed,anomaly)),[seed,anomaly]);
  const budget=BUDGETS[stage];
  const selectedReading=frame.channels[selected];
  const onSelect=useCallback(k=>setSelected(k),[]);
  const flagged=frame.channels.filter(c=>c.flagged);
  const percent=percentage(budget/666);

  useEffect(()=>{
    if (!playing) return undefined;
    const id=window.setInterval(()=>setStep(n=>(n+1)%24),640);
    return ()=>clearInterval(id);
  },[playing]);
  useEffect(()=>{
    let cancel=false;
    setRanked([]);setRankStatus('CALCULATING SHA-256 PAIRS');
    rankPeerEdges(seed).then(pairs=>{
      if(cancel)return;
      setRanked(pairs);setRankStatus('630 PAIRS VERIFIED / REPLAY READY');
    }).catch(error=>{
      if(cancel)return;
      setRankStatus('PEER RANKING UNAVAILABLE: '+error.message);
    });
    return ()=>{cancel=true;};
  },[seed]);
  useEffect(()=>{
    if(!toast)return;
    const id=setTimeout(()=>setToast(''),4000);
    return()=>clearTimeout(id);
  },[toast]);

  function applySeed(){
    const next=Number(seedText);
    if(!Number.isSafeInteger(next)||next<0||next>2147483647){setSeedText(String(seed));setToast('Seed must be an integer from 0 to 2,147,483,647.');return;}
    setPlaying(false);setStep(0);setSeed(next);setToast('Seed updated. Replay reset.');
  }
  function reset(){setPlaying(false);setStep(0);setSelected(0);setToast('Replay returned to frame 00.');}

  async function downloadSnapshot(){
    const record={
      schema:SCHEMA,kind:'synthetic_browser_experiment',synthetic_only:true,
      authority_granted:false,seed,step,budget,anomaly_enabled:anomaly,
      gate_edges:36,selected_peer_pairs:ranked.slice(0,budget-36).map(([i,j])=>[frame.channels[i].id,frame.channels[j].id]),
      selected_channel:selectedReading.id,frame
    };
    if(ranked.length!==630){setToast('Canonical pair ranking is not ready. Export disabled until verified.');return;}
    try{
      const canonical=JSON.stringify(record);
      const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical));
      const sha256=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
      const payload=JSON.stringify({...record,sha256,hash_note:'Digest of JSON.stringify(record) without sha256/hash_note; detects changes, not authenticity.'},null,2)+'\n';
      const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
      const link=document.createElement('a');
      link.href=url;link.download='phimirrorhex-e3-frame-'+String(step).padStart(2,'0')+'.json';
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      setToast('Synthetic replay snapshot saved with SHA-256 digest.');
    }catch(error){setToast('Export unavailable: '+error.message);}
  }

  return <div className="app-shell">
    <div className="grid-background" aria-hidden="true"/>
    <header className="topbar">
      <div className="brand-lockup"><div className="brand-emblem" aria-hidden="true">Φ</div><div><div className="brand-name">MIRROR<span>HEX</span></div><div className="brand-subtitle">FIELD RESEARCH LAB · E3</div></div></div>
      <nav aria-label="Research lab sections" className="top-nav">
        {['LAB','MATRIX','VESSEL','GEARS','COHERENCE','ADAPTIVE','ROBUSTNESS','FRONTIER','GENERALIZE','REPLICATE','TRANSFER','CALIBRATE','DRIFT','SEQUENCE','CONSENSUS','OUT-OF-FAMILY','PROSPECTIVE','EVIDENCE','RECEIVERS','INTAKE','CHECKPOINT','WITNESSES','SIGNATURES','LIFECYCLE','METHOD'].map(name=><button key={name} onClick={()=>setTab(name)} aria-current={tab===name?'page':undefined} className={tab===name?'active':''}>{name}</button>)}
      </nav>
      <a href={REPO} className="repository-link" target="_blank" rel="noreferrer">GITHUB <SmallIcon name="link"/></a>
    </header>

    <main>
      <section className="intro">
        <div className="intro-copy">
          <div className="eyebrow"><span className="status-light"/> REACT RESEARCH INSTRUMENT <span className="eyebrow-divider">/</span> SIMULATION ACTIVE</div>
          <h1>As above.<br/><span>So below.</span></h1>
          <p>Sixfold intelligence, two mirrored structures, thirty-six cross-plane channels, and a 666-relationship audit graph. Explore the architecture from the inside out.</p>
          <div className="hero-tags"><span>Φ COHERENCE</span><span>FIBONACCI SCALING</span><span>CAUSAL MEMORY</span></div>
        </div>
        <div className="formula-area">
          <div className="formula-top">THE CORE RELATIONSHIP</div>
          <div className="formula-large"><span>6</span><b>→</b><span>36</span><b>→</b><span>666</span></div>
          <div className="formula-sub">AXES <i/> CHANNELS <i/> PAIR CHECKS</div>
          <div className="formula-divider"/>
          <div className="phi-line"><div><small>GOLDEN RATIO</small><strong>φ = {PHI.toFixed(8)}</strong></div><div><small>FIBONACCI RINGS</small><strong>1 · 2 · 3 · 5 · 8 · 13</strong></div></div>
        </div>
      </section>

      <section className="metric-grid" aria-label="Live synthetic experiment measurements">
        <MiniMetric label="CROSS-PLANE CHANNELS" value="36" sub="6 × 6 named pathways"/>
        <MiniMetric label="LOGICAL AUDIT PAIRS" value="666" sub="630 peer + 36 gate" accent="violet"/>
        <MiniMetric label="CANDIDATE Φ SCORE" value={nf(frame.gate.candidate_score)} sub="Synthetic metric only" accent="gold"/>
        <MiniMetric label="DETECTED ANOMALIES" value={String(frame.gate.flagged_count).padStart(2,'0')} sub={frame.gate.alert?'Controlled injected signals':'No flagged signals'} accent={frame.gate.alert?'red':'blue'}/>
      </section>

      {tab==='LAB'&&<>
        <div className="visual-grid">
          <section className="surface visual-panel">
            <div className="panel-header"><div><div className="eyebrow">01 / ABOVE AND BELOW</div><h2>The mirrored geometry</h2></div><span className="panel-badge">3D PROJECTION</span></div>
            <PyramidScene frame={frame} selected={selected} running={playing} spin={spin} onSpin={setSpin}/>
            <div className="scene-footer"><span><i className="dot cyan"/> Upper generative plane</span><span><i className="dot amber"/> Lower verification plane</span></div>
          </section>
          <section className="surface visual-panel">
            <div className="panel-header"><div><div className="eyebrow">02 / INFORMATION ROUTING</div><h2>The living network</h2></div><span className="panel-badge">{percent} COVERAGE</span></div>
            <NexusScene frame={frame} selected={selected} onSelect={onSelect} peers={ranked} budget={budget}/>
            <div className="scene-footer"><span><i className="dot cyan"/> Normal channel</span><span><i className="dot red"/> Injected disagreement</span></div>
          </section>
        </div>
        <div className="bottom-grid">
          <section className="surface controls-panel">
            <div className="panel-header"><div><div className="eyebrow">03 / EXPERIMENT CONTROL</div><h2>Replay engine</h2></div><span className="panel-badge synth">SYNTHETIC DATA</span></div>
            <div className="controls-body">
              <div className="transport"><button type="button" onClick={()=>setPlaying(v=>!v)} className="primary-button"><SmallIcon name={playing?'pause':'play'}/>{playing?'PAUSE':'PLAY REPLAY'}</button><button type="button" onClick={reset} className="ghost-button"><SmallIcon name="reset"/> RESET</button><button type="button" onClick={downloadSnapshot} className="ghost-button" disabled={ranked.length!==630}><SmallIcon name="export"/> EXPORT JSON</button></div>
              <div className="slider-header"><label htmlFor="frame">SIMULATION FRAME</label><strong>{String(step).padStart(2,'0')} <small>/ 23</small></strong></div>
              <input id="frame" type="range" min="0" max="23" value={step} onChange={e=>{setPlaying(false);setStep(Number(e.target.value));}}/>
              <div className="slider-header"><label htmlFor="budget">FIBONACCI AUDIT BUDGET</label><strong>{budget} <small>/ 666</small></strong></div>
              <input id="budget" type="range" min="0" max="6" value={stage} onChange={e=>setStage(Number(e.target.value))}/>
              <div className="budget-scale"><span>55</span><span>89</span><span>144</span><span>233</span><span>377</span><span>610</span><span>666</span></div>
              <div className="progress"><div style={{width:percent}}/></div>
              <div className="control-meta"><span>36 mandatory gate relations</span><span>{budget-36} sampled peer checks</span></div>
              <div className="settings-row">
                <label className="switch-label" htmlFor="anomalies"><input id="anomalies" type="checkbox" checked={anomaly} onChange={e=>setAnomaly(e.target.checked)}/><span>Inject test contradictions</span></label>
                <div className="seed-control"><label htmlFor="seed">REPLAY SEED</label><input id="seed" type="number" min="0" max="2147483647" value={seedText} onChange={e=>setSeedText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')applySeed();}}/><button onClick={applySeed}>APPLY</button></div>
              </div>
            </div>
            <div className="diagnostic-status"><span className={'status-light '+(frame.gate.alert?'warning':'')}/><div><b>{frame.gate.alert?'CONTROLLED DISAGREEMENT DETECTED':'NO FLAGGED DISAGREEMENT'}</b><small>{rankStatus}</small></div></div>
          </section>
          <section className="surface inspect-panel">
            <div className="panel-header"><div><div className="eyebrow">04 / IDENTITY-PRESERVING MEMORY</div><h2>Channel inspector</h2></div><span className="channel-id">{selectedReading.id}</span></div>
            <div className="channel-route"><span>{selectedReading.upper}</span><span className="route-arrow">↔</span><span>{selectedReading.lower}</span></div>
            <div className="readings">
              <div><small>SYNTHETIC CLAIM</small><strong>{nf(selectedReading.claim)}</strong></div>
              <div><small>SYNTHETIC OBSERVATION</small><strong>{nf(selectedReading.observation)}</strong></div>
              <div><small>ABSOLUTE DISAGREEMENT</small><strong className={selectedReading.flagged?'danger':''}>{nf(selectedReading.disagreement)}</strong></div>
            </div>
            <div className="inspector-bar"><div style={{width:percentage(selectedReading.activity)}}/></div>
            <div className="inspector-meta"><span>SIMULATED ACTIVITY</span><span>{percentage(selectedReading.activity)}</span></div>
            <p className="inspector-note">{selectedReading.injected?'This channel is deliberately modified by the E2 positive-control injection.':'This channel is generated from the deterministic E2 toy signal equations. Click nodes in the network or open the matrix to select another.'}</p>
            <button className="text-button" onClick={()=>setTab('MATRIX')}>EXPLORE ALL 36 CHANNELS <SmallIcon name="chevron"/></button>
          </section>
        </div>
        <section className="surface timeline-panel">
          <div className="panel-header"><div><div className="eyebrow">05 / DETERMINISTIC HISTORY</div><h2>Coherence through time</h2></div><span className="panel-badge">24 FRAMES</span></div>
          <InlineLineChart series={series} step={step}/>
        </section>
        <MatrixView frame={frame} selected={selected} onSelect={onSelect}/>
      </>}
      {tab==='MATRIX'&&<>
        <MatrixView frame={frame} selected={selected} onSelect={onSelect}/>
        <section className="surface detail-panel">
          <SectionLabel eyebrow="Selected reading" title={selectedReading.id+' · '+selectedReading.upper+' ↔ '+selectedReading.lower}/>
          <div className="matrix-detail-metrics"><MiniMetric label="CLAIM" value={nf(selectedReading.claim)} sub="Synthetic source"/><MiniMetric label="OBSERVATION" value={nf(selectedReading.observation)} sub="Synthetic check"/><MiniMetric label="DISAGREEMENT" value={nf(selectedReading.disagreement)} sub={selectedReading.injected?'Injected positive control':'No injected change'} accent={selectedReading.flagged?'red':'gold'}/></div>
        </section>
      </>}
      {tab==='VESSEL'&&<NestedVessel/>}
      {tab==='GEARS'&&<NestedGears/>}
      {tab==='COHERENCE'&&<CoherenceLab/>}
      {tab==='ADAPTIVE'&&<AdaptiveLab/>}
      {tab==='ROBUSTNESS'&&<RobustnessLab/>}
      {tab==='FRONTIER'&&<FrontierLab/>}
      {tab==='GENERALIZE'&&<GeneralizationLab/>}
      {tab==='REPLICATE'&&<ReplicationLab/>}
      {tab==='TRANSFER'&&<TransferLab/>}
      {tab==='CALIBRATE'&&<CalibrationLab/>}
      {tab==='DRIFT'&&<DriftLab/>}
      {tab==='SEQUENCE'&&<SequentialLab/>}
      {tab==='CONSENSUS'&&<ConsensusLab/>}
      {tab==='OUT-OF-FAMILY'&&<ConsensusTransferLab/>}
      {tab==='PROSPECTIVE'&&<ProspectiveAuditLab/>}
      {tab==='EVIDENCE'&&<EvidenceLab/>}
      {tab==='RECEIVERS'&&<ReceiverLab/>}
      {tab==='INTAKE'&&<IntakeLab/>}
      {tab==='CHECKPOINT'&&<CheckpointLab/>}
      {tab==='WITNESSES'&&<WitnessLab/>}
      {tab==='SIGNATURES'&&<SignatureLab/>}
      {tab==='LIFECYCLE'&&<LifecycleLab/>}
      {tab==='METHOD'&&<MethodsView/>}

      <section className="truth-strip"><span className="truth-icon">ⓘ</span><div><b>A research instrument, not an oracle.</b><p>Exact topology, synthetic signals. No live agent data, external model calls, autonomous actions, or independently proven Φ/Fibonacci optimization. All integration claims require matched baselines, replay, and permissioned observability.</p></div></section>
    </main>
    <footer><span>Φ MIRRORHEX · ENTER THE FIELD</span><span>CAPABILITY ≠ AUTHORITY · E25 KEY LIFECYCLE · PUBLIC KEYS ≠ TRUST</span><a href={REPO} target="_blank" rel="noreferrer">SOURCE CODE ↗</a></footer>
    {toast&&<div className="toast" role="status">{toast}</div>}
  </div>;
}
