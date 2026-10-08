"""E16 · three correlated synthetic Keyholes with honest quorum refusal.

Reuse immutable E15 CUSUM streams and alert limits. Three prespecified
observers (budget 2 identity, budget 3 sum, budget 4 identity) vote on the
SAME noise stream; they are explicitly NOT independent witnesses.

Online quorum 1/2/3 decisions are computed frame by frame. If fewer than
the required quorum have an available sensor reading, ABSTAIN; missing
readings never become false votes or successful rejections.
"""
from __future__ import annotations

from hashlib import sha256
import json

from .sequential import LENGTH, TESTS, sequential_report

SCHEMA = "phimirrorhex.e16.quorum-consensus.v1"
MEMBERS = ((2, "identity_max"), (3, "masked_sum"), (4, "identity_max"))
QUORUMS = (1, 2, 3)
MIN_COVERAGE = 0.75
CHANGE_STEP = 48


def _mask_jaccard(a: int, b: int) -> dict:
    intersection = (a & b).bit_count()
    union = (a | b).bit_count()
    return {
        "intersection": intersection,
        "union": union,
        "jaccard": intersection / union if union else 1.0,
        "disjoint": intersection == 0,
    }


def _quorum_trace(members: list[dict], threshold: int,
                  regime: str, seed: int, change: int | None) -> dict:
    first = None
    observations = []
    eligible_count = abstained = 0
    for step in range(LENGTH):
        member_frames = [m["trace"]["frames"][step] for m in members]
        available = [not f["abstained"] for f in member_frames]
        vote = [
            available[i]
            and member_frames[i]["cusum"] > members[i]["alert_limit"]
            for i in range(len(members))
        ]
        eligible = sum(available)
        affirmative = sum(vote)
        refusal = eligible < threshold
        if refusal:
            abstained += 1
        else:
            eligible_count += 1
        triggered = not refusal and first is None and affirmative >= threshold
        if triggered:
            first = step
        observations.append({
            "step": step, "eligible": eligible,
            "votes": affirmative, "member_available": available,
            "member_votes": vote,
            "member_cusum": [f["cusum"] for f in member_frames],
            "abstained": refusal, "new_alert": triggered,
        })
    persistent = regime in ("step", "ramp")
    premature = first is not None and (not persistent or first < CHANGE_STEP)
    detected = persistent and first is not None and first >= CHANGE_STEP
    return {
        "regime": regime, "seed": seed,
        "quorum": threshold, "frames": LENGTH,
        "true_change_step": change,
        "first_alarm_step": first,
        "false_alarm": premature,
        "persistent_change_detected": detected,
        "persistent_change_missed": persistent and not detected,
        "detection_delay": first - CHANGE_STEP if detected else None,
        "attempted": eligible_count,
        "abstained": abstained,
        "coverage": eligible_count / LENGTH,
        "observations": observations,
    }


