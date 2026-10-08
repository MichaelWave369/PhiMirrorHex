"""E8: frozen out-of-distribution synthetic sensor shifts and memory loss.

No retraining or selection on shifted test data. This is not a robustness
certification, biological measurement, or proof of a Φ advantage.
"""
from __future__ import annotations

from hashlib import sha256
from math import sqrt
import json

from .adaptive import adaptive_benchmark
from .coherence_bench import PROFILES, REGIMES, SAMPLES, TEST_SEED, WEIGHTS, sample_features
from .gears import gear_report

SCHEMA = "phimirrorhex.e8.robustness.v1"
SCENARIOS = ("clean", "noise", "dropout", "mean_only")
NOISE_SEED = 707
NOISE_AMPLITUDE = 0.25
DROPPED_RINGS = (1, 4)


def perturb(features: tuple[float, ...], index: int,
            scenario: str) -> tuple[float, ...]:
    """Fixed sensor transformations: labels are never regenerated."""
    if scenario not in SCENARIOS:
        raise ValueError("unknown perturbation scenario")
    if len(features) != 6 or any(not 0 <= x <= 1 for x in features):
        raise ValueError("six normalized finite features are required")
    if type(index) is not int or not 0 <= index < SAMPLES:
        raise ValueError("index must be a valid held-out sample")
    if scenario == "clean":
        return tuple(features)
    if scenario == "noise":
        reference, _ = sample_features(NOISE_SEED, index)
        return tuple(min(1.0, max(0.0, x + NOISE_AMPLITUDE * (n - 0.5)))
                     for x, n in zip(features, reference))
    if scenario == "dropout":
        return tuple(0.5 if i in DROPPED_RINGS else x
                     for i, x in enumerate(features))
    center = sum(features) / 6
    return (center,) * 6


def _dot(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    return sum(x * y for x, y in zip(a, b))


def _heldout(world: str) -> tuple[tuple[tuple[float, ...], float], ...]:
    out = []
    for index in range(SAMPLES):
        x, eps = sample_features(TEST_SEED, index)
        out.append((x, _dot(WEIGHTS[world], x) + eps))
    return tuple(out)


def _metric(weights: tuple[float, ...], samples, scenario: str) -> dict:
    errors = []
    for index, (features, target) in enumerate(samples):
        estimate = _dot(weights, perturb(features, index, scenario))
        errors.append(estimate - target)
    mae = sum(abs(err) for err in errors) / len(errors)
    mse = sum(err * err for err in errors) / len(errors)
    return {"mae": mae, "rmse": sqrt(mse), "case_count": SAMPLES,
            "features_read": 6, "weighted_terms": 6}


def memory_compression_control() -> dict:
    """E5 Keyhole toy: identity lost to aggregate at t10, visible by t12."""
    source = gear_report()
    episodes = []
    for step in (10, 12):
        frame = source["history"][step]
        a, b = frame["state_a"][-1], frame["state_b"][-1]
        coarse_equal = sum(a) == sum(b)
        full_distinct = a != b
        episodes.append({
            "step": step,
            "representation_full": "six signed outer-ring sectors",
            "representation_coarse": "sum of outer-ring sectors",
            "full_state_distinguishable": full_distinct,
            "coarse_state_distinguishable": not coarse_equal,
            "full_state_correct_of_two": 2 if full_distinct else 1,
            "sum_only_correct_of_two": 1 if coarse_equal else 2,
            "outer_a": sum(a), "outer_b": sum(b),
            "full_state_l1_difference": sum(abs(x - y) for x, y in zip(a, b)),
        })
    return {
        "source_schema": source["schema"],
        "source_sha256": source["sha256"],
        "epistemic_origin": "SIMULATED",
        "fed_to_learner": False,
        "decision_authority": False,
        "cases": episodes,
        "interpretation": "engineered two-case observability; not learned memory reconstruction",
    }


def robustness_benchmark() -> dict:
    """Evaluate frozen E7 learned weights on identical altered held-out cases."""
    e7 = adaptive_benchmark()
    worlds = []
    for world in e7["worlds"]:
        samples = _heldout(world["world"])
        models = {}
        for initial in PROFILES:
            weights = tuple(world["models"][initial]["final_weights"])
            models[initial] = {
                "weights": list(weights),
                "scenarios": {scenario: _metric(weights, samples, scenario)
                              for scenario in SCENARIOS},
                "fixed_equal_reference": None,
            }
        fixed_equal = {scenario: _metric(WEIGHTS["equal"], samples, scenario)
                       for scenario in SCENARIOS}
        picked = world["selected_on_validation"]
        chosen = models[picked]["scenarios"]
        worlds.append({
            "world": world["world"],
            "selected_on_prior_validation": picked,
            "selection_not_changed_after_shifts": True,
            "models": models,
            "fixed_equal_reference": fixed_equal,
            "selected_deltas_vs_clean": {
                name: chosen[name]["mae"] - chosen["clean"]["mae"]
                for name in SCENARIOS
            },
        })
    payload = {
        "schema": SCHEMA, "status": "SYNTHETIC_PERTURBATION_BENCHMARK",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False, "consciousness_measured": False,
        "phi_optimality_demonstrated": False, "action_authorized": False,
        "labels_preserved_under_shift": True, "retraining_on_shift": False,
        "source": {"adaptive_schema": e7["schema"],
                   "adaptive_sha256": e7["sha256"],
                   "test_seed": TEST_SEED},
        "protocol": {
            "scenarios": list(SCENARIOS), "samples_per_scenario": SAMPLES,
            "noise_seed": NOISE_SEED, "noise_amplitude": NOISE_AMPLITUDE,
            "dropped_rings": list(DROPPED_RINGS),
            "dropout_imputation": 0.5,
            "mean_only": "all six features replaced by their arithmetic mean",
            "targets": "original clean E6 programmed target, unchanged by perturbation",
            "training": "frozen E7 learned weights, no refit under shift",
            "candidate_choice": "E7 validation choice; never reselect on shifted test",
            "cost": "six input readings and six weighted terms per inference, all arms",
            "fixed_equal": "untrained descriptive comparison, not training-cost matched",
            "safety": "synthetic demonstration, no autonomous actions or biology inference",
        },
        "profiles": list(PROFILES), "worlds": worlds,
        "memory_keyhole": memory_compression_control(),
    }
    fingerprint = sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"),
                                   allow_nan=False).encode()).hexdigest()
    return {**payload, "sha256": fingerprint}
