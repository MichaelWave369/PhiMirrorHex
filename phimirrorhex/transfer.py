"""E12: budget-matched transfer selection on sealed synthetic source populations.

New development seeds are used to select a robust observer under *both*
prespecified probe sectors; new test seeds never influence any mask choice.
E10 train-selected and first-k masks serve as frozen same-budget baselines.
All statistics describe a finite programmed toy, not deployment readiness.
"""
from __future__ import annotations

from hashlib import sha256
import json

from .frontier import ALL_MASKS, selected_sectors
from .generalization import (
    FLOOR, MODES, SCENARIOS, TEST_N, _count, _data, generalization_report,
)

SCHEMA = "phimirrorhex.e12.sensor-transfer-gate.v1"
DEVELOPMENT_SEEDS = (1201, 1202, 1203)
VALIDATION_SEED = 1204
PROSPECTIVE_SEEDS = (1301, 1302, 1303, 1304, 1305)
TRANSFER_CONDITIONS = ("matched_probe", "shifted_probe")
BASELINE_NAMES = ("robust", "e10", "first_k")
SOURCE_FAMILY = "alternating_sparse_dense"
N = TEST_N


def _populations(seeds: tuple[int, ...]) -> list[list[dict]]:
    return [_data(seed, N, True) for seed in seeds]


def _chosen_mask(
    development: list[list[dict]], budget: int, readout: str
) -> dict:
    """Train-only maximin over probe locations; deterministic multiway tie break."""
    eligible = [mask for mask in ALL_MASKS
                if len(selected_sectors(mask)) == budget]
    candidate = []
    for mask in eligible:
        counts = {
            scenario: sum(_count(rows, mask, readout, scenario)
                          for rows in development)
            for scenario in TRANSFER_CONDITIONS
        }
        worst = min(counts.values())
        total = sum(counts.values())
        candidate.append((worst, total, mask, counts))
    best = min(candidate, key=lambda p: (-p[0], -p[1], p[2]))
    return {
        "mask": best[2], "development_worst_count": best[0],
        "development_total_count": best[1],
        "development_by_condition": best[3],
        "candidate_masks_evaluated": len(eligible),
    }


def _score_population(rows: list[dict], masks: dict[str, int],
                      scenario: str, seed: int) -> dict:
    # Caller supplies one frozen sensor budget and readout.
    raise RuntimeError("Call _score below with the observer readout")


def _score(rows: list[dict], masks: dict[str, int],
           readout: str, scenario: str, seed: int) -> dict:
    counts = {name: _count(rows, mask, readout, scenario)
              for name, mask in masks.items()}
    sparse = [r for r in rows if r["family"] == "sparse"]
    dense = [r for r in rows if r["family"] == "dense"]
    return {
        "seed": seed, "scenario": scenario, "total": len(rows),
        "counts": counts,
        "sparse_counts": {
            name: _count(sparse, mask, readout, scenario)
            for name, mask in masks.items()
        },
        "dense_counts": {
            name: _count(dense, mask, readout, scenario)
            for name, mask in masks.items()
        },
        "delta_vs_e10": counts["robust"] - counts["e10"],
        "delta_vs_first_k": counts["robust"] - counts["first_k"],
        "lost_to_any_baseline": (
            counts["robust"] < counts["e10"]
            or counts["robust"] < counts["first_k"]
        ),
    }


