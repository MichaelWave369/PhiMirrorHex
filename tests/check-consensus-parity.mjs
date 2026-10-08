import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {consensusReport} from '../web/src/consensus-model.mjs';
const fixture=JSON.parse(readFileSync(process.argv[2]||'e16-consensus-fixture.json','utf8'));
assert.equal(fixture.schema,'phimirrorhex.e16.quorum-consensus.v1');
const {sha256,protocol,...expected}=fixture;
assert.equal(sha256.length,64);assert.equal(protocol.parent_sha256.length,64);
const {protocol:jsProtocol,...actual}=consensusReport();
function compare(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tolerance=4e-11*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tolerance,path+': '+a+' !== '+b);
  }else if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path);assert.equal(a.length,b.length,path);
    a.forEach((v,i)=>compare(v,b[i],path+'['+i+']'));
  }else if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    for(const k of Object.keys(a))compare(a[k],b[k],path+'.'+k);
  }else assert.equal(a,b,path);
}
compare(actual,expected);
const {parent_sha256,...pyProtocol}=protocol;
compare(jsProtocol,pyProtocol,'protocol');
assert.equal(actual.summary.evaluation_cells,24);
console.log('E16 parity PASS: 3 correlated observers, 3 frozen voting thresholds, 8 sealed streams, all 2,304 frame-level votes, abstentions and complete failure ledger.');
