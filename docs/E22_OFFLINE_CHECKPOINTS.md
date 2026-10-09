# E22 · Offline Checkpoints and Rollback Defense

## What this rung actually does

E21 logs quarantine/replay outcomes in a purely in-memory **unsigned hash chain**. That chain alone can always be rewritten and rehashed. E22 adds a *separately retainable checkpoint comparison contract*, plus a deliberately demonstrated blind spot.

**Nothing is connected. Nothing is signed. Nothing is persisted by the library.** The React room lets a human export a checkpoint as a local JSON file, but neither a download nor a matching hash proves publisher authenticity. A useful reference must be **retained independently and protected from the same party able to rewrite the ledger**. Actual long-lived integrity requires a trusted storage/anchor/signer design outside E22.

## Checkpoint schema: phimirrorhex.e22.offline-checkpoint.v1

A small JSON object with exactly:

- \`schema\`: E22 contract.
- \`ledger_schema\`: E21 intake chain contract.
- \`count\`: index of the **end of the protected prefix**, from zero through current event count.
- \`head\`: E21 \`event_hash\` at index \`count - 1\`; zero-count uses 64 zeroes.
- \`origin: UNSIGNED_LOCAL_SNAPSHOT\`.
- \`producer_authenticated: false\`, \`external_anchor_provided_by_library: false\`, \`authority_granted: false\`.

Generate only from a fully self-consistent E21 chain. A checkpoint does not contain the entire ledger and is portable across the Python and JavaScript implementations. The comparison API is:

- Python \`checkpoint(ledger, count)\`, \`compare_checkpoint(ledger, reference)\`
- Browser \`makeCheckpoint(ledger, count)\`, \`compareCheckpoint(ledger, reference)\` (async)

### Verification classifications

1. \`INVALID_REFERENCE\`: reference malformed or falsely claiming authenticity.
2. \`INVALID_LEDGER\`: candidate ledger fails E21 hash-chain internal consistency.
3. \`ROLLBACK_DETECTED\`: the valid candidate contains **fewer** events than a retained reference's protected count.
4. \`FORK_DETECTED\`: candidate has enough events, but the saved prefix-end event hash is different.
5. \`PREFIX_MATCHES_UNAUTHENTICATED\`: the same hash exists at the protected count. **No identity, trusted anchor, or action authorization is inferred.**

A prefix match is about **the old prefix only**: the reference says nothing about new events after the checkpoint. It is also useless against an adversary able to replace *both* reference and ledger. The E21 hash chain is deterministic and public; it is neither a MAC nor an authenticated append-only log.

### Frozen eight-scenario demonstration

Start with the eleven-event E21 qualification chain and checkpoint **the first four events**.

| Scenario | Expected result |
| --- | --- |
| Original E21 ledger | PREFIX_MATCHES_UNAUTHENTICATED |
| Same ledger with one additional, valid, quarantined read | PREFIX_MATCHES_UNAUTHENTICATED |
| Truncated to first three events, still internally valid | ROLLBACK_DETECTED |
| Rewrite second event and **recompute all following event hashes** | FORK_DETECTED |
| Rewrite eighth event, **rehash entire suffix** while keeping the first four intact | PREFIX_MATCHES_UNAUTHENTICATED (KNOWN BLIND SPOT) |
| Same ledger with a changed expected head value | FORK_DETECTED (comparison detects a difference, not which copy is right) |
| Reference falsely claims producer authentication | INVALID_REFERENCE |
| Tamper a ledger event without repairing hashes | INVALID_LEDGER |

Expected: **3 prefix matches, 1 rollback, 2 forks, 1 invalid reference, 1 invalid ledger**; zero authority grants or external calls.

Critically, \`known_post_checkpoint_rewrite_missed: true\` is a **positive, required test condition**. Reporting only successful detections would conceal the real coverage boundary.

## Files, operations, and security

No cryptographic keys or remote endpoints are needed. Local browser exports are not trustworthy by themselves; they are a convenient way for a human operator to maintain a separate copy. The browser supports pasting/importing an E21 chain and E22 checkpoint for *in-memory* comparison only. E22 does **not** persist replay cache state, verify identity or grant external model and device actions. A checkpoint file controlled by the same attacker is not a trusted anchor.

Future production work could add **opt-in durable storage, signed checkpoints, authenticated writers, monotonic sequence counters, independent witness storage, and rollback-resilient recovery**. Each has to be designed and tested on its own terms, not inferred from E22.

## Reproduce

\`\`\`bash
python -m phimirrorhex --mode checkpoint --output e22-checkpoint-qualification.json
node tests/check-checkpoint-parity.mjs e22-checkpoint-qualification.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

The React **CHECKPOINT** room illustrates all eight cases, downloads an unsigned checkpoint and source chain as separate files, and supports local pasting of an E21 ledger plus a separately saved E22 checkpoint for prefix comparison.

All experiments remain **SIMULATED**. They provide no evidence of physical, biological or consciousness phenomena, no independent human witnesses, and no permission for autonomous actions.
