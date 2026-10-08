"""E14: sealed synthetic drift sentinel with observation-only shadow recalibration.

Frozen E13 Keyhole masks and null thresholds are tested under three declared
noise regimes. Monitoring may trigger *proposal* of a recalibrated threshold on
a separate null-only population; sealed evaluation never changes the policy.

NO deployment, device action or biology/consciousness claim is authorized.
"""
from __future__ import annotations

from hashlib import sha256
import json

from .calibration import calibration_report
from .coherence_bench import sample_features
from .generalization import _data
from .frontier import gaps

SCHEMA = "phimirrorhex.e14.drift-shadow.v1"
REGIMES = (
    ("nominal", 0.018, 1601, 1701, 1801),
    ("noise_shift", 0.054, 1602, 1702, 1802),
    ("recovered", 0.018, 1603, 1703, 1803),
)
ARM = "robust"
CASES = 48
MIN_FLOOR = 0.01
MAX_CALIBRATION_EXCEEDANCES = 2
FALSE_ALARM_LIMIT = 0.10
COVERAGE_MIN = 0.75
FAULT_EVERY = 8


def _noises(seed: int, index: int, amplitude: float):
    a, _ = sample_features(seed + 20000, index)
    b, _ = sample_features(seed + 21000, index)
    return (
        tuple(amplitude * (v - 0.5) for v in a),
        tuple(amplitude * (v - 0.5) for v in b),
    )


def _observed(first, second, noise):
    a, b = noise
    return (tuple(x + a[i] for i, x in enumerate(first)),
            tuple(x + b[i] for i, x in enumerate(second)))


def _metrics(rows, seed: int, amp: float, mask: int,
             mode: str, floor: float, with_signal: bool) -> dict:
    attempted = abstained = false_alarms = signal_hits = 0
    for index, row in enumerate(rows):
        faulty = index % FAULT_EVERY == 0
        sector = (seed + index) % 6
        if faulty and bool(mask & (1 << sector)):
            abstained += 1
            continue
        attempted += 1
        a, b = row["worlds"]["matched_probe"]
        noise = _noises(seed, index, amp)
        null_gap = gaps(*_observed(a, a, noise), mask)[mode]
        false_alarms += null_gap > floor
        if with_signal:
            signal_gap = gaps(*_observed(a, b, noise), mask)[mode]
            signal_hits += signal_gap > floor
    return {
        "cases": CASES, "attempted": attempted, "abstained": abstained,
        "coverage": attempted / CASES,
        "null_false_alarms": false_alarms,
        "null_false_alarm_rate": false_alarms / attempted if attempted else None,
        "signal_hits": signal_hits if with_signal else None,
        "signal_misses": attempted - signal_hits if with_signal else None,
        "signal_detection_rate": (
            signal_hits / attempted if attempted and with_signal else None
        ),
    }


def _shadow_calibration(rows, seed, amp, mask, mode) -> dict:
    values = []
    for i, row in enumerate(rows):
        a = row["worlds"]["matched_probe"][0]
        values.append(gaps(*_observed(
            a, a, _noises(seed, i, amp)), mask)[mode])
    floor = max(MIN_FLOOR, sorted(values, reverse=True)[MAX_CALIBRATION_EXCEEDANCES])
    return {
        "floor": floor,
        "null_exceedances": sum(v > floor for v in values),
        "null_cases": CASES,
        "calibration_only": True,
    }