def consensus_report() -> dict:
    parent = sequential_report()
    selected = []
    for budget, readout in MEMBERS:
        policy = next(
            p for p in parent["policies"]
            if p["budget"] == budget and p["readout"] == readout
        )
        selected.append(policy)
    member_info = [{
        "id": f"k{p['budget']}-{p['readout']}",
        "budget": p["budget"],
        "readout": p["readout"],
        "mask": p["frozen_mask"],
        "alert_limit": p["sequential_alert_limit"],
        "floor": p["frozen_e13_floor"],
    } for p in selected]
    overlaps = []
    for i in range(len(selected)):
        for j in range(i+1, len(selected)):
            overlaps.append({
                "pair": [member_info[i]["id"], member_info[j]["id"]],
                **_mask_jaccard(member_info[i]["mask"], member_info[j]["mask"]),
            })
    policies = []
    failures = []
    for q in QUORUMS:
        trials = []
        for index, (regime, seed, onset) in enumerate(TESTS):
            members = [
                {"alert_limit": p["sequential_alert_limit"], "trace": p["trials"][index]}
                for p in selected
            ]
            trace = _quorum_trace(members, q, regime, seed, onset)
            trials.append(trace)
            reason_flags = {
                "false_alert": trace["false_alarm"],
                "missed_persistent_change": trace["persistent_change_missed"],
                "coverage_below_floor": trace["coverage"] < MIN_COVERAGE,
            }
            if any(reason_flags.values()):
                failures.append({
                    "quorum": q, "regime": regime,
                    "seed": seed,
                    "first_alarm_step": trace["first_alarm_step"],
                    "detection_delay": trace["detection_delay"],
                    "abstained": trace["abstained"],
                    "reason_flags": reason_flags,
                })
        passed = all(
            not t["false_alarm"]
            and not t["persistent_change_missed"]
            and t["coverage"] >= MIN_COVERAGE
            for t in trials
        )
        policies.append({
            "quorum": q, "rule": f"{q}_OF_3_SAME_STREAM",
            "trials": trials,
            "toy_gate": "PASS_IN_TOY" if passed else "FAIL_IN_TOY",
            "decision_authorized": False,
        })
    # Pairwise co-alert evidence is diagnostic only, NEVER part of policy choice.
    co_votes = []
    for i in range(len(MEMBERS)):
        for j in range(i+1, len(MEMBERS)):
            valid = both = each_i = each_j = 0
            for t in policies[0]["trials"]:
                for f in t["observations"]:
                    if f["member_available"][i] and f["member_available"][j]:
                        valid += 1
                        vi, vj = f["member_votes"][i], f["member_votes"][j]
                        both += vi and vj
                        each_i += vi
                        each_j += vj
            co_votes.append({
                "pair": [member_info[i]["id"], member_info[j]["id"]],
                "both_available_frames": valid,
                "joint_positive_frames": both,
                "first_positive_frames": each_i,
                "second_positive_frames": each_j,
                "empirical_independence_claimed": False,
            })
    report = {
        "schema": SCHEMA,
        "status": "SYNTHETIC_CORRELATED_QUORUM_AND_REFUSAL_LEDGER",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False, "consciousness_measured": False,
        "action_authorized": False, "phi_optimality_proven": False,
        "protocol": {
            "parent_schema": parent["schema"],
            "parent_sha256": parent["sha256"],
            "frozen_members": [
                {"budget": b, "readout": m} for b, m in MEMBERS
            ],
            "quorums": list(QUORUMS),
            "sealed_scenarios": [
                {"regime": name, "seed": seed, "persistent_change_step": onset}
                for name, seed, onset in TESTS
            ],
            "frames_per_stream": LENGTH,
            "same_noise_realization_shared_by_all_members": True,
            "witness_independence_assumed": False,
            "calibration_sees_sealed_data": False,
            "rule": "frame-local votes: available and CUSUM strictly above member's frozen E15 limit",
            "abstain": "fewer than quorum available readings => abstain; never treat as no-detect",
            "alarm": "first frame with quorum affirmative currently available votes; one-shot",
            "first_alarm_before_onset": "false alarm and missed sustained change, no retroactive success",
            "transient_spikes": "negative controls for sustained-event definition",
            "toy_gate": "no false alarms, no missed step/ramp changes, coverage>=0.75 across eight sealed streams",
            "claim_boundary": "correlated procedural simulator; not independent replication or external deployment",
        },
        "members": member_info,
        "overlap_diagnostics": overlaps,
        "co_vote_diagnostics": co_votes,
        "policies": policies,
        "failure_ledger": failures,
        "summary": {
            "member_count": len(MEMBERS),
            "quorum_count": len(QUORUMS),
            "sealed_streams": len(TESTS),
            "evaluation_cells": len(QUORUMS)*len(TESTS),
            "false_alarm_cells": sum(t["false_alarm"] for p in policies for t in p["trials"]),
            "missed_persistent_cells": sum(t["persistent_change_missed"] for p in policies for t in p["trials"]),
            "failure_cells": len(failures),
            "toy_passes": sum(p["toy_gate"] == "PASS_IN_TOY" for p in policies),
            "all_failures_retained": True,
            "deployments_authorized": 0,
        }
    }
    digest = sha256(json.dumps(report, sort_keys=True, separators=(",", ":"),
                               allow_nan=False).encode()).hexdigest()
    return {**report, "sha256": digest}
