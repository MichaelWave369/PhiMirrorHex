"""E17: prospective synthetic out-of-family consensus transfer.

E16's three masks and individual E15 thresholds remain frozen, as do the
three quorum rules. A distinct LCG32 generator produces 12 fresh streams
under six named shift families, including correlated and impulse controls.
All observers share each stream and are not independent witnesses.
"""
from __future__ import annotations

from hashlib import sha256
import json

from .consensus import MEMBERS, QUORUMS, consensus_report
from .frontier import gaps
from .sequential import LENGTH, CHANGE_STEP

SCHEMA = "phimirrorhex.e17.out-of-family-consensus.v1"
SEEDS = (
    ("iid_stationary", 3101, None),
    ("iid_stationary", 3102, None),
    ("correlated_stationary", 3103, None),
    ("correlated_stationary", 3104, None),
    ("correlated_step", 3105, CHANGE_STEP),
    ("correlated_step", 3106, CHANGE_STEP),
    ("correlated_ramp", 3107, CHANGE_STEP),
    ("correlated_ramp", 3108, CHANGE_STEP),
    ("impulse_stationary", 3109, None),
    ("impulse_stationary", 3110, None),
    ("outlier_step", 3111, CHANGE_STEP),
    ("outlier_step", 3112, CHANGE_STEP),
)
NORMAL = 0.018
SHIFTED = 0.054
CUSUM_DRIFT = 0.75
FAULT_EVERY = 8
MIN_COVERAGE = 0.75
M32 = 0xffffffff
SCALE = 4294967296


def _amp(family: str, step: int) -> float:
    if family in ("iid_stationary", "correlated_stationary"):
        return NORMAL
    if family in ("correlated_step", "outlier_step"):
        return SHIFTED if step >= CHANGE_STEP else NORMAL
    if family == "correlated_ramp":
        if step < CHANGE_STEP:
            return NORMAL
        return NORMAL + (SHIFTED - NORMAL) * min(1.0, (step - CHANGE_STEP) / 32)
    if family == "impulse_stationary":
        return SHIFTED if CHANGE_STEP <= step < CHANGE_STEP + 3 else NORMAL
    raise ValueError(f"unregistered family: {family}")


def _noise(seed: int, step: int, family: str):
    """LCG32 procedural stream distinct from E15's xorshift feature generator."""
    state = ((seed * 1664525) ^ ((step + 1) * 1013904223)) & M32
    uniforms = []
    for _ in range(14):
        state = (1664525 * state + 1013904223) & M32
        uniforms.append(state / SCALE - 0.5)
    amplitude = _amp(family, step)
    correlated = family != "iid_stationary"
    a, b = [], []
    for sector in range(6):
        if correlated:
            va = 0.35 * uniforms[sector] + 0.65 * uniforms[12]
            vb = 0.35 * uniforms[sector + 6] + 0.65 * uniforms[13]
        else:
            va, vb = uniforms[sector], uniforms[sector + 6]
        if family == "outlier_step" and (step + sector * 7) % 19 == 0:
            va *= 3.0
            vb *= 3.0
        a.append(amplitude * va)
        b.append(amplitude * vb)
    return tuple(a), tuple(b)


def _member_frames(seed: int, family: str, members: list[dict]):
    cumulative = [0.0] * len(members)
    frames = []
    for step in range(LENGTH):
        a, b = _noise(seed, step, family)
        row = []
        for i, member in enumerate(members):
            mask = member["mask"]
            fault_sector = (seed + step) % 6
            unavailable = step % FAULT_EVERY == 0 and bool(mask & (1 << fault_sector))
            gap = None
            if not unavailable:
                gap = gaps(a, b, mask)[member["readout"]]
                cumulative[i] = max(
                    0.0, cumulative[i] + gap / member["floor"] - CUSUM_DRIFT
                )
            row.append({
                "available": not unavailable,
                "gap": gap,
                "cusum": cumulative[i],
                "vote": not unavailable and cumulative[i] > member["alert_limit"],
            })
        frames.append(row)
    return frames


def _trial(family: str, seed: int, onset: int | None,
           q: int, frames: list[list[dict]]) -> dict:
    first_alarm = None
    attempted = refused = 0
    observations = []
    for step, member_rows in enumerate(frames):
        eligible = sum(r["available"] for r in member_rows)
        votes = sum(r["vote"] for r in member_rows)
        abstain = eligible < q
        if abstain:
            refused += 1
        else:
            attempted += 1
        alert = first_alarm is None and not abstain and votes >= q
        if alert:
            first_alarm = step
        observations.append({
            "step": step, "member_available": [r["available"] for r in member_rows],
            "member_votes": [r["vote"] for r in member_rows],
            "member_cusum": [r["cusum"] for r in member_rows],
            "member_gaps": [r["gap"] for r in member_rows],
            "eligible": eligible, "votes": votes,
            "abstained": abstain, "new_alert": alert,
        })
    persistent = onset is not None
    false_alarm = first_alarm is not None and (
        not persistent or first_alarm < onset
    )
    detected = persistent and first_alarm is not None and first_alarm >= onset
    return {
        "family": family, "seed": seed, "quorum": q, "frames": LENGTH,
        "true_change_step": onset, "first_alarm_step": first_alarm,
        "false_alarm": false_alarm,
        "persistent_change_detected": detected,
        "persistent_change_missed": persistent and not detected,
        "detection_delay": first_alarm - onset if detected else None,
        "attempted": attempted, "abstained": refused,
        "coverage": attempted / LENGTH, "observations": observations,
    }


