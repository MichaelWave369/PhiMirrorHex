"""E14 split isolation, true refusals, failure completeness and claim firewall."""
from phimirrorhex.drift import REGIMES, drift_report
from phimirrorhex.calibration import calibration_report


def test_e13_thresholds_never_change_and_splits_are_disjoint():
    r = drift_report()
    source = calibration_report()
    assert len(r["policies"]) == len(source["policies"]) == 14
    assert r["summary"]["evaluation_cells"] == 42
    seeds = [seed for _, _, m, s, t in REGIMES for seed in (m, s, t)]
    assert len(seeds) == len(set(seeds)) == 9
    for p, prior in zip(r["policies"], source["policies"]):
        assert p["mask"] == prior["frozen_masks"]["robust"]
        assert p["frozen_e13_threshold"] == prior["calibration"]["robust"]["threshold"]
        assert len(p["regimes"]) == 3
        for row in p["regimes"]:
            assert row["frozen_floor"] == p["frozen_e13_threshold"]
            assert not row["frozen_threshold_mutated"]
            assert not row["decision_authorized"]
            assert row["monitor"]["signal_hits"] is None
            assert row["monitor"]["attempted"] + row["monitor"]["abstained"] == 48
            if row["drift_flagged"]:
                assert row["shadow_calibration"] is not None
                assert row["shadow_calibration"]["null_exceedances"] <= 2
                assert row["monitor_decision"] == "ABSTAIN_AND_EVALUATE_SHADOW"
            else:
                assert row["shadow_calibration"] is None
                assert row["candidate_floor"] == row["frozen_floor"]


def test_metrics_and_failures_are_accounted_without_selection_on_test():
    r = drift_report()
    expected = []
    for p in r["policies"]:
        for row in p["regimes"]:
            frozen, candidate = row["frozen_sealed"], row["candidate_sealed"]
            assert frozen["attempted"] == candidate["attempted"]
            assert frozen["abstained"] == candidate["abstained"]
            assert candidate["attempted"] + candidate["abstained"] == 48
            assert candidate["signal_hits"] + candidate["signal_misses"] == candidate["attempted"]
            assert candidate["null_false_alarms"] <= candidate["attempted"]
            assert candidate["coverage"] >= 0
            if row["toy_gate"] == "PASS_IN_TOY":
                assert p["budget"] > 0
                assert candidate["null_false_alarm_rate"] <= .10
                assert candidate["coverage"] >= .75
                assert candidate["signal_hits"] > 0
                assert candidate["signal_hits"] >= frozen["signal_hits"]
            # Every detected failure must be represented in ledger by exact cell.
            missing = not row["drift_flagged"] and frozen["null_false_alarm_rate"] > .10
            false = candidate["null_false_alarm_rate"] > .10
            coverage = candidate["coverage"] < .75
            lost = candidate["signal_hits"] < frozen["signal_hits"]
            zero = p["budget"] > 0 and candidate["signal_hits"] == 0
            if missing or false or coverage or lost or zero:
                expected.append((p["budget"], p["readout"], row["regime"]))
    logged = [(x["budget"], x["readout"], x["regime"]) for x in r["failure_ledger"]]
    assert expected == logged
    assert r["summary"]["failure_cells"] == len(expected)
    assert r["summary"]["zero_budget_blind"]


def test_determinism_and_no_external_authorization():
    a = drift_report()
    assert a == drift_report()
    assert len(a["sha256"]) == 64
    assert len(a["protocol"]["parent_sha256"]) == 64
    assert a["epistemic_origin"] == "SIMULATED"
    assert not a["physical_measurement"] and not a["consciousness_measured"]
    assert not a["action_authorized"] and not a["phi_optimality_proven"]
    assert not a["protocol"]["test_data_for_policy_or_threshold_selection"]
    assert a["summary"]["deployments_authorized"] == 0
