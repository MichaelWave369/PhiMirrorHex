"""E7 preregistered split, cost parity, feedback and causal firewall."""

from math import isfinite

import pytest

from phimirrorhex.adaptive import (
    CHECKPOINTS, LEARNING_RATE, SAMPLES, TRAIN_SEED, VALIDATION_SEED,
    TEST_SEED, adaptive_benchmark, train,
)
from phimirrorhex.coherence_bench import PROFILES, REGIMES, WEIGHTS


def test_train_is_replay_exact_and_keeps_simplex():
    a = train("phi_outer", "equal")
    assert a == train("phi_outer", "equal")
    assert a["train_updates"] == 128
    assert a["train_readings"] == 128 * 6
    assert a["gradient_terms"] == 128 * 6
    assert a["exponential_terms"] == 128 * 6
    assert [c["updates"] for c in a["snapshots"]] == list(CHECKPOINTS)
    for snap in a["snapshots"]:
        assert len(snap["weights"]) == 6
        assert min(snap["weights"]) > 0
        assert sum(snap["weights"]) == pytest.approx(1.0, abs=1e-12)


def test_training_feedback_changes_weights_and_shuffle_changes_fit():
    proper = train("phi_outer", "equal")
    scrambled = train("phi_outer", "equal", shuffled=True)
    assert proper["final_weights"] != list(WEIGHTS["equal"])
    assert proper["final_weights"] != scrambled["final_weights"]
    assert scrambled["feedback_labels_used"] == proper["feedback_labels_used"]
    assert scrambled["train_updates"] == proper["train_updates"]


def test_all_adaptive_arms_receive_equal_train_compute_budget():
    b = adaptive_benchmark()
    assert len(b["worlds"]) == 5
    for world in b["worlds"]:
        pairs = {
            (trial["train_updates"], trial["train_readings"],
             trial["gradient_terms"], trial["exponential_terms"],
             trial["updated_parameters"])
            for trial in world["models"].values()
        }
        assert pairs == {(128, 768, 768, 768, 6)}
        assert world["selected_on_validation"] == min(
            PROFILES,
            key=lambda p: (world["models"][p]["validation"]["mae"], p),
        )
        assert all(isfinite(t["held_out"]["mae"]) for t in world["models"].values())
        c = world["matched_label_shuffle_control"]
        assert c["same_update_count"] == 128
        assert c["selection_not_retuned"]
        assert c["trained"]["train_updates"] == 128


def test_replay_and_heldout_provenance_and_causal_audit():
    r = adaptive_benchmark()
    assert r == adaptive_benchmark()
    assert r["protocol"]["learning_rate_is_frozen"]
    assert (TRAIN_SEED, VALIDATION_SEED, TEST_SEED) == (201, 202, 203)
    assert LEARNING_RATE == 2.0
    assert r["training_and_test_isolated"]
    assert r["ground_truth_engineered"]
    assert r["epistemic_origin"] == "SIMULATED"
    assert not r["phi_optimality_demonstrated"]
    assert not r["physical_measurement"]
    assert not r["consciousness_measured"]
    assert not r["action_authorized"]
    assert len(r["sha256"]) == 64
    audit = r["causal_audit"]
    assert audit["read_only"] and not audit["fed_to_learner"]
    assert audit["step_10"]["outer_hidden_difference"] > 0
    assert audit["step_10"]["coarse_gap"] == 0
    assert audit["step_12"]["coarse_gap"] > 0


def test_unrecognized_inputs_fail():
    for args in [
        ("unknown", "equal"),
        ("equal", "unknown"),
        ("equal", "equal", 1),
    ]:
        if len(args) == 3:
            with pytest.raises(ValueError):
                train(args[0], args[1], shuffled=args[2])
        else:
            with pytest.raises(ValueError):
                train(*args)


def test_asymmetric_world_learns_relative_to_mismatched_fixed_equal():
    b = adaptive_benchmark()
    phi = next(world for world in b["worlds"] if world["world"] == "phi_outer")
    adaptive = phi["models"]["equal"]["held_out"]["mae"]
    fixed = phi["models"]["equal"]["fixed_initial_held_out"]["mae"]
    assert adaptive < fixed
