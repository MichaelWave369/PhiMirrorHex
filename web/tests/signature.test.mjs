import test from 'node:test';
import assert from 'node:assert/strict';
import {signatureQualificationReport,signDemo,inspectSignatures}
 from '../src/signature-model.mjs';
import {intakeQualificationReport} from '../src/intake-chain-model.mjs';
import {makeCheckpoint} from '../src/checkpoint-model.mjs';
import {WITNESSES} from '../src/witness-model.mjs';

const statuses=[
 'SIGNED_AGREEMENT_DEMO_UNTRUSTED','SIGNED_SPLIT_VIEW',
 'INVALID_SIGNATURE','INVALID_SIGNATURE','INSUFFICIENT_CLAIMS',
 'INVALID_CLAIMS','STALE_EPOCH','REVOKED_DEMO_KEY',
 'REPLAY_SEQUENCE','INVALID_CLAIMS','FORK_DETECTED','ROLLBACK_DETECTED',
 'SIGNED_AGREEMENT_DEMO_UNTRUSTED','SIGNED_AGREEMENT_DEMO_UNTRUSTED',
 'INCOMPARABLE_COUNTS'
];
test('E24 full 15-case cryptographic signature demo and honest blind spots',async()=>{
 const r=await signatureQualificationReport();
 assert.equal(r.algorithm,'Ed25519');
 assert.equal(r.trust_roots_authenticated,false);
 assert.equal(r.secret_private_keys_exist,false);
 assert.deepEqual(r.cases.map(c=>c.verdict.status),statuses);
 assert.deepEqual(r.summary,{
  scenarios:15,valid_signature_agreements:3,split_views:1,
  invalid_signatures:2,invalid_claims:2,insufficient:1,stale_epochs:1,
  revoked:1,replayed:1,forks:1,rollbacks:1,incomparable:1,
  public_fixture_forgery_passed:true,suffix_rewrite_passed:true,
  authority_granted:0,external_calls:0
 });
 for(const {verdict:v} of r.cases){
  assert.equal(v.signers_authenticated_in_real_world,false);
  assert.equal(v.independent_custody_proven,false);
  assert.equal(v.public_demo_private_keys,true);
  assert.equal(v.authority_granted,false);
  assert.equal(v.external_calls,0);
 }
});
test('E24 real Ed25519 signatures verify but do not authorize',async()=>{
 const ledger=(await intakeQualificationReport()).ledger;
 const reference=await makeCheckpoint(ledger,4);
 const claims=await Promise.all(WITNESSES.map(i=>signDemo(i,reference)));
 assert.ok(claims.every(c=>c.signature_hex.length===128));
 const result=await inspectSignatures(ledger,claims);
 assert.equal(result.status,'SIGNED_AGREEMENT_DEMO_UNTRUSTED');
 assert.equal(result.signatures_verified,3);
 assert.equal(result.authority_granted,false);
 assert.equal((await inspectSignatures(ledger,claims,[],7)).status,'REPLAY_SEQUENCE');
 assert.equal((await inspectSignatures(ledger,claims,['field-c'])).status,'REVOKED_DEMO_KEY');
 const altered=structuredClone(claims);altered[0].signature_hex='0'.repeat(128);
 assert.equal((await inspectSignatures(ledger,altered)).status,'INVALID_SIGNATURE');
});
