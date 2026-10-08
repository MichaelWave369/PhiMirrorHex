"""E15: finite sequential change detection with calibrated false-alarm controls.

Four nominal-only development streams determine an immutable CUSUM threshold.
Eight sealed streams contain no change, a sustained step, a gradual ramp,
or a brief spike. One-shot alarms, detection delays, missed events, and
fault abstentions are logged. No label or sealed trace tunes the policy.

Synthetic null-only simulator, not live sensor data or real-world safety.
"""
from __future__ import annotations

from hashlib import sha256
import json

from .calibration import calibration_report
from .drift import _noises
from .frontier import gaps

SCHEMA = "phimirrorhex.e15.sequential-change.v1"
DEVELOPMENT_SEEDS = (1901, 1902, 1903, 1904)
TESTS = (
    ("stationary", 2201, None), ("stationary", 2202, None),
    ("step", 2203, 48), ("step", 2204, 48),
    ("ramp", 2205, 48), ("ramp", 2206, 48),
    ("spike", 2207, None), ("spike", 2208, None),
)
LENGTH = 96
NORMAL_AMPLITUDE = 0.018
SHIFT_AMPLITUDE = 0.054
REFERENCE_DRIFT = 0.75
CHANGE_STEP = 48
RAMP_END = 80
SPIKE_END = 51
FAULT_EVERY = 8
MIN_COVERAGE = 0.75
ARMS = ("robust",)


def _amplitude(regime: str, step: int) -> float:
    if regime == "stationary":
        return NORMAL_AMPLITUDE
    if regime == "step":
        return SHIFT_AMPLITUDE if step >= CHANGE_STEP else NORMAL_AMPLITUDE
    if regime == "ramp":
        if step < CHANGE_STEP:
            return NORMAL_AMPLITUDE
        return NORMAL_AMPLITUDE + (SHIFT_AMPLITUDE - NORMAL_AMPLITUDE) * min(
            1.0, (step - CHANGE_STEP) / (RAMP_END - CHANGE_STEP))
    if regime == "spike":
        return SHIFT_AMPLITUDE if CHANGE_STEP <= step < SPIKE_END else NORMAL_AMPLITUDE
    raise ValueError("unknown regime")


def _trace(seed: int, regime: str, mask: int, mode: str, floor: float,
           limit: float | None) -> dict:
    statistic = 0.0
    maximum = 0.0
    first_alert = None
    observed = abstained = 0
    frames = []
    for step in range(LENGTH):
        sector = (seed + step) % 6
        unavailable = step % FAULT_EVERY == 0 and bool(mask & (1 << sector))
        gap = None
        if unavailable:
            abstained += 1
        else:
            observed += 1
            na, nb = _noises(seed, step, _amplitude(regime, step))
            gap = gaps(na, nb, mask)[mode]
            statistic = max(0.0, statistic + gap / floor - REFERENCE_DRIFT)
        maximum = max(maximum, statistic)
        alert_now = (
            limit is not None and first_alert is None and statistic > limit
        )
        if alert_now:
            first_alert = step
        frames.append({
            "step": step, "gap": gap, "cusum": statistic,
            "abstained": unavailable, "new_alert": alert_now,
        })
    is_persistent = regime in ("step", "ramp")
    early = first_alert is not None and (
        not is_persistent or first_alert < CHANGE_STEP
    )
    detected = is_persistent and first_alert is not None and first_alert >= CHANGE_STEP
    return {
        "seed": seed, "regime": regime, "length": LENGTH,
        "true_change_step": CHANGE_STEP if is_persistent else None,
        "observed": observed, "abstained": abstained,
        "coverage": observed / LENGTH,
        "first_alarm_step": first_alert,
        "false_alarm": early,
        "persistent_change_detected": detected,
        "persistent_change_missed": is_persistent and not detected,
        "detection_delay": first_alert - CHANGE_STEP if detected else None,
        "maximum_cusum": maximum,
        "frames": frames,
    }


