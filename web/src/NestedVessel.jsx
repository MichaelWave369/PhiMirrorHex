import { useId, useMemo, useState } from 'react';
import { buildVesselReport, VESSEL_GAINS, VESSEL_LAYERS, VESSEL_RADII } from './vessel-model.mjs';
import './nested-vessel.css';

const COORD=idx=>-Math.PI/2+idx*Math.PI/3;
const vecLabel=a=>'['+a.map(x=>x>0?'+'+x.toFixed(2):x.toFixed(2)).join(', ')+']';
const fmt=n=>(n>=0?'+':'')+Number(n).toFixed(2);
const XY=(cx,cy,r,k)=>[cx+Math.cos(COORD(k))*r,cy+Math.sin(COORD(k))*r];
const polygon=(cx,cy,r)=>Array.from({length:6},(_,k)=>XY(cx,cy,r,k).map(x=>x.toFixed(2)).join(',')).join(' ');
const markerColor=value=>value>.00001?'#70e0ed':value<-.00001?'#f0bc7e':'#466277';

function StateHex({label,letter,color,report,depth,showInternals}) {
  const uid=useId().replaceAll(':','');
  const maxRadius=185, center=231;
  const states=report.layers;
  const selected=states[depth];
  return <div className="vessel-hex-card">
    <div className="vessel-hex-top"><div><span className="vessel-hex-id" style={{'--vessel-accent':color}}>STATE {letter}</span><strong>{label}</strong></div><span className="vessel-sim-pill">SIMULATED</span></div>
    <svg className="vessel-svg" viewBox="0 0 462 462" role="img" aria-label={'Nested sixfold diagram for '+letter+'. At Keyhole '+depth+' the coarse sum is '+fmt(letter==='A'?selected.keyhole_a:selected.keyhole_b)+'. Full internal sectors '+(showInternals?'visible for comparison':'not shown')+'.'}>
      <defs>
        <radialGradient id={'vessel-glow-'+uid}><stop stopColor={color} stopOpacity=".10"/><stop offset="1" stopColor={color} stopOpacity="0"/></radialGradient>
        <filter id={'vessel-soft-'+uid} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5"/>
        </filter>
      </defs>
      <circle cx={center} cy={center} r="204" fill={'url(#vessel-glow-'+uid+')'}/>
      {Array.from({length:6},(_,sector)=>{
        const [x,y]=XY(center,center,203,sector);
        return <line key={'axis'+sector} x1={center} y1={center} x2={x} y2={y} stroke="#396079" strokeWidth=".7" opacity=".28"/>;
      })}
      {[...states].reverse().map((ring)=>{
        const level=ring.index;
        const radius=28+VESSEL_RADII[level]/13*157;
        const highlight=level===depth;
        const vector=letter==='A'?ring.state_a:ring.state_b;
        const dim=level>depth;
        return <g key={level} opacity={dim?.27:1}>
          <polygon points={polygon(center,center,radius)}
            fill={highlight?color:'none'} fillOpacity={highlight?.063:0}
            stroke={highlight?color:'#45718a'}
            strokeWidth={highlight?2.4:1}
            strokeDasharray={highlight?'none':'4 5'}/>
          {highlight&&<polygon points={polygon(center,center,radius)}
            fill="none" stroke={color} strokeWidth="6" opacity=".24" filter={'url(#vessel-soft-'+uid+')'}/>}
          {vector.map((value,sector)=>{
            const [x,y]=XY(center,center,radius,sector);
            const marker=showInternals?markerColor(value):'#648093';
            return <g key={sector}>
              <circle cx={x} cy={y} r={highlight?8.5:6.3} fill="#0a1b2b" stroke={marker} strokeWidth={highlight?2:1}/>
              {showInternals&&value!==0&&<circle cx={x} cy={y} r={highlight?4.3:3} fill={marker}/>}
            </g>;
          })}
        </g>;
      })}
      <circle cx={center} cy={center} r="30" fill="#0d2334" stroke={color} strokeWidth="1.5"/>
      <text x={center} y={center-4} fill="#a5bccc" fontSize="10" textAnchor="middle">P(X)</text>
      <text x={center} y={center+16} fill="#ecf6f7" fontSize="17" fontWeight="750" textAnchor="middle">{fmt(letter==='A'?selected.keyhole_a:selected.keyhole_b)}</text>
      <text x={center} y="24" fill="#adc5d1" fontSize="10" textAnchor="middle" letterSpacing="2">SIX NESTED KEYHOLES</text>
      <text x={center} y="447" fill="#7798a7" fontSize="10" textAnchor="middle" letterSpacing="1">DEPTH {depth} / 5 · CLOSURE TEST</text>
    </svg>
    <div className="vessel-vector-reading"><span>ACTIVE HIDDEN SECTORS</span><code>{showInternals?vecLabel(letter==='A'?selected.state_a:selected.state_b):'Hidden from this Keyhole'}</code></div>
  </div>;
}

