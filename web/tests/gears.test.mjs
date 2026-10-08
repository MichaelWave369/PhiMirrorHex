import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGearReport,COUPLINGS,PROBE_GAINS,GEAR_FRAMES} from '../src/gears-model.mjs';

test('E5 delayed conveyor reaches outer ring at t10, becomes observable at t12',()=>{
  const r=buildGearReport();
  assert.equal(r.witness.first_outer_hidden_arrival,10);
  assert.equal(r.witness.first_coarse_separation,12);
  assert.equal(r.history[10].outer_gap,0);
  assert.ok(r.history[10].outer_hidden_distance>0);
  assert.ok(r.history[12].outer_gap>0);
  assert.equal(r.history.length,GEAR_FRAMES);
});
for(const coupling of COUPLINGS)for(const gain of PROBE_GAINS)for(const enabled of [true,false]){
  test('E5 contract: coupling='+coupling+', gain='+gain+', enabled='+enabled,()=>{
    const r=buildGearReport(coupling,gain,enabled);
    const expected=coupling>0&&gain>0&&enabled;
    assert.equal(r.witness.exists,expected);
    assert.equal(r.two_case_prediction.outer_after_probe_correct,expected?2:1);
    assert.equal(r.epistemic_origin,'SIMULATED');
    assert.equal(r.action_authorized,false);
    assert.equal(r.physical_measurement,false);
    assert.deepEqual(r,buildGearReport(coupling,gain,enabled));
  });
}
test('E5 malformed values fail closed',()=>{
  for(const n of [-1,.15,2,true,NaN]){
    assert.throws(()=>buildGearReport(n,.5));
    assert.throws(()=>buildGearReport(.5,n));
  }
  for(const flag of [0,1,'yes',null])assert.throws(()=>buildGearReport(.5,.5,flag));
});
