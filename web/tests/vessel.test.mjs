import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVesselReport, VESSEL_GAINS } from '../src/vessel-model.mjs';

for(const probe of [1,2,3,4,5]) {
  test('E4 witness at probe layer '+probe, () => {
    const r = buildVesselReport(probe, .5, 5);
    assert.equal(r.initial.keyhole_equal, true);
    assert.equal(r.witness.first_layer, probe);
    assert.equal(r.witness.exists, true);
    assert.equal(r.selected.observable_gap, 1);
    assert.ok(r.layers.slice(0,probe).every(l=>l.equal_through_keyhole));
    assert.ok(r.layers.slice(probe).every(l=>!l.equal_through_keyhole));
  });
  test('E4 no-probe control remains coarse equal at layer '+probe, () => {
    const r=buildVesselReport(probe,0,5);
    assert.equal(r.witness.exists,false);
    assert.equal(r.witness.first_layer,null);
    assert.ok(r.layers.every(l=>l.equal_through_keyhole));
    assert.ok(r.layers.every(l=>l.latent_l1_difference>0));
  });
}
test('E4 nested witness replay and claimed limitations', () => {
  const a=buildVesselReport();
  assert.deepEqual(a,buildVesselReport());
  assert.equal(a.epistemic_origin,'SIMULATED');
  assert.equal(a.physical_measurement,false);
  assert.equal(a.consciousness_measured,false);
  assert.equal(a.action_authorized,false);
  assert.deepEqual(VESSEL_GAINS,[0,.25,.5,1]);
});
test('E4 invalid parameters are rejected',()=>{
  for(const n of [0,6,3.2,-1,true]) assert.throws(()=>buildVesselReport(n,.5,3));
  for(const n of [-1,6,true,3.2]) assert.throws(()=>buildVesselReport(3,.5,n));
  for(const n of [0.1,2,true,NaN]) assert.throws(()=>buildVesselReport(3,n,3));
});
