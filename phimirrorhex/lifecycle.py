"""E25 · Ed25519 fixture key rollover and in-memory anti-replay qualification.

These key seeds are public, both lifecycle states and expiry checks are held
only in caller-owned RAM, and ANYONE can reset or forge this demonstration.
A cryptographically valid trial NEVER authenticates a person or grants tools.
"""
from __future__ import annotations

import copy
from hashlib import sha256

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

from .portable_evidence import _canonical
from .checkpoint import checkpoint, compare_checkpoint
from .intake_chain import intake_qualification_report

SCHEMA = "phimirrorhex.e25.key-lifecycle.v1"
CLAIM_DOMAIN = "PhiMirrorHex/E25/DEMO-CLAIM"
ROTATION_DOMAIN = "PhiMirrorHex/E25/DEMO-ROTATION"
KEY_OLD = "field-a/epoch-1"
KEY_NEW = "field-a/epoch-2"
SEEDS = {
    KEY_OLD: "0c6dd28ec1abf24b4f7967c45e1264cc55d2c2234577561c128b05a84466727f",
    KEY_NEW: "c73c359babfd9a92baf4895862aad4dec62d2eb29cb8c9e8c26bce7a03fc3c09",
}
PUBLIC_KEYS = {
    KEY_OLD: "fe3a47db1b38ab66fa688e0f18752148e27e9ec29422259dbd6680444d5bd2fc",
    KEY_NEW: "7f457ad32f7bedc9e20049be7c0207541ab183754495b8062ae8ff9afd4f673a",
}
CLAIM_KEYS = {"schema", "domain", "key_id", "epoch", "sequence", "checkpoint", "signature_hex"}
ROTATION_KEYS = {"schema", "domain", "from_key", "to_key", "from_epoch",
                 "to_epoch", "effective_at_sequence", "checkpoint", "old_signature_hex",
                 "new_signature_hex"}
STATE_KEYS = {"schema", "epoch", "active_key", "last_sequence", "sequence_floor", "revoked_keys"}
HEX = "0123456789abcdef"


def _digest(v) -> str:
    return sha256(_canonical(v)).hexdigest()


def _sign(key_id: str, body: dict) -> str:
    return Ed25519PrivateKey.from_private_bytes(bytes.fromhex(SEEDS[key_id])).sign(_canonical(body)).hex()


def _verify(key_id: str, body: dict, signature) -> bool:
    if (key_id not in PUBLIC_KEYS or not isinstance(signature, str)
            or len(signature) != 128 or any(c not in HEX for c in signature)):
        return False
    try:
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(PUBLIC_KEYS[key_id])).verify(
            bytes.fromhex(signature), _canonical(body))
        return True
    except (InvalidSignature, ValueError, TypeError):
        return False


def genesis() -> dict:
    return {"schema": SCHEMA, "epoch": 1, "active_key": KEY_OLD,
            "last_sequence": 0, "sequence_floor": 1, "revoked_keys": []}


def _valid_state(s) -> bool:
    if not isinstance(s, dict) or set(s) != STATE_KEYS or s["schema"] != SCHEMA:
        return False
    if (type(s["last_sequence"]) is not int or s["last_sequence"] < 0
            or type(s["sequence_floor"]) is not int or s["sequence_floor"] < 1):
        return False
    if s["epoch"] == 1:
        return (s["active_key"] == KEY_OLD and s["revoked_keys"] == []
                and s["sequence_floor"] == 1)
    if s["epoch"] == 2:
        return (s["active_key"] == KEY_NEW and s["revoked_keys"] == [KEY_OLD]
                and s["sequence_floor"] == 10
                and s["last_sequence"] >= 9)
    return False


def sign_claim(key_id, sequence, ref, *, domain=CLAIM_DOMAIN):
    if key_id not in SEEDS:
        raise ValueError("UNKNOWN_PUBLIC_FIXTURE_KEY")
    body = {
        "schema": SCHEMA, "domain": domain, "key_id": key_id,
        "epoch": 1 if key_id == KEY_OLD else 2, "sequence": sequence,
        "checkpoint": copy.deepcopy(ref),
    }
    return {**body, "signature_hex": _sign(key_id, body)}


def sign_rotation(ref, *, old=True, new=True):
    body = {
        "schema": SCHEMA, "domain": ROTATION_DOMAIN, "from_key": KEY_OLD,
        "to_key": KEY_NEW, "from_epoch": 1, "to_epoch": 2,
        "effective_at_sequence": 10, "checkpoint": copy.deepcopy(ref),
    }
    return {
        **body, "old_signature_hex": _sign(KEY_OLD, body) if old else None,
        "new_signature_hex": _sign(KEY_NEW, body) if new else None,
    }


