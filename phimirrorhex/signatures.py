"""E24 deterministic Ed25519 *demonstration* signers, never live identities.

All private fixture seeds are PUBLIC (generated from these code constants). The
signatures are real Ed25519, but nothing here authenticates a human, device,
independent custodian or external institution, and no keys are kept secret.
"""
from __future__ import annotations

import copy
from hashlib import sha256

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

from .portable_evidence import _canonical
from .checkpoint import checkpoint, compare_checkpoint
from .intake_chain import intake_qualification_report, verify_chain, ZERO
from .witness import WITNESSES

SCHEMA = "phimirrorhex.e24.ed25519-demo-witness.v1"
DOMAIN = "PhiMirrorHex/E24/UNTRUSTED-DEMO"
EPOCH = 3
SEQUENCE = 7
SEEDS = {
    "field-a": "0c6dd28ec1abf24b4f7967c45e1264cc55d2c2234577561c128b05a84466727f",
    "field-b": "a297220d6016dd42d148abb1c9803d9c9f8ad570b4d912b195251696372fbf77",
    "field-c": "dd1cfe6b57affa829a5b8f70455f3e429449a73e37276f3746e55cc3f4b9b27f",
}
PUBLIC_KEYS = {
    "field-a": "fe3a47db1b38ab66fa688e0f18752148e27e9ec29422259dbd6680444d5bd2fc",
    "field-b": "156a252c369bf3cf8ba6fdae3196ea83f931fd899bba5323a0474ad7a323abf2",
    "field-c": "d04721bebc278079614d01287e34c7be23796058bd314a0b70a861462029e650",
}
FIELDS = {"domain", "signer_id", "epoch", "sequence", "checkpoint", "signature_hex"}
HEX = "0123456789abcdef"


def _hash(x):
    return sha256(_canonical(x)).hexdigest()


def sign_demo(signer_id, ref, epoch=EPOCH, sequence=SEQUENCE):
    if signer_id not in SEEDS:
        raise ValueError("UNKNOWN_DEMO_SIGNER")
    body = {
        "domain": DOMAIN, "signer_id": signer_id, "epoch": epoch,
        "sequence": sequence, "checkpoint": copy.deepcopy(ref),
    }
    key = Ed25519PrivateKey.from_private_bytes(bytes.fromhex(SEEDS[signer_id]))
    return {**body, "signature_hex": key.sign(_canonical(body)).hex()}


