import {useMemo,useState} from 'react';
import {generalizationReport,SCENARIOS,MODES,FLOOR} from './generalization-model.mjs';
import {selectedSectors,gaps} from './frontier-model.mjs';
import './generalization-lab.css';

const TITLES={matched_probe:'Known intervention',shifted_probe:'Unseen probe sector',
  no_probe:'Probe disabled',no_coupling:'Transport disabled'};
const EXPLAIN={
 matched_probe:'Same interface location as training, with fresh held-out sparse and dense states.',
 shifted_probe:'Intervention moved from sector 0 to sector 3 without refitting or reselecting the sensor mask.',
 no_probe:'No outer-ring gain is applied. Sparse masked sums may still see surviving differences.',
 no_coupling:'No transfer to the outer ring. Every external measurement should be blind.'
};
const fmt=n=>Number(n).toFixed(5);
const percent=(n,d)=>((n/d)*100).toFixed(1)+'%';
function Heading({eyebrow,title}){return <div className="general-heading"><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>;}
function Metric({label,value,foot}){return <div className="general-metric"><span>{label}</span><strong>{value}</strong><small>{foot}</small></div>;}
function Comparison({selected,reference,ceiling,total}){
  return <div className="general-compare">
    {[
      ['Frozen training choice',selected,'#72dae2'],
      ['First-k fixed baseline',reference,'#e6bd86'],
      ['Post-hoc test oracle',ceiling,'#aa9de8'],
    ].map(([label,value,color])=><div className="general-compare-row" key={label}>
      <div><span>{label}</span><strong>{value} / {total}</strong></div>
      <div className="general-compare-track"><div style={{width:percent(value,total),background:color}}/></div>
    </div>)}
  </div>;
}
function OuterHex({values,mask,label}){
  const point=i=>{const theta=-Math.PI/2+i*Math.PI/3;return [170+105*Math.cos(theta),170+105*Math.sin(theta)];};
  const path=Array.from({length:6},(_,i)=>point(i).join(',')).join(' ');
  return <div className="general-hex-state">
    <div className="general-hex-header"><b>{label}</b><small>6 signed outer-ring channels</small></div>
    <svg viewBox="0 0 340 340" role="img" aria-label={label+' six synthetic signed sector values'}>
      <circle cx="170" cy="170" r="145" stroke="#285268" strokeDasharray="4 8" fill="none"/>
      <polygon points={path} stroke="#6390a5" fill="#18374b" fillOpacity=".4"/>
      {values.map((v,i)=>{
        const [x,y]=point(i),observed=(mask&(1<<i))!==0;
        return <g key={i}>
          <line x1="170" y1="170" x2={x} y2={y} stroke="#33566a" strokeWidth=".8"/>
          <circle cx={x} cy={y} r={observed?15:11} fill={observed?'#194455':'#102a3b'}
            stroke={observed?'#7ad9e4':'#3a6274'} strokeWidth="1.7"/>
          <text x={x} y={y+4} fontSize="11" textAnchor="middle" fill={observed?'#f2f6f3':'#789bab'}>S{i}</text>
          <text x={x} y={y+(y>170?29:-21)} fontSize="10" textAnchor="middle"
            fill={v>0?'#91e2d7':v<0?'#eac18e':'#7c9cab'}>{v>=0?'+':''}{v.toFixed(3)}</text>
        </g>;
      })}
      <circle cx="170" cy="170" r="38" fill="#0d2333" stroke="#446c83"/>
      <text x="170" y="166" fontSize="10" fill="#a6bdc8" textAnchor="middle">Σ ALL</text>
      <text x="170" y="184" fontSize="13" fontWeight="700" fill="#ebf3ed" textAnchor="middle">{fmt(values.reduce((a,b)=>a+b,0))}</text>
    </svg>
  </div>;
}
export default function GeneralizationLab(){
  const report=useMemo(()=>generalizationReport(),[]);
  const [budget,setBudget]=useState(3);
  const [readout,setReadout]=useState('identity_max');
  const [scenario,setScenario]=useState('matched_probe');
  const [example,setExample]=useState(1);
  const [notice,setNotice]=useState('');
  const policy=report.policies.find(p=>p.budget===budget&&p.readout===readout);
  const chosen=policy.train_selected_mask;
  const selected=policy.heldout_detected[scenario];
  const reference=policy.fixed_first_k_heldout[scenario];
  const heldout=report.heldout_examples[example];
  const e=heldout.outer_by_scenario[scenario],observed=gaps(e.a,e.b,chosen);
  const gap=observed[readout];
  const detected=gap>FLOOR;
  const exampleIndices=selectedSectors(chosen);
  const budgets=report.policies.filter(p=>p.readout===readout);
  async function exportReceipt(){
    try{
      const payload={schema:'phimirrorhex.e10.browser-evaluation.v1',
        epistemic_origin:'SIMULATED',consciousness_measured:false,action_authorized:false,
        selected_policy:policy,scenario,heldout_example:heldout,readout_gap:gap,
        protocol:report.protocol,controls:report.controls};
      const s=JSON.stringify(payload);
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),
        b=>b.toString(16).padStart(2,'0')).join('');
      const uri=URL.createObjectURL(new Blob([JSON.stringify({...payload,sha256:hash,
        hash_note:'SHA256 over JSON.stringify(payload), excludes hash fields; not authenticated.'},null,2)+'\n'],
        {type:'application/json'}));
      const link=document.createElement('a');link.href=uri;link.download='phimirrorhex-e10-heldout.json';
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(uri),1000);
      setNotice('Synthetic held-out policy receipt exported.');
    }catch(err){setNotice('Export unavailable: '+err.message);}
  }
  return <section className="general-page">
    <div className="general-hero"><div>
      <div className="eyebrow">E10 / INDEPENDENT CAUSAL GENERALIZATION · SEALED SENSOR POLICIES</div>
      <h2>Does the <em>Keyhole</em> generalize?</h2>
      <p>Choose the six-scale observation budget. We select its best mask on training data, freeze it, and see how it performs on unseen source patterns and interventions. The failures count, too.</p>
      <div className="general-tags"><span>48 TRAIN</span><span>24 VALIDATE</span><span>48 HELD-OUT</span><span>50% NEW DENSE PATTERNS</span></div>
    </div><div className="general-hero-aside"><small>THE RULE OF THIS EXPERIMENT</small><strong>Freeze the mask.<br/>Change the world.</strong><p>Holdout answers can evaluate the choice, never redesign it.</p></div></div>

    <div className="general-metrics">
      <Metric label="SENSORS INSPECTED" value={budget+'/6'} foot="Identical budget for both readouts"/>
      <Metric label="TRAIN DETECTIONS" value={policy.train_detected+'/48'} foot="Sensor mask selected here only"/>
      <Metric label="VALIDATION DETECTIONS" value={policy.validation_detected+'/24'} foot="Independent sparse draws"/>
      <Metric label="HELD-OUT DETECTIONS" value={selected+'/48'} foot="Mixed sparse + unseen dense patterns"/>
    </div>
    <section className="surface general-config">
      <Heading eyebrow="01 / FROZEN DESIGN" title="Set the observer"/>
      <div className="general-settings">
        <div className="general-control"><label htmlFor="general-budget">Number of sampled channels <b>{budget} of 6</b></label>
          <input id="general-budget" type="range" min="0" max="6" step="1" value={budget} onChange={e=>setBudget(Number(e.target.value))}/>
          <p>For each budget, every candidate mask is scored on training episodes; ties favor the lowest mask ID.</p>
        </div>
        <div className="general-control"><label htmlFor="general-observer">Measurement operator</label>
          <select id="general-observer" value={readout} onChange={e=>setReadout(e.target.value)}>
            <option value="identity_max">Keep sector identity (max gap)</option>
            <option value="masked_sum">Collapse chosen sectors to sum</option>
          </select>
          <p>Both operators inspect the exact same frozen sensor mask at this budget.</p>
        </div>
      </div>
      <div className="general-selected"><div><small>TRAIN-SELECTED MASK</small><strong>{chosen.toString(2).padStart(6,'0')}</strong></div>
        <div><small>IDENTITIES RETAINED</small><strong>{exampleIndices.length?exampleIndices.map(i=>'S'+i).join(' · '):'NONE'}</strong></div>
        <div><small>MODEL RETUNING</small><strong>OFF</strong></div></div>
    </section>

    <section className="surface general-shift">
      <Heading eyebrow="02 / OUT-OF-DISTRIBUTION EVALUATION" title="Change the intervention"/>
      <div className="general-scenarios" role="group" aria-label="Select a held-out intervention">
        {SCENARIOS.map(s=><button key={s} type="button" aria-pressed={scenario===s}
          className={scenario===s?'active':''} onClick={()=>setScenario(s)}><b>{TITLES[s]}</b><small>{s==='shifted_probe'?'NEW PROBE LOCATION':s==='matched_probe'?'TRAIN-LIKE PROBE':'CONTROL'}</small></button>)}
      </div>
      <p className="general-scenario-text">{EXPLAIN[scenario]}</p>
      <div className="general-chart-grid">
        <div><h3>Held-out detector comparison</h3>
          <Comparison selected={selected} reference={reference}
            ceiling={scenario==='matched_probe'?policy.posthoc_best_test_count_diagnostic_only:selected}
            total={48}/>
          <p className="general-chart-note">{scenario==='matched_probe'
            ?'Post-hoc best is an unattainable oracle, shown only to expose generalization regret.'
            :'Post-hoc oracle is omitted for shifted controls; the third bar repeats the frozen selection.'}</p>
        </div>
        <div><h3>Budget-by-budget coverage</h3>
          <div className="general-budget-table">{budgets.map(p=><button key={p.budget} type="button"
            className={p.budget===budget?'active':''} onClick={()=>setBudget(p.budget)}>
            <span>{p.budget} sensors</span>
            <div className="general-budget-track"><div style={{width:percent(p.heldout_detected[scenario],48)}}/></div>
            <strong>{p.heldout_detected[scenario]}/48</strong>
          </button>)}</div>
          <p className="general-chart-note">Every row uses a separate sensor-budget-specific policy selected on training, not on this chart's test values.</p>
        </div>
      </div>
    </section>

    <section className="surface general-inspection">
      <Heading eyebrow="03 / PAIRWISE SENSOR INSPECTOR" title="See an unseen pair"/>
      <div className="general-example-switches" role="group" aria-label="Choose a frozen holdout example">
        {report.heldout_examples.map((item,i)=><button key={item.id} type="button"
          className={i===example?'active':''} aria-pressed={i===example}
          onClick={()=>setExample(i)}>{i+1}<small>{item.family.toUpperCase()}</small></button>)}
      </div>
      <div className="general-hexes">
        <OuterHex values={e.a} mask={chosen} label="A · Outer state"/>
        <OuterHex values={e.b} mask={chosen} label="B · Outer state"/>
      </div>
      <div className="general-case-result"><div><small>CASE {heldout.id}</small>
        <strong>{heldout.family==='dense'?'New dense family':'Previously seen sparse family'}</strong></div>
        <div><small>SELECTED OPERATOR GAP</small><strong>{fmt(gap)}</strong></div>
        <div><small>DETECTION FLOOR</small><strong>{fmt(FLOOR)}</strong></div>
        <div className={detected?'general-detected':'general-blind'}><small>OBSERVABLE?</small><strong>{detected?'YES':'NO'}</strong></div>
      </div>
    </section>
    <div className="general-claim"><div><b>A held-out toy is not proof of real-world causal generalization.</b>
      <p>We preregister the split seeds, finite intervention operators, and mask-selection rule. The six-sector states are generated, not measured from people, crystals, biology, photons, or actual agents. The same 48 held-out episodes are used for each comparison. Results are descriptive finite counts, not statistical confidence bounds or physical principles.</p>
      <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E10_CAUSAL_GENERALIZATION.md" target="_blank" rel="noreferrer">READ FROZEN E10 METHOD ↗</a></div>
      <button type="button" className="ghost-button" onClick={exportReceipt}>↓ EXPORT FROZEN RESULT</button></div>
    {notice&&<p className="general-notice" role="status">{notice}</p>}
  </section>;
}
