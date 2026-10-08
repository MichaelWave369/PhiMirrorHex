"""E7: adaptive six-scale synthetic benchmark with frozen online feedback.

Five positive-simplex initializations run the *same* multiplicative-gradient
update for one pass over a train-only split. Validation selects a candidate,
and held-out test remains untouched until evaluation. Fixed and label-shuffled
controls are included. A separate E5 NBG-style Keyhole receipt is observation-
only and is never fed back into the learner.

No external data, physics, biology, consciousness, or action authority.
"""

from __future__ import annotations

from hashlib import sha256
import json
from math import exp

from .coherence_bench import PROFILES, REGIMES, SAMPLES, WEIGHTS, sample_features
from .gears import gear_report

SCHEMA = "phimirrorhex.e7.adaptive-coherence.v1"
TRAIN_SEED = 201
VALIDATION_SEED = 202
TEST_SEED = 203
LEARNING_RATE = 2.0
CHECKPOINTS = (0, 16, 32, 64, 96, 128)
SHUFFLE_OFFSET = 47
READINGS_PER_SAMPLE = 6
PARAMETERS = 6


def _dot(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    return sum(x * y for x, y in zip(a, b))


def _rows(world: str, seed: int) -> tuple[tuple[tuple[float, ...], float], ...]:
    if world not in REGIMES:
        raise ValueError("unknown synthetic world")
    data = []
    for i in range(SAMPLES):
        inputs, noise = sample_features(seed, i)
        data.append((inputs, _dot(WEIGHTS[world], inputs) + noise))
    return tuple(data)


def _step(weights: tuple[float, ...], features: tuple[float, ...],
          label: float, rate: float = LEARNING_RATE) -> tuple[float, ...]:
    """Exponentiated-gradient update with six independent positive weights.

    Exactly one prediction, six gradient terms and six exponential updates
    are evaluated per observed training example, regardless of initialization.
    """
    pred = _dot(weights, features)
    delta = 2.0 * (pred - label)
    values = tuple(w * exp(-rate * delta * x) for w, x in zip(weights, features))
    total = sum(values)
    if total <= 0.0:
        raise ArithmeticError("adaptive normalization failed")
    return tuple(v / total for v in values)


def _error(weights: tuple[float, ...],
           samples: tuple[tuple[tuple[float, ...], float], ...]) -> dict:
    errors = [_dot(weights, inputs) - label for inputs, label in samples]
    mae = sum(abs(err) for err in errors) / len(errors)
    mse = sum(err * err for err in errors) / len(errors)
    return {"mae": mae, "mse": mse}


def train(world: str, initial: str, *, shuffled: bool = False) -> dict:
    """Deterministic train-only updates; no validation or test label access."""
    if world not in REGIMES or initial not in PROFILES:
        raise ValueError("invalid world or initialization")
    if type(shuffled) is not bool:
        raise ValueError("shuffled must be boolean")
    rows = _rows(world, TRAIN_SEED)
    labels = tuple(y for _, y in rows)
    weights = WEIGHTS[initial]
    snapshots = [list(weights)]
    for index, (features, label) in enumerate(rows):
        if shuffled:
            label = labels[(index + SHUFFLE_OFFSET) % len(labels)]
        weights = _step(weights, features, label)
        if index + 1 in CHECKPOINTS[1:]:
            snapshots.append(list(weights))
    if len(snapshots) != len(CHECKPOINTS):
        raise AssertionError("checkpoint count changed")
    return {
        "final_weights": list(weights),
        "snapshots": [
            {"updates": step, "weights": values}
            for step, values in zip(CHECKPOINTS, snapshots)
        ],
        "train_updates": SAMPLES,
        "train_readings": SAMPLES * READINGS_PER_SAMPLE,
        "updated_parameters": PARAMETERS,
        "gradient_terms": SAMPLES * PARAMETERS,
        "exponential_terms": SAMPLES * PARAMETERS,
        "feedback_labels_used": SAMPLES,
        "source_split": "train_only",
        "shuffled_training_labels": shuffled,
    }


def _keyhole_audit() -> dict:
    """Independent synthetic E5 causal-provenance check, NOT model features."""
    e5 = gear_report(coupling=0.5, probe_gain=0.5, conveyor_enabled=True)
    before, after = e5["history"][10], e5["history"][12]
    return {
        "source": "phimirrorhex.e5.gear-coupling.v1",
        "source_sha256": e5["sha256"],
        "epistemic_origin": "SIMULATED",
        "read_only": True,
        "fed_to_learner": False,
        "step_10": {
            "outer_hidden_difference": before["outer_hidden_distance"],
            "coarse_gap": before["outer_gap"],
        },
        "step_12": {
            "outer_hidden_difference": after["outer_hidden_distance"],
            "coarse_gap": after["outer_gap"],
        },
        "interpretation": "toy hidden difference precedes coarse visibility; not a learned causal discovery",
    }


def adaptive_benchmark() -> dict:
    """All profiles and splits disclosed; adaptive selection uses validation."""
    worlds = []
    for world in REGIMES:
        validation = _rows(world, VALIDATION_SEED)
        holdout = _rows(world, TEST_SEED)
        trials = {}
        for initial in PROFILES:
            training = train(world, initial)
            weights = tuple(training["final_weights"])
            trials[initial] = {
                **training,
                "validation": _error(weights, validation),
                "held_out": _error(weights, holdout),
                "fixed_initial_held_out": _error(WEIGHTS[initial], holdout),
            }

        selected = min(PROFILES, key=lambda p: (trials[p]["validation"]["mae"], p))
        shuffled = train(world, selected, shuffled=True)
        shuffled_test = _error(tuple(shuffled["final_weights"]), holdout)
        worlds.append({
            "world": world,
            "engineered_target": True,
            "selected_on_validation": selected,
            "models": trials,
            "matched_label_shuffle_control": {
                "initialization": selected,
                "trained": shuffled,
                "held_out": shuffled_test,
                "same_update_count": SAMPLES,
                "label_offset": SHUFFLE_OFFSET,
                "selection_not_retuned": True,
            },
            "held_out_example": {
                "inputs": list(holdout[0][0]),
                "target": holdout[0][1],
                "selected_prediction": _dot(
                    tuple(trials[selected]["final_weights"]), holdout[0][0]
                ),
                "fixed_equal_prediction": _dot(WEIGHTS["equal"], holdout[0][0]),
            },
        })

    report = {
        "schema": SCHEMA,
        "status": "DETERMINISTIC_SYNTHETIC_METHOD_BENCHMARK",
        "epistemic_origin": "SIMULATED",
        "ground_truth_engineered": True,
        "physical_measurement": False,
        "consciousness_measured": False,
        "action_authorized": False,
        "phi_optimality_demonstrated": False,
        "training_and_test_isolated": True,
        "protocol": {
            "seed_train": TRAIN_SEED,
            "seed_validation": VALIDATION_SEED,
            "seed_test": TEST_SEED,
            "cases_per_split": SAMPLES,
            "features": PARAMETERS,
            "learning_rate": LEARNING_RATE,
            "rule": "positive-simplex exponentiated gradient, one online pass",
            "objective": "squared-error online gradient; evaluate MAE and MSE",
            "updates_per_adaptive_arm": SAMPLES,
            "cost_comparison": "adaptive initializations share 6 parameters, 6 readings, 6 gradient/exponential terms per train case",
            "fixed_profiles": "untrained descriptive controls, not claimed compute-matched to training",
            "candidate_selection": "lowest validation MAE; lexicographic tie break",
            "holdout": "never used for fitting, model selection or hyperparameter choice",
            "negative_control": "same learning rule with training labels circularly shifted by 47",
            "causal_audit": "independent E5 witness, explicitly not an adaptive-training feature",
            "learning_rate_is_frozen": True,
        },
        "profiles": list(PROFILES),
        "worlds": worlds,
        "causal_audit": _keyhole_audit(),
    }
    digest = sha256(json.dumps(report, sort_keys=True, separators=(",", ":"),
                               ensure_ascii=True, allow_nan=False).encode()).hexdigest()
    return {**report, "sha256": digest}
