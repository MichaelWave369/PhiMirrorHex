"""E13 · calibrated synthetic Keyhole detection and fault-triggered refusal.

Reuse E12 frozen masks. Calibrate each observer's nuisance threshold on a
separate noise-only population. Assess false alarms, signal detections and
missing-sensor abstentions on five sealed populations without any tuning.

Every result is finite and SIMULATED; a toy PASS never grants authority.
"""
from __future__ import annotations

from hashlib import sha256
import json

from .coherence_bench import sample_features
from .frontier import gaps, selected_sectors
from .generalization import _data
from .transfer import transfer_report

SCHEMA = "phimirrorhex.e13.calibrated-refusal.v1"
CALIBRATION_SEED = 1401
TEST_SEEDS = (1501, 1502, 1503, 1504, 1505)
SCENARIOS = ("matched_probe", "shifted_probe", "no_coupling")
ARMS = ("robust", "e10", "first_k")
CASES = 48
NOISE_AMPLITUDE = 0.018
CALIBRATION_MAX_ALARMS = 2
MIN_FLOOR = 0.01
FAULT_EVERY = 8
TEST_FALSE_ALARM_LIMIT = 0.10
TEST_COVERAGE_MIN = 0.75


def _noise(seed: int, index: int) -> tuple[tuple[float, ...], tuple[float, ...]]:
    a, _ = sample_features(seed + 20000, index)
    b, _ = sample_features(seed + 21000, index)
    return (tuple(NOISE_AMPLITUDE*(v-.5) for v in a),
            tuple(NOISE_AMPLITUDE*(v-.5) for v in b))


def _observations(a: tuple[float, ...], b: tuple[float, ...],
                  noise_a: tuple[float, ...], noise_b: tuple[float, ...]):
    return (tuple(x+n for x, n in zip(a, noise_a)),
            tuple(x+n for x, n in zip(b, noise_b)))


def _threshold(rows: list[dict], mask: int, readout: str) -> dict:
    # Null pair contains the same latent state on both sides;
    # independent observational noise is the only possible difference.
    null_gaps = []
    for index, row in enumerate(rows):
        a = row["worlds"]["matched_probe"][0]
        na, nb = _noise(CALIBRATION_SEED, index)
        observed = _observations(a, a, na, nb)
        null_gaps.append(gaps(*observed, mask)[readout])
    threshold = max(MIN_FLOOR, sorted(null_gaps, reverse=True)[CALIBRATION_MAX_ALARMS])
    return {
        "threshold": threshold,
        "calibration_null_detected": sum(v > threshold for v in null_gaps),
        "calibration_null_count": CASES,
        "rule": "max(floor, third-largest of 48 noise-only gaps), strict >",
    }


def _evaluate(rows: list[dict], seed: int, scenario: str,
              mask: int, readout: str, threshold: float) -> dict:
    null_alarms = 0
    signal_hits = 0
    abstained = 0
    examples = []
    for index, row in enumerate(rows):
        na, nb = _noise(seed, index)
        faulty = index % FAULT_EVERY == 0
        bad_sector = (seed + index) % 6
        has_fault = faulty and bool(mask & (1 << bad_sector))
        if has_fault:
            abstained += 1
            if len(examples) < 4:
                examples.append({"index": index, "status": "ABSTAIN",
                                 "fault_sector": bad_sector})
            continue
        a, b = row["worlds"][scenario]
        null_observed = _observations(a, a, na, nb)
        ng = gaps(*null_observed, mask)[readout]
        false_alarm = ng > threshold
        null_alarms += false_alarm
        if scenario != "no_coupling":
            signal_observed = _observations(a, b, na, nb)
            sg = gaps(*signal_observed, mask)[readout]
            detected = sg > threshold
            signal_hits += detected
        if len(examples) < 4:
            examples.append({
                "index": index, "status": "MEASURED",
                "fault_sector": bad_sector if faulty else None,
                "null_gap": ng,
                "signal_gap": sg if scenario != "no_coupling" else None,
            })
    attempted = CASES-abstained
    return {
        "cases": CASES, "attempted": attempted,
        "abstained": abstained, "coverage": attempted/CASES,
        "null_false_alarms": null_alarms,
        "null_correct_rejections": attempted-null_alarms,
        "null_false_alarm_rate": null_alarms/attempted if attempted else None,
        "signal_detected": signal_hits if scenario != "no_coupling" else None,
        "signal_missed": attempted-signal_hits if scenario != "no_coupling" else None,
        "signal_detection_rate": (
            signal_hits/attempted if attempted and scenario != "no_coupling" else None
        ),
        "fault_policy": "abstain if selected sensor identity has a declared fault",
        "example_receipts": examples,
    }


