"""E12 sealed population checks, robust mask selection, failure ledger."""
from phimirrorhex.transfer import (
    DEVELOPMENT_SEEDS, PROSPECTIVE_SEEDS, TRANSFER_CONDITIONS,
    _chosen_mask, _populations, transfer_report,
)
from phimirrorhex.generalization import generalization_report
from phimirrorhex.frontier import selected_sectors


def test_train_only_selection_and_unchanged_budget():
    report = transfer_report()
    reference = generalization_report()
    development = _populations(DEVELOPMENT_SEEDS)
    assert report["policy_count"] == 14
    assert report["protocol"]["selection_sees_validation"] is False
    assert report["protocol"]["selection_sees_prospective_test"] is False
    for policy, e10 in zip(report["policies"], reference["policies"]):
        k, readout = policy["budget"], policy["readout"]
        selector = _chosen_mask(development, k, readout)
        assert policy["selection_receipt"] == selector
        assert policy["masks"]["robust"] == selector["mask"]
        assert policy["masks"]["e10"] == e10["train_selected_mask"]
        assert policy["masks"]["first_k"] == e10["fixed_first_k_mask"]
        assert all(len(selected_sectors(m)) == k
                   for m in policy["masks"].values())
        assert len(policy["validation"]) == 2
        assert len(policy["prospective_trials"]) == 20


def test_population_and_stratification_and_controls():
    r = transfer_report()
    assert r["summary"]["comparison_cells"] == 280
    assert r["summary"]["prospective_pairs"] == 240
    assert r["summary"]["no_coupling_blind"]
    assert r["summary"]["zero_budget_blind"]
    for p in r["policies"]:
        for trial in p["prospective_trials"]:
            assert trial["seed"] in PROSPECTIVE_SEEDS
            assert trial["total"] == 48
            for key in ("robust", "e10", "first_k"):
                assert trial["sparse_counts"][key] + trial["dense_counts"][key] == trial["counts"][key]
                assert 0 <= trial["counts"][key] <= 48
        for scenario in TRANSFER_CONDITIONS:
            entry = p["summary"][scenario]
            expected = all(not trial["lost_to_any_baseline"]
                           for trial in p["prospective_trials"]
                           if trial["scenario"] == scenario)
            assert (entry["losses_to_any_baseline"] == 0) == expected
        gate = all(p["summary"][s]["losses_to_any_baseline"] == 0
                   for s in TRANSFER_CONDITIONS)
        assert p["descriptive_transfer_gate"] == (
            "PASS_IN_THIS_TOY" if gate else "FAIL_IN_THIS_TOY"
        )
        assert p["gate_is_deployment_authority"] is False


def test_failure_ledger_complete_and_source_provenance():
    r = transfer_report()
    assert r == transfer_report()
    actual = [(p, t) for p in r["policies"]
              for t in p["prospective_trials"] if t["lost_to_any_baseline"]]
    assert len(actual) == len(r["failure_ledger"]) == r["summary"]["failure_cells"]
    assert r["summary"]["deployment_promotions"] == 0
    assert r["protocol"]["gate_is_descriptive_not_authority"]
    assert r["epistemic_origin"] == "SIMULATED"
    assert not r["action_authorized"]
    assert not r["physical_measurement"]
    assert not r["consciousness_measured"]
    assert not r["phi_optimality_proven"]
    assert len(r["sha256"]) == 64
    assert len(r["protocol"]["parent_sha256"]) == 64
