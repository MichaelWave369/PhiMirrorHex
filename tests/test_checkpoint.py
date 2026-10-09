"""E22 checkpoint tests: rollback, fork, known blind spots and zero promotion."""
import copy
from phimirrorhex.checkpoint import (
    SCHEMA, checkpoint, compare_checkpoint, checkpoint_qualification_report,
)
from phimirrorhex.intake_chain import ZERO, intake_qualification_report, verify_chain


def test_sealed_checkpoint_examples_and_honest_blindspot():
    r = checkpoint_qualification_report()
    assert r["schema"] == SCHEMA
    assert r["source_event_count"] == 11
    assert r["source_checkpoint_count"] == 4
    assert len(r["checkpoint"]["head"]) == 64
    assert r["checkpoint"]["producer_authenticated"] is False
    assert r["reference_was_externally_anchored"] is False
    assert r["reference_is_signed"] is False
    assert r["summary"] == {
        "scenarios": 8, "prefix_matches": 3, "rollbacks": 1, "forks": 2,
        "invalid_references": 1, "invalid_ledgers": 1,
        "known_post_checkpoint_rewrite_missed": True,
        "authority_grants": 0, "external_calls": 0,
    }
    assert [x["verdict"]["status"] for x in r["scenario_receipts"]] == [
        "PREFIX_MATCHES_UNAUTHENTICATED",
        "PREFIX_MATCHES_UNAUTHENTICATED",
        "ROLLBACK_DETECTED", "FORK_DETECTED",
        "PREFIX_MATCHES_UNAUTHENTICATED", "FORK_DETECTED",
        "INVALID_REFERENCE", "INVALID_LEDGER",
    ]
    for row in r["scenario_receipts"]:
        verdict = row["verdict"]
        assert not verdict["origin_authenticated"]
        assert not verdict["trusted_anchor_created"]
        assert not verdict["after_checkpoint_suffix_protected"]
        assert verdict["external_calls"] == 0
        assert verdict["authority_granted"] is False
    assert r == checkpoint_qualification_report()


def test_valid_empty_and_full_reference_and_short_rollback():
    ledger = intake_qualification_report()["ledger"]
    empty = checkpoint(ledger, 0)
    assert empty["head"] == ZERO
    assert compare_checkpoint(ledger, empty)["prefix_matches"]
    full = checkpoint(ledger, len(ledger["events"]))
    assert full["head"] == ledger["head"]
    assert compare_checkpoint(ledger, full)["prefix_matches"]
    shortened = {"schema": ledger["schema"],
                 "events": ledger["events"][:-1],
                 "head": ledger["events"][-2]["event_hash"]}
    assert verify_chain(shortened)["valid"]
    assert compare_checkpoint(shortened, full)["status"] == "ROLLBACK_DETECTED"


def test_forged_anchor_does_not_establish_trust():
    ledger = intake_qualification_report()["ledger"]
    a = checkpoint(ledger, 4)
    assert compare_checkpoint(ledger, {**a, "producer_authenticated": True})[
        "status"] == "INVALID_REFERENCE"
    assert compare_checkpoint(ledger, {**a, "head": "f"*64})[
        "status"] == "FORK_DETECTED"
    assert compare_checkpoint(ledger, {**a, "count": 5})[
        "status"] == "FORK_DETECTED"
    assert compare_checkpoint(ledger, {**a, "count": True})[
        "status"] == "INVALID_REFERENCE"
    assert compare_checkpoint(ledger, None)["status"] == "INVALID_REFERENCE"
    bad = copy.deepcopy(ledger)
    bad["events"][0]["reason_codes"].append("MALICIOUS_TAMPER")
    assert compare_checkpoint(bad, a)["status"] == "INVALID_LEDGER"
    for count in (-1, 12, True):
        try:
            checkpoint(ledger, count)
        except ValueError as exc:
            assert str(exc) == "INVALID_CHECKPOINT_COUNT"
        else:
            raise AssertionError("Expected invalid checkpoint count")
