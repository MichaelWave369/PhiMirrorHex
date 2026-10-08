"""E2 replay, alerts, receipts, cross-plane observability and safe adapters."""

from copy import deepcopy

import pytest

from phimirrorhex.bridges import readonly_envelope
from phimirrorhex.simulation import (
    ALERT_THRESHOLD, MAX_FRAMES, ANOMALY_CHANNELS,
    simulate_frame, simulate_series, verify_series,
)


def test_frame_has_all_36_recoverable_identity_channels():
    frame = simulate_frame(0)
    assert len(frame["channels"]) == 36
    assert len({x["id"] for x in frame["channels"]}) == 36
    assert frame["channels"][0]["id"] == "U1:L1"
    assert frame["channels"][-1]["id"] == "U6:L6"
    assert not frame["gate"]["alert"]
    assert frame["gate"]["flagged_count"] == 0
    assert all(not x["injected"] for x in frame["channels"])


def test_anomaly_is_explicit_and_honestly_labeled():
    frame = simulate_frame(12, anomaly=True)
    injected = [x for x in frame["channels"] if x["injected"]]
    assert len(injected) == len(ANOMALY_CHANNELS) == 3
    assert frame["gate"]["alert"]
    assert frame["gate"]["flagged_count"] == 3
    assert all(x["disagreement"] >= ALERT_THRESHOLD for x in injected)
    clean = simulate_frame(12, anomaly=False)
    assert not clean["gate"]["alert"]
    assert not any(x["injected"] for x in clean["channels"])


def test_alert_ends_after_anomaly_window():
    for step in (0, 9, 18, 23):
        assert not simulate_frame(step)["gate"]["alert"]
    for step in (10, 11, 12, 13, 14, 15, 16, 17):
        assert simulate_frame(step)["gate"]["alert"]


def test_series_digest_exact_replay_and_tamper_detection():
    a, b = simulate_series(24, 369), simulate_series(24, 369)
    assert a == b
    assert verify_series(a)
    assert a["topology"]["audit_pairs"] == 666
    assert a["topology"]["cross_plane_channels"] == 36
    assert not a["authority_granted"]
    tampered = deepcopy(a)
    tampered["frames"][12]["channels"][3]["claim"] = -99
    assert not verify_series(tampered)
    assert simulate_series(24, 370)["sha256"] != a["sha256"]


def test_receipt_never_implies_external_authority():
    series = simulate_series()
    for target in ("nestedbubblegear", "superphivessel"):
        result = readonly_envelope(series, target, 12)
        assert result["target"] == target
        assert result["source_sha256"] == series["sha256"]
        assert result["summary"]["gate"]["alert"] is True
        assert len(result["summary"]["flagged_channels"]) == 3
        assert result["capabilities"] == ["read:synthetic-summary"]
        assert result["commands"] == []
        assert result["authority_granted"] is False
        assert result["synthetic_only"] is True


def test_reject_invalid_inputs_and_altered_series():
    for bad in (-1, MAX_FRAMES, True, 2.0):
        with pytest.raises(ValueError):
            simulate_frame(bad)
    for bad in (0, MAX_FRAMES + 1, True):
        with pytest.raises(ValueError):
            simulate_series(steps=bad)
    with pytest.raises(ValueError):
        simulate_frame(0, seed=-1)
    with pytest.raises(ValueError):
        simulate_frame(0, anomaly=1)
    with pytest.raises(ValueError):
        readonly_envelope(simulate_series(), target="filesystem")
    with pytest.raises(ValueError):
        readonly_envelope(simulate_series(), frame_index=-1)
    tampered = simulate_series(2)
    tampered["authority_granted"] = True
    with pytest.raises(ValueError):
        readonly_envelope(tampered)
