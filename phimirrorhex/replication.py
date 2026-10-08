"""E11 · repeated synthetic OOD replication and transparent failure ledger.

Retrieves E10's *frozen training-selected* sensor masks, then checks them on
five separately seeded synthetic held-out populations. Neither masks nor
thresholds can be retuned. Worst-case replicates and failures are retained.
This is finite toy reproducibility, not an empirical confidence interval.
"""
from __future__ import annotations

from hashlib import sha256
import json

from .generalization import (
    FLOOR, MODES, SCENARIOS, TEST_N, _count, _data, generalization_report
)

SCHEMA = "phimirrorhex.e11.replication-ledger.v1"
REPLICATION_SEEDS = (1101, 1102, 1103, 1104, 1105)
FAMILIES = ("sparse", "dense")
TRAINING_POLICY_SOURCE = "phimirrorhex.e10.generalization.v1"


def replication_report() -> dict:
    e10 = generalization_report()
    policies = e10["policies"]
    replicates = []
    failures = []
    for seed in REPLICATION_SEEDS:
        population = _data(seed, TEST_N, True)
        strata = {family: [row for row in population if row["family"] == family]
                  for family in FAMILIES}
        scores = []
        for policy in policies:
            mask, reference = policy["train_selected_mask"], policy["fixed_first_k_mask"]
            for scenario in SCENARIOS:
                mode = policy["readout"]
                selected = _count(population, mask, mode, scenario)
                fixed = _count(population, reference, mode, scenario)
                stratified = {
                    family: {
                        "cases": len(rows),
                        "selected_detected": _count(rows, mask, mode, scenario),
                        "fixed_detected": _count(rows, reference, mode, scenario),
                    }
                    for family, rows in strata.items()
                }
                score = {
                    "budget": policy["budget"],
                    "readout": mode,
                    "scenario": scenario,
                    "mask": mask,
                    "baseline_mask": reference,
                    "cases": TEST_N,
                    "selected_detected": selected,
                    "fixed_detected": fixed,
                    "selected_rate": selected / TEST_N,
                    "fixed_rate": fixed / TEST_N,
                    "delta_count": selected - fixed,
                    "strata": stratified,
                }
                scores.append(score)
                if selected < fixed:
                    failures.append({
                        "seed": seed, "budget": policy["budget"],
                        "readout": mode, "scenario": scenario,
                        "selected_detected": selected,
                        "fixed_detected": fixed,
                        "shortfall": fixed - selected,
                        "kind": "FROZEN_MASK_LOSES_TO_FIXED_BASELINE",
                    })
        replicates.append({"seed": seed, "cases": TEST_N,
                           "family_counts": {f: len(strata[f]) for f in FAMILIES},
                           "scores": scores})

    aggregate = []
    for policy in policies:
        for scenario in SCENARIOS:
            rows = [
                next(row for row in replication["scores"]
                     if row["budget"] == policy["budget"]
                     and row["readout"] == policy["readout"]
                     and row["scenario"] == scenario)
                for replication in replicates
            ]
            chosen = [r["selected_detected"] for r in rows]
            baseline = [r["fixed_detected"] for r in rows]
            delta = [r["delta_count"] for r in rows]
            aggregate.append({
                "budget": policy["budget"],
                "readout": policy["readout"],
                "scenario": scenario,
                "frozen_mask": policy["train_selected_mask"],
                "reference_mask": policy["fixed_first_k_mask"],
                "replicate_seeds": list(REPLICATION_SEEDS),
                "selected_counts": chosen,
                "fixed_counts": baseline,
                "delta_counts": delta,
                "selected_mean_rate": sum(chosen) / (len(rows) * TEST_N),
                "fixed_mean_rate": sum(baseline) / (len(rows) * TEST_N),
                "selected_min_rate": min(chosen) / TEST_N,
                "selected_max_rate": max(chosen) / TEST_N,
                "worst_delta_count": min(delta),
                "losses": sum(d < 0 for d in delta),
                "ties": sum(d == 0 for d in delta),
                "wins": sum(d > 0 for d in delta),
                "interpretation": "finite selected seeds, not uncertainty interval",
            })

    report = {
        "schema": SCHEMA,
        "status": "FINITE_SYNTHETIC_REPLICATION_AND_FAILURE_LEDGER",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False,
        "consciousness_measured": False,
        "action_authorized": False,
        "phi_optimality_proven": False,
        "protocol": {
            "training_source": TRAINING_POLICY_SOURCE,
            "training_policy_digest": e10["sha256"],
            "replication_seeds": list(REPLICATION_SEEDS),
            "cases_per_replication": TEST_N,
            "sparse_per_replication": TEST_N // 2,
            "dense_per_replication": TEST_N // 2,
            "readout_floor": FLOOR,
            "sensor_policy": "E10 training-only selections, frozen across replicates",
            "baseline": "E10 fixed first-k masks of identical sensor budget/readout",
            "interventions": list(SCENARIOS),
            "heldout_oracle_not_used": True,
            "replication_test_used_for_selection": False,
            "bounds": "min/max over five fixed synthetic seeds; no population CI",
            "failure_criterion": "selected count strictly below fixed same-budget count",
            "claim_boundary": "method stress test in programmed worlds only",
        },
        "policy_count": len(policies),
        "replicates": replicates,
        "aggregate": aggregate,
        "failure_ledger": failures,
        "summary": {
            "seed_count": len(REPLICATION_SEEDS),
            "replicate_cases_total": len(REPLICATION_SEEDS) * TEST_N,
            "policy_scenario_cells": len(aggregate),
            "failure_cells": len(failures),
            "every_coupling_off_cell_blind": all(
                row["selected_detected"] == row["fixed_detected"] == 0
                for r in replicates for row in r["scores"]
                if row["scenario"] == "no_coupling"
            ),
            "empty_mask_never_detects": all(
                row["selected_detected"] == row["fixed_detected"] == 0
                for r in replicates for row in r["scores"]
                if row["budget"] == 0
            ),
            "all_failures_retained": True,
        },
    }
    digest = sha256(json.dumps(report, sort_keys=True, separators=(",", ":"),
                               allow_nan=False).encode()).hexdigest()
    return {**report, "sha256": digest}
