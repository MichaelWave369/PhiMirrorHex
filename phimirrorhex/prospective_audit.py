"""E18: prospective selection audit of correlated synthetic Keyhole councils.

E17's existing twelve test streams are *repurposed as retrospective development
evidence*. A prespecified cost function selects one frozen E16 quorum; then
all rules are replayed against twelve new E18 streams with a new counter-mix
noise generator. The sealed E18 stream outcomes NEVER influence selection.

The historical E17 set was not originally registered as training data.
This is a useful software audit, NOT an independent scientific validation,
a physical measurement, or an authorization to deploy anything.
"""
from __future__ import annotations
from hashlib import sha256
import json

from .consensus_transfer import transfer_consensus_report
from .frontier import gaps
from .sequential import LENGTH, CHANGE_STEP

SCHEMA = "phimirrorhex.e18.prospective-quorum-audit.v1"
STREAMS = (
    ("independent_null", 4101, None), ("independent_null", 4102, None),
    ("shared_null", 4103, None), ("shared_null", 4104, None),
    ("lagged_step", 4105, CHANGE_STEP), ("lagged_step", 4106, CHANGE_STEP),
    ("lagged_ramp", 4107, CHANGE_STEP), ("lagged_ramp", 4108, CHANGE_STEP),
    ("burst_null", 4109, None), ("burst_null", 4110, None),
    ("outlier_step", 4111, CHANGE_STEP), ("outlier_step", 4112, CHANGE_STEP),
)
QUORUMS = (1, 2, 3)
NORMAL = 0.018
SHIFTED = 0.054
DRIFT = 0.75
MASK32 = 0xFFFFFFFF
SCALE = 4294967296
MIN_COVERAGE = 0.75
WEIGHTS = {"miss": 5, "false_alarm": 4, "low_coverage": 2}


def _uniform(seed: int, step: int, lane: int) -> float:
    """Counter-addressed avalanche mixer, unlike E17's sequential LCG draws."""
    x = (seed * 0x9E3779B1 + (step + 1) * 0x85EBCA77
         + (lane + 1) * 0xC2B2AE3D) & MASK32
    x ^= x >> 16
    x = x * 0x7FEB352D & MASK32
    x ^= x >> 15
    x = x * 0x846CA68B & MASK32
    x ^= x >> 16
    return x / SCALE - 0.5


def _amp(family: str, step: int) -> float:
    if family in ("independent_null", "shared_null"):
        return NORMAL
    if family in ("lagged_step", "outlier_step"):
        return SHIFTED if step >= CHANGE_STEP else NORMAL
    if family == "lagged_ramp":
        return NORMAL if step < CHANGE_STEP else NORMAL + (
            SHIFTED - NORMAL) * min(1.0, (step - CHANGE_STEP) / 32)
    if family == "burst_null":
        return SHIFTED if 48 <= step < 52 else NORMAL
    raise ValueError(f"unregistered family {family}")


def _noise(seed: int, step: int, family: str):
    correlated = family != "independent_null"
    lagged = family in ("lagged_step", "lagged_ramp", "outlier_step")
    common_a = _uniform(seed, step, 12)
    common_b = _uniform(seed, step, 13)
    previous_a = _uniform(seed, step - 1, 12) if step else common_a
    previous_b = _uniform(seed, step - 1, 13) if step else common_b
    a, b = [], []
    for sector in range(6):
        xa, xb = _uniform(seed, step, sector), _uniform(seed, step, sector + 6)
        if correlated:
            xa = 0.3 * xa + 0.7 * common_a
            xb = 0.3 * xb + 0.7 * common_b
        if lagged and step:
            pa = 0.3 * _uniform(seed, step - 1, sector) + 0.7 * previous_a
            pb = 0.3 * _uniform(seed, step - 1, sector + 6) + 0.7 * previous_b
            xa = 0.6 * xa + 0.4 * pa
            xb = 0.6 * xb + 0.4 * pb
        if family == "outlier_step" and (step + 7 * sector) % 17 == 0:
            xa *= 2.5
            xb *= 2.5
        amp = _amp(family, step)
        a.append(amp * xa)
        b.append(amp * xb)
    return tuple(a), tuple(b)


