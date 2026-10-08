"""E10 source diversity, sealed policy selection and honest OOD failures."""

from phimirrorhex.generalization import (
    FLOOR, TRAIN_N, VALIDATION_N, TEST_N, _data, _count, _pair,
    _policy, _outer, generalization_report,
)
from phimirrorhex.frontier import ALL_MASKS, selected_sectors, gaps


def test_generated_source_family_and_counterposed_outer_pair():
    train = _data(901, 48, False)
    holdout = _data(903, 48, True)
    assert len(train) == TRAIN_N and len(holdout) == TEST_N
    assert all(e["family"] == "sparse" for e in train)
    assert sum(e["family"] == "dense" for e in holdout) == 24
    assert all(abs(sum(e["initial"])) < 1e-10 for e in train + holdout)
    assert len({tuple(e["initial"]) for e in holdout}) >= 10
    for row in holdout:
        assert all(len(pair) == 2 and len(pair[0]) == len(pair[1]) == 6
                   for pair in row["worlds"].values())
        assert row["worlds"]["no_coupling"] == ((0.0,) * 6, (0.0,) * 6)


def test_source_seeds_replay_and_bad_probe_rejected():
    assert _pair(901, 2, "sparse") == _pair(901, 2, "sparse")
    assert _pair(901, 2, "sparse") != _pair(903, 2, "dense")
    for invalid in (-1, True, 6):
        try:
            _outer((1., -1., 0., 0., 0., 0.), probe_sector=invalid)
        except ValueError:
            pass
        else:
            raise AssertionError("bad probe sector accepted")


def test_masks_are_selected_without_holdout_and_budget_is_preserved():
    train = _data(901, 48, False)
    result = generalization_report()
    assert result["protocol"]["heldout_used_for_selection"] is False
    assert result["protocol"]["validation_used_for_selection"] is False
    assert len(result["policies"]) == 14
    for policy in result["policies"]:
        chosen, score = _policy(train, policy["budget"], policy["readout"])
        assert chosen == policy["train_selected_mask"]
        assert score == policy["train_detected"]
        assert len(selected_sectors(chosen)) == policy["budget"]
        assert policy["sensor_readings"] == policy["budget"]
        assert policy["selection_split"] == "train_only"
        assert policy["reoptimized_on_test"] is False
        assert policy["posthoc_best_test_count_diagnostic_only"] >= policy[
            "heldout_detected"]["matched_probe"]
        for scenario, count in policy["heldout_detected"].items():
            assert 0 <= count <= TEST_N
        assert 0 <= policy["validation_detected"] <= VALIDATION_N


def test_counterfactual_controls_and_no_probe_nuance():
    result = generalization_report()
    assert result["controls"]["empty_mask_always_blind"]
    assert result["controls"]["no_coupling_always_blind"]
    assert result["controls"]["no_probe_can_still_separate_partial_sums"]
    assert all(p["heldout_detected"]["no_coupling"] == 0
               for p in result["policies"])
    assert all(p["heldout_detected"]["no_probe"] == 0
               for p in result["policies"] if p["budget"] == 6
               and p["readout"] == "masked_sum")
    assert any(p["heldout_detected"]["matched_probe"] > 0
               for p in result["policies"] if p["readout"] == "identity_max")


def test_report_provenance_frozen_and_without_realworld_claims():
    a = generalization_report()
    assert a == generalization_report()
    assert a["epistemic_origin"] == "SIMULATED"
    assert not a["physical_measurement"]
    assert not a["consciousness_measured"]
    assert not a["action_authorized"]
    assert not a["phi_optimality_proven"]
    assert len(a["sha256"]) == 64
    assert [e["family"] for e in a["heldout_examples"]] == [
        "sparse", "dense", "sparse", "dense", "sparse", "dense"]
