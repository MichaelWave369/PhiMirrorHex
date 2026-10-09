"""E23: finite multi-copy checkpoint claim audit, NOT authenticated witnessing.

Three labels identify LOCAL simulated copies, not distinct operators,
cryptographic signers or independent trust domains. Matching references
never grant authority; conflicting claimed heads are never majority-voted away.
"""
from __future__ import annotations

import copy
from hashlib import sha256

from .checkpoint import checkpoint, compare_checkpoint
from .intake_chain import intake_qualification_report, verify_chain, ZERO
from .portable_evidence import _canonical

SCHEMA = "phimirrorhex.e23.witness-claim-audit.v1"
WITNESSES = ("field-a", "field-b", "field-c")
RECEIPT_KEYS = {"witness_id", "checkpoint", "claim_kind",
                "identity_authenticated", "independence_verified",
                "authority_granted"}
HEX = "0123456789abcdef"


def _hash(x) -> str:
    return sha256(_canonical(x)).hexdigest()


def claim(witness_id: str, reference: dict) -> dict:
    if witness_id not in WITNESSES:
        raise ValueError("UNKNOWN_LOCAL_WITNESS_LABEL")
    return {
        "witness_id": witness_id,
        "checkpoint": copy.deepcopy(reference),
        "claim_kind": "UNAUTHENTICATED_LOCAL_COPY",
        "identity_authenticated": False,
        "independence_verified": False,
        "authority_granted": False,
    }


def audit_witnesses(ledger, claims) -> dict:
    """Fail closed on all disagreement; quorum counts are descriptive only."""
    result = {
        "schema": SCHEMA, "status": "INVALID_WITNESS_SET",
        "reason": "WITNESS_CONTRACT_INVALID",
        "witness_count": len(claims) if isinstance(claims, list) else 0,
        "witness_checks": [], "claim_groups": [],
        "matching_claims": 0, "majority_claims": 0,
        "all_claims_match": False,
        "authenticated_quorum": False,
        "independent_witnesses_established": False,
        "source_authenticated": False, "authority_granted": False,
        "trusted_memory_write": False, "external_calls": 0,
    }
    if not isinstance(claims, list):
        return result
    if len(claims) < 3:
        result["status"], result["reason"] = "INSUFFICIENT_CLAIMS", "THREE_CLAIMS_REQUIRED"
        return result
    if len(claims) != 3:
        return result
    used = set()
    valid = True
    for item in claims:
        if not isinstance(item, dict) or set(item) != RECEIPT_KEYS:
            valid = False
            break
        name = item["witness_id"]
        pin = item["checkpoint"]
        if (not isinstance(name, str) or name not in WITNESSES or name in used
                or item["claim_kind"] != "UNAUTHENTICATED_LOCAL_COPY"
                or item["identity_authenticated"] is not False
                or item["independence_verified"] is not False
                or item["authority_granted"] is not False
                or not isinstance(pin, dict)):
            valid = False
            break
        used.add(name)
    if not valid or len(used) != 3:
        return result
    ordered = sorted(claims, key=lambda x: x["witness_id"])
    counts = [row["checkpoint"].get("count") for row in ordered]
    if any(type(c) is not int or c < 0 for c in counts):
        return result
    if len(set(counts)) != 1:
        result["status"], result["reason"] = "INCOMPARABLE_COUNTS", "CHECKPOINT_POSITIONS_DIFFER"
        return result
    checks = [{
        "witness_id": row["witness_id"],
        "claimed_head": row["checkpoint"].get("head"),
        "checkpoint_count": row["checkpoint"]["count"],
        "comparison": compare_checkpoint(ledger, row["checkpoint"]),
    } for row in ordered]
    result["witness_checks"] = checks
    if any(x["comparison"]["status"] == "INVALID_REFERENCE" for x in checks):
        result["status"], result["reason"] = "INVALID_WITNESS_SET", "MALFORMED_CHECKPOINT"
        return result
    group_map: dict[str, list[str]] = {}
    for row in checks:
        head = row["claimed_head"]
        if not isinstance(head, str):
            return result
        group_map.setdefault(head, []).append(row["witness_id"])
    result["claim_groups"] = [{
        "head": head, "witness_ids": group_map[head],
        "count": len(group_map[head]),
    } for head in sorted(group_map)]
    result["matching_claims"] = max(map(len, group_map.values()))
    result["majority_claims"] = sum(
        g["count"] >= 2 for g in result["claim_groups"]
    )
    result["all_claims_match"] = len(group_map) == 1
    if len(group_map) != 1:
        result["status"], result["reason"] = "SPLIT_VIEW_DETECTED", "CLAIMED_HEADS_DISAGREE"
        return result
    chain = verify_chain(ledger)
    if not chain["valid"]:
        result["status"], result["reason"] = "INVALID_LEDGER", chain["reason"]
        return result
    cmp = checks[0]["comparison"]
    if cmp["status"] == "ROLLBACK_DETECTED":
        result["status"], result["reason"] = "ROLLBACK_DETECTED", cmp["reason"]
    elif cmp["status"] == "FORK_DETECTED":
        result["status"], result["reason"] = "FORK_DETECTED", cmp["reason"]
    elif cmp["status"] == "PREFIX_MATCHES_UNAUTHENTICATED":
        result["status"], result["reason"] = "AGREEMENT_UNAUTHENTICATED", "SAME_UNSIGNED_PREFIX_CLAIM"
    else:
        result["status"], result["reason"] = "INVALID_WITNESS_SET", "UNEXPECTED_COMPARISON"
    return result