function DepthLadder({report,depth,onDepth}) {
  return <div className="vessel-ladder" role="group" aria-label="Select the depth of the coarse observer">
    {report.layers.map(layer=><button key={layer.index} type="button"
      aria-pressed={depth===layer.index} onClick={()=>onDepth(layer.index)}
      className={'vessel-layer-button'+(depth===layer.index?' selected':'')+(layer.equal_through_keyhole?'':' split')}>
      <span className="vessel-layer-number">{String(layer.index).padStart(2,'0')}</span>
      <span className="vessel-layer-label">{layer.name}</span>
      <span className="vessel-layer-result">{layer.equal_through_keyhole?'COARSE EQUAL':'SEPARATED'}</span>
    </button>)}
  </div>;
}

function Controls({depth,setDepth,probe,setProbe,gain,setGain,showInternals,setShowInternals}) {
  return <div className="vessel-controls">
    <div className="vessel-control">
      <label htmlFor="vessel-depth">Observer depth <strong>{depth} / 5</strong></label>
      <input type="range" id="vessel-depth" min="0" max="5" step="1" value={depth} onChange={e=>setDepth(Number(e.target.value))}/>
      <p>Changes only what the observer can inspect. The two underlying trajectories are not rewritten.</p>
    </div>
    <div className="vessel-control">
      <label htmlFor="vessel-probe">Fixed interface depth <strong>{probe} / 5</strong></label>
      <input id="vessel-probe" type="range" min="1" max="5" step="1" value={probe} onChange={e=>setProbe(Number(e.target.value))}/>
      <p>Choose the layer at which the same preregistered sector gain acts on both states.</p>
    </div>
    <div className="vessel-control">
      <label htmlFor="vessel-gain">Gear interface strength <strong>{gain.toFixed(2)}</strong></label>
      <select id="vessel-gain" value={gain} onChange={e=>setGain(Number(e.target.value))}>
        {VESSEL_GAINS.map(v=><option key={v} value={v}>{v.toFixed(2)}{v===0?' · negative control':v===.5?' · default probe':''}</option>)}
      </select>
      <p>With gain = 0, no separating witness occurs. That is the frozen negative control.</p>
    </div>
    <label className="vessel-check"><input type="checkbox" checked={showInternals} onChange={e=>setShowInternals(e.target.checked)}/> Reveal internal state (simulator-only)</label>
  </div>;
}

