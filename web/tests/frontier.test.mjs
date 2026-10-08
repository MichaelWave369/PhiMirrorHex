import test from 'node:test';
import assert from 'node:assert/strict';
import {frontierReport,gaps,selectedSectors,ALL_MASKS,THRESHOLDS} from '../src/frontier-model.mjs';

test('64 mask census and strict zero-sensor negative control',()=>{
  assert.equal(ALL_MASKS.length,64);
  assert.deepEqual(selectedSectors(0),[]);
  assert.deepEqual(selectedSectors(63),[0,1,2,3,4,5]);
  assert.throws(()=>selectedSectors(64));
  assert.throws(()=>selectedSectors(-1));
  assert.throws(()=>selectedSectors(true));
  assert.deepEqual(gaps([1,-1,0,0,0,0],[-1,1,0,0,0,0],63),{
    identity_max:2,masked_sum:0
  });
});
test('E9 separate budget samples, probe controls and monotone thresholds',()=>{
  const r=frontierReport();
  assert.equal(r.worlds.length,4);
  assert.equal(r.protocol.all_masks_including_empty,64);
  for(const world of r.worlds){
    assert.equal(world.snapshots.length,THRESHOLDS.length);
    for(const series of world.snapshots){
      assert.equal(series.frames.length,24);
      for(const frame of series.frames){
        assert.equal(frame.by_budget.reduce((s,row)=>s+row.total_masks,0),64);
        assert.equal(frame.by_budget[0].identity_detected,0);
      }
    }
    for(let i=1;i<THRESHOLDS.length;i++){
      for(let frame=0;frame<24;frame++){
        const lower=world.snapshots[i-1].frames[frame];
        const upper=world.snapshots[i].frames[frame];
        for(let k=0;k<7;k++){
          assert.ok(upper.by_budget[k].identity_detected<=lower.by_budget[k].identity_detected);
          assert.ok(upper.by_budget[k].sum_detected<=lower.by_budget[k].sum_detected);
        }
      }
    }
  }
  const pos=r.worlds.find(w=>w.condition==='coupled_probe');
  assert.ok(pos.snapshots[0].frames[10].outer_hidden_l1>0);
  assert.equal(pos.snapshots[0].frames[10].global_sum_gap,0);
  assert.equal(pos.snapshots[0].frames[10].by_budget[6].identity_detected,1);
  assert.equal(pos.snapshots[0].frames[10].by_budget[6].sum_detected,0);
  for(const name of ['no_coupling','no_conveyor']){
    const w=r.worlds.find(x=>x.condition===name);
    assert.ok(w.snapshots.every(x=>x.frames.every(f=>f.by_budget.every(
      r=>r.identity_detected===0&&r.sum_detected===0
    ))));
  }
  assert.equal(r.epistemic_origin,'SIMULATED');
  assert.equal(r.action_authorized,false);
  assert.equal(r.controls.identical_state_never_detects,true);
});
