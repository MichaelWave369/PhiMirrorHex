import {useMemo,useState} from 'react';
import {prospectiveAuditReport,STREAMS} from './prospective-audit-model.mjs';
import './prospective-audit-lab.css';

const FAMILIES={
 independent_null:'Independent-channel steady',
 shared_null:'High-correlation steady',
 lagged_step:'Lagged shared-noise step',
 lagged_ramp:'Lagged shared-noise ramp',
 burst_null:'Four-frame burst + outage',
 outlier_step:'Outlier + sustained step'
};
const positive=new Set(['lagged_step','lagged_ramp','outlier_step']);
const fmt=x=>Number(x).toFixed(3);
const pct=x=>(100*x).toFixed(1)+'%';
const reasons={
 false_alert:'False alarm',
 missed_persistent_change:'Missed persistent shift',
 coverage_below_floor:'Quorum coverage below 75%'
};
const COLORS=['#83d9e5','#d0afe6','#edbe89'];
function Stat({label,value,detail}){return <div className="ot-stat"><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;}
function Chart({frames,limits,frame,onFrame,changed}){
  const w=900,h=200,p=15;
  const x=i=>p+(w-p*2)*i/95;
  const max=Math.max(1,...limits,...frames.flatMap(f=>f.member_cusum))*1.1;
  const y=v=>h-24-(h-40)*v/max;
  return <div className="ot-chart">
    <svg viewBox={'0 0 '+w+' '+h} preserveAspectRatio="none" role="img" aria-label="Three synthetic frozen observer CUSUM traces, quorum warning and sensor refusals">
      {changed&&<line x1={x(48)} x2={x(48)} y1="11" y2={h-24} stroke="#e8b77e" strokeDasharray="5 5"/>}
      {limits.map((v,i)=><line key={'l'+i} x1={p} x2={w-p} y1={y(v)} y2={y(v)} stroke={COLORS[i]} opacity=".45" strokeDasharray="5 7"/>)}
      {COLORS.map((color,i)=><path key={color} d={frames.map((f,j)=>(j?'L':'M')+x(j).toFixed(2)+','+y(f.member_cusum[i]).toFixed(2)).join(' ')}
        fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke"/>)}
      {frames.filter(f=>f.new_alert).map(f=><circle key={f.step} cx={x(f.step)} cy={h-24} r="6" fill="#f6ad91"/>)}
      {frames.filter(f=>f.abstained).map(f=><circle key={f.step} cx={x(f.step)} cy="8" r="2.5" fill="#ae98da"/>)}
      <line x1={x(frame)} x2={x(frame)} y1="0" y2={h-24} stroke="#e8f6f2" strokeDasharray="4 4"/>
    </svg>
    <div className="ot-axis"><span>Frame 0</span><span>48 {changed?'· sustained onset':'· no sustained event'}</span><span>Frame 95</span></div>
    <input type="range" min="0" max="95" step="1" value={frame} onChange={e=>onFrame(Number(e.target.value))} aria-label="Scrub sealed synthetic ensemble frames"/>
  </div>;
}
export default function ConsensusTransferLab(){
  const r=useMemo(()=>prospectiveAuditReport(),[]);
  const [q,setQ]=useState(2);
  const [family,setFamily]=useState('lagged_step');
  const [seed,setSeed]=useState(4105);
  const [frame,setFrame]=useState(48);
  const [onlyFailures,setOnlyFailures]=useState(true);
  const [notice,setNotice]=useState('');
  const policy=r.policies.find(p=>p.quorum===q);
  const chosen=policy.trials.find(t=>t.seed===seed);
  const current=chosen.observations[frame];
  const familyTrials=STREAMS.filter(t=>t[0]===family);
  const listing=onlyFailures?r.failure_ledger:r.policies.flatMap(p=>p.trials.map(t=>({
    quorum:p.quorum,family:t.family,seed:t.seed,first_alarm_step:t.first_alarm_step,abstained:t.abstained,
    reason_flags:{false_alert:t.false_alarm,missed_persistent_change:t.persistent_change_missed,
      coverage_below_floor:t.coverage<.75}
  })));
  const groups=Object.keys(FAMILIES);
  const familyStats=groups.map(name=>({
    family:name,
    entries:policy.trials.filter(t=>t.family===name),
  }));
  function chooseFamily(f){
    setFamily(f);setSeed(STREAMS.find(row=>row[0]===f)[1]);setFrame(48);
  }
  async function exportLedger(){
    try{
      const receipt={...r,view:{quorum:q,family,seed,frame}};
      const raw=JSON.stringify(receipt);
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
      const sum=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
      const url=URL.createObjectURL(new Blob([JSON.stringify({...receipt,browser_sha256:sum,
        digest_note:'SHA-256 of browser JSON.stringify(receipt) before digest fields; unsigned'},null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='phimirrorhex-e18-prospective-audit.json';
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Complete synthetic E18 prospective audit and failure ledger exported.');
    }catch(err){setNotice('Export unavailable: '+err.message);}
  }
  return <section className="ot-page">
    <header className="ot-hero">
      <div><div className="eyebrow">E18 / RETROSPECTIVE E17 SELECTION · SEALED QUORUM AUDIT</div>
        <h2>Can a <em>chosen quorum</em> hold up?</h2>
        <p>One quorum chosen from E17's published synthetic results, then locked before twelve entirely separate test streams. All three rules still get scored. No tuning to the answers.</p>
        <div className="ot-tags"><span>12 FRESH E18 STREAMS</span><span>6 AUDIT FAMILIES</span><span>3 FROZEN VOTING RULES</span><span>E17-ONLY RULE SELECTION</span></div>
      </div>
      <div className="ot-hero-note"><small>THE RESEARCH BOUNDARY</small><strong>One locked choice.<br/>Fresh test streams.<br/>No promotion.</strong>
        <p>Prior E17 results were test evidence, not preregistered training data. Their retrospective reuse is disclosed. Passing cannot grant real-world authority.</p>
      </div>
    </header>
    <div className="ot-stats">
      <Stat label="SEALED TEST CELLS" value={r.summary.evaluation_cells} detail="3 quorums × 12 new streams"/>
      <Stat label="FALSE ALARMS" value={r.policies.reduce((n,p)=>n+p.false_alarm_cells,0)} detail="Stationary, impulses and premature warnings"/>
      <Stat label="MISSED PERSISTENT EVENTS" value={r.policies.reduce((n,p)=>n+p.missed_persistent_cells,0)} detail="Never replace misses with early warnings"/>
      <Stat label="FAILURE LEDGER CELLS" value={r.summary.total_failure_cells} detail="All loss conditions retained"/>
    </div>
    <section className="surface ot-development">
      <div className="panel-header"><div><div className="eyebrow">00 / RETROSPECTIVE E17 DEVELOPMENT RECEIPT</div><h2>Selection happened before E18 scoring</h2></div><span className="panel-badge">SELECTED RULE {r.selection.selected_quorum}/3</span></div>
      <div className="ot-selection-inner">
        <p>E17's already-published test cells are reused as development evidence. Loss = 5 × misses + 4 × false alarms + 2 × coverage breaches. Ties favor fewer abstentions, then quorum closest to 2, then smaller quorum.</p>
        <div className="ot-selection-costs">{r.selection.candidate_costs.map(c=><div key={c.quorum} className={c.quorum===r.selection.selected_quorum?'chosen':''}>
          <small>{c.quorum}/3 QUORUM {c.quorum===r.selection.selected_quorum?'· SELECTED':''}</small>
          <strong>{c.weighted_loss}</strong>
          <span>Misses {c.miss_cells} · false {c.false_alarm_cells} · low coverage {c.coverage_breach_cells}</span>
          <span>{c.abstained_frames} abstained E17 frames</span>
        </div>)}</div>
        <p><b>Boundary:</b> E17 was not preregistered as training data. E18 uses a fresh synthetic sealed set; none of this is physical independent validation.</p>
      </div>
    </section>
    <section className="surface ot-policy">
      <div className="panel-header"><div><div className="eyebrow">01 / IMMUTABLE MEMBERS & QUORUM</div><h2>Choose a rule to inspect</h2></div><span className="panel-badge">ALL THREE RULES SCORED</span></div>
      <div className="ot-policy-inner">
        <div className="ot-quorums">{[1,2,3].map(v=><button type="button" key={v} className={q===v?'active':''} aria-pressed={q===v}
          onClick={()=>setQ(v)}><strong>{v}/3</strong><small>{v===1?'Any member':v===2?'Majority':'Unanimous'}</small></button>)}</div>
        <div className="ot-members">{r.members.map((m,i)=><div key={m.id}>
          <span className="ot-dot" style={{background:COLORS[i]}}/>
          <b>{m.budget} channels · {m.readout==='identity_max'?'Identity-max':'Sum-only'}</b>
          <strong>{m.mask.toString(2).padStart(6,'0')}</strong>
          <small>Unchanged E15 threshold: {fmt(m.alert_limit)}</small>
        </div>)}</div>
        <p>All members inspect the same six-channel noise realization. Channel overlap remains documented; majority agreement is not independent replication.</p>
      </div>
    </section>
    <section className="ot-families" aria-label="Select the synthetic noise family">{groups.map(f=><button type="button" key={f} className={family===f?'active':''}
      onClick={()=>chooseFamily(f)} aria-pressed={family===f}>
      <b>{FAMILIES[f]}</b><small>{positive.has(f)?'PERSISTENT EVENT · t48':'NEGATIVE CONTROL'}</small>
    </button>)}</section>
    <section className="surface ot-replay">
      <div className="panel-header"><div><div className="eyebrow">02 / UNSEEN SYNTHETIC STREAM</div><h2>{FAMILIES[family]}</h2></div><span className="panel-badge">COUNTER-MIX32 GENERATOR · SEED {seed}</span></div>
      <div className="ot-replay-body">
        <div className="ot-seeds">{familyTrials.map(([,s])=><button type="button" key={s} className={seed===s?'active':''} onClick={()=>{setSeed(s);setFrame(48);}}>SEED {s}</button>)}</div>
        <Chart frames={chosen.observations} limits={r.members.map(m=>m.alert_limit)} frame={frame} onFrame={setFrame} changed={positive.has(family)}/>
        <div className="ot-frame">
          <Stat label="SELECTED FRAME" value={'t = '+frame} detail="Never used for retuning"/>
          <Stat label="ELIGIBLE MEMBERS" value={current.eligible+'/3'} detail="Unavailable channels refuse"/>
          <Stat label="AFFIRMATIVE VOTES" value={current.votes+'/3'} detail="Frame-local, not historic votes"/>
          <Stat label="FRAME DECISION" value={current.abstained?'ABSTAIN':current.new_alert?'FIRST ALARM':current.votes>=q?'QUORUM YES':'NO ALARM'} detail="Only first alarm emitted"/>
        </div>
        <div className="ot-member-votes">{r.members.map((m,i)=><div key={m.id}>
          <b>KEYHOLE {i+1}</b>
          <strong>{!current.member_available[i]?'ABSTAIN':current.member_votes[i]?'YES':'NO'}</strong>
          <small>Gap {current.member_gaps[i]===null?'missing':fmt(current.member_gaps[i])} · CUSUM {fmt(current.member_cusum[i])}</small>
        </div>)}</div>
      </div>
    </section>
    <div className="ot-two">
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">03 / TRANSFER RESULT</div><h2>What changed?</h2></div></div>
        <div className="ot-inner">
          <div className={'ot-verdict'+(chosen.false_alarm?' bad':chosen.persistent_change_detected?' good':'')}>
            <small>FIRST-ALARM CLASSIFICATION</small>
            <strong>{chosen.false_alarm?'FALSE ALARM':
              chosen.persistent_change_detected?'PERSISTENT CHANGE DETECTED':
              chosen.persistent_change_missed?'PERSISTENT CHANGE MISSED':'NO ALARM'}</strong>
          </div>
          <div className="ot-pair">
            <Stat label="FIRST ALARM FRAME" value={chosen.first_alarm_step===null?'NONE':chosen.first_alarm_step} detail="One shot only"/>
            <Stat label="DETECTION DELAY" value={chosen.detection_delay===null?'N/A':chosen.detection_delay+' frames'} detail="On/after frame 48"/>
          </div>
          <div className="ot-pair">
            <Stat label="QUORUM COVERAGE" value={pct(chosen.coverage)} detail="Frames with enough observers"/>
            <Stat label="ABSTAINED FRAMES" value={chosen.abstained+'/96'} detail="Never counted as correct decisions"/>
          </div>
        </div>
      </section>
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">04 / FAMILY & HISTORICAL AUDIT</div><h2>Failure modes by regime</h2></div></div>
        <div className="ot-inner">
          {familyStats.map(group=><div className="ot-family-row" key={group.family}>
            <b>{FAMILIES[group.family]}</b>
            <span>{group.entries.filter(t=>t.false_alarm).length} false · {group.entries.filter(t=>t.persistent_change_missed).length} missed</span>
          </div>)}
          <p>E17 is repurposed as retrospective development evidence. E18 test results never change the selected rule. Witnesses still share simulated noise.</p>
        </div>
      </section>
    </div>
    <section className="surface ot-ledger">
      <div className="panel-header"><div><div className="eyebrow">05 / FAILURE EVIDENCE</div><h2>Keep every warning, miss and refusal</h2></div><span className="panel-badge">{r.summary.total_failure_cells} FLAGGED CELLS</span></div>
      <div className="ot-inner">
        <label><input type="checkbox" checked={onlyFailures} onChange={e=>setOnlyFailures(e.target.checked)}/> Show only failed policy/stream cells</label>
        <div className="ot-failure-list">
          {listing.length===0?<p>No failures under these fixed synthetic populations. No guarantee follows.</p>:
          listing.map((record,i)=><button key={[record.quorum,record.seed,i].join(':')} type="button" onClick={()=>{
            setQ(record.quorum);setFamily(record.family);setSeed(record.seed);setFrame(record.first_alarm_step??48);
          }}>
            <span><b>{record.quorum}/3</b><small>QUORUM</small></span>
            <span><b>{record.seed}</b><small>SEED</small></span>
            <span><b>{FAMILIES[record.family]}</b><small>SHIFT FAMILY</small></span>
            <span><b>{Object.entries(record.reason_flags).filter(([,v])=>v).map(([k])=>reasons[k]).join(' · ')||'No failure'}</b><small>DETECTION / COVERAGE EVIDENCE</small></span>
          </button>)}
        </div>
      </div>
    </section>
    <div className="ot-boundary">
      <div><b>Out-of-family synthetic testing is not real-world validation.</b>
        <p>These new procedural streams audit a quorum selected using retrospective E17 evidence. All witnesses remain correlated and everything is programmed. No physical validation, consciousness sensing or external action authority.</p>
        <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E18_PROSPECTIVE_QUORUM_AUDIT.md" target="_blank" rel="noreferrer">READ E18 AUDIT PROTOCOL ↗</a>
      </div><button type="button" className="ghost-button" onClick={exportLedger}>↓ EXPORT FULL E18 LEDGER</button>
    </div>
    {notice&&<p className="ot-notice" role="status">{notice}</p>}
  </section>;
}
