import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {coherenceBenchmark} from '../web/src/coherence-model.mjs';

const fixture=JSON.parse(readFileSync(process.argv[2]||'e6-coherence-fixture.json','utf8'));
const {sha256,...expected}=fixture;
const actual=coherenceBenchmark();
assert.equal(sha256.length,64);
function compare(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tolerance=2e-12*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tolerance,path+' '+a+' != '+b);
    return;
  }
  if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path);
    assert.equal(a.length,b.length,path);
    for(let i=0;i<a.length;i++)compare(a[i],b[i],path+'['+i+']');
    return;
  }
  if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    for(const key of Object.keys(a))compare(a[key],b[key],path+'.'+key);
    return;
  }
  assert.equal(a,b,path);
}
compare(actual,expected);
console.log('E6 parity PASS: 5 engineered worlds × 5 profiles × 128 validation + 128 held-out cases; all model results match.');
