"""E8: test isolation, negative shifts, layer loss and memory observability."""

import math

import pytest

from phimirrorhex.robustness import (
    SCENARIOS, DROPPED_RINGS, memory_compression_control, perturb,
    robustness_benchmark,
)
from phimirrorhex.coherence_bench import PROFILES


def test_clean_is_noop_and_shifts_are_reproducible():
    features = (.05, .2, .4, .6, .8, .95)
    assert perturb(features, 0, "clean") == features
    assert perturb(features, 8, "noise") == perturb(features, 8, "noise")
    assert perturb(features, 8, "noise") != features
    drop = perturb(features, 0, "dropout")
    assert [drop[i] for i in DROPPED_RINGS] == [.5, .5]
    assert all(drop[i] == features[i] for i in range(6) if i not in DROPPED_RINGS)
    assert perturb(features, 1, "mean_only") == (sum(features)/6,) * 6


def test_invalid_shifts_fail_closed():
    with pytest.raises(ValueError):
        perturb((.1,)*6, 0, "oracle")
    for bad in (-1, True, 128):
        with pytest.raises(ValueError):
            perturb((.1,)*6, bad, "noise")
    for bad in ((.5,)*5, (1.2,)*6, (float("nan"),)*6):
        with pytest.raises(ValueError):
            perturb(bad, 0, "clean")


def test_memory_keyhole_is_separate_from_learning():
    k = memory_compression_control()
    assert k["fed_to_learner"] is False
    assert k["decision_authority"] is False
    assert k["epistemic_origin"] == "SIMULATED"
    assert len(k["source_sha256"]) == 64
    ten, twelve = k["cases"]
    assert ten["step"] == 10 and twelve["step"] == 12
    assert ten["full_state_correct_of_two"] == 2
    assert ten["sum_only_correct_of_two"] == 1
    assert ten["full_state_l1_difference"] > 0
    assert twelve["sum_only_correct_of_two"] == 2


def test_all_arms_share_scenarios_sample_count_and_no_adaptation():
    r = robustness_benchmark()
    assert r == robustness_benchmark()
    assert len(r["sha256"]) == 64
    assert r["epistemic_origin"] == "SIMULATED"
    assert not r["physical_measurement"]
    assert not r["consciousness_measured"]
    assert not r["action_authorized"]
    assert not r["phi_optimality_demonstrated"]
    assert r["labels_preserved_under_shift"]
    assert not r["retraining_on_shift"]
    assert r["source"]["test_seed"] == 203
    assert len(r["worlds"]) == 5
    for world in r["worlds"]:
        assert world["selected_on_prior_validation"] in PROFILES
        assert world["selection_not_changed_after_shifts"]
        for initial in PROFILES:
            measures = world["models"][initial]["scenarios"]
            assert list(measures) == list(SCENARIOS)
            assert all(m["case_count"] == 128 and m["features_read"] == 6
                       and m["weighted_terms"] == 6 for m in measures.values())
            assert all(math.isfinite(m["mae"]) and m["rmse"] >= m["mae"] - 1e-12
                       for m in measures.values())
            assert world["models"][initial]["weights"] != []
        assert world["selected_deltas_vs_clean"]["clean"] == 0


def test_perturbations_change_at_least_some_heldout_errors():
    r = robustness_benchmark()
    assert any(
        abs(world["selected_deltas_vs_clean"][scenario]) > 1e-5
        for world in r["worlds"]
        for scenario in ("noise", "dropout", "mean_only")
    )
