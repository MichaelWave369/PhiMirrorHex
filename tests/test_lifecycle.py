"""E25: demonstration state transitions are cryptographic, not authoritative."""
from phimirrorhex.lifecycle import (
    SCHEMA, KEY_OLD, KEY_NEW, PUBLIC_KEYS, genesis, sign_claim, sign_rotation,
    consume, rotate, lifecycle_qualification_report,
)
from phimirrorhex.intake_chain import intake_qualification_report
from phimirrorhex.checkpoint import checkpoint

EXPECTED = [
    "ACCEPTED_DEMO_UNTRUSTED",
    "REFUSED_REPLAY",
    "REFUSED_BAD_SIGNATURE",
    "REFUSED_BAD_ROTATION_PROOF",
    "REFUSED_BAD_ROTATION_PROOF",
    "ROTATED_DEMO_UNTRUSTED",
    "REFUSED_REVOKED",
    "REFUSED_SEQUENCE_FLOOR",
    "ACCEPTED_DEMO_UNTRUSTED",
    "REFUSED_REPLAY",
    "REFUSED_STALE_ROTATION",
    "ACCEPTED_DEMO_UNTRUSTED",
    "ACCEPTED_DEMO_UNTRUSTED",
    "REFUSED_BAD_DOMAIN",
    "REFUSED_BAD_SIGNATURE",
    "REFUSED_CHECKPOINT",
    "ACCEPTED_DEMO_UNTRUSTED",
]

def test_full_replay_and_known_restart_vulnerability():
    report = lifecycle_qualification_report()
    assert report["schema"] == SCHEMA
    assert report["fixture_public_keys"] == PUBLIC_KEYS
    assert report["public_private_seeds"] is True
    assert report["authenticated_identity_present"] is False
    assert report["durable_anti_replay_storage_present"] is False
    assert report["real_key_custody"] is False
    assert [row["verdict"]["status"] for row in report["events"]] == EXPECTED
    assert report["summary"] == {
        "trials": 17, "accepted_untrusted": 5, "rotated_untrusted": 1,
        "refused": 11, "public_seed_forgery_accepted": True,
        "replay_after_state_reset_accepted": True,
        "final_active_epoch": 2, "final_sequence": 12,
        "authority_grants": 0, "external_calls": 0,
    }
    assert len(report["rotation_old_signature"]) == 128
    assert len(report["rotation_new_signature"]) == 128
    for row in report["events"]:
        decision = row["verdict"]
        assert decision["authority_granted"] is False
        assert decision["signers_authenticated"] is False
        assert decision["state_is_durable"] is False
        assert decision["external_calls"] == 0
    assert report == lifecycle_qualification_report()


def test_rotation_dual_attestation_and_sequence_floor():
    ledger = intake_qualification_report()["ledger"]
    ref = checkpoint(ledger, 4)
    initial = genesis()
    first = sign_claim(KEY_OLD, 9, ref)
    valid = consume(initial, first, ledger)
    assert initial["last_sequence"] == 0
    assert valid["status"] == "ACCEPTED_DEMO_UNTRUSTED"
    s = valid["state"]
    assert consume(s, first, ledger)["status"] == "REFUSED_REPLAY"
    one = sign_rotation(ref, new=False)
    assert rotate(s, one, ledger)["status"] == "REFUSED_BAD_ROTATION_PROOF"
    full = rotate(s, sign_rotation(ref), ledger)
    assert full["status"] == "ROTATED_DEMO_UNTRUSTED"
    assert full["signatures_verified"] == 2
    assert full["state"]["active_key"] == KEY_NEW
    assert full["state"]["revoked_keys"] == [KEY_OLD]
    assert full["state"]["last_sequence"] == 9
    assert consume(full["state"], sign_claim(KEY_NEW, 9, ref), ledger)[
        "status"] == "REFUSED_SEQUENCE_FLOOR"
    assert consume(full["state"], sign_claim(KEY_OLD, 10, ref), ledger)[
        "status"] == "REFUSED_REVOKED"
    assert consume(full["state"], sign_claim(KEY_NEW, 10, ref), ledger)[
        "status"] == "ACCEPTED_DEMO_UNTRUSTED"


def test_signed_wrong_checkpoint_and_corrupted_local_state_rejected():
    ledger = intake_qualification_report()["ledger"]
    ref = checkpoint(ledger, 4)
    s = genesis()
    assert consume(s, sign_claim(KEY_OLD, 1, checkpoint(ledger, 5)), ledger)[
        "status"] == "REFUSED_CHECKPOINT"
    bad = {**s, "epoch": 2}
    assert consume(bad, sign_claim(KEY_OLD, 1, ref), ledger)[
        "status"] == "REFUSED_INVALID_STATE"
    assert rotate(bad, sign_rotation(ref), ledger)[
        "status"] == "REFUSED_INVALID_STATE"
