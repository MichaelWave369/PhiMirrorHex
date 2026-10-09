"""E22: offline, separately retained hash-chain checkpoint comparisons.

A checkpoint is *not* authenticated, signed, or stored by this library.
An independently retained, trusted reference may detect chain rollback or
rewrites to its prefix; a co-rewritten checkpoint offers no such protection.
"""
from __future__ import annotations

import copy
from hashlib import sha256

from .intake_chain import ZERO, empty_ledger, intake, intake_qualification_report, verify_chain
from .portable_evidence import _canonical, portable_packet

SCHEMA = "phimirrorhex.e22.offline-checkpoint.v1"
DIGITS = "0123456789abcdef"


def _hash(value) -> str:
    return sha256(_canonical(value)).hexdigest()


def _valid_hash(value) -> bool:
    return (isinstance(value, str) and len(value) == 64
            and all(ch in DIGITS for ch in value))


def checkpoint(ledger: dict, count: int) -> dict:
    if not verify_chain(ledger)["valid"]:
        raise ValueError("INVALID_SOURCE_LEDGER")
    if type(count) is not int or not 0 <= count <= len(ledger["events"]):
        raise ValueError("INVALID_CHECKPOINT_COUNT")
    head = ZERO if count == 0 else ledger["events"][count - 1]["event_hash"]
    return {
        "schema": SCHEMA,
        "ledger_schema": ledger["schema"],
        "count": count,
        "head": head,
        "origin": "UNSIGNED_LOCAL_SNAPSHOT",
        "producer_authenticated": False,
        "external_anchor_provided_by_library": False,
        "authority_granted": False,
    }


def compare_checkpoint(ledger, reference) -> dict:
    status, reason = "INVALID_REFERENCE", "CHECKPOINT_SCHEMA_INVALID"
    if (isinstance(reference, dict) and set(reference) == {
        "schema", "ledger_schema", "count", "head", "origin",
        "producer_authenticated", "external_anchor_provided_by_library",
        "authority_granted"
    } and reference.get("schema") == SCHEMA
            and reference.get("ledger_schema") == "phimirrorhex.e21.intake-chain.v1"
            and type(reference.get("count")) is int and reference["count"] >= 0
            and _valid_hash(reference.get("head"))
            and reference.get("origin") == "UNSIGNED_LOCAL_SNAPSHOT"
            and reference.get("producer_authenticated") is False
            and reference.get("external_anchor_provided_by_library") is False
            and reference.get("authority_granted") is False
            and (reference["count"] != 0 or reference["head"] == ZERO)):
        check = verify_chain(ledger)
        if not check["valid"]:
            status, reason = "INVALID_LEDGER", check["reason"]
        elif len(ledger["events"]) < reference["count"]:
            status, reason = "ROLLBACK_DETECTED", "LEDGER_SHORTER_THAN_RETAINED_CHECKPOINT"
        else:
            actual = (ZERO if reference["count"] == 0 else
                      ledger["events"][reference["count"]-1]["event_hash"])
            if actual != reference["head"]:
                status, reason = "FORK_DETECTED", "CHECKPOINT_PREFIX_HASH_MISMATCH"
            else:
                status, reason = "PREFIX_MATCHES_UNAUTHENTICATED", "RETAINED_PREFIX_MATCHES"
    return {
        "status": status,
        "reason": reason,
        "prefix_matches": status == "PREFIX_MATCHES_UNAUTHENTICATED",
        "origin_authenticated": False,
        "trusted_anchor_created": False,
        "after_checkpoint_suffix_protected": False,
        "external_calls": 0,
        "authority_granted": False,
    }


def _rehash_from(ledger: dict, starting: int) -> dict:
    candidate = copy.deepcopy(ledger)
    prev = ZERO if starting == 0 else candidate["events"][starting-1]["event_hash"]
    for e in candidate["events"][starting:]:
        e["prev_hash"] = prev
        e["event_hash"] = _hash({k: v for k, v in e.items() if k != "event_hash"})
        prev = e["event_hash"]
    candidate["head"] = prev
    return candidate


def checkpoint_qualification_report() -> dict:
    old = intake_qualification_report()["ledger"]
    anchor = checkpoint(old, 4)
    packet = portable_packet()
    extended = intake(old, packet, "BrainC")
    rollback = {
        "schema": old["schema"], "events": copy.deepcopy(old["events"][:3]),
        "head": old["events"][2]["event_hash"],
    }
    pre = copy.deepcopy(old)
    pre["events"][1]["reason_codes"].append("REWRITTEN_PRE_CHECKPOINT")
    pre = _rehash_from(pre, 1)
    post = copy.deepcopy(old)
    post["events"][7]["reason_codes"].append("REWRITTEN_POST_CHECKPOINT")
    post = _rehash_from(post, 7)
    changed_pin = {**anchor, "head": "f"*64}
    invalid_ref = {**anchor, "producer_authenticated": True}
    corrupt = copy.deepcopy(old)
    corrupt["events"][3]["reason_codes"].append("UNREHASHED_EDIT")
    scenarios = [
        ("original", old, anchor),
        ("appended_receipt", extended, anchor),
        ("truncated_history", rollback, anchor),
        ("rebuilt_history_before_checkpoint", pre, anchor),
        ("rebuilt_history_after_checkpoint", post, anchor),
        ("altered_retained_pin", old, changed_pin),
        ("forged_authenticated_checkpoint", old, invalid_ref),
        ("inconsistent_ledger", corrupt, anchor),
    ]
    records = [{
        "name": name,
        "actual_chain_valid": verify_chain(candidate)["valid"],
        "verdict": compare_checkpoint(candidate, pin),
    } for name, candidate, pin in scenarios]
    payload = {
        "schema": SCHEMA,
        "producer": "PhiMirrorHex",
        "origin": "SIMULATED",
        "checkpoint": anchor,
        "source_intake_head": old["head"],
        "source_event_count": len(old["events"]),
        "source_checkpoint_count": anchor["count"],
        "reference_was_externally_anchored": False,
        "reference_is_signed": False,
        "consumer_repositories_connected": False,
        "durable_storage_enabled": False,
        "scenario_receipts": records,
        "summary": {
            "scenarios": len(records),
            "prefix_matches": sum(r["verdict"]["prefix_matches"] for r in records),
            "rollbacks": sum(r["verdict"]["status"] == "ROLLBACK_DETECTED" for r in records),
            "forks": sum(r["verdict"]["status"] == "FORK_DETECTED" for r in records),
            "invalid_references": sum(r["verdict"]["status"] == "INVALID_REFERENCE" for r in records),
            "invalid_ledgers": sum(r["verdict"]["status"] == "INVALID_LEDGER" for r in records),
            "known_post_checkpoint_rewrite_missed": (
                records[4]["verdict"]["status"] == "PREFIX_MATCHES_UNAUTHENTICATED"
            ),
            "authority_grants": 0,
            "external_calls": 0,
        },
        "limitations": [
            "An independently saved reference is required to notice a complete rehash.",
            "This checkpoint is unsigned, in-memory and not an independently trusted anchor.",
            "Rewriting both evidence and its comparison pin defeats this check.",
            "A rewrite entirely after the pinned prefix is outside the checkpoint guarantee.",
            "No live agent integrations, physical measurements or action grants exist.",
        ],
    }
    return {**payload, "sha256": _hash(payload)}
