import {useMemo,useState} from 'react';
import {coherenceBenchmark,PROFILES,WEIGHTS,TEST_SEED,SAMPLES,sampleFeatures} from './coherence-model.mjs';
import './coherence-lab.css';

const TITLES = {
  equal:'Equal influence',
  phi_inner:'Φ · inward-biased',
  phi_outer:'Φ · outward-biased',
  center:'Center-weighted',
  alternating:'Alternating',
};
const SHORT = {equal:'EQUAL',phi_inner:'Φ IN',phi_outer:'Φ OUT',center:'CENTER',alternating:'ALT'};
const colors = {
  equal:'#8fcbdc',
  phi_inner:'#b39be6',
  phi_outer:'#e4bc83',
  center:'#7bdaa9',
  alternating:'#e78e9f',
};
const n3=x=>Number(x).toFixed(4);
const errorPct=(a,b)=>b===0?'–':((a-b)/b*100).toFixed(1)+'%';

function LayerBars({profile,features}) {
  const data=WEIGHTS[profile];
  return <div className="coh-weights">
    {data.map((w,i)=><div key={i} className="coh-weight-cell">
      <div className="coh-weight-bar-track">
        <div className="coh-weight-bar" style={{height:(w/Math.max(...data)*100)+'%',background:colors[profile]}}/>
      </div>
      <strong>{(w*100).toFixed(1)}%</strong>
      <small>R{i}</small>
      <span>{(features[i]*100).toFixed(0)}% x</span>
    </div>)}
  </div>;
}

function ProfileTable({result}) {
  const max=Math.max(...PROFILES.map(p=>result.held_out[p].mae));
  return <div className="coh-profile-table">
    {PROFILES.map(profile=>{
      const row=result.held_out[profile];
      const win=profile===result.selected_on_validation;
      return <div key={profile} className={'coh-row'+(win?' champion':'')}>
        <div className="coh-row-name"><i style={{background:colors[profile]}}/>{TITLES[profile]}{win&&<span>VALIDATION PICK</span>}</div>
        <div className="coh-row-bar-area"><div className="coh-row-track"><div style={{width:(row.mae/max*100)+'%',background:colors[profile]}}/></div></div>
        <strong>{n3(row.mae)}</strong>
        <small>RMSE {n3(row.rmse)}</small>
      </div>;
    })}
  </div>;
}

