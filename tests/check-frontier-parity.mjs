import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {frontierReport} from '../web/src/frontier-model.mjs';

const fixture=JSON.parse(readFileSync(process.argv[2]||'e9-frontier-fixture.json','utf8'));
assert.equal(fixture.schema,'phimirrorhex.e9.observability-frontier.v1');
const {sha256,worlds,...expected}=fixture;
assert.equal(sha256.length,64);
const actual=frontierReport();
const {worlds:jsWorlds,...jsExpected}=actual;
function compare(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tol=2e-12*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tol,path+': '+a+' vs '+b);return;
  }
  if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path);assert.equal(a.length,b.length,path);
    a.forEach((x,i)=>compare(x,b[i],path+'['+i+']'));return;
  }
  if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    for(const k of Object.keys(a))compare(a[k],b[k],path+'.'+k);
    return;
  }
  assert.equal(a,b,path);
}
compare(jsExpected,expected);
assert.equal(jsWorlds.length,4);
for(let i=0;i<4;i++){
  const {e5_sha256,...py}=worlds[i];
  assert.equal(e5_sha256.length,64);
  compare(jsWorlds[i],py,'world['+i+']');
}
console.log('E9 parity PASS: 4 controls × 24 frames × 4 floors × 64 exhaustive sensor masks; identity/sum readouts.');
