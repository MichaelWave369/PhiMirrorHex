import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prospectiveAuditReport} from '../web/src/prospective-audit-model.mjs';
const py=JSON.parse(readFileSync(process.argv[2]||'e18-prospective-audit-fixture.json','utf8'));
assert.equal(py.schema,'phimirrorhex.e18.prospective-quorum-audit.v1');
const {sha256,protocol,...expected}=py;
assert.equal(sha256.length,64);
assert.equal(protocol.parent_sha256.length,64);
const {protocol:jsProtocol,...actual}=prospectiveAuditReport();
function compare(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tol=5e-11*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tol,path+' : '+a+' != '+b);
  } else if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path);assert.equal(a.length,b.length,path);
    a.forEach((v,i)=>compare(v,b[i],path+'['+i+']'));
  } else if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    for(const k of Object.keys(a))compare(a[k],b[k],path+'.'+k);
  } else assert.equal(a,b,path);
}
compare(actual,expected);
const {parent_sha256,...withoutParent}=protocol;
compare(jsProtocol,withoutParent,'protocol');
assert.equal(actual.summary.frame_cells,3456);
assert.equal(actual.selection.selection_uses_e18_sealed_data,false);
console.log('E18 PARITY PASS: historical E17-only quorum selection, 12 fresh counter-mixed streams, 36 quorum cells, all 3456 frames, faults, misses, false alarms and full failure ledger.');
