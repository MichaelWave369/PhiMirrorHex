"""E9 full mask enumeration, fixed thresholds, control integrity."""

import pytest

from phimirrorhex.frontier import (
    ALL_MASKS, CONDITIONS, THRESHOLDS, frontier_report, gaps, selected_sectors,
)


def test_all_64_masks_are_exhaustive_and_counts_are_combinatorial():
    assert len(ALL_MASKS) == 64
    assert len(set(ALL_MASKS)) == 64
    assert selected_sectors(0) == ()
    assert selected_sectors(63) == (0, 1, 2, 3, 4, 5)
    for mask in ALL_MASKS:
        assert len(selected_sectors(mask)) == mask.bit_count()
    for invalid in (-1, 64, True, 1.2):
        with pytest.raises(ValueError):
            selected_sectors(invalid)


def test_identity_preservation_vs_coarse_sum():
    a = (1.0, -1.0, 0, 0, 0, 0)
    b = (-1.0, 1.0, 0, 0, 0, 0)
    assert gaps(a, b, 63)["identity_max"] == 2
    assert gaps(a, b, 63)["masked_sum"] == 0
    assert gaps(a, b, 1)["identity_max"] == 2
    assert gaps(a, b, 1)["masked_sum"] == 2
    assert gaps(a, a, 63) == {"identity_max": 0, "masked_sum": 0}
    assert gaps(a, b, 0) == {"identity_max": 0, "masked_sum": 0}
    with pytest.raises(ValueError):
        gaps(a[:5], b, 1)


def test_exhaustive_budget_partition_and_monotone_threshold_coverage():
    report = frontier_report()
    assert report["protocol"]["all_masks_including_empty"] == 64
    for world in report["worlds"]:
        assert len(world["snapshots"]) == len(THRESHOLDS)
        for entry in world["snapshots"]:
            assert len(entry["frames"]) == 24
            for frame in entry["frames"]:
                assert sum(r["total_masks"] for r in frame["by_budget"]) == 64
                for row in frame["by_budget"]:
                    assert 0 <= row["identity_detected"] <= row["total_masks"]
                    assert 0 <= row["sum_detected"] <= row["total_masks"]
                    assert row["total_masks"] > 0
                    assert row["identity_fraction"] == pytest.approx(
                        row["identity_detected"] / row["total_masks"]
                    )
                    assert row["sum_fraction"] == pytest.approx(
                        row["sum_detected"] / row["total_masks"]
                    )
                    if row["budget"] == 0:
                        assert row["identity_detected"] == row["sum_detected"] == 0
        for i in range(1, len(THRESHOLDS)):
            for f_low, f_high in zip(
                world["snapshots"][i - 1]["frames"],
                world["snapshots"][i]["frames"],
            ):
                for low, high in zip(f_low["by_budget"], f_high["by_budget"]):
                    assert high["identity_detected"] <= low["identity_detected"]
                    assert high["sum_detected"] <= low["sum_detected"]


def test_positive_and_negative_gear_conditions():
    report = frontier_report()
    worlds = {r["condition"]: r for r in report["worlds"]}
    assert len(worlds) == len(CONDITIONS) == 4
    pos = worlds["coupled_probe"]
    before = pos["snapshots"][0]["frames"][10]
    after = pos["snapshots"][0]["frames"][12]
    assert before["outer_hidden_l1"] > 0
    assert before["global_sum_gap"] == 0
    assert before["by_budget"][6]["identity_detected"] == 1
    assert before["by_budget"][6]["sum_detected"] == 0
    assert after["global_sum_gap"] > 0
    for name in ("no_coupling", "no_conveyor"):
        for threshold in worlds[name]["snapshots"]:
            for frame in threshold["frames"]:
                assert all(row["identity_detected"] == row["sum_detected"] == 0
                           for row in frame["by_budget"])
    no_probe = worlds["no_probe"]["snapshots"][0]["frames"][10]
    assert no_probe["outer_hidden_l1"] > 0
    assert no_probe["global_sum_gap"] == 0


def test_contract_replay_and_provenance():
    report = frontier_report()
    assert report == frontier_report()
    assert len(report["sha256"]) == 64
    assert report["epistemic_origin"] == "SIMULATED"
    assert not report["physical_measurement"]
    assert not report["consciousness_measured"]
    assert not report["agent_data_used"]
    assert not report["action_authorized"]
    assert report["controls"]["identical_state_never_detects"]
    assert report["controls"]["empty_mask_never_detects"]