function ScoreCard({label,value,detail}) {
  return <div className="coh-scorecard"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

export default function CoherenceLab() {
  const data=useMemo(()=>coherenceBenchmark(),[]);
  const [world,setWorld]=useState('equal');
  const [index,setIndex]=useState(0);
  const [profile,setProfile]=useState('phi_outer');
  const [split,setSplit]=useState('held_out');
  const [notice,setNotice]=useState('');
  const result=data.results.find(r=>r.regime===world);
  const row=result[split];
  const winner=result.selected_on_validation;
  const example=useMemo(()=>{
    const {features,noise}=sampleFeatures(TEST_SEED,index);
    const dot=weights=>weights.reduce((sum,w,i)=>sum+w*features[i],0);
    return {features,noise,target:dot(WEIGHTS[world])+noise,
      predictions:Object.fromEntries(PROFILES.map(p=>[p,dot(WEIGHTS[p])]))};
  },[world,index]);
  const bestHeldOut=PROFILES.reduce((best,p)=>result.held_out[p].mae<result.held_out[best].mae?p:best,PROFILES[0]);
  const equalTest=result.held_out.equal.mae;
  const chosenTest=result.held_out[winner].mae;
  const phiTest=result.held_out.phi_outer.mae;
  function reset(){setWorld('equal');setIndex(0);setProfile('phi_outer');setSplit('held_out');}
  async function exportReport(){
    try{
      const receipt={
        ...data,
        selected_regime:world,
        selected_candidate:profile,
        selected_index:index,
        context:'Synthetic replay record. Models are evaluated on engineered labels, not measured biology or consciousness.'
      };
      const source=JSON.stringify(receipt);
      const fingerprint=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source));
      const hex=Array.from(new Uint8Array(fingerprint),b=>b.toString(16).padStart(2,'0')).join('');
      const bytes=JSON.stringify({...receipt,browser_sha256:hex,
        browser_hash_note:'SHA256 of JSON.stringify(receipt) without browser digest/note; not a signature.'},null,2);
      const url=URL.createObjectURL(new Blob([bytes],{type:'application/json'}));
      const a=document.createElement('a');
      a.href=url;a.download='phimirrorhex-e6-'+world+'.json';document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Engineered E6 results exported as synthetic JSON.');
    }catch(err){setNotice('Export unavailable: '+err.message);}
  }
  return <section className="coherence-page">
    <div className="coh-hero">
      <div>
        <div className="eyebrow">E6 / COHERENCE ACROSS SCALES · HELD-OUT COMPARISONS</div>
        <h2>Does <em>Φ</em> actually help?</h2>
        <p>Five deliberately constructed synthetic worlds. Five competing weighting schemes. Equal computation, frozen validation selection, and an independent test split. We record the winner even when it isn't phi.</p>
        <div className="coh-hero-pills"><span>6 INPUT SCALES</span><span>5 × 5 COMPARISONS</span><span>128 HELD-OUT CASES / WORLD</span></div>
      </div>
      <div className="coh-equation">
        <span>FROZEN RESEARCH QUESTION</span>
        <strong>ŷ = Σ wᵢ xᵢ</strong>
        <p>Which six-weight profile best estimates the programmed target?</p>
        <div>φ = 1.6180339887…</div>
      </div>
    </div>

    <div className="coh-world-picker">
      <div className="coh-picker-top"><div><div className="eyebrow">01 / SELECT A PROGRAMMED WORLD</div><h3>Change the ground truth</h3></div><button onClick={reset} type="button" className="ghost-button">↺ RESET LAB</button></div>
      <div className="coh-world-grid">
        {PROFILES.map(p=><button key={p} type="button" onClick={()=>{setWorld(p);setIndex(0);setProfile(p);}}
          aria-pressed={world===p} className={'coh-world-choice'+(world===p?' selected':'')}>
          <span style={{color:colors[p]}}>●</span><b>{SHORT[p]}</b><small>{TITLES[p]}</small>
        </button>)}
      </div>
      <p>The generator uses the displayed scheme to construct the target. This is an intentional sanity test, not evidence that natural systems follow that scheme.</p>
    </div>

    <div className="coh-metrics">
      <ScoreCard label="VALIDATION PICK" value={SHORT[winner]} detail="Chosen without the test split"/>
      <ScoreCard label="PICKED MODEL TEST MAE" value={n3(chosenTest)} detail="Lower is better"/>
      <ScoreCard label="EQUAL BASELINE TEST MAE" value={n3(equalTest)} detail="Identical computational cost"/>
      <ScoreCard label="Φ-OUT TEST VS EQUAL" value={errorPct(phiTest,equalTest)} detail="Relative MAE, not a natural-law effect"/>
    </div>

    <div className="coh-main">
      <section className="surface coh-ranking-panel">
        <div className="panel-header"><div><div className="eyebrow">02 / BENCHMARK SCOREBOARD</div><h2>Six-scale error comparisons</h2></div><span className="panel-badge">MAE · LOWER IS BETTER</span></div>
        <div className="coh-ranking-body">
          <div className="coh-switch" role="group" aria-label="Benchmark split">
            <button aria-pressed={split==='held_out'} className={split==='held_out'?'on':''} onClick={()=>setSplit('held_out')}>HELD-OUT TEST</button>
            <button aria-pressed={split==='validation'} className={split==='validation'?'on':''} onClick={()=>setSplit('validation')}>VALIDATION</button>
          </div>
          <ProfileTable result={{...result,held_out:row}}/>
          <div className="coh-ranking-info"><strong>{TITLES[bestHeldOut]}</strong> is the best held-out model for the <b>{TITLES[world]}</b> programmed regime. <b>{TITLES[winner]}</b> was selected on validation alone.</div>
        </div>
      </section>
      <section className="surface coh-profile-panel">
        <div className="panel-header"><div><div className="eyebrow">03 / SIXFOLD WEIGHT DISTRIBUTION</div><h2>Inside the weighting</h2></div><span className="panel-badge">6 TERMS · MATCHED COST</span></div>
        <div className="coh-profile-body">
          <label htmlFor="coh-profile">Inspect candidate profile</label>
          <select id="coh-profile" value={profile} onChange={e=>setProfile(e.target.value)}>
            {PROFILES.map(p=><option key={p} value={p}>{TITLES[p]}</option>)}
          </select>
          <LayerBars profile={profile} features={example.features}/>
          <p>Each vertical bar is one normalized weight. The smaller annotation shows that scale's current synthetic input. Every candidate reads the same six scales.</p>
          <div className="coh-profile-formula">
            <span>WEIGHTED ESTIMATE · SAMPLE {String(index).padStart(3,'0')}</span>
            <strong>{n3(example.predictions[profile])}</strong>
            <small>Programmed target: {n3(example.target)} · Absolute error: {n3(Math.abs(example.predictions[profile]-example.target))}</small>
          </div>
        </div>
      </section>
    </div>

    <section className="surface coh-sample-panel">
      <div className="panel-header"><div><div className="eyebrow">04 / HOLDOUT INSPECTOR</div><h2>Inspect a never-tuned test case</h2></div><span className="panel-badge">SEED 203 · DETERMINISTIC</span></div>
      <div className="coh-sample-body">
        <label htmlFor="coh-sample">Test sample <b>{index} / {SAMPLES-1}</b></label>
        <input id="coh-sample" type="range" min="0" max={SAMPLES-1} value={index} onChange={e=>setIndex(Number(e.target.value))}/>
        <div className="coh-sample-tile">
          <div><span>PROGRAMMED TARGET</span><strong>{n3(example.target)}</strong></div>
          <div><span>SELECTED CANDIDATE</span><strong>{n3(example.predictions[profile])}</strong></div>
          <div><span>ABSOLUTE ERROR</span><strong>{n3(Math.abs(example.predictions[profile]-example.target))}</strong></div>
        </div>
        <div className="coh-feature-row">
          {example.features.map((v,i)=><div key={i}><span>RING {i}</span><div className="coh-feature-track"><div style={{width:(v*100)+'%'}}/></div><strong>{n3(v)}</strong></div>)}
        </div>
      </div>
    </section>

    <div className="coh-lower">
      <section className="surface coh-control-panel">
        <div className="panel-header"><div><div className="eyebrow">05 / NEGATIVE CONTROL</div><h2>Scrambled-label comparison</h2></div><span className="panel-badge">NO RETUNING</span></div>
        <div className="coh-control-inner">
          <div className="coh-control-numbers">
            <div><small>SELECTED PROFILE, CORRECT PAIRS</small><strong>{n3(chosenTest)}</strong></div>
            <div><small>SELECTED PROFILE, SHIFTED LABELS</small><strong>{n3(result.label_permutation_control.mae)}</strong></div>
          </div>
          <p>We shift the targets by 47 samples while keeping the predictions unchanged. A larger error supports the simple conclusion that input/target pairing matters in this synthetic generator, not that φ is special.</p>
        </div>
      </section>
      <section className="surface coh-method-panel">
        <div className="panel-header"><div><div className="eyebrow">06 / EVIDENCE BOUNDARY</div><h2>What the results mean</h2></div><span className="panel-badge">NO CLAIM PROMOTION</span></div>
        <div className="coh-method-inner">
          <p><b>Equal wins in an equal-weight world.</b> The two φ candidates win in their matching φ worlds. That's expected: the generator was engineered to contain each weighting pattern.</p>
          <p><b>Test sets stay locked.</b> We choose a candidate using validation only, then report every model on a different, fixed-seed test population.</p>
          <p><b>Not a consciousness measurement.</b> These are hypothetical scale signals. No real biological, psychological, physical, or NBG causal data is involved.</p>
          <button onClick={exportReport} className="ghost-button">↓ EXPORT E6 RESULTS</button>
          {notice&&<div className="coh-notice" role="status">{notice}</div>}
        </div>
      </section>
    </div>
    <div className="coh-firewall"><b>Φ is a hypothesis, not a shortcut to truth.</b><p>Different constructed worlds have different winners. E6 only validates that the benchmark can distinguish predefined weighting mechanisms under controlled conditions. Before any real coherence claim, we need externally grounded data, prospective holdouts and replicated results.</p><a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E6_COHERENCE_BENCHMARK.md" target="_blank" rel="noreferrer">READ THE E6 PROTOCOL ↗</a></div>
  </section>;
}
