"""E13 calibrated null controls, fault abstention and sealed holdout evidence."""
from phimirrorhex.calibration import (
    CALIBRATION_MAX_ALARMS, CALIBRATION_SEED, CASES, SCENARIOS,
    TEST_SEEDS, _noise, _threshold, calibration_report,
)
from phimirrorhex.generalization import _data
from phimirrorhex.transfer import transfer_report


def test_calibration_frozen_and_synthetic_null_cap():
    r = calibration_report()
    parent = transfer_report()
    assert r["protocol"]["calibration_seed"] == 1401
    assert r["protocol"]["prospective_test_seeds"] == list(TEST_SEEDS)
    assert r["summary"]["scored_cells"] == 14 * 5 * 3
    assert r["summary"]["calibration_cap_respected"]
    assert len(r["policies"]) == len(parent["policies"]) == 14
    calibration = _data(CALIBRATION_SEED, CASES, True)
    for p, previous in zip(r["policies"], parent["policies"]):
        assert p["frozen_masks"] == previous["masks"]
        for arm, row in p["calibration"].items():
            assert row == _threshold(calibration, previous["masks"][arm], p["readout"])
            assert row["calibration_null_detected"] <= CALIBRATION_MAX_ALARMS
            assert row["threshold"] >= 0.01


def test_refusal_not_reclassified_as_correct_and_counts_conserved():
    report = calibration_report()
    for p in report["policies"]:
        assert p["decision_authorized"] is False
        assert len(p["trials"]) == 5 * len(SCENARIOS)
        for t in p["trials"]:
            assert t["seed"] in TEST_SEEDS
            for arm in t["arms"].values():
                assert arm["cases"] == CASES
                assert arm["attempted"] + arm["abstained"] == CASES
                assert arm["null_false_alarms"] + arm["null_correct_rejections"] == arm["attempted"]
                assert arm["coverage"] == arm["attempted"] / CASES
                if t["scenario"] == "no_coupling":
                    assert arm["signal_detected"] is None
                    assert arm["signal_detection_rate"] is None
                else:
                    assert arm["signal_detected"] + arm["signal_missed"] == arm["attempted"]
                assert all(e["status"] in ("ABSTAIN", "MEASURED") for e in arm["example_receipts"])
    assert report["summary"]["empty_mask_blind"]


def test_failure_ledger_exhaustive_and_gate_not_authority():
    report = calibration_report()
    expected = sum(
        (
            t["arms"]["robust"]["null_false_alarm_rate"] is not None
            and t["arms"]["robust"]["null_false_alarm_rate"] > 0.10
        ) or (
            t["scenario"] != "no_coupling"
            and t["arms"]["robust"]["signal_detected"] < max(
                t["arms"]["e10"]["signal_detected"],
                t["arms"]["first_k"]["signal_detected"]
            )
        )
        for p in report["policies"] for t in p["trials"]
    )
    assert len(report["failure_ledger"]) == expected
    assert report["summary"]["failure_cells"] == expected
    assert report["summary"]["deployment_promotions"] == 0
    assert not report["action_authorized"]
    assert not report["physical_measurement"]
    assert not report["consciousness_measured"]
    assert not report["phi_optimality_proven"]
    assert report == calibration_report()
    assert len(report["sha256"]) == 64
    assert len(report["protocol"]["parent_sha256"]) == 64


def test_noise_seed_replay_exact_but_distinct():
    a = _noise(1501, 7)
    assert a == _noise(1501, 7)
    assert a != _noise(1502, 7)
