"""E26 independent recovery tests: no falsely authenticated snapshot."""
import copy
from phimirrorhex.recovery import (
    SCHEMA, PIN_SCHEMA, make_snapshot, hold_reference, recover,
    recovery_qualification_report,
)
from phimirrorhex.lifecycle import genesis

EXPECTED = [
    "RECOVERED_DEMO_UNTRUSTED", "REFUSED_ROLLBACK",
    "REFUSED_INVALID_SNAPSHOT", "REFUSED_FORK",
    "RECOVERED_DEMO_UNTRUSTED", "REFUSED_NO_REFERENCE",
    "REFUSED_INVALID_REFERENCE", "REFUSED_UNPINNED_ADVANCE",
    "REFUSED_INVALID_SNAPSHOT", "REFUSED_FORK",
    "RECOVERED_DEMO_UNTRUSTED", "RECOVERED_DEMO_UNTRUSTED",
]


def test_frozen_recovery_matrix_and_no_security_claims():
    r = recovery_qualification_report()
    assert r["schema"] == SCHEMA
    assert r["retained_reference"]["schema"] == PIN_SCHEMA
    assert r["real_durable_anti_rollback_anchor"] is False
    assert r["real_authenticated_state_writer"] is False
    assert r["cross_session_automated_persistence"] is False
    assert [c["verdict"]["status"] for c in r["cases"]] == EXPECTED
    assert r["summary"] == {
        "scenarios": 12, "recovered_untrusted": 4,
        "rollbacks": 1, "forks": 2,
        "invalid_snapshots": 2, "missing_references": 1,
        "invalid_references": 1, "unpinned_advances": 1,
        "co_rewrite_passed": True, "co_rewind_passed": True,
        "fresh_genesis_passed": True, "reset_replay_accepted": True,
        "protected_replay_refused": True,
        "authority_grants": 0, "external_calls": 0,
    }
    assert r["replay_probes"] == {
        "with_matching_epoch_two_state": "REFUSED_REVOKED",
        "after_forged_genesis_recovery": "ACCEPTED_DEMO_UNTRUSTED",
    }
    assert len(r["sha256"]) == 64
    for case in r["cases"]:
        v = case["verdict"]
        assert v["authority_granted"] is False
        assert v["publisher_authenticated"] is False
        assert v["independent_reference_authenticated"] is False
        assert v["secure_persistence_provided"] is False
        assert v["external_calls"] == 0
        if v["status"] != "RECOVERED_DEMO_UNTRUSTED":
            assert v["state"] is None
    assert r == recovery_qualification_report()


def test_snapshot_integrity_fork_and_rollback():
    current = make_snapshot(genesis(), 5)
    pin = hold_reference(current)
    assert recover(current, pin)["status"] == "RECOVERED_DEMO_UNTRUSTED"
    assert recover(current, None)["status"] == "REFUSED_NO_REFERENCE"
    assert recover(make_snapshot(genesis(), 4), pin)["status"] == "REFUSED_ROLLBACK"
    assert recover(make_snapshot(genesis(), 6), pin)["status"] == "REFUSED_UNPINNED_ADVANCE"
    tampered = copy.deepcopy(current)
    tampered["state"]["last_sequence"] = 5
    assert recover(tampered, pin)["status"] == "REFUSED_INVALID_SNAPSHOT"
    alternate = make_snapshot({**genesis(), "last_sequence": 5}, 5)
    assert recover(alternate, pin)["status"] == "REFUSED_FORK"
    assert recover(alternate, hold_reference(alternate))["status"] == "RECOVERED_DEMO_UNTRUSTED"
    assert recover(current, {**pin, "identity_authenticated": True})[
        "status"] == "REFUSED_INVALID_REFERENCE"
    assert recover(current, {**pin, "expected_digest": "f"*64})[
        "status"] == "REFUSED_FORK"
    assert recover(current, pin)["state"] == genesis()
