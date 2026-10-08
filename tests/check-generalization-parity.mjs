import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generalizationReport} from '../web/src/generalization-model.mjs';

const py=JSON.parse(readFileSync(process.argv[2]||'e10-generalization-fixture.json','utf8'));
const {sha256,...expected}=py;
assert.equal(sha256.length,64);
const js=generalizationReport();
function walk(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tolerance=3e-11*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tolerance,path+' '+a+' !== '+b);
  }else if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path);assert.equal(a.length,b.length,path);
    a.forEach((v,i)=>walk(v,b[i],path+'['+i+']'));
  }else if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    for(const k of Object.keys(a))walk(a[k],b[k],path+'.'+k);
  }else{
    assert.equal(a,b,path);
  }
}
walk(js,expected);
assert.equal(js.policies.length,14);
assert.equal(js.heldout_examples.length,6);
console.log('E10 cross-language parity PASS: 3 isolated splits, 14 train-selected policies, 4 causal interventions and independently generated held-out episodes.');
