import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {robustnessBenchmark} from '../web/src/robustness-model.mjs';
const fixture=JSON.parse(readFileSync(process.argv[2]||'e8-robustness-fixture.json','utf8'));
assert.equal(fixture.schema,'phimirrorhex.e8.robustness.v1');
const {sha256,source,memory_keyhole,...expected}=fixture;
assert.equal(sha256.length,64);
assert.equal(source.adaptive_sha256.length,64);
assert.equal(memory_keyhole.source_sha256.length,64);
const js=robustnessBenchmark();
const {source:jsSource,memory_keyhole:jsMemory,...actual}=js;
function compare(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tol=2e-12*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tol,path+' mismatch '+a+' vs '+b);
    return;
  }
  if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path);
    assert.equal(a.length,b.length,path);
    a.forEach((v,i)=>compare(v,b[i],path+'['+i+']'));return;
  }
  if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    Object.keys(a).forEach(k=>compare(a[k],b[k],path+'.'+k));return;
  }
  assert.equal(a,b,path);
}
compare(actual,expected);
const {adaptive_sha256,...pySource}=source;
const {source_sha256,...pyMemory}=memory_keyhole;
compare(jsSource,pySource,'source');
compare(jsMemory,pyMemory,'memory');
assert.equal(js.worlds.length,5);
console.log('E8 PARITY PASS: 5 worlds × 5 frozen learners × 4 shifts × 128 identical labels; E5 Keyhole controls.');