export default function NestedVessel() {
  const [depth,setDepth]=useState(3);
  const [probe,setProbe]=useState(3);
  const [gain,setGain]=useState(.5);
  const [showInternals,setShowInternals]=useState(true);
  const [notification,setNotification]=useState('');
  const report=useMemo(()=>buildVesselReport(probe,gain,depth),[probe,gain,depth]);
  const active=report.layers[depth],witness=report.witness;
  const canSeparate=!active.equal_through_keyhole;

  async function save(){
    try{
      const payload=JSON.stringify(report);
      const checksum=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload))),x=>x.toString(16).padStart(2,'0')).join('');
      const file={...report,sha256:checksum,hash_method:'SHA-256 of JSON.stringify(report) without hash fields; browser receipt, not authentication'};
      const url=URL.createObjectURL(new Blob([JSON.stringify(file,null,2)+'\n'],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='phimirrorhex-nested-vessel-e4.json';
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotification('Simulated E4 witness exported. No biometric data.');
    }catch(error){setNotification('Export unavailable: '+error.message);}
  }

  return <section className="nested-vessel-page">
    <div className="vessel-lead">
      <div className="eyebrow">E4 / NBG KEYHOLE MEASUREMENT · SIMULATED MODEL</div>
      <div className="vessel-lead-grid">
        <div><h2>Inside the <em>vessel.</em></h2><p>What if outward measurements hide important internal structure? Explore two six-sector states that look identical at the boundary until a defined gear-like interaction exposes their difference.</p></div>
        <div className="vessel-principle"><span>THE KEYHOLE QUESTION</span><strong>P(A₀) = P(B₀)</strong><div>but after the same allowed interface sequence:</div><strong>P(GA₀) ≠ P(GB₀)</strong></div>
      </div>
    </div>
    <div className="vessel-summary-grid">
      <div className="vessel-summary"><span>HIDDEN STATES</span><strong>02</strong><small>Same starting coarse sum</small></div>
      <div className="vessel-summary"><span>NESTED DOMAINS</span><strong>06</strong><small>Illustrative layers</small></div>
      <div className="vessel-summary"><span>FIRST WITNESS DEPTH</span><strong>{witness.first_layer===null?'NONE':String(witness.first_layer).padStart(2,'0')}</strong><small>Frozen gain/rotation rule</small></div>
      <div className={'vessel-summary'+(canSeparate?' active':'')}><span>CURRENT OBSERVABLE GAP</span><strong>{active.observable_gap.toFixed(2)}</strong><small>{canSeparate?'States are distinguishable':'States appear identical'}</small></div>
    </div>
    <div className="vessel-dual">
      <StateHex label="Positive-first residue" letter="A" color="#6bd8e6" report={report} depth={depth} showInternals={showInternals}/>
      <StateHex label="Negative-first residue" letter="B" color="#e6bb85" report={report} depth={depth} showInternals={showInternals}/>
    </div>
    <div className="vessel-operators-grid">
      <section className="surface vessel-operation-panel">
        <div className="panel-header"><div><div className="eyebrow">01 / EXPERIMENT CONTROLS</div><h2>Move through the gears</h2></div><span className="panel-badge">NO PHYSICAL INPUTS</span></div>
        <Controls depth={depth} setDepth={setDepth} probe={probe} setProbe={setProbe}
          gain={gain} setGain={setGain} showInternals={showInternals} setShowInternals={setShowInternals}/>
        <div className="vessel-result" aria-live="polite" data-separated={canSeparate}>
          <span>{canSeparate?'◉ SEPARATING KEYHOLE WITNESS':'◌ COARSE EQUIVALENCE AT THIS DEPTH'}</span>
          <strong>{fmt(active.keyhole_a)} <span>vs.</span> {fmt(active.keyhole_b)}</strong>
          <p>{canSeparate?'After the same fixed interface operation, the coarse projections split. This is a finite mathematical witness only.':'The coarse sum cannot distinguish the two internal states at this observer depth.'}</p>
        </div>
      </section>
      <section className="surface vessel-depth-panel">
        <div className="panel-header"><div><div className="eyebrow">02 / THE NESTED OBSERVER</div><h2>Six Keyhole depths</h2></div><span className="panel-badge">CLICK TO INSPECT</span></div>
        <DepthLadder report={report} depth={depth} onDepth={setDepth}/>
        <p className="vessel-depth-note">Selected: {active.name} · operator: {active.operation.replaceAll('_',' ')} · latent L1 difference: {active.latent_l1_difference.toFixed(2)}</p>
      </section>
    </div>
    <section className="surface vessel-evidence-panel">
      <div className="panel-header"><div><div className="eyebrow">03 / COMPARATIVE MEASUREMENT</div><h2>The observable gap</h2></div><span className="panel-badge">FROZEN TOY RESULT</span></div>
      <div className="vessel-gap-bars">
        {report.layers.map(r=><button type="button" key={r.index} className={'vessel-gap-cell'+(r.index===depth?' chosen':'')} onClick={()=>setDepth(r.index)}>
          <div className="vessel-gap-top"><span>DEPTH {r.index}</span><strong>{r.observable_gap.toFixed(2)}</strong></div>
          <div className="vessel-gap-track"><div style={{height:(r.observable_gap/2)*100+'%'}}/></div>
          <small>{r.operation==='ROTATE_GAIN'?'GEAR PROBE':r.operation==='INITIAL'?'INITIAL':'TRANSPORT'}</small>
        </button>)}
      </div>
      <div className="vessel-measure-footer"><div><b>{gain===0?'NEGATIVE CONTROL ACTIVE':'POSITIVE CONTROL ACTIVE'}</b><p>{gain===0?'Symmetric rotation never separates the identical coarse sums, even though hidden states differ.':'The same fixed sector gain makes the hidden difference visible at depth '+probe+'.'}</p></div><button className="ghost-button" onClick={save}>EXPORT E4 OBSERVATION ↗</button></div>
      {notification&&<p className="vessel-notice" role="status">{notification}</p>}
    </section>
    <div className="vessel-firewall">
      <span className="truth-icon">ⓘ</span><div><b>Conceptual biological analogy, not a consciousness detector.</b><p>These rings name hypothetical measurement layers, not proven biological compartments. All values are synthetic. There are no sensors, human measurements, patient data, soul claims, light-to-matter conversion claims, or execution permissions. The experiment demonstrates an NBG-style hidden-state witness, not a physical theory of people.</p>
      <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E4_NESTED_VESSEL.md" target="_blank" rel="noreferrer">Read the frozen E4 method ↗</a></div>
    </div>
  </section>;
}
