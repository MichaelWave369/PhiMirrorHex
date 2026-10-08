# E19 · Portable Evidence Bridge (read-only, unsigned)

## Purpose

E19 provides a **portable content-addressed research receipt** so that future NestedBubbleGear, BrainC and SuperPhiVessel integrations can inspect PhiMirrorHex E18 synthetic research without granting one project execution authority over another.

This **creates an interoperable packet and example consumer contract** inside PhiMirrorHex only. It does **not** modify or connect the other repositories. The integration state is explicitly \`CONTRACT_ONLY_NOT_CONNECTED\`.

## Wire contract

- Root object has only \`payload\` and \`integrity\`.
- \`payload.schema\`: \`field-evidence.synthetic-quorum.v1\`.
- \`producer\`: PhiMirrorHex, \`origin\`: SIMULATED, \`signature_status\`: UNSIGNED.
- \`source_experiment\`: frozen E18 synthetic quorum audit.
- \`lineage\`: E17 retrospective development selection; E18 sealed seeds 4101–4112, 96 frames each; explicit non-independent witnesses and no raw sensor export.
- \`authority\`: grants NONE, permits INSPECT_ONLY, forbids network/device/model actions and deployments. These are **informational labels, not a sandbox or actual enforcement layer**; receiving systems must enforce their own policies.
- \`selection\`: chosen E17 rule, fixed weights, all development candidate cost receipts. Test outcomes do not alter selection.
- \`cases\`: 36 quorum × held-out synthetic-stream rows, each preserving first-alarm, missed-signal, false alarm, attempted/abstained frame counts, and 96 × 4-character compact frame tokens.
- \`summary\`: total counts with zero granted actions.
- \`integrity.algorithm\`: SHA-256 of **canonical payload JSON** (sorted object keys recursively, minified, UTF-8, ASCII field values in E19). \`signer\`: null; \`authenticity_proven\`: false.

Each 4-character trace token consists of:
1. a hexadecimal bitmask 0–7 for the three currently available observers;
2. a hexadecimal bitmask 0–7 for their affirmative votes;
3. an ASCII 0/1 for group abstention;
4. an ASCII 0/1 for the one-shot first-alarm pulse.

The frame stream includes every abstention and warning decision, **not raw noise measurements**. Portable verification checks the masks, voting constraints, quorum eligibility, single-first-alert semantics and complete trusted local E18 replay against received evidence.

## Security boundary

**A plain SHA-256 hash is not a signature.** If an attacker can replace the packet, they can also recompute its digest. The digest detects accidental/unsynchronized mutation but **does not establish authorship**. The included \`producer\` and \`origin\` strings are assertions, not verified identities. Acceptance in BrainC or Vessie requires a separately authenticated source, a trusted hash anchored out-of-band and permissioned ingestion rules.

In this repository, both verifiers additionally **recreate E18 locally and require exact matches to every expected receipt**. Therefore acceptance means \`READ_ONLY_VERIFIED\` relative to this frozen simulator, not validation of nature or external authorization. Deliberately changed data with a recomputed digest still fail.

The verifier never executes instructions included in the packet, never dispatches network calls, never authorizes a tool and never upgrades \`SIMULATED\` to \`MEASURED\`. Unexpected fields, malformed traces, fabricated signatures, changed policy flags and oversized JSON are rejected. The browser input has a 200 KB text limit.

## Consumer workflow (contract only)

1. Obtain the JSON packet through an authorized provenance channel and limit its size.
2. Parse data as JSON only, never as code.
3. Verify the canonical SHA256, strict schema, claim barriers and expected stream replay.
4. Store it as **untrusted external research evidence** with source, version and audit status; do not promote it to operational memory, reality-gate approval, scientific fact or tool authority.
5. Surface refusals and failed cases alongside successful ones.
6. Require separate operator permission and stronger external authentication if a consumer later supports operational decisions.

Possible future integration adapters should expose **read-only \`inspect(packet)\`** and \`verify(packet)\` calls, returning structured rejection reasons. E19 does not claim these adapters already exist in those repositories.

## Reproduction

\`\`\`bash
python -m phimirrorhex --mode portable-evidence --output e19-portable-evidence.json
node tests/check-portable-evidence-parity.mjs e19-portable-evidence.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

Python: \`phimirrorhex.portable_evidence.portable_packet()\` and \`verify_packet(packet)\`.

Browser / Node 22+: \`buildPortablePacket()\` and \`verifyPortablePacket(packet)\` are both async because they use native **WebCrypto SHA-256**. E19 React **EVIDENCE** room can export its packet and paste a local packet for verification; it never uploads data to a remote service.

### Proof and claim limits

Every input stream, voting behavior, change point and failure is synthetic. E19 does not prove new physical properties, photons converting to matter, biology, consciousness, independent witnesses, cryptographic publisher authenticity, sensor reliability or deployment safety. The paper trail makes those unsupported jumps harder, not more legitimate.
