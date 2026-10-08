"""E15 change-point controls, frozen development threshold and refusal ledger."""
from phimirrorhex.sequential import (
    DEVELOPMENT_SEEDS, TESTS, LENGTH, sequential_report, _trace
)
from phimirrorhex.calibration import calibration_report


def test_frozen_parent_and_no_sealed_tuning():
    r = sequential_report()
    parent = calibration_report()
    assert r["summary"]["evaluation_cells"] == 14 * 8
    assert r["summary"]["policies"] == 14
    assert r["protocol"]["test_data_used_for_calibration"] is False
    assert len(set(DEVELOPMENT_SEEDS)) == 4
    assert not set(DEVELOPMENT_SEEDS) & {seed for _, seed, _ in TESTS}
    for p, old in zip(r["policies"], parent["policies"]):
        assert p["frozen_mask"] == old["frozen_masks"]["robust"]
        assert p["frozen_e13_floor"] == old["calibration"]["robust"]["threshold"]
        assert len(p["development_maxima"]) == len(DEVELOPMENT_SEEDS)
        assert p["sequential_alert_limit"] > max(p["development_maxima"])
        assert len(p["trials"]) == len(TESTS)
        assert p["development_alerts"] == 0
        assert not p["decision_authorized"]
        for seed in DEVELOPMENT_SEEDS:
            observed = _trace(
                seed, "stationary", p["frozen_mask"], p["readout"],
                p["frozen_e13_floor"], p["sequential_alert_limit"]
            )
            assert observed["first_alarm_step"] is None


def test_every_trace_is_causal_and_fault_denominators_conserved():
    r = sequential_report()
    for p in r["policies"]:
        for trial, (regime, seed, change) in zip(p["trials"], TESTS):
            assert trial["seed"] == seed and trial["regime"] == regime
            assert trial["true_change_step"] == change
            assert trial["observed"] + trial["abstained"] == LENGTH
            assert len(trial["frames"]) == LENGTH
            alerts = [f["step"] for f in trial["frames"] if f["new_alert"]]
            assert len(alerts) <= 1
            assert trial["first_alarm_step"] == (alerts[0] if alerts else None)
            assert all(f["step"] == i for i, f in enumerate(trial["frames"]))
            assert all(f["gap"] is None for f in trial["frames"] if f["abstained"])
            for i in range(1, LENGTH):
                before, after = trial["frames"][i - 1], trial["frames"][i]
                if after["abstained"]:
                    assert after["cusum"] == before["cusum"]
            assert not (trial["false_alarm"] and trial["persistent_change_detected"])
            assert trial["persistent_change_missed"] == (
                regime in ("step", "ramp") and not trial["persistent_change_detected"]
            )
            if trial["persistent_change_detected"]:
                assert trial["first_alarm_step"] >= 48
                assert trial["detection_delay"] == trial["first_alarm_step"] - 48


def test_complete_losing_cells_and_nonauthority_replay():
    r = sequential_report()
    failed = [
        (p["budget"], p["readout"], t["regime"], t["seed"])
        for p in r["policies"] for t in p["trials"]
        if t["false_alarm"] or t["persistent_change_missed"] or t["coverage"] < .75
    ]
    evidence = [(e["budget"], e["readout"], e["regime"], e["seed"])
                for e in r["failure_ledger"]]
    assert evidence == failed
    assert r["summary"]["failure_cells"] == len(failed)
    assert r["summary"]["zero_budget_never_alarms"]
    assert r["summary"]["deployments_authorized"] == 0
    assert r["epistemic_origin"] == "SIMULATED"
    assert not r["action_authorized"] and not r["physical_measurement"]
    assert not r["consciousness_measured"] and not r["phi_optimality_proven"]
    assert len(r["sha256"]) == 64
    assert len(r["protocol"]["parent_sha256"]) == 64
    assert r == sequential_report()