def inspect_signatures(ledger, claims, revoked=(), min_sequence=0):
    """Read-only verification and finite demo replay-window comparison."""
    result = {
        "schema": SCHEMA, "status": "INVALID_CLAIMS",
        "reason": "MALFORMED_SIGNED_CLAIM_SET",
        "signatures_verified": 0,
        "declared_claims": len(claims) if isinstance(claims, list) else 0,
        "head_groups": [], "all_heads_equal": False,
        "fixture_public_keys_pinned": True,
        "signers_authenticated_in_real_world": False,
        "independent_custody_proven": False,
        "public_demo_private_keys": True,
        "authority_granted": False, "external_calls": 0,
    }
    if not isinstance(claims, list):
        return result
    if len(claims) < len(WITNESSES):
        result.update(status="INSUFFICIENT_CLAIMS",reason="THREE_SIGNED_CLAIMS_REQUIRED")
        return result
    if len(claims) != len(WITNESSES) or any(not isinstance(c, dict) or set(c) != FIELDS for c in claims):
        return result
    ids = [c["signer_id"] for c in claims]
    if any(not isinstance(i, str) or i not in SEEDS for i in ids) or len(set(ids)) != 3:
        return result
    if (not isinstance(min_sequence, int) or isinstance(min_sequence, bool)
            or min_sequence < 0 or not isinstance(revoked, (list, tuple, set))
            or any(not isinstance(i, str) for i in revoked)):
        return result
    if any(c["domain"] != DOMAIN for c in claims):
        return result
    if any(c["epoch"] != EPOCH or type(c["epoch"]) is not int for c in claims):
        result.update(status="STALE_EPOCH",reason="FROZEN_EPOCH_REQUIRED")
        return result
    if any(type(c["sequence"]) is not int or c["sequence"] <= min_sequence for c in claims):
        result.update(status="REPLAY_SEQUENCE",reason="SEQUENCE_NOT_FRESH")
        return result
    if any(c["signer_id"] in revoked for c in claims):
        result.update(status="REVOKED_DEMO_KEY",reason="REVOKED_KEY_IN_CLAIM_SET")
        return result
    counts = [c["checkpoint"].get("count") if isinstance(c["checkpoint"], dict) else None for c in claims]
    if any(type(c) is not int or c < 0 for c in counts):
        return result
    if len(set(counts)) > 1:
        result.update(status="INCOMPARABLE_COUNTS",reason="CHECKPOINT_POSITIONS_DIFFER")
        return result
    for c in claims:
        raw = c["signature_hex"]
        if not isinstance(raw, str) or len(raw) != 128 or any(ch not in HEX for ch in raw):
            result.update(status="INVALID_SIGNATURE",reason="SIGNATURE_ENCODING_INVALID")
            return result
        body = {key: value for key, value in c.items() if key != "signature_hex"}
        try:
            Ed25519PublicKey.from_public_bytes(
                bytes.fromhex(PUBLIC_KEYS[c["signer_id"]])
            ).verify(bytes.fromhex(raw), _canonical(body))
        except (InvalidSignature, ValueError, TypeError):
            result.update(status="INVALID_SIGNATURE",reason="PINNED_DEMO_KEY_VERIFICATION_FAILED")
            return result
        result["signatures_verified"] += 1
    ordered = sorted(claims, key=lambda c: c["signer_id"])
    heads: dict[str, list[str]] = {}
    for c in ordered:
        h = c["checkpoint"].get("head")
        if not isinstance(h, str):
            return result
        heads.setdefault(h, []).append(c["signer_id"])
    result["head_groups"] = [
        {"head": head, "signer_ids": heads[head], "count": len(heads[head])}
        for head in sorted(heads)
    ]
    result["all_heads_equal"] = len(heads) == 1
    if len(heads) != 1:
        result.update(status="SIGNED_SPLIT_VIEW", reason="SIGNED_HEAD_CLAIMS_CONFLICT")
        return result
    check = compare_checkpoint(ledger, ordered[0]["checkpoint"])
    if check["status"] == "PREFIX_MATCHES_UNAUTHENTICATED":
        result.update(status="SIGNED_AGREEMENT_DEMO_UNTRUSTED",
                      reason="DEMO_SIGNATURES_VALID_BUT_KEYS_PUBLIC")
    elif check["status"] == "FORK_DETECTED":
        result.update(status="FORK_DETECTED",reason="SIGNED_PREFIX_CONFLICTS_WITH_LEDGER")
    elif check["status"] == "ROLLBACK_DETECTED":
        result.update(status="ROLLBACK_DETECTED",reason="SIGNED_PREFIX_EXCEEDS_LEDGER_LENGTH")
    else:
        result.update(status="INVALID_LEDGER_OR_REFERENCE",reason=check["status"])
    return result


def _rehash(candidate, index):
    ledger = copy.deepcopy(candidate)
    prev = ZERO if index == 0 else ledger["events"][index-1]["event_hash"]
    for e in ledger["events"][index:]:
        e["prev_hash"] = prev
        e["event_hash"] = _hash({k: v for k, v in e.items() if k != "event_hash"})
        prev = e["event_hash"]
    ledger["head"] = prev
    return ledger


