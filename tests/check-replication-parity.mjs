import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {replicationReport} from '../web/src/replication-model.mjs';

const py=JSON.parse(readFileSync(process.argv[2]||'e11-replication-fixture.json','utf8'));
const {sha256,protocol, ...rest}=py;
assert.equal(sha256.length,64);
assert.equal(protocol.training_policy_digest.length,64);
const {protocol:jsProtocol,...jsRest}=replicationReport();
function compare(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tolerance=3e-11*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tolerance,path+' mismatch '+a+' versus '+b);
  }else if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path); assert.equal(a.length,b.length,path);
    a.forEach((value,index)=>compare(value,b[index],path+'['+index+']'));
  }else if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    for(const k of Object.keys(a))compare(a[k],b[k],path+'.'+k);
  }else assert.equal(a,b,path);
}
compare(jsRest,rest);
const {training_policy_digest,...pyProtocol}=protocol;
compare(jsProtocol,pyProtocol,'protocol');
assert.equal(jsRest.replicates.length,5);
assert.equal(jsRest.aggregate.length,56);
console.log('E11 parity PASS: 5 independent synthetic seeds, 14 frozen policies, 4 scenarios, 240 held-out pairs, full failure ledger.');
