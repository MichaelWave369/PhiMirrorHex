# E23: Witness Claim & Split-View Audit

E22 established that a separately retained unsigned prefix checkpoint can reveal rollback and old-history forks, but does not provide authenticated origin. E23 asks what three *local copies* of those references would imply.

**Crucial boundary:** the three names field-a, field-b, field-c are software labels. They are neither authenticated identities, separate institutions, independent people, nor signatures. Every outcome remains synthetic, read-only, and non-authorizing. No NBG, BrainC, SPV or external repositories are connected.

## Witness claims

Each input declares six fields: witness_id, checkpoint (E22 schema), claim_kind (UNAUTHENTICATED_LOCAL_COPY), identity_authenticated=false, independence_verified=false, authority_granted=false.

Require exactly three distinct labels for a comparable claim set. If there are fewer, return INSUFFICIENT_CLAIMS; if duplicate identities or fabricated authentication appear, INVALID_WITNESS_SET. References about different protected counts are INCOMPARABLE_COUNTS, not cryptographic equivocation.

Compare each unsigned reference to the submitted E21 ledger using E22. At a common count, **any** differing reference heads produce SPLIT_VIEW_DETECTED, **even when two out of three match**. The displayed majority is a diagnostic count, never proof of truth.

If all three agree, return the E22 result as ROLLBACK_DETECTED, FORK_DETECTED, INVALID_LEDGER or AGREEMENT_UNAUTHENTICATED. Unanimity never confers permission.

## Frozen 11-case qualification

| Case | Classification |
|---|---|
| Three matching local claims | AGREEMENT_UNAUTHENTICATED |
| Two same, one different | SPLIT_VIEW_DETECTED |
| Three different | SPLIT_VIEW_DETECTED |
| Different protected counts | INCOMPARABLE_COUNTS |
| Only two claims | INSUFFICIENT_CLAIMS |
| Repeated label | INVALID_WITNESS_SET |
| False authentication claim | INVALID_WITNESS_SET |
| Rewrite and rehash protected prefix | FORK_DETECTED |
| Truncate an internally valid ledger | ROLLBACK_DETECTED |
| Co-rewrite ledger and all three pins | AGREEMENT_UNAUTHENTICATED (KNOWN BLIND SPOT) |
| Rewrite suffix after checkpoint | AGREEMENT_UNAUTHENTICATED (KNOWN BLIND SPOT) |

Totals: 3 unsigned agreements, 2 split views, 1 incomparable, 1 insufficient, 2 invalid, 1 fork and 1 rollback; 0 permission grants.

A malicious actor controlling all reference copies can forge unanimous agreement. Effective future witness networks would need distinct authenticated principals, separate custody, independently anchored checkpoints, signed or otherwise authenticated distribution, and explicit operational authorization policies. None of these are asserted or implemented here.

## Reproduce

    python -m phimirrorhex --mode witness --output e23-witness-qualification.json
    node tests/check-witness-parity.mjs e23-witness-qualification.json
    python -m pytest -q
    cd web && npm test && npm run build

The React **WITNESSES** room displays the 11 cases, conflict groups, 2:1 split refusal, and the forgery and unprotected-suffix blind spots. It exports only a local JSON research report.