def transfer_report() -> dict:
    e10 = generalization_report()
    development = _populations(DEVELOPMENT_SEEDS)
    validation = _data(VALIDATION_SEED, N, True)
    prospective = _populations(PROSPECTIVE_SEEDS)
    policies = []
    failures = []
    for parent in e10["policies"]:
        budget, readout = parent["budget"], parent["readout"]
        selector = _chosen_mask(development, budget, readout)
        masks = {
            "robust": selector["mask"],
            "e10": parent["train_selected_mask"],
            "first_k": parent["fixed_first_k_mask"],
        }
        val = [
            _score(validation, masks, readout, condition, VALIDATION_SEED)
            for condition in TRANSFER_CONDITIONS
        ]
        # Lock mask on development alone; validation only reports a result.
        trials = []
        for seed, population in zip(PROSPECTIVE_SEEDS, prospective):
            for condition in SCENARIOS:
                trial = _score(population, masks, readout, condition, seed)
                trials.append(trial)
                if trial["lost_to_any_baseline"]:
                    failures.append({
                        "seed": seed, "budget": budget,
                        "readout": readout, "scenario": condition,
                        "counts": trial["counts"],
                        "delta_vs_e10": trial["delta_vs_e10"],
                        "delta_vs_first_k": trial["delta_vs_first_k"],
                        "kind": "ROBUST_MASK_LOSES_TO_FROZEN_BASELINE",
                    })
        by_scenario = {}
        for scenario in SCENARIOS:
            selected = [r for r in trials if r["scenario"] == scenario]
            by_scenario[scenario] = {
                "replicate_seeds": list(PROSPECTIVE_SEEDS),
                "robust_counts": [r["counts"]["robust"] for r in selected],
                "e10_counts": [r["counts"]["e10"] for r in selected],
                "first_k_counts": [r["counts"]["first_k"] for r in selected],
                "mean_robust_rate": sum(r["counts"]["robust"] for r in selected)
                    / (len(selected) * N),
                "worst_margin_vs_e10": min(r["delta_vs_e10"] for r in selected),
                "worst_margin_vs_first_k": min(
                    r["delta_vs_first_k"] for r in selected),
                "losses_to_any_baseline": sum(
                    r["lost_to_any_baseline"] for r in selected),
            }

        gate = all(
            by_scenario[condition]["losses_to_any_baseline"] == 0
            for condition in TRANSFER_CONDITIONS
        )
        policies.append({
            "budget": budget, "readout": readout,
            "sensor_readings_per_pair": budget,
            "policy_selection_split": "development_only",
            "masks": masks,
            "selection_receipt": selector,
            "validation": val,
            "prospective_trials": trials,
            "summary": by_scenario,
            "descriptive_transfer_gate": (
                "PASS_IN_THIS_TOY" if gate else "FAIL_IN_THIS_TOY"
            ),
            "gate_is_deployment_authority": False,
        })

    report = {
        "schema": SCHEMA,
        "status": "SEALED_FINITE_SYNTHETIC_TRANSFER_STRESS_TEST",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False,
        "consciousness_measured": False,
        "action_authorized": False,
        "phi_optimality_proven": False,
        "protocol": {
            "parent_schema": e10["schema"],
            "parent_sha256": e10["sha256"],
            "development_seeds": list(DEVELOPMENT_SEEDS),
            "validation_seed": VALIDATION_SEED,
            "prospective_seeds": list(PROSPECTIVE_SEEDS),
            "cases_per_seed": N,
            "population_family": SOURCE_FAMILY,
            "sparse_per_seed": N//2,
            "dense_per_seed": N//2,
            "fixed_detection_floor": FLOOR,
            "development_conditions": list(TRANSFER_CONDITIONS),
            "evaluation_conditions": list(SCENARIOS),
            "selection": (
                "maximize minimum development detection count between "
                "known/shifted probes; then total count; then smallest mask"
            ),
            "selection_sees_validation": False,
            "selection_sees_prospective_test": False,
            "all_three_policies_same_budget_and_readout": True,
            "baseline_e10": "unchanged E10 train-selected mask",
            "baseline_first_k": "unchanged deterministic first-k mask",
            "gate_rule": (
                "no losses vs either baseline in any of five prospective "
                "replicates under BOTH matching and shifted probes"
            ),
            "gate_is_descriptive_not_authority": True,
            "uncertainty": "finite seed extremes only, no confidence interval",
        },
        "policy_count": len(policies),
        "policies": policies,
        "failure_ledger": failures,
        "summary": {
            "prospective_pairs": len(PROSPECTIVE_SEEDS)*N,
            "distinct_prospective_seeds": len(PROSPECTIVE_SEEDS),
            "comparison_cells": len(policies)*len(PROSPECTIVE_SEEDS)*len(SCENARIOS),
            "failure_cells": len(failures),
            "descriptive_gate_passes": sum(
                p["descriptive_transfer_gate"] == "PASS_IN_THIS_TOY"
                for p in policies),
            "no_coupling_blind": all(
                all(v == 0 for v in trial["counts"].values())
                for p in policies for trial in p["prospective_trials"]
                if trial["scenario"] == "no_coupling"),
            "zero_budget_blind": all(
                all(v == 0 for v in trial["counts"].values())
                for p in policies if p["budget"] == 0
                for trial in p["prospective_trials"]),
            "failure_ledger_exhaustive": True,
            "deployment_promotions": 0,
        },
    }
    return {**report, "sha256": sha256(
        json.dumps(report, sort_keys=True, separators=(",", ":"),
                   allow_nan=False).encode()).hexdigest()}