def _rehash(ledger, start):
    copy_of = copy.deepcopy(ledger)
    prev = ZERO if start == 0 else copy_of["events"][start-1]["event_hash"]
    for event in copy_of["events"][start:]:
        event["prev_hash"] = prev
        event["event_hash"] = _hash({k: v for k, v in event.items() if k != "event_hash"})
        prev = event["event_hash"]
    copy_of["head"] = prev
    return copy_of


def witness_qualification_report() -> dict:
    base = intake_qualification_report()["ledger"]
    pin = checkpoint(base, 4)
    honest = [claim(w, pin) for w in WITNESSES]
    one_bad = copy.deepcopy(honest)
    one_bad[2]["checkpoint"]["head"] = "f"*64
    three_way = copy.deepcopy(honest)
    three_way[1]["checkpoint"]["head"] = "e"*64
    three_way[2]["checkpoint"]["head"] = "f"*64
    different_count = copy.deepcopy(honest)
    different_count[2]["checkpoint"] = checkpoint(base, 5)
    duplicate = copy.deepcopy(honest)
    duplicate[2]["witness_id"] = "field-a"
    false_auth = copy.deepcopy(honest)
    false_auth[1]["identity_authenticated"] = True
    pre = copy.deepcopy(base)
    pre["events"][1]["reason_codes"].append("REWRITTEN_PROTECTED_PREFIX")
    pre = _rehash(pre, 1)
    after = copy.deepcopy(base)
    after["events"][7]["reason_codes"].append("REWRITTEN_UNPROTECTED_SUFFIX")
    after = _rehash(after, 7)
    truncated = {
        "schema": base["schema"], "events": copy.deepcopy(base["events"][:3]),
        "head": base["events"][2]["event_hash"],
    }
    all_forged = [claim(w, checkpoint(pre, 4)) for w in WITNESSES]
    scenarios = [
        ("three_matching_untrusted", base, honest),
        ("two_matching_one_conflicting", base, one_bad),
        ("three_conflicting_claims", base, three_way),
        ("mismatched_checkpoint_counts", base, different_count),
        ("missing_third_claim", base, honest[:2]),
        ("duplicated_witness_label", base, duplicate),
        ("false_authenticated_label", base, false_auth),
        ("rehashed_protected_prefix", pre, honest),
        ("truncated_consistent_history", truncated, honest),
        ("co_rewritten_history_and_all_references", pre, all_forged),
        ("rehashed_after_protected_prefix", after, honest),
    ]
    outcomes = [{
        "name": name,
        "ledger_self_consistent": verify_chain(ledger)["valid"],
        "verdict": audit_witnesses(ledger, copies),
    } for name, ledger, copies in scenarios]
    payload = {
        "schema": SCHEMA, "origin": "SIMULATED",
        "source": "E22_OFFLINE_CHECKPOINT",
        "witness_labels": list(WITNESSES),
        "authentic_witnesses_present": False,
        "independently_custodied_references_present": False,
        "source_packet_signed": False,
        "receiver_repositories_connected": False,
        "checkpoint_count": 4,
        "cases": outcomes,
        "summary": {
            "scenarios": len(outcomes),
            "agreement_unauthed": sum(
                x["verdict"]["status"] == "AGREEMENT_UNAUTHENTICATED" for x in outcomes),
            "split_views": sum(
                x["verdict"]["status"] == "SPLIT_VIEW_DETECTED" for x in outcomes),
            "incomparable": sum(
                x["verdict"]["status"] == "INCOMPARABLE_COUNTS" for x in outcomes),
            "insufficient": sum(
                x["verdict"]["status"] == "INSUFFICIENT_CLAIMS" for x in outcomes),
            "invalid_sets": sum(
                x["verdict"]["status"] == "INVALID_WITNESS_SET" for x in outcomes),
            "forks": sum(x["verdict"]["status"] == "FORK_DETECTED" for x in outcomes),
            "rollbacks": sum(
                x["verdict"]["status"] == "ROLLBACK_DETECTED" for x in outcomes),
            "co_rewritten_claims_pass_unauthed": (
                outcomes[9]["verdict"]["status"] == "AGREEMENT_UNAUTHENTICATED"),
            "post_checkpoint_rewrite_pass_unauthed": (
                outcomes[10]["verdict"]["status"] == "AGREEMENT_UNAUTHENTICATED"),
            "false_authority_promotions": 0, "external_calls": 0,
        },
        "limitations": [
            "Three labels are not three independently authenticated witnesses.",
            "A two-of-three majority never overrides a conflicting head claim.",
            "Forging all copies and their referenced history can produce agreement.",
            "After-checkpoint suffix rewrites remain outside pinned prefix protection.",
            "No transport, signatures, durable custody, independent operators or authority.",
        ],
    }
    return {**payload, "sha256": _hash(payload)}