def _decision(state, status, reason, signatures=0):
    return {
        "status": status, "reason": reason, "signatures_verified": signatures,
        "state": copy.deepcopy(state), "signers_authenticated": False,
        "state_is_durable": False, "authority_granted": False,
        "external_calls": 0,
    }


def consume(state, claim, ledger):
    if not _valid_state(state):
        return _decision(state, "REFUSED_INVALID_STATE", "STATE_INVARIANTS_FAILED")
    if not isinstance(claim, dict) or set(claim) != CLAIM_KEYS or claim["schema"] != SCHEMA:
        return _decision(state, "REFUSED_MALFORMED_CLAIM", "CLAIM_FIELDS_INVALID")
    if claim["domain"] != CLAIM_DOMAIN:
        return _decision(state, "REFUSED_BAD_DOMAIN", "DOMAIN_SEPARATION_REQUIRED")
    if claim["key_id"] in state["revoked_keys"]:
        return _decision(state, "REFUSED_REVOKED", "RETIRED_KEY_NO_LONGER_ACTIVE")
    if (claim["key_id"] != state["active_key"]
            or type(claim["epoch"]) is not int or claim["epoch"] != state["epoch"]):
        return _decision(state, "REFUSED_INACTIVE_KEY", "ACTIVE_EPOCH_KEY_MISMATCH")
    seq = claim["sequence"]
    if type(seq) is not int or seq < state["sequence_floor"]:
        return _decision(state, "REFUSED_SEQUENCE_FLOOR", "BELOW_ROTATION_SEQUENCE_FLOOR")
    if seq <= state["last_sequence"]:
        return _decision(state, "REFUSED_REPLAY", "SEQUENCE_NOT_STRICTLY_INCREASING")
    body = {k: v for k, v in claim.items() if k != "signature_hex"}
    if not _verify(claim["key_id"], body, claim["signature_hex"]):
        return _decision(state, "REFUSED_BAD_SIGNATURE", "ED25519_VERIFY_FAILED")
    if compare_checkpoint(ledger, claim["checkpoint"])["status"] != "PREFIX_MATCHES_UNAUTHENTICATED":
        return _decision(state, "REFUSED_CHECKPOINT", "UNSIGNED_PREFIX_REFERENCE_NOT_MATCHED", 1)
    after = copy.deepcopy(state)
    after["last_sequence"] = seq
    return _decision(after, "ACCEPTED_DEMO_UNTRUSTED",
                     "VALID_FIXTURE_SIGNATURE_NO_AUTHORITY", 1)


def rotate(state, record, ledger):
    if not _valid_state(state):
        return _decision(state, "REFUSED_INVALID_STATE", "STATE_INVARIANTS_FAILED")
    if not isinstance(record, dict) or set(record) != ROTATION_KEYS or record["schema"] != SCHEMA:
        return _decision(state, "REFUSED_MALFORMED_ROTATION", "ROTATION_FIELDS_INVALID")
    if record["domain"] != ROTATION_DOMAIN:
        return _decision(state, "REFUSED_BAD_DOMAIN", "ROTATION_DOMAIN_REQUIRED")
    if state["epoch"] != 1:
        return _decision(state, "REFUSED_STALE_ROTATION", "ROTATION_ALREADY_APPLIED")
    if (record["from_key"] != KEY_OLD or record["to_key"] != KEY_NEW
            or type(record["from_epoch"]) is not int or record["from_epoch"] != 1
            or type(record["to_epoch"]) is not int or record["to_epoch"] != 2
            or type(record["effective_at_sequence"]) is not int
            or record["effective_at_sequence"] != 10
            or record["effective_at_sequence"] <= state["last_sequence"]):
        return _decision(state, "REFUSED_ROTATION_POLICY", "NONMONOTONIC_OR_WRONG_KEY_TRANSITION")
    body = {k: v for k, v in record.items()
            if k not in ("old_signature_hex", "new_signature_hex")}
    old_ok = _verify(KEY_OLD, body, record["old_signature_hex"])
    new_ok = _verify(KEY_NEW, body, record["new_signature_hex"])
    if not old_ok or not new_ok:
        return _decision(state, "REFUSED_BAD_ROTATION_PROOF", "BOTH_KEY_SIGNATURES_REQUIRED",
                         int(old_ok) + int(new_ok))
    if compare_checkpoint(ledger, record["checkpoint"])["status"] != "PREFIX_MATCHES_UNAUTHENTICATED":
        return _decision(state, "REFUSED_CHECKPOINT", "UNSIGNED_ROTATION_REFERENCE_NOT_MATCHED", 2)
    after = copy.deepcopy(state)
    after.update(epoch=2, active_key=KEY_NEW, sequence_floor=10, revoked_keys=[KEY_OLD])
    return _decision(after, "ROTATED_DEMO_UNTRUSTED",
                     "PUBLIC_FIXTURE_DUAL_SIGNED_NO_IDENTITY", 2)