def drift_report() -> dict:
    parent = calibration_report()
    policies = []
    failures = []
    for prior in parent["policies"]:
        budget, mode = prior["budget"], prior["readout"]
        mask = prior["frozen_masks"][ARM]
        frozen_floor = prior["calibration"][ARM]["threshold"]
        regimes = []
        for regime, amplitude, monitor_seed, shadow_seed, test_seed in REGIMES:
            monitor = _metrics(_data(monitor_seed, CASES, True),
                               monitor_seed, amplitude, mask, mode,
                               frozen_floor, False)
            flagged = (
                monitor["null_false_alarm_rate"] is not None
                and monitor["null_false_alarm_rate"] > FALSE_ALARM_LIMIT
            )
            shadow = (
                _shadow_calibration(_data(shadow_seed, CASES, True),
                                    shadow_seed, amplitude, mask, mode)
                if flagged else None
            )
            candidate_floor = shadow["floor"] if shadow else frozen_floor
            sealed = _data(test_seed, CASES, True)
            frozen = _metrics(sealed, test_seed, amplitude, mask, mode,
                              frozen_floor, True)
            candidate = _metrics(sealed, test_seed, amplitude, mask, mode,
                                 candidate_floor, True)
            missed_breach = (
                not flagged
                and frozen["null_false_alarm_rate"] is not None
                and frozen["null_false_alarm_rate"] > FALSE_ALARM_LIMIT
            )
            false_alarm_breach = (
                candidate["null_false_alarm_rate"] is None or
                candidate["null_false_alarm_rate"] > FALSE_ALARM_LIMIT
            )
            coverage_breach = candidate["coverage"] < COVERAGE_MIN
            signal_loss = candidate["signal_hits"] < frozen["signal_hits"]
            zero_signal = budget > 0 and candidate["signal_hits"] == 0
            passed = (budget > 0 and not missed_breach and
                      not false_alarm_breach and not coverage_breach
                      and not signal_loss and not zero_signal)
            row = {
                "regime": regime, "noise_amplitude": amplitude,
                "monitor_seed": monitor_seed, "shadow_seed": shadow_seed,
                "sealed_test_seed": test_seed,
                "frozen_floor": frozen_floor,
                "monitor": monitor, "drift_flagged": flagged,
                "monitor_decision": (
                    "ABSTAIN_AND_EVALUATE_SHADOW" if flagged
                    else "KEEP_FROZEN_MONITORING"
                ),
                "shadow_calibration": shadow,
                "candidate_floor": candidate_floor,
                "frozen_sealed": frozen,
                "candidate_sealed": candidate,
                "frozen_threshold_mutated": False,
                "decision_authorized": False,
                "toy_gate": "PASS_IN_TOY" if passed else "FAIL_IN_TOY",
            }
            regimes.append(row)
            reasons = {
                "monitor_missed_test_false_alarm_breach": missed_breach,
                "candidate_false_alarm_breach": false_alarm_breach,
                "coverage_breach": coverage_breach,
                "shadow_signal_loss_vs_frozen": signal_loss,
                "no_positive_detections": zero_signal,
            }
            if any(reasons.values()):
                failures.append({
                    "budget": budget, "readout": mode,
                    "regime": regime, "test_seed": test_seed,
                    "reason_flags": reasons,
                    "frozen_false_alarms": frozen["null_false_alarms"],
                    "candidate_false_alarms": candidate["null_false_alarms"],
                    "frozen_hits": frozen["signal_hits"],
                    "candidate_hits": candidate["signal_hits"],
                    "candidate_abstained": candidate["abstained"],
                })
        policies.append({
            "budget": budget, "readout": mode, "mask": mask,
            "frozen_e13_threshold": frozen_floor,
            "regimes": regimes,
            "authority": "OBSERVATION_ONLY",
        })
    payload = {
        "schema": SCHEMA,
        "status": "FINITE_SYNTHETIC_DRIFT_AND_SHADOW_CALIBRATION",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False, "consciousness_measured": False,
        "action_authorized": False, "phi_optimality_proven": False,
        "protocol": {
            "parent_schema": parent["schema"], "parent_sha256": parent["sha256"],
            "arm": ARM, "regimes": [
                {"name": n, "amplitude": a, "monitor_seed": m,
                 "shadow_seed": s, "sealed_test_seed": t}
                for n, a, m, s, t in REGIMES
            ],
            "cases_per_split": CASES,
            "monitor": "null-only, uses frozen E13 threshold; triggers when observed false alarm fraction > 0.10",
            "shadow": "only if monitor flags; fresh null-only seed; third-largest gap, floor 0.01",
            "sealed_test": "separate from monitor and shadow calibration; never influences thresholds",
            "fault_rule": "every eighth case; if selected sector (seed+index)%6 faulty, abstain",
            "candidate": "evaluation only, never adopted or deployed",
            "candidate_gate": "budget>0, no monitor miss of observed test breach, test false alarms<=0.10, coverage>=0.75, signal hits>0 and no signal loss versus frozen",
            "strict_threshold": True,
            "false_alarm_limit": FALSE_ALARM_LIMIT,
            "minimum_coverage": COVERAGE_MIN,
            "test_data_for_policy_or_threshold_selection": False,
            "actual_external_sensor_input": False,
        },
        "policies": policies,
        "failure_ledger": failures,
        "summary": {
            "policy_count": len(policies),
            "evaluation_cells": len(policies) * len(REGIMES),
            "regime_count": len(REGIMES),
            "monitor_flags": sum(r["drift_flagged"]
                                 for p in policies for r in p["regimes"]),
            "toy_passes": sum(r["toy_gate"] == "PASS_IN_TOY"
                              for p in policies for r in p["regimes"]),
            "failure_cells": len(failures),
            "zero_budget_blind": all(
                all(r["candidate_sealed"]["signal_hits"] == 0
                    and r["candidate_sealed"]["null_false_alarms"] == 0
                    for r in p["regimes"])
                for p in policies if p["budget"] == 0),
            "all_failures_retained": True,
            "deployments_authorized": 0,
        },
    }
    digest = sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"),
                               allow_nan=False).encode()).hexdigest()
    return {**payload, "sha256": digest}
