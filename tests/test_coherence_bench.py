"""E6 holdout, cost matching, negative controls, regime specificity."""

import math

import pytest

from phimirrorhex.coherence_bench import (
    WEIGHTS, PROFILES, REGIMES, SAMPLES, TEST_SEED, VALIDATION_SEED,
    benchmark, sample_features,
)


def test_profile_weights_are_nonnegative_normalized_and_not_all_equal():
    assert len(WEIGHTS) == 5
    for name, weights in WEIGHTS.items():
        assert len(weights) == 6
        assert min(weights) > 0
        assert sum(weights) == pytest.approx(1.0)
    assert WEIGHTS["phi_inner"] != WEIGHTS["phi_outer"]
    assert WEIGHTS["phi_inner"] != WEIGHTS["equal"]


def test_replay_and_input_validation():
    assert sample_features(TEST_SEED, 21) == sample_features(TEST_SEED, 21)
    assert sample_features(TEST_SEED, 21) != sample_features(VALIDATION_SEED, 21)
    for bad in (-1, True, float("nan"), 2**31):
        with pytest.raises(ValueError):
            sample_features(bad, 0)
    for bad in (-1, 100000, False):
        with pytest.raises(ValueError):
            sample_features(202, bad)


def test_benchmark_no_test_tuning_and_cost_matched():
    r = benchmark()
    assert r == benchmark()
    assert len(r["sha256"]) == 64
    assert r["splits"]["validation_seed"] != r["splits"]["test_seed"]
    assert r["splits"]["cases_per_split_per_regime"] == SAMPLES
    assert [x["regime"] for x in r["results"]] == list(REGIMES)
    assert r["epistemic_origin"] == "SIMULATED"
    assert r["ground_truth_is_engineered"]
    assert not r["phi_is_proven_optimal"]
    assert not r["consciousness_measured"]
    assert not r["action_authorized"]
    for row in r["results"]:
        assert row["selected_on_validation"] == min(
            PROFILES, key=lambda p: (row["validation"][p]["mae"], p)
        )
        assert set(row["held_out"]) == set(PROFILES)
        for split in ("validation", "held_out"):
            assert all(m["readings_per_case"] == 6 for m in row[split].values())
            assert all(m["weighted_terms_per_case"] == 6 for m in row[split].values())
        assert row["label_permutation_control"]["mae"] >= 0
        assert all(math.isfinite(m["rmse"]) and m["rmse"] >= m["mae"] - 1e-10
                   for m in row["held_out"].values())


def test_engineered_worlds_favor_matching_profile_not_phi_everywhere():
    r = benchmark()
    for row in r["results"]:
        assert row["selected_on_validation"] == row["regime"]
        best = min(PROFILES, key=lambda p: row["held_out"][p]["mae"])
        assert best == row["regime"]
    assert r["results"][0]["held_out"]["equal"]["mae"] < r["results"][0]["held_out"]["phi_outer"]["mae"]
    assert r["results"][2]["held_out"]["phi_outer"]["mae"] < r["results"][2]["held_out"]["equal"]["mae"]