def lifecycle_qualification_report():
    ledger = intake_qualification_report()["ledger"]
    ref = checkpoint(ledger, 4)
    state = genesis()
    events = []

    def observe(name, fn, material):
        nonlocal state
        out = fn(state, material, ledger)
        state = out["state"]
        events.append({"name": name, "verdict": out})

    old_9 = sign_claim(KEY_OLD, 9, ref)
    observe("first_epoch_one_claim", consume, old_9)
    observe("old_claim_replayed", consume, old_9)
    altered = sign_claim(KEY_OLD, 11, ref)
    altered["sequence"] = 10
    observe("tampered_sequence_after_signing", consume, altered)
    one_sided = sign_rotation(ref, new=False)
    observe("only_old_key_signed_rotation", rotate, one_sided)
    forged_proof = sign_rotation(ref)
    forged_proof["new_signature_hex"] = "0"*128
    observe("wrong_new_key_rotation_signature", rotate, forged_proof)
    dual = sign_rotation(ref)
    observe("valid_public_fixture_rotation", rotate, dual)
    observe("old_key_after_rotation", consume, sign_claim(KEY_OLD, 10, ref))
    observe("new_key_below_rotation_floor", consume, sign_claim(KEY_NEW, 9, ref))
    new_10 = sign_claim(KEY_NEW, 10, ref)
    observe("first_new_key_claim", consume, new_10)
    observe("new_key_replay", consume, new_10)
    observe("reapply_old_rotation", rotate, dual)
    observe("next_monotonic_new_key_claim", consume, sign_claim(KEY_NEW, 11, ref))
    # The publicly known key can produce a forged "valid" signature.
    observe("public_seed_can_forge_signature", consume, sign_claim(KEY_NEW, 12, ref))
    observe("wrong_domain_signature", consume,
            sign_claim(KEY_NEW, 13, ref, domain="PhiMirrorHex/E24/UNTRUSTED-DEMO"))
    changed = sign_claim(KEY_NEW, 13, ref)
    changed["checkpoint"]["head"] = "f"*64
    observe("checkpoint_mutated_after_signing", consume, changed)
    observe("valid_signature_wrong_checkpoint", consume,
            sign_claim(KEY_NEW, 13, checkpoint(ledger, 5)))
    # This completely independent fresh genesis demonstrates lost replay memory.
    restart = consume(genesis(), old_9, ledger)
    events.append({"name": "restart_with_lost_state_accepts_old_claim", "verdict": restart})

    statuses = [e["verdict"]["status"] for e in events]
    payload = {
        "schema": SCHEMA, "origin": "SIMULATED",
        "algorithm": "Ed25519", "fixture_public_keys": PUBLIC_KEYS,
        "public_private_seeds": True, "authenticated_identity_present": False,
        "durable_anti_replay_storage_present": False,
        "external_credential_provisioning": False,
        "real_key_custody": False,
        "rotation_old_signature": dual["old_signature_hex"],
        "rotation_new_signature": dual["new_signature_hex"],
        "first_old_claim_signature": old_9["signature_hex"],
        "first_new_claim_signature": new_10["signature_hex"],
        "events": events,
        "summary": {
            "trials": len(events),
            "accepted_untrusted": statuses.count("ACCEPTED_DEMO_UNTRUSTED"),
            "rotated_untrusted": statuses.count("ROTATED_DEMO_UNTRUSTED"),
            "refused": sum(s.startswith("REFUSED_") for s in statuses),
            "public_seed_forgery_accepted": statuses[12] == "ACCEPTED_DEMO_UNTRUSTED",
            "replay_after_state_reset_accepted": statuses[16] == "ACCEPTED_DEMO_UNTRUSTED",
            "final_active_epoch": state["epoch"],
            "final_sequence": state["last_sequence"],
            "authority_grants": 0, "external_calls": 0,
        },
        "limitations": [
            "All private signing seeds are public; fixture signatures can be forged by anyone.",
            "This is one locally simulated signer, not independently trusted identity or custody.",
            "Memory-only epoch, revocation and sequence checks vanish on state reset.",
            "The verifier cannot safely recover monotonic state without authenticated durable storage.",
            "No agent or device permission is derived from any successful signature or rotation.",
        ],
    }
    return {**payload, "sha256": _digest(payload)}