def calibration_report() -> dict:
    parent = transfer_report()
    calibration = _data(CALIBRATION_SEED, CASES, True)
    tests = {seed: _data(seed, CASES, True) for seed in TEST_SEEDS}
    policies = []
    failures = []
    for old in parent["policies"]:
        budget, mode = old["budget"], old["readout"]
        calibration_arms = {
            name: _threshold(calibration, old["masks"][name], mode) for name in ARMS
        }
        trials = []
        for seed in TEST_SEEDS:
            for scenario in SCENARIOS:
                measures = {
                    name: _evaluate(tests[seed], seed, scenario,
                                    old["masks"][name], mode,
                                    calibration_arms[name]["threshold"])
                    for name in ARMS
                }
                robust = measures["robust"]
                false_alarm_failure = (
                    robust["null_false_alarm_rate"] is not None and
                    robust["null_false_alarm_rate"] > TEST_FALSE_ALARM_LIMIT
                )
                detection_shortfall = (
                    scenario != "no_coupling" and
                    robust["signal_detected"] < max(
                        measures["e10"]["signal_detected"],
                        measures["first_k"]["signal_detected"])
                )
                if false_alarm_failure or detection_shortfall:
                    failures.append({
                        "seed": seed, "budget": budget, "readout": mode,
                        "scenario": scenario,
                        "false_alarm_limit_exceeded": false_alarm_failure,
                        "fewer_detections_than_baseline": detection_shortfall,
                        "robust_signal_detected": robust["signal_detected"],
                        "baseline_e10_signal_detected": measures["e10"]["signal_detected"],
                        "baseline_first_k_signal_detected": measures["first_k"]["signal_detected"],
                        "robust_false_alarm_rate": robust["null_false_alarm_rate"],
                    })
                trials.append({"seed": seed, "scenario": scenario, "arms": measures})
        gate_rows = [r["arms"]["robust"] for r in trials]
        passed = (
            budget > 0
            and all(row["coverage"] >= TEST_COVERAGE_MIN for row in gate_rows)
            and all(row["null_false_alarm_rate"] is not None
                    and row["null_false_alarm_rate"] <= TEST_FALSE_ALARM_LIMIT
                    for row in gate_rows)
            and all(row["signal_detected"] is not None and row["signal_detected"] > 0
                    for row in gate_rows if row["signal_detected"] is not None)
        )
        policies.append({
            "budget": budget, "readout": mode,
            "frozen_masks": old["masks"],
            "calibration": calibration_arms,
            "trials": trials,
            "toy_refusal_gate": "PASS_IN_TOY" if passed else "FAIL_IN_TOY",
            "decision_authorized": False,
        })
    report = {
        "schema": SCHEMA,
        "status": "SIMULATED_NOISE_CALIBRATION_AND_REFUSAL_LEDGER",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False,
        "consciousness_measured": False,
        "action_authorized": False,
        "phi_optimality_proven": False,
        "protocol": {
            "parent_schema": parent["schema"],
            "parent_sha256": parent["sha256"],
            "calibration_seed": CALIBRATION_SEED,
            "prospective_test_seeds": list(TEST_SEEDS),
            "cases_per_seed": CASES,
            "noise_amplitude": NOISE_AMPLITUDE,
            "calibration_max_false_alarms": CALIBRATION_MAX_ALARMS,
            "calibration_min_floor": MIN_FLOOR,
            "fault_every_nth_case": FAULT_EVERY,
            "fault_sector_rule": "(seed + index) mod 6",
            "null_definition": "identical latent A on both sides, independent sensor noise",
            "signal_definition": "counterposed simulated outer states, independent sensor noise",
            "no_coupling": "null-only negative control; no signal claim",
            "calibration": "noise-only cases; no mask reselection",
            "test": "new seeds never used for threshold, mask or gate tuning",
            "toy_gate_coverage_min": TEST_COVERAGE_MIN,
            "toy_gate_false_alarm_max": TEST_FALSE_ALARM_LIMIT,
            "toy_gate_requires_nonzero_signal_detection": True,
            "toy_gate_authorizes_nothing": True,
            "detection_metric": "absolute identity-max or masked-sum gap > calibrated floor",
            "failure_criterion": "robust false alarms > 10%, or signal hits below either same-budget baseline",
        },
        "policies": policies, "failure_ledger": failures,
        "summary": {
            "policies": len(policies),
            "scored_cells": len(policies)*len(TEST_SEEDS)*len(SCENARIOS),
            "failure_cells": len(failures),
            "toy_gate_passes": sum(p["toy_refusal_gate"] == "PASS_IN_TOY" for p in policies),
            "empty_mask_blind": all(
                all(v["null_false_alarms"] == 0 and v["signal_detected"] in (0, None)
                    for trial in p["trials"] for v in trial["arms"].values())
                for p in policies if p["budget"] == 0),
            "calibration_cap_respected": all(
                c["calibration_null_detected"] <= CALIBRATION_MAX_ALARMS
                for p in policies for c in p["calibration"].values()),
            "all_failures_retained": True,
            "deployment_promotions": 0,
        },
    }
    digest = sha256(json.dumps(report, sort_keys=True, separators=(",", ":"),
                               allow_nan=False).encode()).hexdigest()
    return {**report, "sha256": digest}
