"""E21 intake chain invariants: replay scope, tampering, and no trust escalation."""
import copy
from phimirrorhex.intake_chain import (
    ZERO, empty_ledger, intake, verify_chain, intake_qualification_report
)
from phimirrorhex.portable_evidence import portable_packet


def test_11_sealed_scenarios_and_unauthenticated_chain():
    r = intake_qualification_report()
    assert r["schema"] == "phimirrorhex.e21.intake-chain.v1"
    assert r["summary"] == {
        "cases": 11, "quarantined": 3, "duplicates": 1,
        "rejected": 6, "refused_actions": 1,
        "authority_grants": 0, "external_calls": 0,
        "source_authenticity_proven": False, "self_consistent_only": True,
    }
    assert r["chain_verification"]["valid"]
    assert not r["chain_verification"]["authenticity_proven"]
    assert not r["chain_verification"]["trusted_anchor_present"]
    assert not r["receiver_profiles_connected"]
    assert not r["durable_storage_enabled"]
    assert not r["hashes_are_signatures"]
    assert len(r["ledger"]["events"]) == 11
    assert len(r["ledger"]["head"]) == 64
    assert r["ledger"]["events"][0]["prev_hash"] == ZERO
    for i, event in enumerate(r["ledger"]["events"]):
        assert event["index"] == i
        assert event["authority_granted"] is False
        assert event["trusted_memory_write"] is False
        assert event["external_calls"] == 0
        if i:
            assert event["prev_hash"] == r["ledger"]["events"][i-1]["event_hash"]
    assert [e["disposition"] for e in r["ledger"]["events"]] == [
        "QUARANTINED_READ_ONLY", "DUPLICATE_QUARANTINED",
        "QUARANTINED_READ_ONLY", "QUARANTINED_READ_ONLY",
        "REJECTED", "REJECTED", "REJECTED", "REJECTED",
        "REJECTED", "REFUSED_ACTION", "REJECTED",
    ]


def test_replay_scope_and_rejection_invariants():
    packet = portable_packet()
    original = empty_ledger()
    nbg = intake(original, packet, "NestedBubbleGear")
    assert original["events"] == []  # pure state transition
    assert nbg["events"][0]["disposition"] == "QUARANTINED_READ_ONLY"
    replay = intake(nbg, packet, "NestedBubbleGear")
    assert replay["events"][-1]["disposition"] == "DUPLICATE_QUARANTINED"
    brainc = intake(replay, packet, "BrainC")
    assert brainc["events"][-1]["disposition"] == "QUARANTINED_READ_ONLY"
    wrong_pin = intake(brainc, packet, "BrainC", expected_sha256="f"*64)
    assert wrong_pin["events"][-1]["reason_codes"] == ["PINNED_DIGEST_MISMATCH"]
    assert wrong_pin["events"][-1]["pin_check"] == "MISMATCH"
    approved = intake(wrong_pin, packet, "SuperPhiVessel", "approve")
    assert approved["events"][-1]["disposition"] == "REFUSED_ACTION"
    assert verify_chain(approved)["valid"]


def test_no_tampered_chain_can_be_appended_and_no_authenticity_claims():
    source = intake(empty_ledger(), portable_packet(), "NestedBubbleGear")
    corrupted = copy.deepcopy(source)
    corrupted["events"][0]["disposition"] = "REFUSED_ACTION"
    verdict = verify_chain(corrupted)
    assert not verdict["valid"]
    assert verdict["status"] == "CORRUPT_OR_INVALID"
    try:
        intake(corrupted, portable_packet(), "BrainC")
    except ValueError as exc:
        assert str(exc) == "INTAKE_CHAIN_INTEGRITY_FAILED"
    else:
        raise AssertionError("Tampered ledger was accepted for append")
    assert not verify_chain({"schema": "bad", "events": [], "head": ZERO})["valid"]
    assert not verify_chain({"schema": source["schema"], "events": [], "head": "x"*64})["valid"]
    assert source == intake(empty_ledger(), portable_packet(), "NestedBubbleGear")
