import {useMemo,useState} from 'react';
import {adaptiveBenchmark,CHECKPOINTS} from './adaptive-model.mjs';
import {PROFILES} from './coherence-model.mjs';
import './adaptive-lab.css';

const NAMES={
  equal:'Equal start',
  phi_inner:'Φ inward start',
  phi_outer:'Φ outward start',
  center:'Center start',
  alternating:'Alternating start'
};
const SHORT={equal:'EQUAL',phi_inner:'Φ IN',phi_outer:'Φ OUT',center:'CENTER',alternating:'ALT'};
const COLORS={equal:'#7ce0ea',phi_inner:'#c3a4ef',phi_outer:'#eebd82',center:'#80dcb2',alternating:'#e790a3'};
const SCALE_COLORS=['#71dce6','#baa6ec','#e9b87d','#75dbaf','#ea9e9c','#9ab8ef'];
const fmt=x=>Number(x).toFixed(5);
const pct=x=>(x*100).toFixed(1)+'%';

function Metric({label,value,note,positive=false}){
  return <div className={'adaptive-metric'+(positive?' positive':'')}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
function WeightChart({model,checkpoint,active}){
  const snapshot=model.snapshots[checkpoint];
  return <div className="adaptive-weight-chart">
    <div className="adaptive-weight-caption"><span>TRAINING STEP {snapshot.updates}</span><strong>Σw = 1.000</strong></div>
    <div className="adaptive-weight-columns">{snapshot.weights.map((weight,k)=><div key={k}>
      <div className="adaptive-weight-track"><div style={{height:pct(weight),background:SCALE_COLORS[k]}}/></div>
      <b>{pct(weight)}</b><small>R{k}</small></div>)}</div>
    <p>Positive normalized weights. Each bar represents one synthetic input scale, not a measured physiological region.</p>
    <div className="adaptive-checkpoint-track" role="group" aria-label="Training checkpoint">
      {CHECKPOINTS.map((n,k)=><button key={n} aria-pressed={checkpoint===k} className={checkpoint===k?'on':''}
        onClick={()=>active(k)}><span>{n}</span></button>)}
    </div>
  </div>;
}
function ErrorRows({result,active,onActive}){
  const max=Math.max(...PROFILES.map(p=>result.models[p].held_out.mae),.01);
  return <div className="adaptive-ranking">
    {PROFILES.map(profile=>{
      const model=result.models[profile];
      const selected=profile===result.selected_on_validation;
      return <button type="button" key={profile} aria-pressed={active===profile}
        className={'adaptive-ranking-row'+(active===profile?' active':'')}
        onClick={()=>onActive(profile)}>
        <div className="adaptive-ranking-label"><span style={{background:COLORS[profile]}}/><b>{NAMES[profile]}</b>
          {selected&&<small>VAL PICK</small>}</div>
        <strong>{fmt(model.held_out.mae)}</strong>
        <div className="adaptive-error-track"><div style={{width:pct(model.held_out.mae/max),background:COLORS[profile]}}/></div>
        <small className="adaptive-ranking-meta">fixed {fmt(model.fixed_initial_held_out.mae)} · train steps {model.train_updates}</small>
      </button>;
    })}
  </div>;
}
function LearningTrace({model}){
  const vals=model.snapshots.map(s=>s.weights);
  const graphW=670,graphH=210;
  const xx=i=>22+(graphW-44)*i/(vals.length-1),yy=w=>graphH-17-w*(graphH-33);
  return <div className="adaptive-learning-trace">
    <div className="adaptive-trace-labels">{[0,1,2,3,4,5].map((k)=><span key={k}><i style={{background:SCALE_COLORS[k]}}/> Ring {k}</span>)}</div>
    <svg viewBox={'0 0 '+graphW+' '+graphH} preserveAspectRatio="none" role="img"
      aria-label="Six learned weight trajectories from zero to 128 training updates">
      {[.25,.5,.75,1].map(val=><line key={val} x1="0" x2={graphW} y1={yy(val)} y2={yy(val)} stroke="#315062" strokeWidth=".8" strokeDasharray="4 6"/>)}
      {Array.from({length:6},(_,k)=><path key={k} fill="none" stroke={SCALE_COLORS[k]}
        vectorEffect="non-scaling-stroke" strokeWidth="2.5"
        d={vals.map((weights,i)=>(i?'L':'M')+xx(i).toFixed(1)+' '+yy(weights[k]).toFixed(1)).join(' ')}/>)}
      <text x="8" y="17" fill="#9bb8c7" fontSize="11">1.0</text>
    </svg>
    <div className="adaptive-trace-axis">{CHECKPOINTS.map(k=><span key={k}>{k}</span>)}</div>
  </div>;
}

export default function AdaptiveLab(){
  const result=useMemo(()=>adaptiveBenchmark(),[]);
  const [world,setWorld]=useState('equal');
  const [profile,setProfile]=useState('equal');
  const [checkpoint,setCheckpoint]=useState(5);
  const [notice,setNotice]=useState('');
  const row=result.worlds.find(x=>x.world===world);
  const selected=row.selected_on_validation;
  const trial=row.models[profile];
  const winner=row.models[selected];
  const negative=row.matched_label_shuffle_control;
  const audit=result.causal_audit;
  const holdoutMAE=trial.held_out.mae;
  const originalMAE=trial.fixed_initial_held_out.mae;
  const change=holdoutMAE-originalMAE;
  const bestTest=PROFILES.reduce((p,k)=>row.models[k].held_out.mae<row.models[p].held_out.mae?k:p,PROFILES[0]);
  function chooseWorld(value){setWorld(value);setProfile(value);setCheckpoint(5);}
  async function exportReceipt(){
    try{
      const payload={...result,selected_world:world,inspected_model:profile,selected_checkpoint:CHECKPOINTS[checkpoint]};
      const bytes=JSON.stringify(payload);
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(bytes))),
        b=>b.toString(16).padStart(2,'0')).join('');
      const bundle=JSON.stringify({...payload,browser_sha256:hash,
        browser_digest_note:'SHA-256 of JSON.stringify(payload) before browser digest fields; integrity only, not authenticated'},null,2)+'\n';
      const url=URL.createObjectURL(new Blob([bundle],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='phimirrorhex-e7-'+world+'.json';
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Synthetic adaptive E7 report saved locally.');
    }catch(err){setNotice('Export unavailable: '+err.message);}
  }
  return <div className="adaptive-page">
    <div className="adaptive-hero">
      <div>
        <div className="eyebrow">E7 / ADAPTIVE NESTED COHERENCE · FREEZE 201 / 202 / 203</div>
        <h2>Can the gears <em>learn?</em></h2>
        <p>Test five different six-scale starting patterns with identical online feedback. Every learner sees the same training examples, gets the same update count, and faces a genuinely untouched synthetic test split.</p>
        <div className="adaptive-hero-tags"><span>128 UPDATES</span><span>6 WEIGHTS</span><span>5 INITIALIZATIONS</span><span>HOLDOUT SEALED</span></div>
      </div>
      <div className="adaptive-formula"><span>FROZEN UPDATE RULE</span><strong>w'ᵢ ∝ wᵢ · e<sup>−η∂L/∂wᵢ</sup></strong>
        <p>Positive simplex · η = 2.0 · one online pass</p>
        <div>TRAIN 201 <b>→</b> VALIDATE 202 <b>→</b> TEST 203</div>
      </div>
    </div>

    <section className="surface adaptive-world-panel">
      <div className="panel-header"><div><div className="eyebrow">01 / GROUND TRUTH</div><h2>Choose the synthetic world</h2></div><span className="panel-badge">ENGINEERED LABELS</span></div>
      <div className="adaptive-world-body">
        <div className="adaptive-world-options" role="group" aria-label="Synthetic target world">
          {PROFILES.map(name=><button key={name} className={world===name?'on':''} aria-pressed={world===name}
            onClick={()=>chooseWorld(name)}><span style={{color:COLORS[name]}}>●</span><b>{SHORT[name]}</b><small>{NAMES[name]}</small></button>)}
        </div>
        <p>Every world is explicitly generated from one of these profiles. A winner in its own designed world is a software sanity check, not a discovered universal law.</p>
      </div>
    </section>

    <div className="adaptive-metrics">
      <Metric label="VALIDATION SELECTED" value={SHORT[selected]} note="Selected without accessing test"/>
      <Metric label="SELECTED TEST MAE" value={fmt(winner.held_out.mae)} note="128 untouched synthetic cases" positive/>
      <Metric label="EQUAL-START TEST MAE" value={fmt(row.models.equal.held_out.mae)} note="Same updates and learning rule"/>
      <Metric label="BEST TEST (DIAGNOSTIC)" value={SHORT[bestTest]} note="Post-hoc inspection, not selection"/>
    </div>

    <div className="adaptive-grid">
      <section className="surface adaptive-ranking-panel">
        <div className="panel-header"><div><div className="eyebrow">02 / MATCHED ONLINE LEARNING</div><h2>Holdout scoreboard</h2></div><span className="panel-badge">MAE · LOWER IS BETTER</span></div>
        <div className="adaptive-ranking-body">
          <p>All adaptive starts perform 128 updates. Fixed-profile MAE is displayed as an <strong>untrained control</strong>, not an equal-compute training arm.</p>
          <ErrorRows result={row} active={profile} onActive={name=>{setProfile(name);setCheckpoint(5);}}/>
          <div className="adaptive-ranking-note">
            <b>{NAMES[profile]}</b> test MAE: {fmt(holdoutMAE)}; unchanged initial profile: {fmt(originalMAE)}.
            <span style={{color:change<0?'#8ee4bd':'#e7b18a'}}> {change<0?'Lower':'Higher or equal'} error after feedback ({change>=0?'+':''}{fmt(change)}).</span>
          </div>
        </div>
      </section>
      <section className="surface adaptive-weights-panel">
        <div className="panel-header"><div><div className="eyebrow">03 / WEIGHT EVOLUTION</div><h2>See the gears adapt</h2></div><span className="panel-badge">{SHORT[profile]}</span></div>
        <div className="adaptive-weight-body"><WeightChart model={trial} checkpoint={checkpoint} active={setCheckpoint}/>
          <div className="adaptive-param-summary"><div><small>TRAINING UPDATES</small><strong>{trial.train_updates}</strong></div><div><small>FEATURE READINGS</small><strong>{trial.train_readings}</strong></div><div><small>GRADIENT TERMS</small><strong>{trial.gradient_terms}</strong></div></div>
        </div>
      </section>
    </div>

    <section className="surface adaptive-trace-panel">
      <div className="panel-header"><div><div className="eyebrow">04 / TRAINING LEDGER</div><h2>Where each scale's influence moves</h2></div><span className="panel-badge">6 POSITIVE WEIGHTS</span></div>
      <LearningTrace model={trial}/>
    </section>

    <div className="adaptive-lower">
      <section className="surface adaptive-controls-panel">
        <div className="panel-header"><div><div className="eyebrow">05 / NEGATIVE CONTROL</div><h2>Break the feedback</h2></div><span className="panel-badge">128 MATCHED STEPS</span></div>
        <div className="adaptive-controls-body">
          <p>Take the <strong>validation-selected initialization</strong>, shift its training labels by 47 cases, and still give it the same 128 updates. Then score both on the original held-out labels.</p>
          <div className="adaptive-control-values">
            <div><small>CORRECTLY PAIRED FEEDBACK</small><strong>{fmt(winner.held_out.mae)}</strong></div>
            <div><small>SHIFTED TRAINING LABELS</small><strong>{fmt(negative.held_out.mae)}</strong></div>
          </div>
          <div className="adaptive-rule">The negative-control learner is not allowed to change the chosen initialization or learning rate after seeing test data.</div>
        </div>
      </section>
      <section className="surface adaptive-audit-panel">
        <div className="panel-header"><div><div className="eyebrow">06 / NBG KEYHOLE AUDIT</div><h2>Hidden before visible</h2></div><span className="panel-badge">E5 · READ ONLY</span></div>
        <div className="adaptive-audit-body">
          <p>The E5 delayed-conveyor witness is inspected alongside training, <strong>not used as a learning feature</strong>.</p>
          <div className="adaptive-audit-timeline">
            <div><span>FRAME 10 · HIDDEN ARRIVAL</span><strong>{fmt(audit.step_10.outer_hidden_difference)}</strong><small>Outer internal difference, Keyhole gap {fmt(audit.step_10.coarse_gap)}</small></div>
            <div><span>FRAME 12 · PROBE REVELATION</span><strong>{fmt(audit.step_12.coarse_gap)}</strong><small>Visible coarse separation from a fixed synthetic probe</small></div>
          </div>
          <div className="adaptive-audit-gate"><span>CAUSAL WITNESS FED TO LEARNER</span><strong>NO</strong></div>
        </div>
      </section>
    </div>
    <div className="adaptive-warning"><div><b>SIMULATED ≠ OBSERVED. Correlation ≠ causation. Initializing with φ ≠ proving φ is best.</b>
      <p>E7 tests engineered, known ground-truth data with a fixed optimizer. The causal audit is independently constructed. No physiological, conscious, or physical property is being measured; no agent is being given permission to act.</p>
      <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E7_ADAPTIVE_NESTED_COHERENCE.md" target="_blank" rel="noreferrer">READ FROZEN E7 PROTOCOL ↗</a></div>
      <button className="ghost-button" type="button" onClick={exportReceipt}>↓ EXPORT E7 LEDGER</button>
    </div>
    {notice&&<div className="adaptive-notice" role="status">{notice}</div>}
  </div>;
}