def transfer_consensus_report() -> dict:
    e16 = consensus_report()
    members = e16["members"]
    streams = {
        seed: _member_frames(seed, family, members)
        for family, seed, _ in SEEDS
    }
    failures = []
    policies = []
    for q in QUORUMS:
        trials = []
        for family, seed, onset in SEEDS:
            t = _trial(family, seed, onset, q, streams[seed])
            trials.append(t)
            reasons = {
                "false_alert": t["false_alarm"],
                "missed_persistent_change": t["persistent_change_missed"],
                "coverage_below_floor": t["coverage"] < MIN_COVERAGE,
            }
            if any(reasons.values()):
                failures.append({
                    "quorum": q, "family": family, "seed": seed,
                    "first_alarm_step": t["first_alarm_step"],
                    "detection_delay": t["detection_delay"],
                    "abstained": t["abstained"], "reason_flags": reasons,
                })
        legacy = next(p for p in e16["policies"] if p["quorum"] == q)
        policies.append({
            "quorum": q,
            "rule": f"{q}_OF_3_FROZEN",
            "trials": trials,
            "legacy_e16_context": {
                "seeds_reused": False,
                "e16_false_alarm_cells": sum(t["false_alarm"] for t in legacy["trials"]),
                "e16_missed_persistent_cells": sum(
                    t["persistent_change_missed"] for t in legacy["trials"]
                ),
                "e16_coverage_min": min(t["coverage"] for t in legacy["trials"]),
            },
            "toy_gate": "PASS_IN_TOY" if all(
                not t["false_alarm"] and not t["persistent_change_missed"]
                and t["coverage"] >= MIN_COVERAGE for t in trials
            ) else "FAIL_IN_TOY",
            "decision_authorized": False,
        })
    payload = {
        "schema": SCHEMA,
        "status": "SYNTHETIC_OUT_OF_FAMILY_FROZEN_CONSENSUS_TRANSFER",
        "epistemic_origin": "SIMULATED", "physical_measurement": False,
        "consciousness_measured": False, "action_authorized": False,
        "phi_optimality_proven": False,
        "protocol": {
            "parent_schema": e16["schema"],
            "parent_sha256": e16["sha256"],
            "frozen_members": [
                {"budget": b, "readout": m} for b, m in MEMBERS
            ],
            "frozen_quorums": list(QUORUMS),
            "new_sealed_streams": [
                {"family": family, "seed": seed, "persistent_change_step": onset}
                for family, seed, onset in SEEDS
            ],
            "frames_per_stream": LENGTH,
            "new_generator": "LCG32 1664525/1013904223 with 14 frame draws; unlike E15 xorshift",
            "noise_families": [
                "iid_stationary", "correlated_stationary", "correlated_step",
                "correlated_ramp", "impulse_stationary", "outlier_step"
            ],
            "normal_amplitude": NORMAL, "shift_amplitude": SHIFTED,
            "pairwise_member_independence": False,
            "shared_noise_draws": True,
            "fault_every_nth_frame": FAULT_EVERY,
            "fault_sector": "(seed+step)%6",
            "abstentions_do_not_advance_member_cusum": True,
            "no_quorum_selected_after_test": True,
            "e15_thresholds_mutated": False,
            "new_streams_disjoint_from_e15": True,
            "first_alarm_rule": "frame-local quorum; one-shot; early alarm cannot count as persistent detection",
            "negative_controls": "stationary and three-frame impulse; false alarms counted",
            "toy_gate": "no false alarms, no misses, coverage >=0.75 on all 12 streams; descriptive only",
            "no_external_actions": True,
            "evidence_boundary": "new procedural toy families; not independent physical witnesses or validation",
        },
        "members": members,
        "mask_overlap": e16["overlap_diagnostics"],
        "policies": policies,
        "failure_ledger": failures,
        "summary": {
            "member_count": len(members),
            "quorum_count": len(QUORUMS),
            "sealed_stream_count": len(SEEDS),
            "evaluation_cells": len(SEEDS) * len(QUORUMS),
            "total_frame_evaluations": LENGTH * len(SEEDS) * len(QUORUMS),
            "false_alarm_cells": sum(t["false_alarm"] for p in policies for t in p["trials"]),
            "missed_persistent_cells": sum(
                t["persistent_change_missed"] for p in policies for t in p["trials"]
            ),
            "failure_cells": len(failures),
            "toy_gate_passes": sum(p["toy_gate"] == "PASS_IN_TOY" for p in policies),
            "all_failures_retained": True,
            "deployments_authorized": 0,
        },
    }
    digest = sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"),
                               allow_nan=False).encode()).hexdigest()
    return {**payload, "sha256": digest}
