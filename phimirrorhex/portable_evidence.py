"""E19 · read-only portable synthetic evidence packets.

Packets are intentionally unsigned, content-addressed and non-authorizing.
They do NOT provide an authenticity proof, external sensor provenance, or
permission for consumer agent actions. The verifier accepts untrusted JSON
without evaluating code or making network calls.
"""
from __future__ import annotations

from hashlib import sha256
import json

from .prospective_audit import prospective_audit_report

SCHEMA = "field-evidence.synthetic-quorum.v1"
CONSUMERS = ("NestedBubbleGear", "BrainC", "SuperPhiVessel")
FRAME_COUNT = 96
EXPECTED_CASES = 36
MAX_BYTES = 200_000
LIMITATIONS = (
    "All observations are deterministic simulated noise, not real measurements.",
    "Observers share synthetic noise; agreement does not mean independence.",
    "E17 was reused retrospectively as development evidence.",
    "Content hashes detect byte changes, not authorship, consent or authenticity.",
    "No control, device, model, network or deployment authority is conveyed.",
)


def _canonical(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False, allow_nan=False).encode("utf-8")


def _frame_digest(trace: list[dict]) -> str:
    # Four ASCII chars per frame: available mask, affirmative vote mask,
    # ensemble refusal and first-alert pulse. Never exports raw sensor data.
    tokens = []
    for row in trace:
        availability = sum((1 << i) for i, v in enumerate(row["member_available"]) if v)
        yes = sum((1 << i) for i, v in enumerate(row["member_votes"]) if v)
        tokens.append(f"{availability:x}{yes:x}{int(row['abstained'])}{int(row['new_alert'])}")
    return "".join(tokens)


def _case(policy: dict, t: dict) -> dict:
    return {
        "quorum": policy["quorum"], "family": t["family"], "seed": t["seed"],
        "onset": t["true_change_step"], "first_alarm": t["first_alarm_step"],
        "false_alarm": t["false_alarm"],
        "persistent_missed": t["persistent_change_missed"],
        "detected": t["persistent_change_detected"],
        "detection_delay": t["detection_delay"],
        "attempted": t["attempted"], "abstained": t["abstained"],
        "frame_tokens": _frame_digest(t["observations"]),
    }


def portable_payload() -> dict:
    e18 = prospective_audit_report()
    cases = [_case(p, t) for p in e18["policies"] for t in p["trials"]]
    return {
        "schema": SCHEMA,
        "producer": "PhiMirrorHex",
        "source_experiment": e18["schema"],
        "source_stage": "E18",
        "origin": "SIMULATED",
        "signature_status": "UNSIGNED",
        "consumer_integration_status": "CONTRACT_ONLY_NOT_CONNECTED",
        "intended_readonly_consumers": list(CONSUMERS),
        "claims": {
            "real_measurement": False, "independent_witnesses": False,
            "consciousness_measured": False, "physical_law_discovered": False,
            "reliability_certified": False, "agent_action_authorized": False,
        },
        "authority": {
            "grant": "NONE", "permitted": "INSPECT_ONLY",
            "execution_allowed": False, "deployment_allowed": False,
            "network_action_allowed": False, "must_be_revalidated": True,
        },
        "lineage": {
            "source_selection_stage": "E17_REUSED_AS_RETROSPECTIVE_DEVELOPMENT",
            "selection_was_originally_preregistered": False,
            "quorum_frozen_before_e18_holdout": True,
            "source_seeds": list(range(4101, 4113)),
            "frame_count": FRAME_COUNT,
            "frame_encoding": "4 hex ASCII per step: available(0-7), yes(0-7), refused(0/1), first-alert(0/1)",
            "raw_sensor_samples_exported": False,
        },
        "selection": {
            "chosen_quorum": e18["selection"]["selected_quorum"],
            "weights": e18["selection"]["weights"],
            "candidate_costs": e18["selection"]["candidate_costs"],
            "selection_uses_e18_holdout": False,
        },
        "cases": cases,
        "summary": {
            "cases": len(cases),
            "per_quorum": FRAME_COUNT // 8,
            "total_frames": len(cases) * FRAME_COUNT,
            "false_alarms": sum(c["false_alarm"] for c in cases),
            "persistent_misses": sum(c["persistent_missed"] for c in cases),
            "total_abstained": sum(c["abstained"] for c in cases),
            "selected_quorum": e18["selection"]["selected_quorum"],
            "granted_actions": 0,
        },
        "limitations": list(LIMITATIONS),
    }


