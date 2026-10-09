# E25 · Key Rollover & State-Scoped Replay Defense

## Question

E24 proved that Ed25519 signatures can be verified in Python and WebCrypto while all signers remain public synthetic fixtures. E25 asks what *key rollover*, retirement, monotonic replay checks, and **loss of local state on restart** actually accomplish.

**This is still not production authentication.** Both old and new private signing seeds are published in the source. Any person can manufacture a valid signature for either demo key. No external principals, signing custody, persistent database, real revocation service or agents are connected. A successful transition does not grant tool permission or establish identity.

## Frozen wire contract

Schema \`phimirrorhex.e25.key-lifecycle.v1\`.

Two known public demo keys are associated with one simulated signer:
- \`field-a/epoch-1\`: the same demonstrative seed and pinned public key from E24.
- \`field-a/epoch-2\`: a separate deterministic, openly published seed and new public key.

Signed claims bind \`schema\`, a distinct E25 claim domain, key ID, epoch, monotonically increasing sequence and the complete E22 checkpoint at **protected count four**. Both languages sign the same recursively sorted, minified UTF-8 JSON with Ed25519.

A rotation record binds the old key, new key, old/new epochs, effective global sequence **10** and frozen checkpoint count **four**. **Both old and new demo private keys must sign that exact rotation body.** It cannot be activated by a one-sided signature or a forged second signature.

### Pure in-memory lifecycle

\`genesis()\` starts at epoch 1 with \`field-a/epoch-1\`, accepted sequence 0 and minimum sequence 1.

1. An accepted signed claim updates only the locally returned state, never an agent permission. It must match the current key and epoch, be above the sequence floor, be strictly newer than the last accepted claim, be validly signed and match the frozen checkpoint.
2. An authenticated-in-the-demo *dual-signed* rotation from epoch 1 to 2 requires a future effective sequence 10. The local state moves to key 2, and key 1 joins a revoked-key list. Both signatures can be forged by anyone who has the publicly disclosed fixture seeds.
3. A retired key is refused, as are old sequences, wrong domains, tampered bytes, bad rotation proofs and mismatched checkpoints.
4. **All controls are local RAM state.** Recreating \`genesis()\` reopens the old key and resets the sequence counter. E25 **tests that vulnerability openly**. It does not provide crash recovery, persistence, anti-rollback, authentication or a remote witness.

## Frozen 17-case demonstration

| # | Scenario | Expected |
|---|---|---|
| 1 | First old-key claim at sequence 9 | ACCEPTED_DEMO_UNTRUSTED |
| 2 | Replay exactly the same old claim | REFUSED_REPLAY |
| 3 | Mutate sequence after signing | REFUSED_BAD_SIGNATURE |
| 4 | Rotate with old signature only | REFUSED_BAD_ROTATION_PROOF |
| 5 | Rotate with forged new-key signature bytes | REFUSED_BAD_ROTATION_PROOF |
| 6 | Validly dual-signed fixture rotation | ROTATED_DEMO_UNTRUSTED |
| 7 | Old key tries sequence 10 after rotation | REFUSED_REVOKED |
| 8 | New key attempts below effective sequence | REFUSED_SEQUENCE_FLOOR |
| 9 | First new-key claim sequence 10 | ACCEPTED_DEMO_UNTRUSTED |
| 10 | Replay new-key sequence 10 | REFUSED_REPLAY |
| 11 | Reapply old rotation | REFUSED_STALE_ROTATION |
| 12 | New-key claim sequence 11 | ACCEPTED_DEMO_UNTRUSTED |
| 13 | Public signing seed forges sequence 12 | ACCEPTED_DEMO_UNTRUSTED (KNOWN VULNERABILITY) |
| 14 | Wrong signing domain at sequence 13 | REFUSED_BAD_DOMAIN |
| 15 | Modify protected checkpoint after signing | REFUSED_BAD_SIGNATURE |
| 16 | Valid signature over a different checkpoint position | REFUSED_CHECKPOINT |
| 17 | Restart from genesis, replay old sequence 9 | ACCEPTED_DEMO_UNTRUSTED (KNOWN VULNERABILITY) |

Expected **17 attempts: 5 untrusted acceptances, 1 rotation, 11 refusals**, ending at local active epoch 2, last sequence 12. Every result retains zero agent authority and external calls. Public-seed forgery and state-reset acceptance are **required demonstrated failures** rather than hidden exceptions.

## Reproduce

\`\`\`bash
python -m phimirrorhex --mode lifecycle --output e25-key-lifecycle.json
node tests/check-lifecycle-parity.mjs e25-key-lifecycle.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

Python \`phimirrorhex.lifecycle\` exports \`genesis\`, \`sign_claim\`, \`sign_rotation\`, \`consume\`, \`rotate\` and \`lifecycle_qualification_report\`. JavaScript \`web/src/lifecycle-model.mjs\` independently exports corresponding WebCrypto operations. Complete claim and dual-rotation Ed25519 signature bytes, outcome receipts and SHA256 must match.

A separate production-grade design would require secret protected keys, independently provisioned trust roots, crash-safe monotonic persisted state, securely anchored revocation and recovery policy, and a dedicated capability-control service. None of these are provided or claimed here.

All data is synthetic. No inference about physics, biology, consciousness or human identity follows.
