"""E20 receiver policy: no trust promotion, no external adapter writes."""
from hashlib import sha256
from phimirrorhex.portable_evidence import portable_packet, _canonical
from phimirrorhex.receivers import (
    CONSUMERS, ACTIONS, receive, receiver_qualification_report
)


def test_positive_receivers_are_quarantined_not_authorized():
    source = portable_packet()
    for name in CONSUMERS:
        r = receive(source, name)
        assert r["disposition"] == "QUARANTINED_READ_ONLY"
        assert r["consumer"] == name
        assert r["requested_action"] == "inspect"
        assert r["contract_connected"] is False
        assert r["external_calls"] == 0
        assert r["authenticity_proven"] is False
        assert r["authority_granted"] is False
        assert r["trusted_memory_write"] is False
        assert r["model_routing_write"] is False
        assert r["reality_gate_approval"] is False
        assert r["view"]["permission"] == "INSPECT_ONLY"
        assert r["view"]["quarantine_required"] is True
        assert r["view"]["case_count"] == 36
        assert r["view"]["frame_count"] == 3456
        assert r["view"]["negative_evidence_complete"]
        assert r["view"]["origin"] == "SIMULATED"
        assert "UNSIGNED_ORIGIN_NOT_AUTHENTICATED" in r["reasons"]


def test_all_requested_mutations_refused_before_dispatch():
    packet = portable_packet()
    for name in CONSUMERS:
        for operation in ACTIONS:
            if operation == "inspect":
                continue
            result = receive(packet, name, operation)
            assert result["disposition"] == "REFUSED_ACTION"
            assert result["reasons"] == [
                "OPERATION_NOT_ALLOWED", "CAPABILITY_NOT_AUTHORITY"
            ]
            assert result["view"] is None
            assert result["external_calls"] == 0
            assert not result["authority_granted"]
    assert receive(packet, "UnlistedAgent")["disposition"] == "REJECTED"
    assert receive(packet, "BrainC", "delete_all")["disposition"] == "REJECTED"


def test_attacks_rejected_without_trust_escalation():
    report = receiver_qualification_report()
    assert report["summary"] == {
        "scenarios": 9, "quarantined": 3, "rejected": 5,
        "refused_actions": 1, "false_promotions": 0, "external_calls": 0
    }
    assert report["profiles_are_connected"] is False
    assert report["no_remote_writes"] is True
    assert report["no_model_execution"] is True
    assert [s["attack"] for s in report["scenarios"]] == [
        False,False,False,True,True,True,True,True,True
    ]
    assert [s["result"]["disposition"] for s in report["scenarios"]] == [
        "QUARANTINED_READ_ONLY"]*3 + ["REJECTED"]*4 + [
        "REFUSED_ACTION", "REJECTED"
    ]
    for s in report["scenarios"]:
        r = s["result"]
        assert not r["authority_granted"]
        assert not r["authenticity_proven"]
        assert not r["trusted_memory_write"]
        assert not r["model_routing_write"]
        assert not r["reality_gate_approval"]
        assert r["external_calls"] == 0
    digest = report.pop("sha256")
    assert digest == sha256(_canonical(report)).hexdigest()