def signature_qualification_report():
    ledger = intake_qualification_report()["ledger"]
    ref = checkpoint(ledger, 4)
    honest = [sign_demo(i, ref) for i in WITNESSES]
    conflicting = copy.deepcopy(honest)
    conflicting[2] = sign_demo("field-c", {**ref, "head": "f"*64})
    tampered = copy.deepcopy(honest)
    tampered[0]["checkpoint"]["head"] = "f"*64
    wrong_id = copy.deepcopy(honest)
    wrong_id[0]["signer_id"] = "field-b"
    dup = copy.deepcopy(honest)
    dup[2]["signer_id"] = "field-a"
    old_epoch = [sign_demo(i, ref, epoch=2) for i in WITNESSES]
    bad_field = copy.deepcopy(honest)
    bad_field[1]["identity_authenticated"] = True
    pre = copy.deepcopy(ledger)
    pre["events"][1]["reason_codes"].append("E24_PRE_CHECKPOINT_REWRITE")
    pre = _rehash(pre, 1)
    after = copy.deepcopy(ledger)
    after["events"][7]["reason_codes"].append("E24_SUFFIX_REWRITE")
    after = _rehash(after, 7)
    forged = [sign_demo(i, checkpoint(pre, 4)) for i in WITNESSES]
    short = {"schema":ledger["schema"],"events":copy.deepcopy(ledger["events"][:3]),
             "head":ledger["events"][2]["event_hash"]}
    different_count = copy.deepcopy(honest)
    different_count[2] = sign_demo("field-c", checkpoint(ledger, 5))
    scenarios = [
        ("three_valid_demo_signatures", ledger, honest, (), 0),
        ("signed_two_to_one_split", ledger, conflicting, (), 0),
        ("mutated_after_signing", ledger, tampered, (), 0),
        ("wrong_signer_identity", ledger, wrong_id, (), 0),
        ("missing_third_signature", ledger, honest[:2], (), 0),
        ("duplicated_signer_id", ledger, dup, (), 0),
        ("expired_epoch", ledger, old_epoch, (), 0),
        ("revoked_demo_signer", ledger, honest, ("field-b",), 0),
        ("replayed_sequence", ledger, honest, (), 7),
        ("forged_authentication_field", ledger, bad_field, (), 0),
        ("signed_prefix_fork", pre, honest, (), 0),
        ("signed_rollback", short, honest, (), 0),
        ("all_public_fixture_signers_reissue_forged_history", pre, forged, (), 0),
        ("signed_unprotected_suffix_rewrite", after, honest, (), 0),
        ("valid_signatures_different_positions", ledger, different_count, (), 0),
    ]
    cases = [
        {"name": name, "ledger_self_consistent": verify_chain(led)["valid"],
         "verdict": inspect_signatures(led, copies, revoked, threshold)}
        for name, led, copies, revoked, threshold in scenarios
    ]
    outcomes = [s["verdict"]["status"] for s in cases]
    payload = {
        "schema": SCHEMA, "origin": "SIMULATED", "algorithm": "Ed25519",
        "signature_context": DOMAIN, "demo_epoch": EPOCH,
        "demo_sequence": SEQUENCE, "demo_public_keys": PUBLIC_KEYS,
        "secret_private_keys_exist": False,
        "trust_roots_authenticated": False,
        "independent_witness_custody": False,
        "live_integrations_connected": False,
        "cases": cases,
        "summary": {
            "scenarios": len(cases),
            "valid_signature_agreements": outcomes.count("SIGNED_AGREEMENT_DEMO_UNTRUSTED"),
            "split_views": outcomes.count("SIGNED_SPLIT_VIEW"),
            "invalid_signatures": outcomes.count("INVALID_SIGNATURE"),
            "invalid_claims": outcomes.count("INVALID_CLAIMS"),
            "insufficient": outcomes.count("INSUFFICIENT_CLAIMS"),
            "stale_epochs": outcomes.count("STALE_EPOCH"),
            "revoked": outcomes.count("REVOKED_DEMO_KEY"),
            "replayed": outcomes.count("REPLAY_SEQUENCE"),
            "forks": outcomes.count("FORK_DETECTED"),
            "rollbacks": outcomes.count("ROLLBACK_DETECTED"),
            "incomparable": outcomes.count("INCOMPARABLE_COUNTS"),
            "public_fixture_forgery_passed": outcomes[12] == "SIGNED_AGREEMENT_DEMO_UNTRUSTED",
            "suffix_rewrite_passed": outcomes[13] == "SIGNED_AGREEMENT_DEMO_UNTRUSTED",
            "authority_granted": 0, "external_calls": 0,
        },
        "limitations": [
            "This demo uses public deterministic Ed25519 private seeds: anyone can forge each fixture signer.",
            "Signature verification proves possession of a key, not its owner's identity or independence.",
            "Revocation, epochs, and sequence counters are in-memory verifier arguments only.",
            "All-signer forgery and unsigned suffix edits can still yield matching signed prefix claims.",
            "No live trust root, durable replay database, external custody, or agent action authority.",
        ],
    }
    return {**payload, "sha256": _hash(payload)}
