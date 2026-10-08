import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calibrationReport} from '../web/src/calibration-model.mjs';

const fixture=JSON.parse(readFileSync(process.argv[2]||'e13-calibration-fixture.json','utf8'));
assert.equal(fixture.schema,'phimirrorhex.e13.calibrated-refusal.v1');
const {sha256,protocol,...rest}=fixture;
assert.equal(sha256.length,64);
assert.equal(protocol.parent_sha256.length,64);
const browser=calibrationReport();
const {protocol:jsProtocol,...jsRest}=browser;
function compare(a,b,path='root'){
  if(typeof a==='number'&&typeof b==='number'){
    const tolerance=4e-11*Math.max(1,Math.abs(a),Math.abs(b));
    assert.ok(Math.abs(a-b)<=tolerance,path+': '+a+' != '+b);
  } else if(Array.isArray(a)){
    assert.ok(Array.isArray(b),path);assert.equal(a.length,b.length,path);
    a.forEach((v,i)=>compare(v,b[i],path+'['+i+']'));
  } else if(a&&typeof a==='object'){
    assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path);
    Object.keys(a).forEach(k=>compare(a[k],b[k],path+'.'+k));
  } else assert.equal(a,b,path);
}
compare(jsRest,rest);
const {parent_sha256,...withoutDigest}=protocol;
compare(jsProtocol,withoutDigest,'protocol');
assert.equal(browser.summary.scored_cells,210);
console.log('E13 parity PASS: 14 frozen mask policies, independent null calibration, 5 sealed seeds, fault abstention, all 210 trial cells and failure evidence.');
