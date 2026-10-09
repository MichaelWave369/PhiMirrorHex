"""E26: unauthenticated snapshot recovery and separately held comparison pin.

No durable state, authenticated writer, secret key, real witness or authority
is provided. A matching local checksum is not a trusted crash-recovery proof.
"""
from __future__ import annotations
import copy
from hashlib import sha256
from .portable_evidence import _canonical
from .lifecycle import (_valid_state, lifecycle_qualification_report,
                        genesis, sign_claim, consume, KEY_OLD)
from .intake_chain import intake_qualification_report
from .checkpoint import checkpoint

SCHEMA = "phimirrorhex.e26.recovery-audit.v1"
PIN_SCHEMA = "phimirrorhex.e26.held-state-reference.v1"
STATE_KEYS = {"schema", "generation", "state", "digest"}
PIN_KEYS = {"schema", "minimum_generation", "expected_digest", "origin",
            "identity_authenticated", "durable_anchor_provided", "authority_granted"}
HEX = "0123456789abcdef"


def _hash(value):
    return sha256(_canonical(value)).hexdigest()


def _is_hash(v):
    return isinstance(v, str) and len(v) == 64 and all(c in HEX for c in v)


def make_snapshot(state, generation):
    if not _valid_state(state) or type(generation) is not int or generation < 0:
        raise ValueError("INVALID_SNAPSHOT_SOURCE")
    body = {"schema": SCHEMA, "generation": generation, "state": copy.deepcopy(state)}
    return {**body, "digest": _hash(body)}


def hold_reference(snapshot):
    if not _valid_snapshot(snapshot):
        raise ValueError("INVALID_REFERENCE_SOURCE")
    return {
        "schema": PIN_SCHEMA, "minimum_generation": snapshot["generation"],
        "expected_digest": snapshot["digest"], "origin": "UNAUTHENTICATED_HELD_COPY",
        "identity_authenticated": False, "durable_anchor_provided": False,
        "authority_granted": False,
    }


def _valid_snapshot(s):
    if (not isinstance(s, dict) or set(s) != STATE_KEYS or s.get("schema") != SCHEMA
            or type(s.get("generation")) is not int or s["generation"] < 0
            or not _is_hash(s.get("digest")) or not _valid_state(s.get("state"))):
        return False
    return _hash({k: v for k, v in s.items() if k != "digest"}) == s["digest"]


def _valid_reference(ref):
    return (
        isinstance(ref, dict) and set(ref) == PIN_KEYS
        and ref.get("schema") == PIN_SCHEMA
        and type(ref.get("minimum_generation")) is int
        and ref["minimum_generation"] >= 0
        and _is_hash(ref.get("expected_digest"))
        and ref.get("origin") == "UNAUTHENTICATED_HELD_COPY"
        and ref.get("identity_authenticated") is False
        and ref.get("durable_anchor_provided") is False
        and ref.get("authority_granted") is False
    )


def recover(snapshot, reference):
    status, reason = "REFUSED_INVALID_REFERENCE", "REFERENCE_FIELDS_INVALID"
    if reference is None:
        status, reason = "REFUSED_NO_REFERENCE", "SEPARATE_REFERENCE_REQUIRED"
    elif _valid_reference(reference):
        if not _valid_snapshot(snapshot):
            status, reason = "REFUSED_INVALID_SNAPSHOT", "SNAPSHOT_STRUCTURE_OR_DIGEST_INVALID"
        elif snapshot["generation"] < reference["minimum_generation"]:
            status, reason = "REFUSED_ROLLBACK", "SNAPSHOT_OLDER_THAN_HELD_REFERENCE"
        elif snapshot["generation"] > reference["minimum_generation"]:
            status, reason = "REFUSED_UNPINNED_ADVANCE", "NEW_GENERATION_HAS_NO_VALIDATED_CONTINUITY"
        elif snapshot["digest"] != reference["expected_digest"]:
            status, reason = "REFUSED_FORK", "SAME_GENERATION_DIFFERENT_DIGEST"
        else:
            status, reason = "RECOVERED_DEMO_UNTRUSTED", "MATCHED_UNAUTHENTICATED_CHECKSUM_ONLY"
    return {
        "status": status, "reason": reason, "generation": (
            snapshot["generation"] if _valid_snapshot(snapshot) else None
        ),
        "state": (copy.deepcopy(snapshot["state"])
                  if status == "RECOVERED_DEMO_UNTRUSTED" else None),
        "independent_reference_authenticated": False,
        "publisher_authenticated": False,
        "secure_persistence_provided": False,
        "authority_granted": False, "external_calls": 0,
    }


