import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transferConsensusReport} from '../web/src/consensus-transfer-model.mjs';
const py=JSON.parse(readFileSync(process.argv[2]||'e17-consensus-transfer-fixture.json','utf8'));
assert.equal(py.schema,'phimirrorhex.e17.out-of-family-consensus.v1');
const {sha256,protocol,...expected}=py;
assert.equal(sha256.length,64);assert.equal(protocol.parent_sha256.length,64);
const {protocol:jsProtocol,...actual}=transferConsensusReport();
function compare(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tol=4e-11*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tol,path+': '+a+' !== '+b);
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
assert.equal(actual.summary.evaluation_cells,36);
console.log('E17 parity PASS: 12 newly generated out-of-family streams × 3 frozen quorums × 96 frames, every member vote, abstention, change delay and loss ledger.');
