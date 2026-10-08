"""E19 portable receipt security: full evidence, tampering and non-authority."""
import copy
from hashlib import sha256

from phimirrorhex.portable_evidence import (
    FRAME_COUNT, MAX_BYTES, _canonical, portable_packet, portable_payload,
    verify_packet,
)


def test_complete_portable_receipt_and_lineage():
    packet = portable_packet()
    payload = packet["payload"]
    assert packet["integrity"]["sha256"] == sha256(_canonical(payload)).hexdigest()
    assert packet["integrity"]["signer"] is None
    assert packet["integrity"]["authenticity_proven"] is False
    assert payload["schema"] == "field-evidence.synthetic-quorum.v1"
    assert payload["origin"] == "SIMULATED"
    assert payload["consumer_integration_status"] == "CONTRACT_ONLY_NOT_CONNECTED"
    assert payload["intended_readonly_consumers"] == [
        "NestedBubbleGear", "BrainC", "SuperPhiVessel"
    ]
    assert payload["authority"]["grant"] == "NONE"
    assert not payload["authority"]["execution_allowed"]
    assert not payload["claims"]["real_measurement"]
    assert not payload["claims"]["independent_witnesses"]
    assert not payload["claims"]["agent_action_authorized"]
    assert payload["lineage"]["source_selection_stage"] == (
        "E17_REUSED_AS_RETROSPECTIVE_DEVELOPMENT"
    )
    assert payload["lineage"]["selection_was_originally_preregistered"] is False
    assert payload["summary"]["cases"] == 36
    assert payload["summary"]["total_frames"] == 3456
    assert payload["summary"]["granted_actions"] == 0
    assert len(payload["cases"]) == 36
    assert {case["quorum"] for case in payload["cases"]} == {1, 2, 3}
    assert {case["seed"] for case in payload["cases"]} == set(range(4101, 4113))
    assert all(len(case["frame_tokens"]) == 4 * FRAME_COUNT
               for case in payload["cases"])
    assert len(_canonical(packet)) < MAX_BYTES
    verdict = verify_packet(packet)
    assert verdict == {
        "valid": True, "integrity_checked": True,
        "authenticity_proven": False, "action_authorized": False,
        "status": "READ_ONLY_VERIFIED", "errors": [],
    }


def test_integrity_tampering_and_forged_authority_are_rejected():
    original = portable_packet()
    tampered = copy.deepcopy(original)
    tampered["payload"]["cases"][0]["frame_tokens"] = (
        "0000" + tampered["payload"]["cases"][0]["frame_tokens"][4:]
    )
    assert not verify_packet(tampered)["valid"]
    forged = copy.deepcopy(original)
    forged["payload"]["authority"]["execution_allowed"] = True
    forged["integrity"]["sha256"] = sha256(
        _canonical(forged["payload"])
    ).hexdigest()
    check = verify_packet(forged)
    assert not check["valid"]
    assert check["action_authorized"] is False
    signed = copy.deepcopy(original)
    signed["integrity"]["signer"] = "fake"
    signed["integrity"]["authenticity_proven"] = True
    assert not verify_packet(signed)["valid"]
    injected = copy.deepcopy(original)
    injected["payload"]["executable"] = "rm -rf /"
    injected["integrity"]["sha256"] = sha256(_canonical(injected["payload"])).hexdigest()
    assert not verify_packet(injected)["valid"]


def test_valid_json_unauthenticated_and_replay_is_deterministic():
    packet = portable_packet()
    assert packet == portable_packet()
    assert portable_payload() == packet["payload"]
    assert not verify_packet({})["valid"]
    assert not verify_packet(None)["valid"]
    assert not verify_packet({"payload": {}, "integrity": {}})["valid"]
    assert not verify_packet({
        "payload": packet["payload"], "integrity": {
            "algorithm": "MD5", "sha256": "0"*64, "signer": None,
            "authenticity_proven": False
        }
    })["valid"]