def _frames(seed: int, family: str, members: list[dict]):
    cumulative = [0.0] * 3
    frames = []
    for step in range(LENGTH):
        a, b = _noise(seed, step, family)
        row = []
        for i, member in enumerate(members):
            extra_fault = family == "burst_null" and 48 <= step < 52
            fault = step % 8 == 0 or extra_fault
            unavailable = fault and bool(member["mask"] & (1 << ((seed+step) % 6)))
            gap = None
            if not unavailable:
                gap = gaps(a, b, member["mask"])[member["readout"]]
                cumulative[i] = max(
                    0.0, cumulative[i] + gap / member["floor"] - DRIFT
                )
            row.append({
                "available": not unavailable, "gap": gap,
                "cusum": cumulative[i],
                "vote": not unavailable and cumulative[i] > member["alert_limit"],
            })
        frames.append(row)
    return frames


def _trial(family: str, seed: int, onset: int | None,
           quorum: int, source: list[list[dict]]) -> dict:
    first = None
    available_count = 0
    observations = []
    for step, rows in enumerate(source):
        count = sum(v["available"] for v in rows)
        yes = sum(v["vote"] for v in rows)
        abstain = count < quorum
        available_count += not abstain
        alert = first is None and not abstain and yes >= quorum
        if alert:
            first = step
        observations.append({
            "step": step, "eligible": count, "votes": yes,
            "member_available": [v["available"] for v in rows],
            "member_votes": [v["vote"] for v in rows],
            "member_gaps": [v["gap"] for v in rows],
            "member_cusum": [v["cusum"] for v in rows],
            "abstained": abstain, "new_alert": alert,
        })
    persistent = onset is not None
    false_alarm = first is not None and (not persistent or first < onset)
    detected = persistent and first is not None and first >= onset
    return {
        "family": family, "seed": seed, "quorum": quorum,
        "frames": LENGTH, "true_change_step": onset,
        "first_alarm_step": first, "false_alarm": false_alarm,
        "persistent_change_detected": detected,
        "persistent_change_missed": persistent and not detected,
        "detection_delay": first - onset if detected else None,
        "attempted": available_count,
        "abstained": LENGTH - available_count,
        "coverage": available_count / LENGTH,
        "observations": observations,
    }


def _select(parent: dict) -> dict:
    """Compute development-only rule exactly once without E18 outcomes."""
    rows = []
    for policy in parent["policies"]:
        trials = policy["trials"]
        misses = sum(t["persistent_change_missed"] for t in trials)
        alarms = sum(t["false_alarm"] for t in trials)
        coverage = sum(t["coverage"] < MIN_COVERAGE for t in trials)
        refused = sum(t["abstained"] for t in trials)
        cost = (WEIGHTS["miss"] * misses
                + WEIGHTS["false_alarm"] * alarms
                + WEIGHTS["low_coverage"] * coverage)
        rows.append({
            "quorum": policy["quorum"], "miss_cells": misses,
            "false_alarm_cells": alarms, "coverage_breach_cells": coverage,
            "abstained_frames": refused, "weighted_loss": cost,
        })
    selected = min(rows, key=lambda r: (
        r["weighted_loss"], r["abstained_frames"],
        abs(r["quorum"] - 2), r["quorum"]
    ))
    return {
        "selection_source": "E17_REUSED_AS_RETROSPECTIVE_DEVELOPMENT",
        "weights": WEIGHTS,
        "candidate_costs": rows, "selected_quorum": selected["quorum"],
        "selection_uses_e18_sealed_data": False,
        "selection_is_originally_preregistered_e17_training": False,
    }


