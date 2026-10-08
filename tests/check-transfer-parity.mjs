import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {transferReport} from '../web/src/transfer-model.mjs';

const py=JSON.parse(readFileSync(process.argv[2]||'e12-transfer-fixture.json','utf8'));
assert.equal(py.schema,'phimirrorhex.e12.sensor-transfer-gate.v1');
const {sha256,protocol,...rest}=py;
assert.equal(sha256.length,64);
assert.equal(protocol.parent_sha256.length,64);
const browser=transferReport();
const {protocol:jsProtocol,...jsRest}=browser;
function equal(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tol=3e-11*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tol,path+': '+a+' != '+b);
  }else if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path);assert.equal(a.length,b.length,path);
    a.forEach((x,i)=>equal(x,b[i],path+'['+i+']'));
  }else if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    for(const key of Object.keys(a))equal(a[key],b[key],path+'.'+key);
  }else assert.equal(a,b,path);
}
equal(jsRest,rest);
const {parent_sha256,...withoutDigest}=protocol;
equal(jsProtocol,withoutDigest,'protocol');
assert.equal(browser.policy_count,14);
assert.equal(browser.summary.comparison_cells,280);
console.log('E12 PARITY PASS: three development seeds, one validation seed, five sealed test seeds, all 14 policies × 4 scenarios × 5 repeats including full failure ledger.');
