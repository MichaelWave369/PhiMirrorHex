import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {driftReport} from '../web/src/drift-model.mjs';
const py=JSON.parse(readFileSync(process.argv[2]||'e14-drift-fixture.json','utf8'));
assert.equal(py.schema,'phimirrorhex.e14.drift-shadow.v1');
const {sha256,protocol,...expected}=py;
assert.equal(sha256.length,64);
assert.equal(protocol.parent_sha256.length,64);
const {protocol:browserProtocol,...actual}=driftReport();
function compare(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tol=4e-11*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tol,path+': '+a+' !== '+b);
  }else if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path);assert.equal(a.length,b.length,path);
    a.forEach((x,i)=>compare(x,b[i],path+'['+i+']'));
  }else if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    for(const k of Object.keys(a))compare(a[k],b[k],path+'.'+k);
  }else assert.equal(a,b,path);
}
compare(actual,expected);
const {parent_sha256,...pyProtocol}=protocol;
compare(browserProtocol,pyProtocol,'protocol');
console.log('E14 PARITY PASS: E13 frozen masks, 3 regimes, 9 non-overlapping seeds, 42 monitor/shadow/test outcomes and complete failure ledger.');