def prospective_audit_report() -> dict:
    parent = transfer_consensus_report()
    selection = _select(parent)
    members = parent["members"]
    generated = {
        seed: _frames(seed, family, members) for family, seed, _ in STREAMS
    }
    policies = []
    failures = []
    for quorum in QUORUMS:
        trials = []
        for family, seed, onset in STREAMS:
            t = _trial(family, seed, onset, quorum, generated[seed])
            trials.append(t)
            reasons = {
                "false_alert": t["false_alarm"],
                "missed_persistent_change": t["persistent_change_missed"],
                "coverage_below_floor": t["coverage"] < MIN_COVERAGE,
            }
            if any(reasons.values()):
                failures.append({
                    "quorum": quorum, "family": family, "seed": seed,
                    "first_alarm_step": t["first_alarm_step"],
                    "abstained": t["abstained"],
                    "detection_delay": t["detection_delay"],
                    "reason_flags": reasons,
                    "selected_rule": quorum == selection["selected_quorum"],
                })
        policies.append({
            "quorum": quorum,
            "selected_from_e17": quorum == selection["selected_quorum"],
            "trials": trials,
            "false_alarm_cells": sum(t["false_alarm"] for t in trials),
            "missed_persistent_cells": sum(
                t["persistent_change_missed"] for t in trials
            ),
            "coverage_breach_cells": sum(
                t["coverage"] < MIN_COVERAGE for t in trials
            ),
            "toy_gate": "PASS_IN_TOY" if all(
                not t["false_alarm"] and not t["persistent_change_missed"]
                and t["coverage"] >= MIN_COVERAGE for t in trials
            ) else "FAIL_IN_TOY",
            "decision_authorized": False,
        })
    selected = next(
        p for p in policies if p["quorum"] == selection["selected_quorum"])
    report = {
        "schema": SCHEMA, "status": "SEALED_TOY_SELECTED_QUORUM_PROSPECTIVE_AUDIT",
        "epistemic_origin": "SIMULATED", "physical_measurement": False,
        "consciousness_measured": False, "action_authorized": False,
        "phi_optimality_proven": False,
        "protocol": {
            "parent_schema": parent["schema"],
            "parent_sha256": parent["sha256"],
            "development_reuse_disclosed": True,
            "selection_score": "5 × missed cells + 4 × false-alarm cells + 2 × coverage-breach cells; ties fewer abstentions, then closest to 2, then smallest quorum",
            "frozen_masks_limits_and_members": True,
            "quorum_selected_before_e18_outcomes": True,
            "quorums_all_scored": list(QUORUMS),
            "sealed_streams": [
                {"family": family, "seed": seed, "persistent_change_step": onset}
                for family, seed, onset in STREAMS
            ],
            "frames_per_stream": LENGTH,
            "fresh_seed_range": [4101, 4112],
            "source_generator": "counter-addressed avalanche mix32, temporal lag, distinct from E17 LCG32",
            "shared_noise_witnesses": True,
            "independent_physical_witnesses": False,
            "noise_amplitudes": [NORMAL, SHIFTED],
            "additional_burst_outage": "frames 48–51 under burst_null only",
            "fault_sector": "(seed+step)%6",
            "fault_every_nth_frame": 8,
            "first_alarm_before_onset_is_failure": True,
            "min_coverage": MIN_COVERAGE,
            "no_threshold_or_quorum_adaptation_on_sealed_set": True,
            "gate": "no false alarms, missed persistent events or low coverage on any of 12 streams; toy descriptive only",
            "action_policy": "NO_EXTERNAL_AUTHORITY",
        },
        "selection": selection, "members": members, "policies": policies,
        "failure_ledger": failures,
        "summary": {
            "quorum_count": len(QUORUMS),
            "new_streams": len(STREAMS),
            "evaluation_cells": len(QUORUMS) * len(STREAMS),
            "frame_cells": len(QUORUMS) * len(STREAMS) * LENGTH,
            "selected_quorum": selection["selected_quorum"],
            "selected_false_alarm_cells": selected["false_alarm_cells"],
            "selected_missed_persistent_cells": selected["missed_persistent_cells"],
            "selected_coverage_breach_cells": selected["coverage_breach_cells"],
            "total_failure_cells": len(failures),
            "toy_gate_passes": sum(
                p["toy_gate"] == "PASS_IN_TOY" for p in policies
            ),
            "all_failures_retained": True, "deployments_authorized": 0,
        },
    }
    digest = sha256(json.dumps(
        report, sort_keys=True, separators=(",", ":"), allow_nan=False
    ).encode()).hexdigest()
    return {**report, "sha256": digest}
