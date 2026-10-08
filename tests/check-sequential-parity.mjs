import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {sequentialReport} from '../web/src/sequential-model.mjs';
const py=JSON.parse(readFileSync(process.argv[2]||'e15-sequential-fixture.json','utf8'));
const {sha256,protocol,...expected}=py;
assert.equal(py.schema,'phimirrorhex.e15.sequential-change.v1');
assert.equal(sha256.length,64);
assert.equal(protocol.parent_sha256.length,64);
const {protocol:jsProtocol,...actual}=sequentialReport();
function compare(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    assert.ok(Math.abs(a-b)<=3e-11*Math.max(1,Math.abs(a),Math.abs(b)),
      path+' : '+a+' !== '+b);
  } else if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path);assert.equal(a.length,b.length,path);
    a.forEach((v,i)=>compare(v,b[i],path+'['+i+']'));
  } else if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    for(const k of Object.keys(a))compare(a[k],b[k],path+'.'+k);
  }else assert.equal(a,b,path);
}
compare(actual,expected);
const {parent_sha256,...pyProtocol}=protocol;
compare(jsProtocol,pyProtocol,'protocol');
console.log('E15 parity PASS: 14 frozen policies × 8 sealed streams × 96 frames, four development controls, single-shot alarms, delays, abstentions, false alarms and loss ledger.');
