// Python reference vs independent JS for all E7 train, validation and test outcomes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adaptiveBenchmark} from '../web/src/adaptive-model.mjs';

const fixture=JSON.parse(readFileSync(process.argv[2]||'e7-adaptive-fixture.json','utf8'));
assert.equal(fixture.schema,'phimirrorhex.e7.adaptive-coherence.v1');
const {sha256,causal_audit,...expected}=fixture;
assert.equal(sha256.length,64);
assert.equal(causal_audit.source_sha256.length,64);
const browser=adaptiveBenchmark();
const {causal_audit:jsCausal,...actual}=browser;
const {source_sha256,...pyCausal}=causal_audit;
function compare(x,y,path='root'){
  if(typeof x==='number'&&typeof y==='number'){
    const tolerance=2e-12*Math.max(1,Math.abs(x),Math.abs(y));
    assert.ok(Math.abs(x-y)<=tolerance,path+': '+x+' != '+y);
  }else if(Array.isArray(x)){
    assert.ok(Array.isArray(y),path);
    assert.equal(x.length,y.length,path);
    x.forEach((v,i)=>compare(v,y[i],path+'['+i+']'));
  }else if(x&&typeof x==='object'){
    assert.deepEqual(Object.keys(x).sort(),Object.keys(y).sort(),path);
    for(const k of Object.keys(x))compare(x[k],y[k],path+'.'+k);
  }else assert.equal(x,y,path);
}
compare(actual,expected);
compare(jsCausal,pyCausal,'causal_audit');
assert.equal(browser.worlds.length,5);
for(const w of browser.worlds)assert.equal(Object.keys(w.models).length,5);
console.log('E7 parity PASS: 5 worlds × 5 initializations × 128 train updates plus held-out validation/test and isolated E5 causal audit.');
