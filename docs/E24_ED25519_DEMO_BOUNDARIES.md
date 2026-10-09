# E24 · Ed25519 Witness Mechanics With an Explicit Trust Boundary

## Scope and language

E23 had unsigned witness claim labels. E24 uses **real Ed25519 cryptographic signing and verification** with the Python cryptography library and standard browser/Node WebCrypto API.

**Every private seed used by this test is public, deterministic and shipped in the source. This is deliberately a DEMONSTRATION of signature mechanics, not a trust system.** Any reader can sign as field-a, field-b or field-c. A cryptographically correct signature verifies possession of the corresponding key, but cannot authenticate the real-world identity, independence, custody, or trustworthiness of a publicly known fixture key.

No external keys, credentials, authenticated operators, certificate authority, durable replay store, or connection to NBG/BrainC/SuperPhiVessel exist.

## Frozen signed claim wire representation

The protected message is recursively sorted, minified UTF-8 JSON containing:
- domain = PhiMirrorHex/E24/UNTRUSTED-DEMO
- signer_id = field-a, field-b, or field-c
- epoch = 3
- sequence = 7
- checkpoint = the complete E22 checkpoint reference

Each has a deterministic Ed25519 signature in lowercase hexadecimal. Public keys are pinned in the code; private fixture seeds are openly published and cannot be used as secrets.

The read-only verifier:
1. Requires three distinct known signer labels and strictly fixed claim keys.
2. Refuses wrong domain, stale epoch, non-fresh sequence, revoked signer, malformed bytes, and unequal checkpoint counts. Epoch, revocation and sequence limits are caller-supplied in-memory **demonstrations**, not durable security state.
3. Verifies each Ed25519 signature against its declared **pinned demo** public key.
4. If valid claims disagree about the checkpoint head, returns SIGNED_SPLIT_VIEW rather than letting a 2-to-1 majority grant authority.
5. If all agree, compares the claimed protected prefix to the E21 ledger through E22. Valid fixtures return SIGNED_AGREEMENT_DEMO_UNTRUSTED, never true identity authentication or authority.

## Frozen fifteen-case adversarial qualification

| Case | Expected |
|---|---|
| Three genuinely signed demo claims | SIGNED_AGREEMENT_DEMO_UNTRUSTED |
| Signed 2-to-1 conflicting heads | SIGNED_SPLIT_VIEW |
| Change message bytes after signing | INVALID_SIGNATURE |
| Swap two signer identity fields | INVALID_SIGNATURE |
| Missing third signature | INSUFFICIENT_CLAIMS |
| Duplicate signer ID | INVALID_CLAIMS |
| Correctly signed but stale epoch | STALE_EPOCH |
| Locally marked revoked demo signer | REVOKED_DEMO_KEY |
| Stale sequence against supplied freshness threshold | REPLAY_SEQUENCE |
| Inject false authenticated field | INVALID_CLAIMS |
| Change protected prefix and rehash | FORK_DETECTED |
| Truncate internally consistent ledger | ROLLBACK_DETECTED |
| Re-sign co-rewritten history using public fixture keys | SIGNED_AGREEMENT_DEMO_UNTRUSTED: **known forgery**
| Rehash only suffix after protected prefix | SIGNED_AGREEMENT_DEMO_UNTRUSTED: **known blind spot** |
| Different protected counts, valid signatures | INCOMPARABLE_COUNTS |

This exhibits actual signature verification without making false claims about real identity. Since the test keys are public, **co-rewriting a ledger and re-signing all three checkpoints is entirely possible**. No subset of the 15 scenarios grants tool execution, trust promotion, or external control.

## Reproduce

Python package dependency: cryptography, deliberately using a mature Ed25519 implementation rather than DIY crypto.

    python -m phimirrorhex --mode signed-witness --output e24-signature-qualification.json
    node tests/check-signature-parity.mjs e24-signature-qualification.json
    python -m pytest -q
    cd web && npm test && npm run build

React SIGNATURES room displays classifications and the caveats above. The UI uses native WebCrypto support for Ed25519; older browsers that lack it should show a clear failure rather than falsely claim verification success. It never uploads receipts or contacts another project.

Next real production-grade work would need protected private keys, independently provisioned trust roots, principal-to-key binding, certificate/key rotation and revocation, durable monotonic anti-replay state, independent custody, and an external policy engine. E24 does not supply them.