def portable_packet() -> dict:
    payload = portable_payload()
    return {
        "payload": payload,
        "integrity": {
            "algorithm": "SHA-256",
            "sha256": sha256(_canonical(payload)).hexdigest(),
            "signer": None,
            "authenticity_proven": False,
        },
    }


def verify_packet(packet) -> dict:
    """Structural + content-integrity audit, never authorization/authentication.

    Digest is unkeyed. Anyone can alter a packet and recompute it; this
    proves internal consistency only, not publisher identity.
    """
    errors: list[str] = []
    try:
        if not isinstance(packet, dict) or set(packet) != {"payload", "integrity"}:
            raise ValueError("Invalid envelope keys")
        if len(_canonical(packet)) > MAX_BYTES:
            raise ValueError("Packet exceeds 200000 bytes")
        payload, integrity = packet["payload"], packet["integrity"]
        if not isinstance(payload, dict) or not isinstance(integrity, dict):
            raise ValueError("Payload and integrity must be objects")
        if set(integrity) != {"algorithm", "sha256", "signer", "authenticity_proven"}:
            raise ValueError("Unexpected integrity fields")
        digest = integrity["sha256"]
        if (integrity["algorithm"] != "SHA-256" or
            not isinstance(digest, str) or len(digest) != 64 or
            any(x not in "0123456789abcdef" for x in digest)):
            raise ValueError("Invalid checksum metadata")
        if sha256(_canonical(payload)).hexdigest() != digest:
            raise ValueError("Checksum mismatch")
        if integrity["signer"] is not None or integrity["authenticity_proven"] is not False:
            raise ValueError("Unsigned packets cannot claim authenticity")
        expected = portable_payload()
        if set(payload) != set(expected):
            raise ValueError("Unexpected evidence fields")
        for k in ("schema", "producer", "source_experiment", "source_stage",
                  "origin", "signature_status", "consumer_integration_status",
                  "intended_readonly_consumers", "claims", "authority", "lineage",
                  "selection", "limitations"):
            if payload[k] != expected[k]:
                raise ValueError(f"Contract/provenance mismatch: {k}")
        cases = payload["cases"]
        if not isinstance(cases, list) or len(cases) != EXPECTED_CASES:
            raise ValueError("Case-count mismatch")
        # Portable contract: fixed protocols and source seed rows are immutable.
        # Regenerating E18 here makes this verifier a reproducibility verifier
        # as well as an envelope-integrity checker, without trusting packet inputs.
        if cases != expected["cases"] or payload["summary"] != expected["summary"]:
            raise ValueError("Evidence replay mismatch")
        for case in cases:
            tokens = case["frame_tokens"]
            if not isinstance(tokens, str) or len(tokens) != FRAME_COUNT * 4:
                raise ValueError("Missing complete frame trace")
            q, attempts, first = case["quorum"], 0, None
            for step in range(FRAME_COUNT):
                a, v, refuse, new = tokens[4*step:4*step+4]
                if a not in "01234567" or v not in "01234567" or (
                    refuse not in "01" or new not in "01"
                ):
                    raise ValueError("Invalid frame token")
                avail, votes = int(a, 16), int(v, 16)
                if votes & ~avail:
                    raise ValueError("Unavailable member cast a vote")
                unavailable = avail.bit_count() < q
                if unavailable != (refuse == "1"):
                    raise ValueError("Refusal mismatch")
                attempts += not unavailable
                alarm = first is None and not unavailable and votes.bit_count() >= q
                if alarm != (new == "1"):
                    raise ValueError("First-alarm sequence mismatch")
                if alarm:
                    first = step
            if attempts != case["attempted"] or FRAME_COUNT-attempts != case["abstained"]:
                raise ValueError("Coverage mismatch")
            if first != case["first_alarm"]:
                raise ValueError("First-alarm mismatch")
    except (ValueError, TypeError, OverflowError) as e:
        errors.append(str(e))
    return {
        "valid": not errors,
        "integrity_checked": not errors,
        "authenticity_proven": False,
        "action_authorized": False,
        "status": "READ_ONLY_VERIFIED" if not errors else "REJECTED",
        "errors": errors,
    }
