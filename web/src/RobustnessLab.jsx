import {useMemo,useState} from 'react';
import {robustnessBenchmark,SCENARIOS,perturb} from './robustness-model.mjs';
import {PROFILES,TEST_SEED,sampleFeatures} from './coherence-model.mjs';
import './robustness-lab.css';

const NAMES={equal:'Equal',phi_inner:'Φ inward',phi_outer:'Φ outward',center:'Center',alternating:'Alternating'};
const SCENE_NAMES={clean:'Clean baseline',noise:'Noisy input',dropout:'Sensor dropout',mean_only:'Mean-only compression'};
const SCENE_TEXT={
  clean:'The negative control: every six-scale reading is passed through untouched.',
  noise:'Independent bounded noise is added to each input, without altering the ground-truth labels.',
  dropout:'Readings at scales 1 and 4 are replaced by neutral 0.5, with labels unchanged.',
  mean_only:'All six distinct readings collapse to one arithmetic mean. Information about which scale had which value is lost.'
};
const ICONS={clean:'◌',noise:'≈',dropout:'⊠',mean_only:'≡'};
const fmt=x=>Number(x).toFixed(5);
const pct=x=>(x*100).toFixed(1)+'%';
const COLORS={equal:'#88d5df',phi_inner:'#b49ae8',phi_outer:'#edba7d',center:'#7cdab0',alternating:'#e79caf'};
function Metric({label,value,sub,tone}){
  return <div className={'rob-metric '+(tone||'')}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>;
}
function ShiftPlot({world,scenario,selected,onSelect}) {
  const values=PROFILES.map(initial=>({initial,
    mae:world.models[initial].scenarios[scenario].mae,
    clean:world.models[initial].scenarios.clean.mae
  }));
  const high=Math.max(.02,...values.map(v=>v.mae));
  return <div className="rob-plot">
    {values.map(row=><button type="button" key={row.initial} aria-pressed={selected===row.initial}
      onClick={()=>onSelect(row.initial)} className={'rob-plot-row'+(selected===row.initial?' chosen':'')}>
      <div className="rob-plot-label"><i style={{background:COLORS[row.initial]}}/><span>{NAMES[row.initial]}</span></div>
      <div className="rob-plot-track"><div style={{width:pct(row.mae/high),background:COLORS[row.initial]}}/></div>
      <strong>{fmt(row.mae)}</strong>
      <small>Δ {row.mae-row.clean>=0?'+':''}{fmt(row.mae-row.clean)} vs clean</small>
    </button>)}
  </div>;
}
function SensorView({scenario}) {
  const source=sampleFeatures(TEST_SEED,0).features;
  const changed=perturb(source,0,scenario);
  return <div className="rob-sensors">
    {source.map((x,i)=><div key={i} className="rob-sensor">
      <span>R{i}</span>
      <div className="rob-sensor-column">
        <div className="rob-sensor-track"><div style={{height:pct(x)}}/></div>
        <div className="rob-sensor-track shifted"><div style={{height:pct(changed[i])}}/></div>
      </div>
      <strong>{changed[i].toFixed(3)}</strong>
    </div>)}
    <div className="rob-sensor-key"><span><i/> Clean</span><span><i/> Shifted</span></div>
  </div>;
}
export default function RobustnessLab(){
  const result=useMemo(()=>robustnessBenchmark(),[]);
  const [world,setWorld]=useState('equal');
  const [scenario,setScenario]=useState('noise');
  const [model,setModel]=useState('equal');
  const [memoryStep,setMemoryStep]=useState(10);
  const [notice,setNotice]=useState('');
  const row=result.worlds.find(r=>r.world===world);
  const measure=row.models[model].scenarios[scenario];
  const clean=row.models[model].scenarios.clean;
  const delta=measure.mae-clean.mae;
  const selected=row.selected_on_prior_validation;
  const memory=result.memory_keyhole.cases.find(r=>r.step===memoryStep);
  const sameCost=measure.weighted_terms===6&&measure.case_count===128;
  const shiftWinner=PROFILES.reduce((best,p)=>row.models[p].scenarios[scenario].mae <
    row.models[best].scenarios[scenario].mae?p:best,PROFILES[0]);
  async function save(){
    try{
      const payload={...result,viewer:{world,scenario,model,memoryStep}};
      const raw=JSON.stringify(payload);
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))),
        x=>x.toString(16).padStart(2,'0')).join('');
      const blob=new Blob([JSON.stringify({...payload,browser_sha256:hash,browser_digest_note:'SHA-256 over JSON.stringify(payload) before browser checksum; not authenticated.'},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='phimirrorhex-e8-'+world+'-'+scenario+'.json';
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Synthetic robustness report exported locally.');
    }catch(error){setNotice('Export failed: '+error.message);}
  }
  return <section className="robustness-page">
    <header className="rob-hero">
      <div><div className="eyebrow">E8 / ROBUSTNESS & MEMORY COMPRESSION · CONTROLLED TEST ENVIRONMENTS</div>
        <h2>What survives <em>disturbance?</em></h2>
        <p>Freeze the E7 learners. Change their synthetic inputs without moving the target. Test noise, missing information, and complete scale-identity compression. No shift-driven retraining. No convenient rewriting of the answer key.</p>
        <div className="rob-hero-tags"><span>5 WORLDS</span><span>5 FROZEN LEARNERS</span><span>4 INPUT SCENARIOS</span><span>128 MATCHED CASES</span></div>
      </div>
      <div className="rob-hero-equation"><span>THE QUESTION</span><strong>Input changes.<br/>Truth stays fixed.</strong><p>Same learned parameters. Same label. Same six-term inference budget.</p></div>
    </header>

    <section className="surface rob-configuration">
      <div className="panel-header"><div><div className="eyebrow">01 / ENGINEERED TARGET ENVIRONMENT</div><h2>Freeze the world</h2></div><span className="panel-badge">TEST SEED 203</span></div>
      <div className="rob-world-grid">{PROFILES.map(p=><button key={p} type="button" className={p===world?'active':''} aria-pressed={p===world}
        onClick={()=>{setWorld(p);setModel(p)}}><span style={{color:COLORS[p]}}>◆</span><b>{NAMES[p]}</b><small>Programmed target</small></button>)}</div>
      <p className="rob-footnote">E6 programmed each target. The E7 training and validation are completed before these input shifts are applied.</p>
    </section>

    <section className="rob-scenario-grid" aria-label="Select a controlled synthetic input transformation">
      {SCENARIOS.map(s=><button type="button" key={s} onClick={()=>setScenario(s)} aria-pressed={scenario===s}
        className={'rob-scenario-card'+(scenario===s?' active':'')}><span className="rob-scenario-icon">{ICONS[s]}</span>
        <b>{SCENE_NAMES[s]}</b><small>{s==='clean'?'NO-OP NEGATIVE CONTROL':s==='noise'?'BOUNDED INDEPENDENT NOISE':s==='dropout'?'RINGS 1 + 4 LOST':'ALL RING IDENTITIES COLLAPSE'}</small>
      </button>)}
    </section>

    <div className="rob-metrics">
      <Metric label="CURRENT HELD-OUT MAE" value={fmt(measure.mae)} sub={SCENE_NAMES[scenario]}/>
      <Metric label="CLEAN MAE" value={fmt(clean.mae)} sub="Same frozen learner and test labels"/>
      <Metric label="ERROR CHANGE" value={(delta>=0?'+':'')+fmt(delta)} sub="Shift MAE minus clean MAE" tone={delta>0?'warn':'good'}/>
      <Metric label="E7 VALIDATION PICK" value={NAMES[selected]} sub="Not reselected after perturbation"/>
    </div>

    <div className="rob-main-grid">
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">02 / FROZEN LEARNER SCOREBOARD</div><h2>Change without retraining</h2></div><span className="panel-badge">LOWER MAE = BETTER</span></div>
        <div className="rob-panel-body"><p>{SCENE_TEXT[scenario]}</p><ShiftPlot world={row} scenario={scenario} selected={model} onSelect={setModel}/>
          <div className="rob-selection"><strong>{NAMES[model]}</strong> started with a six-scale profile, learned on E7 training data, and now receives <b>{SCENE_NAMES[scenario].toLowerCase()}</b>. The best model under this shift happens to be <strong>{NAMES[shiftWinner]}</strong>, but it is shown as a post-hoc diagnostic, not selected for deployment.</div>
        </div>
      </section>
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">03 / FEATURE CHANNEL INSTRUMENT</div><h2>What the sensor sees</h2></div><span className="panel-badge">HELD-OUT CASE 0</span></div>
        <div className="rob-panel-body"><SensorView scenario={scenario}/>
          <p className="rob-sensor-note">Each pair compares one clean input against its altered measurement. Fixed target values are not regenerated for the shifted sensors.</p>
          <div className="rob-budget-line"><span>READINGS PER CASE</span><strong>6</strong><span>WEIGHTED TERMS</span><strong>6</strong></div>
          <p className="rob-sensor-note">{sameCost?'Per-inference operation counts are matched among all frozen learners.':'Unexpected operation-count contract mismatch.'} The untrained equal reference remains descriptive and is not a training-cost-matched competitor.</p>
        </div>
      </section>
    </div>

    <section className="surface rob-memory-panel">
      <div className="panel-header"><div><div className="eyebrow">04 / NBG KEYHOLE MEMORY CONTROL</div><h2>What compression forgets</h2></div><span className="panel-badge">E5 · READ ONLY</span></div>
      <div className="rob-memory-body">
        <div className="rob-memory-choices" role="group" aria-label="Select E5 observability frame">
          {[10,12].map(step=><button key={step} type="button" onClick={()=>setMemoryStep(step)}
            className={memoryStep===step?'active':''} aria-pressed={memoryStep===step}>FRAME {step} <small>{step===10?'HIDDEN ARRIVAL':'AFTER PROBE'}</small></button>)}
        </div>
        <div className="rob-memory-metrics">
          <div><span>FULL SIX-SECTOR MEMORY</span><strong>{memory.full_state_correct_of_two}/2</strong><small>Constructed identity task</small></div>
          <div><span>SUM-ONLY KEYHOLE</span><strong>{memory.sum_only_correct_of_two}/2</strong><small>Coarse-only task</small></div>
          <div><span>LATENT OUTER L1 DISTANCE</span><strong>{fmt(memory.full_state_l1_difference)}</strong><small>Internal-state difference</small></div>
        </div>
        <div className="rob-memory-projections"><div><span>STATE A · COARSE SUM</span><strong>{fmt(memory.outer_a)}</strong></div><div><span>STATE B · COARSE SUM</span><strong>{fmt(memory.outer_b)}</strong></div></div>
        <p>At frame 10, the two outer-ring states differ internally but collapse to the same summed observation. At frame 12, the fixed E5 intervention makes that difference visible. This is a deliberate two-case observability demonstration, <strong>not</strong> a learned reconstruction or a measurement of someone's mind.</p>
      </div>
    </section>

    <div className="rob-firewall"><div><b>Ledger first. A win in an engineered simulation isn't a law of nature.</b>
      <p>All E8 inputs and labels are synthetic. A noisy-input result doesn't certify adversarial safety. The Keyhole demonstration is independent of learning, preserves its SIMULATED provenance, and grants no authority to agents or machines.</p>
      <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E8_ROBUSTNESS_MEMORY.md" target="_blank" rel="noreferrer">READ E8 FROZEN METHOD ↗</a></div>
      <button className="ghost-button" type="button" onClick={save}>↓ EXPORT EXPERIMENT JSON</button>
    </div>
    {notice&&<div className="rob-notice" role="status">{notice}</div>}
  </section>;
}