def recovery_qualification_report():
    e25 = lifecycle_qualification_report()
    old_state = e25["events"][11]["verdict"]["state"]  # epoch 2, seq 11
    new_state = e25["events"][12]["verdict"]["state"]  # epoch 2, seq 12
    earlier = make_snapshot(old_state, 11)
    current = make_snapshot(new_state, 12)
    pin = hold_reference(current)
    modified = copy.deepcopy(current)
    modified["state"]["last_sequence"] = 11   # digest not repaired
    rehashed = make_snapshot({**new_state, "last_sequence": 11}, 12)
    co_ref = hold_reference(rehashed)
    unpinned_future = make_snapshot(new_state, 13)
    corrupt_state = copy.deepcopy(new_state)
    corrupt_state["epoch"] = 1
    malformed = {"schema": SCHEMA, "generation": 12, "state": corrupt_state}
    malformed["digest"] = _hash(malformed)
    genesis_snapshot = make_snapshot(genesis(), 0)
    scenarios = [
        ("exact_retained_snapshot", current, pin),
        ("valid_older_snapshot", earlier, pin),
        ("edited_snapshot_without_rehash", modified, pin),
        ("rehash_same_generation", rehashed, pin),
        ("rewrite_snapshot_and_reference_together", rehashed, co_ref),
        ("missing_reference", current, None),
        ("fake_authenticated_reference", current, {**pin, "identity_authenticated": True}),
        ("future_snapshot_without_new_pin", unpinned_future, pin),
        ("impossible_epoch_state_with_valid_hash", malformed, pin),
        ("tampered_held_reference_digest", current, {**pin, "expected_digest": "f"*64}),
        ("older_snapshot_with_co_rewound_reference", earlier, hold_reference(earlier)),
        ("fresh_genesis_with_its_own_reference", genesis_snapshot,
         hold_reference(genesis_snapshot)),
    ]
    cases = [
        {"name": name, "verdict": recover(s, ref)}
        for name, s, ref in scenarios
    ]
    ledger = intake_qualification_report()["ledger"]
    checkpoint_ref = checkpoint(ledger, 4)
    old_signed = sign_claim(KEY_OLD, 9, checkpoint_ref)
    safe_probe = consume(cases[0]["verdict"]["state"], old_signed, ledger)
    reset_probe = consume(cases[-1]["verdict"]["state"], old_signed, ledger)
    names = [row["verdict"]["status"] for row in cases]
    payload = {
        "schema": SCHEMA, "origin": "SIMULATED",
        "source": "E25_PUBLIC_KEY_LIFECYCLE", "retained_reference": pin,
        "example_snapshot": current,
        "real_durable_anti_rollback_anchor": False,
        "real_authenticated_state_writer": False,
        "cross_session_automated_persistence": False,
        "consumer_repositories_connected": False,
        "cases": cases,
        "replay_probes": {
            "with_matching_epoch_two_state": safe_probe["status"],
            "after_forged_genesis_recovery": reset_probe["status"],
        },
        "summary": {
            "scenarios": len(cases),
            "recovered_untrusted": names.count("RECOVERED_DEMO_UNTRUSTED"),
            "rollbacks": names.count("REFUSED_ROLLBACK"),
            "forks": names.count("REFUSED_FORK"),
            "invalid_snapshots": names.count("REFUSED_INVALID_SNAPSHOT"),
            "missing_references": names.count("REFUSED_NO_REFERENCE"),
            "invalid_references": names.count("REFUSED_INVALID_REFERENCE"),
            "unpinned_advances": names.count("REFUSED_UNPINNED_ADVANCE"),
            "co_rewrite_passed": names[4] == "RECOVERED_DEMO_UNTRUSTED",
            "co_rewind_passed": names[10] == "RECOVERED_DEMO_UNTRUSTED",
            "fresh_genesis_passed": names[11] == "RECOVERED_DEMO_UNTRUSTED",
            "reset_replay_accepted": reset_probe["status"] == "ACCEPTED_DEMO_UNTRUSTED",
            "protected_replay_refused": safe_probe["status"] == "REFUSED_REVOKED",
            "authority_grants": 0, "external_calls": 0,
        },
        "limitations": [
            "No reference copy is authenticated or durably protected by this implementation.",
            "Rewriting both state and its held reference defeats the checksum comparison.",
            "A fresh genesis plus a self-issued reference admits old replayed claims.",
            "A valid snapshot hash is not an attestation of its actual writer or provenance.",
            "No secure crash recovery, filesystem persistence, signature trust root or action rights.",
        ],
    }
    return {**payload, "sha256": _hash(payload)}
