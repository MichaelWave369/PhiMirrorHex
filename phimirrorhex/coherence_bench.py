"""E6 preregistered synthetic comparison of six-scale weighting schemes.

The generator intentionally includes worlds defined by the candidate weights.
A match within such a constructed world is NOT evidence of universal Phi utility.
All methods inspect six inputs and perform six weighted contributions per case.
"""

from __future__ import annotations

from hashlib import sha256
from math import isfinite, sqrt
import json

SCHEMA = "phimirrorhex.e6.coherence-benchmark.v1"
PHI = (1 + sqrt(5)) / 2
MASK = 0xFFFFFFFF
SAMPLES = 128
VALIDATION_SEED = 202
TEST_SEED = 203
PROFILES = ("equal", "phi_inner", "phi_outer", "center", "alternating")
REGIMES = PROFILES
RING_NAMES = (
    "Environmental coupling", "Sensory boundary", "Signal encoding",
    "Local feedback loops", "Integration proxy", "Behavioral expression proxy",
)


def _normalize(values: tuple[float, ...]) -> tuple[float, ...]:
    total = sum(values)
    return tuple(value / total for value in values)


WEIGHTS = {
    "equal": _normalize((1, 1, 1, 1, 1, 1)),
    "phi_inner": _normalize(tuple(PHI ** (5 - ring) for ring in range(6))),
    "phi_outer": _normalize(tuple(PHI ** ring for ring in range(6))),
    "center": _normalize((1, 2, 3, 3, 2, 1)),
    "alternating": _normalize((4, 1, 4, 1, 4, 1)),
}


def _rng_step(value: int) -> int:
    value ^= (value << 13) & MASK
    value ^= value >> 17
    value ^= (value << 5) & MASK
    return value & MASK


def sample_features(seed: int, sample_index: int) -> tuple[tuple[float, ...], float]:
    """Unsigned 32-bit xorshift; independent deterministic partition seeds."""
    if type(seed) is not int or not 0 <= seed <= 2**31 - 1:
        raise ValueError("seed must be an integer in [0, 2^31-1]")
    if type(sample_index) is not int or not 0 <= sample_index < 100000:
        raise ValueError("sample_index must be an integer in [0,100000)")
    state = (seed ^ ((sample_index + 1) * 0x9E3779B9)
             ^ ((seed + 1) * 0x85EBCA6B)) & MASK
    if state == 0:
        state = 0x6D2B79F5
    values = []
    for _ in range(7):
        state = _rng_step(state)
        values.append((state & 0xFFFFFF) / 0xFFFFFF)
    return tuple(values[:6]), 0.04 * (values[6] - 0.5)


def _dot(weights: tuple[float, ...], features: tuple[float, ...]) -> float:
    return sum(weight * feature for weight, feature in zip(weights, features))


def _errors(regime: str, profile: str, seed: int) -> dict:
    weights = WEIGHTS[profile]
    world = WEIGHTS[regime]
    absolute, squared = 0.0, 0.0
    for index in range(SAMPLES):
        features, noise = sample_features(seed, index)
        truth = _dot(world, features) + noise
        predicted = _dot(weights, features)
        delta = predicted - truth
        absolute += abs(delta)
        squared += delta * delta
    return {
        "mae": absolute / SAMPLES,
        "rmse": sqrt(squared / SAMPLES),
        "readings_per_case": 6,
        "weighted_terms_per_case": 6,
    }


def _shuffled_label_mae(regime: str, profile: str, seed: int) -> float:
    observations = []
    for index in range(SAMPLES):
        x, noise = sample_features(seed, index)
        observations.append((_dot(WEIGHTS[profile], x), _dot(WEIGHTS[regime], x) + noise))
    # Deterministic label shuffle, never chosen based on test performance.
    permutation = tuple((i + 47) % SAMPLES for i in range(SAMPLES))
    return sum(abs(pred - observations[j][1])
               for (pred, _), j in zip(observations, permutation)) / SAMPLES


def benchmark() -> dict:
    """Selection on validation only, all candidates exposed on held-out test."""
    results = []
    for regime in REGIMES:
        validation = {name: _errors(regime, name, VALIDATION_SEED) for name in PROFILES}
        selected = min(PROFILES, key=lambda name: (validation[name]["mae"], name))
        holdout = {name: _errors(regime, name, TEST_SEED) for name in PROFILES}
        example_x, example_noise = sample_features(TEST_SEED, 0)
        results.append({
            "regime": regime,
            "world_is_constructed": True,
            "selected_on_validation": selected,
            "validation": validation,
            "held_out": holdout,
            "label_permutation_control": {
                "selected_profile": selected,
                "mae": _shuffled_label_mae(regime, selected, TEST_SEED),
                "description": "Held-out labels offset by 47 samples; no re-fitting",
            },
            "held_out_example": {
                "features": list(example_x),
                "target": _dot(WEIGHTS[regime], example_x) + example_noise,
                "noise": example_noise,
                "predictions": {p: _dot(WEIGHTS[p], example_x) for p in PROFILES},
            },
        })
    payload = {
        "schema": SCHEMA,
        "status": "CONSTRUCTED_SYNTHETIC_BENCHMARK",
        "epistemic_origin": "SIMULATED",
        "ground_truth_is_engineered": True,
        "physical_measurement": False,
        "consciousness_measured": False,
        "action_authorized": False,
        "phi_is_proven_optimal": False,
        "splits": {"validation_seed": VALIDATION_SEED, "test_seed": TEST_SEED,
                   "cases_per_split_per_regime": SAMPLES},
        "protocol": {
            "noise": "uniform-derived deterministic jitter in [-0.02,0.02]",
            "target": "ground-truth six-weight dot(features) + noise",
            "selector": "minimum validation MAE among five frozen candidates, lexicographic ties",
            "holdout": "never used in candidate selection",
            "cost": "all candidates read six scales and evaluate six weighted terms",
            "negative_control": "held-out labels shifted by 47 samples",
            "claim_boundary": "matched engineered regimes, not biological coherence",
        },
        "profiles": list(PROFILES),
        "ring_names": list(RING_NAMES),
        "weights": {name: list(WEIGHTS[name]) for name in PROFILES},
        "results": results,
    }
    fingerprint = sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"),
                                    ensure_ascii=True, allow_nan=False).encode()).hexdigest()
    return {**payload, "sha256": fingerprint}
