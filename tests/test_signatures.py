"""E24 Ed25519 demo: signature mechanics without presumed real identities."""
from phimirrorhex.signatures import (
    SCHEMA, PUBLIC_KEYS, sign_demo, inspect_signatures,
    signature_qualification_report,
)
from phimirrorhex.checkpoint import checkpoint
from phimirrorhex.intake_chain import intake_qualification_report
from phimirrorhex.witness import WITNESSES

EXPECTED = [
    "SIGNED_AGREEMENT_DEMO_UNTRUSTED", "SIGNED_SPLIT_VIEW",
    "INVALID_SIGNATURE", "INVALID_SIGNATURE",
    "INSUFFICIENT_CLAIMS", "INVALID_CLAIMS",
    "STALE_EPOCH", "REVOKED_DEMO_KEY",
    "REPLAY_SEQUENCE", "INVALID_CLAIMS",
    "FORK_DETECTED", "ROLLBACK_DETECTED",
    "SIGNED_AGREEMENT_DEMO_UNTRUSTED",
    "SIGNED_AGREEMENT_DEMO_UNTRUSTED",
    "INCOMPARABLE_COUNTS",
]

def test_e24_entire_fixture_and_untrusted_signature_limitations():
    report = signature_qualification_report()
    assert report["schema"] == SCHEMA
    assert report["algorithm"] == "Ed25519"
    assert report["demo_public_keys"] == PUBLIC_KEYS
    assert report["secret_private_keys_exist"] is False
    assert report["trust_roots_authenticated"] is False
    assert report["independent_witness_custody"] is False
    assert report["live_integrations_connected"] is False
    assert [x["verdict"]["status"] for x in report["cases"]] == EXPECTED
    assert report["summary"] == {
        "scenarios": 15,
        "valid_signature_agreements": 3,
        "split_views": 1,
        "invalid_signatures": 2,
        "invalid_claims": 2,
        "insufficient": 1,
        "stale_epochs": 1,
        "revoked": 1,
        "replayed": 1,
        "forks": 1,
        "rollbacks": 1,
        "incomparable": 1,
        "public_fixture_forgery_passed": True,
        "suffix_rewrite_passed": True,
        "authority_granted": 0, "external_calls": 0,
    }
    for x in report["cases"]:
        v = x["verdict"]
        assert not v["authority_granted"]
        assert not v["signers_authenticated_in_real_world"]
        assert not v["independent_custody_proven"]
        assert v["public_demo_private_keys"]
        assert v["external_calls"] == 0
    assert len(report["sha256"]) == 64
    assert report == signature_qualification_report()

def test_genuine_demo_signatures_and_strict_scope():
    ledger = intake_qualification_report()["ledger"]
    ref = checkpoint(ledger, 4)
    claims = [sign_demo(i, ref) for i in WITNESSES]
    assert all(len(x["signature_hex"]) == 128 for x in claims)
    verdict = inspect_signatures(ledger, claims)
    assert verdict["status"] == "SIGNED_AGREEMENT_DEMO_UNTRUSTED"
    assert verdict["signatures_verified"] == 3
    assert not verdict["authority_granted"]
    assert inspect_signatures(ledger, claims, min_sequence=7)["status"] == "REPLAY_SEQUENCE"
    assert inspect_signatures(ledger, claims, revoked=["field-c"])["status"] == "REVOKED_DEMO_KEY"
    changed = [dict(x) for x in claims]
    changed[0]["signature_hex"] = "0"*128
    assert inspect_signatures(ledger, changed)["status"] == "INVALID_SIGNATURE"
    assert inspect_signatures(ledger, None)["status"] == "INVALID_CLAIMS"