def sequential_report() -> dict:
    parent = calibration_report()
    policies = []
    failures = []
    for prior in parent["policies"]:
        mask = prior["frozen_masks"]["robust"]
        mode = prior["readout"]
        floor = prior["calibration"]["robust"]["threshold"]
        nominal_controls = [
            _trace(seed, "stationary", mask, mode, floor, None)
            for seed in DEVELOPMENT_SEEDS
        ]
        # The strict increment ensures exactly zero alerts on these
        # development streams only, not a guarantee for new normal streams.
        limit = max(x["maximum_cusum"] for x in nominal_controls) + 1e-9
        trials = [
            _trace(seed, regime, mask, mode, floor, limit)
            for regime, seed, _ in TESTS
        ]
        for trial in trials:
            issues = {
                "false_alert": trial["false_alarm"],
                "missed_sustained_change": trial["persistent_change_missed"],
                "coverage_below_floor": trial["coverage"] < MIN_COVERAGE,
            }
            if any(issues.values()):
                failures.append({
                    "budget": prior["budget"], "readout": mode,
                    "regime": trial["regime"], "seed": trial["seed"],
                    "reason_flags": issues,
                    "first_alarm_step": trial["first_alarm_step"],
                    "detection_delay": trial["detection_delay"],
                    "abstained": trial["abstained"],
                })
        no_issues = all(
            not trial["false_alarm"]
            and not trial["persistent_change_missed"]
            and trial["coverage"] >= MIN_COVERAGE
            for trial in trials
        )
        policies.append({
            "budget": prior["budget"],
            "readout": mode,
            "frozen_mask": mask,
            "frozen_e13_floor": floor,
            "development_maxima": [r["maximum_cusum"] for r in nominal_controls],
            "sequential_alert_limit": limit,
            "development_alerts": 0,
            "trials": trials,
            "toy_gate": "PASS_IN_TOY" if prior["budget"] > 0 and no_issues
                        else "FAIL_IN_TOY",
            "decision_authorized": False,
        })
    report = {
        "schema": SCHEMA,
        "status": "SEALED_SYNTHETIC_SEQUENTIAL_CHANGE_AND_REFUSAL",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False,
        "consciousness_measured": False,
        "action_authorized": False,
        "phi_optimality_proven": False,
        "protocol": {
            "parent_schema": parent["schema"],
            "parent_sha256": parent["sha256"],
            "development_seeds": list(DEVELOPMENT_SEEDS),
            "sealed_scenarios": [
                {"regime": regime, "seed": seed,
                 "persistent_change_step": onset}
                for regime, seed, onset in TESTS
            ],
            "frames_per_stream": LENGTH,
            "normal_noise_amplitude": NORMAL_AMPLITUDE,
            "changed_noise_amplitude": SHIFT_AMPLITUDE,
            "change_step": CHANGE_STEP,
            "ramp_saturates_at_step": RAMP_END,
            "spike_interval": [CHANGE_STEP, SPIKE_END],
            "cusum_increment": "null_gap / frozen_e13_floor - 0.75",
            "cusum_reset": "max(0, previous + increment)",
            "alert_rule": "first strict exceedance of maximum CUSUM from four nominal development streams plus 1e-9",
            "one_shot_alarm": True,
            "fault_every_nth_frame": FAULT_EVERY,
            "fault_sector_rule": "(seed+step)%6",
            "abstentions_do_not_update_cusum": True,
            "false_alarm_definition": "alarm in stationary/spike stream, or before change_step in persistent stream",
            "positive_detection_definition": "first alarm on/after change_step in step/ramp only",
            "miss_definition": "no on-time first alarm for step/ramp (early alarm cannot count as detection)",
            "test_data_used_for_calibration": False,
            "candidate_adoption": False,
            "toy_gate_requires": "nonzero budget; no false alarms or missed persistent changes on any sealed stream, coverage>=0.75",
            "evidence_boundary": "finite synthetic null streams, not certified online change-point detection",
        },
        "policies": policies,
        "failure_ledger": failures,
        "summary": {
            "policies": len(policies),
            "sealed_streams_per_policy": len(TESTS),
            "evaluation_cells": len(policies) * len(TESTS),
            "false_alarm_cells": sum(t["false_alarm"] for p in policies for t in p["trials"]),
            "missed_persistent_cells": sum(t["persistent_change_missed"]
                                           for p in policies for t in p["trials"]),
            "failure_cells": len(failures),
            "toy_passes": sum(p["toy_gate"] == "PASS_IN_TOY" for p in policies),
            "all_development_controls_have_zero_alarms": True,
            "zero_budget_never_alarms": all(
                t["first_alarm_step"] is None for p in policies if p["budget"] == 0
                for t in p["trials"]),
            "all_failures_retained": True,
            "deployments_authorized": 0,
        },
    }
    digest = sha256(json.dumps(report, sort_keys=True, separators=(",", ":"),
                               allow_nan=False).encode()).hexdigest()
    return {**report, "sha256": digest}
