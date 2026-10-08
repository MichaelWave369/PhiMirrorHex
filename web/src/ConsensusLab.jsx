import {useMemo,useState} from 'react';
import {consensusReport,QUORUMS} from './consensus-model.mjs';
import './consensus-lab.css';

const NAMES={stationary:'Stationary',step:'Sustained step',ramp:'Gradual ramp',spike:'Brief spike'};
const PAIRS=[['stationary',2201,2202],['step',2203,2204],['ramp',2205,2206],['spike',2207,2208]];
const display=n=>n===null?'NONE':String(n);
const percent=n=>(n*100).toFixed(1)+'%';
const reasonName={false_alert:'Premature or false warning',
  missed_persistent_change:'Missed sustained change',
  coverage_below_floor:'Insufficient available quorum'};
function Statistic({label,value,small}){return <div className="q-stat"><small>{label}</small><strong>{value}</strong><span>{small}</span></div>;}
function FrameChart({rows,selected,setSelected,quorum,change,limit}){
  const w=900,h=230,p=22;
  const x=t=>p+(w-2*p)*t/95;
  const max=Math.max(1,...rows.map(r=>Math.max(...r.member_cusum)),...limit)*1.1;
  const y=n=>h-32-(h-63)*n/max;
  return <div className="q-chart">
    <svg viewBox={'0 0 '+w+' '+h} preserveAspectRatio="none" role="img" aria-label="Three correlated CUSUM traces and their frozen thresholds">
      {[.25,.5,.75,1].map(v=><line key={v} x1={p} x2={w-p} y1={y(max*v)} y2={y(max*v)} stroke="#345066" strokeDasharray="4 7"/>)}
      {change&&<line x1={x(48)} x2={x(48)} y1={20} y2={h-32} stroke="#dfa86f" strokeDasharray="6 6" strokeWidth="1.3"/>}
      {limit.map((v,i)=><line key={i} x1={p} x2={w-p} y1={y(v)} y2={y(v)} stroke={['#83dfdc','#d3b5f0','#e9b98d'][i]} strokeDasharray="3 8" opacity=".65"/>)}
      {[0,1,2].map(i=><path key={i} d={rows.map((r,j)=>(j===0?'M':'L')+x(j).toFixed(2)+' '+y(r.member_cusum[i]).toFixed(2)).join(' ')}
        fill="none" stroke={['#83dfdc','#d3b5f0','#e9b98d'][i]} strokeWidth="2" vectorEffect="non-scaling-stroke"/>)}
      {rows.filter(r=>r.new_alert).map(r=><circle key={r.step} cx={x(r.step)} cy={h-32} r="6" fill="#f2b08d"/>)}
      {rows.filter(r=>r.abstained).map(r=><circle key={r.step} cx={x(r.step)} cy="18" r="2.5" fill="#bfa7d6"/>)}
      <line x1={x(selected)} x2={x(selected)} y1="13" y2={h-32} stroke="#e5f8ed" strokeDasharray="3 5"/>
    </svg>
    <div className="q-axis"><span>0</span><span>48 · {change?'persistent onset':'no sustained onset'}</span><span>95</span></div>
    <input aria-label="Scrub consensus frame" type="range" min="0" max="95" step="1"
      value={selected} onChange={e=>setSelected(Number(e.target.value))}/>
    <p>Colored traces show the three frozen member CUSUM scores; matching dashed lines show their different E15 thresholds. Purple markers indicate unavailable quorum frames. Orange marks the first ensemble warning.</p>
  </div>;
}
export default function ConsensusLab(){
  const report=useMemo(()=>consensusReport(),[]);
  const [quorum,setQuorum]=useState(2);
  const [regime,setRegime]=useState('step');
  const [seed,setSeed]=useState(2203);
  const [frame,setFrame]=useState(48);
  const [failOnly,setFailOnly]=useState(true);
  const [notice,setNotice]=useState('');
  const policy=report.policies.find(p=>p.quorum===quorum);
  const stream=policy.trials.find(t=>t.seed===seed&&t.regime===regime);
  const evidence=stream.observations[frame];
  const visible=failOnly?report.failure_ledger:report.policies.flatMap(p=>p.trials.map(t=>({
    quorum:p.quorum,seed:t.seed,regime:t.regime,
    first_alarm_step:t.first_alarm_step,abstained:t.abstained,
    reason_flags:{false_alert:t.false_alarm,
      missed_persistent_change:t.persistent_change_missed,
      coverage_below_floor:t.coverage<.75}
  })));
  function changeRegime(next){
    setRegime(next);setSeed(PAIRS.find(p=>p[0]===next)[1]);setFrame(48);
  }
  async function exportReceipt(){
    try{
      const record={...report,view:{quorum,regime,seed,frame}};
      const data=JSON.stringify(record);
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data));
      const checksum=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
      const url=URL.createObjectURL(new Blob([JSON.stringify({...record,
        browser_sha256:checksum,hash_note:'SHA256 of JSON.stringify(record), before checksum; unsigned'},null,2)],
        {type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='phimirrorhex-e16-consensus.json';
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Synthetic quorum ledger exported with all failures.');
    }catch(err){setNotice('Export failed: '+err.message);}
  }
  return <section className="q-page">
    <header className="q-hero"><div>
      <div className="eyebrow">E16 / CORRELATED OBSERVERS · CONSENSUS & REFUSAL</div>
      <h2>Do three <em>Keyholes</em> see more?</h2>
      <p>Compare one-of-three, two-of-three and unanimous warnings on the same synthetic streams. Every member retains its own frozen E15 threshold. Missing readings trigger refusal, and shared noise prevents us from claiming independent confirmation.</p>
      <div className="q-tags"><span>3 CORRELATED OBSERVERS</span><span>3 VOTING RULES</span><span>8 SEALED STREAMS</span><span>NO RETUNING</span></div>
    </div><aside className="q-hero-aside"><small>THE CENTRAL CAUTION</small>
      <strong>Agreement<br/>isn't independence.</strong>
      <p>Two sensors can share the same error. The ledger records it instead of pretending three votes make a physical fact.</p></aside>
    </header>
    <div className="q-metrics">
      <Statistic label="SEALED POLICY CELLS" value="24" small="3 voting rules × 8 streams"/>
      <Statistic label="FALSE WARNINGS" value={String(report.summary.false_alarm_cells)} small="All streams, same sustained-event target"/>
      <Statistic label="MISSED SUSTAINED CHANGES" value={String(report.summary.missed_persistent_cells)} small="First warnings after change only"/>
      <Statistic label="FAILURE LEDGER CELLS" value={String(report.summary.failure_cells)} small="No losing cases suppressed"/>
    </div>
    <section className="surface q-controls">
      <div className="panel-header"><div><div className="eyebrow">01 / FROZEN GROUP POLICY</div><h2>How many must agree?</h2></div><span className="panel-badge">NO HOLDOUT RULE SELECTION</span></div>
      <div className="q-controls-inner">
        <div className="q-rule-buttons" role="group" aria-label="Select required simultaneous observer votes">
          {QUORUMS.map(q=><button type="button" key={q} className={quorum===q?'active':''} aria-pressed={quorum===q}
            onClick={()=>setQuorum(q)}><strong>{q}/3</strong><small>{q===1?'Any available':q===2?'Majority':'Unanimous'}</small></button>)}
        </div>
        <div className="q-member-grid">{report.members.map((m,i)=><div className="q-member" key={m.id}>
          <span className="q-member-dot" style={{background:['#83dfdc','#d3b5f0','#e9b98d'][i]}}/>
          <b>Observer {i+1} · {m.budget} sensors</b>
          <small>{m.readout==='identity_max'?'Identity-max':'Masked sum'}</small>
          <strong>{m.mask.toString(2).padStart(6,'0')}</strong>
          <span>Frozen CUSUM limit: {m.alert_limit.toFixed(3)}</span>
        </div>)}</div>
      </div>
    </section>
    <section className="q-scenario-buttons" aria-label="Choose sealed synthetic regime">
      {PAIRS.map(([name])=><button type="button" key={name}
        className={regime===name?'active':''} aria-pressed={regime===name} onClick={()=>changeRegime(name)}>
        <b>{NAMES[name]}</b><small>{name==='step'||name==='ramp'?'CHANGE FROM FRAME 48':'NO SUSTAINED TARGET'}</small>
      </button>)}
    </section>
    <section className="surface q-stream">
      <div className="panel-header"><div><div className="eyebrow">02 / SYNTHETIC VOTING TRACE</div><h2>{NAMES[regime]}</h2></div><span className="panel-badge">SEALED SEED {seed}</span></div>
      <div className="q-stream-inner">
        <div className="q-seed-row">{PAIRS.find(p=>p[0]===regime).slice(1).map(s=><button type="button" key={s}
          className={seed===s?'active':''} onClick={()=>{setSeed(s);setFrame(48);}}>SEED {s}</button>)}</div>
        <FrameChart rows={stream.observations} limit={report.members.map(m=>m.alert_limit)}
          quorum={quorum} selected={frame} setSelected={setFrame} change={stream.true_change_step!==null}/>
        <div className="q-frame-grid">
          <Statistic label="FRAME" value={'t='+frame} small="Synthetic same-noise reading"/>
          <Statistic label="ELIGIBLE OBSERVERS" value={evidence.eligible+'/3'} small="Member-specific fault metadata"/>
          <Statistic label="YES VOTES NOW" value={evidence.votes+'/3'} small="Strictly over individual frozen limits"/>
          <Statistic label="GROUP STATUS" value={evidence.abstained?'ABSTAIN':evidence.new_alert?'FIRST ALARM':evidence.votes>=quorum?'QUORUM YES':'NO ALARM'} small="No implicit votes from missing members"/>
        </div>
        <div className="q-member-votes">
          {report.members.map((m,i)=><div key={m.id}>
            <b>Observer {i+1}</b><span>{evidence.member_available[i]?(evidence.member_votes[i]?'YES VOTE':'NO VOTE'):'UNAVAILABLE'}</span>
            <small>Score {evidence.member_cusum[i].toFixed(3)} / limit {m.alert_limit.toFixed(3)}</small>
          </div>)}
        </div>
      </div>
    </section>
    <div className="q-duo">
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">03 / OUTCOME</div><h2>Alarm, miss or refusal</h2></div></div>
        <div className="q-body">
          <div className={'q-verdict '+(stream.false_alarm?'bad':stream.persistent_change_detected?'good':'')}>
            <small>ONE-SHOT CONSENSUS OUTCOME</small><strong>{stream.false_alarm?'FALSE ALARM':
            stream.persistent_change_detected?'CHANGE DETECTED':
            stream.persistent_change_missed?'SUSTAINED CHANGE MISSED':'NO ALARM'}</strong>
          </div>
          <div className="q-pair">
            <Statistic label="FIRST ALARM" value={display(stream.first_alarm_step)} small="One shot only"/>
            <Statistic label="DETECTION DELAY" value={stream.detection_delay===null?'N/A':stream.detection_delay+' frames'} small="From persistent onset at t=48"/>
          </div>
          <div className="q-pair">
            <Statistic label="QUORUM COVERAGE" value={percent(stream.coverage)} small="Frames with enough available members"/>
            <Statistic label="GROUP ABSTENTIONS" value={stream.abstained+'/96'} small="Do not count as negative decisions"/>
          </div>
        </div>
      </section>
      <section className="surface">
        <div className="panel-header"><div><div className="eyebrow">04 / CORRELATION AUDIT</div><h2>Shared sensors, shared mistakes</h2></div></div>
        <div className="q-body"><p>These observers examine the same noise draws, often through overlapping sectors. Agreement is shown as a diagnostic only, never statistical independence.</p>
          {report.overlap_diagnostics.map((v,i)=><div key={i} className="q-overlap">
            <span>{v.pair.map(x=>x.split('-')[0]).join(' + ')}</span>
            <b>{percent(v.jaccard)} channel overlap</b>
            <small>{v.intersection} shared of {v.union} total sectors</small>
          </div>)}
          {report.co_vote_diagnostics.map((v,i)=><div className="q-covote" key={i}>
            <span>{v.pair.map(x=>x.split('-')[0]).join(' / ')}: </span><b>{v.joint_positive_frames}</b>
            <span> simultaneous positive frames (of {v.both_available_frames} jointly available)</span>
          </div>)}
        </div>
      </section>
    </div>
    <section className="surface q-failures">
      <div className="panel-header"><div><div className="eyebrow">05 / FULL FAILURE LEDGER</div><h2>Keep every false warning and miss</h2></div><span className="panel-badge">{report.summary.failure_cells} FAILURE CELLS</span></div>
      <div className="q-body">
        <label><input type="checkbox" checked={failOnly} onChange={e=>setFailOnly(e.target.checked)}/> Show only failures under the predeclared sustained-event target</label>
        <div className="q-failure-list">
          {visible.length===0?<p>No failures under these fixed synthetic streams. That is not a reliability guarantee.</p>:
          visible.map((f,i)=><button key={[f.quorum,f.seed,i].join(':')} type="button"
            onClick={()=>{setQuorum(f.quorum);setRegime(f.regime);setSeed(f.seed);setFrame(f.first_alarm_step??48);}}>
            <span><b>{f.quorum}/3</b><small>QUORUM</small></span>
            <span><b>{f.seed}</b><small>SEALED SEED</small></span>
            <span><b>{NAMES[f.regime]}</b><small>REGIME</small></span>
            <span><b>{Object.entries(f.reason_flags).filter(([,val])=>val).map(([key])=>reasonName[key]).join(' · ')||'none'}</b><small>FAILURE REASONS</small></span>
          </button>)}
        </div>
      </div>
    </section>
    <div className="q-claim"><div><b>A council of correlated simulated observers is not independent evidence.</b>
      <p>The eight test streams are reused from E15. This is a comparative replay, not a fresh prospective trial. The group uses fixed mathematical noise, not external data; passing a toy gate grants no model, hardware, network or human inference authority.</p>
      <a href="https://github.com/MichaelWave369/PhiMirrorHex/blob/main/docs/E16_CORRELATED_CONSENSUS.md" target="_blank" rel="noreferrer">READ FROZEN E16 METHOD ↗</a>
    </div><button type="button" className="ghost-button" onClick={exportReceipt}>↓ EXPORT CONSENSUS LEDGER</button></div>
    {notice&&<p className="q-notice" role="status">{notice}</p>}
  </section>;
}
