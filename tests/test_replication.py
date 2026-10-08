"""E11: frozen replication policies, stratification and honest failures."""
import pytest

from phimirrorhex.replication import REPLICATION_SEEDS, replication_report
from phimirrorhex.generalization import generalization_report


def test_all_masks_are_frozen_and_no_coupling_stays_blind():
    r=replication_report()
    src=generalization_report()
    assert r["policy_count"]==14
    assert r["protocol"]["replication_test_used_for_selection"] is False
    assert r["summary"]["every_coupling_off_cell_blind"]
    assert r["summary"]["empty_mask_never_detects"]
    assert len(r["replicates"])==len(REPLICATION_SEEDS)==5
    assert len(r["aggregate"])==14*4
    for replicate in r["replicates"]:
        assert len(replicate["scores"])==56
        assert replicate["family_counts"]=={"sparse":24,"dense":24}
        for row in replicate["scores"]:
            p=next(p for p in src["policies"]
                   if p["budget"]==row["budget"] and p["readout"]==row["readout"])
            assert row["mask"]==p["train_selected_mask"]
            assert row["baseline_mask"]==p["fixed_first_k_mask"]
            assert sum(s["cases"] for s in row["strata"].values())==48
            assert sum(s["selected_detected"] for s in row["strata"].values())==row["selected_detected"]
            assert sum(s["fixed_detected"] for s in row["strata"].values())==row["fixed_detected"]


def test_finite_ranges_and_failure_ledger_match_every_cell():
    r=replication_report()
    failing=[(rep["seed"],score) for rep in r["replicates"]
             for score in rep["scores"] if score["delta_count"]<0]
    assert len(failing)==len(r["failure_ledger"])==r["summary"]["failure_cells"]
    for a in r["aggregate"]:
        assert 0<=a["selected_min_rate"]<=a["selected_mean_rate"]<=a["selected_max_rate"]<=1
        assert a["wins"]+a["losses"]+a["ties"]==5
        assert len(a["selected_counts"])==5
        assert a["worst_delta_count"]==min(a["delta_counts"])
    for fail in r["failure_ledger"]:
        assert fail["shortfall"]>0
        assert fail["fixed_detected"]>fail["selected_detected"]


def test_replay_origin_and_claim_firewall():
    a=replication_report()
    assert a==replication_report()
    assert len(a["sha256"])==64
    assert len(a["protocol"]["training_policy_digest"])==64
    assert a["epistemic_origin"]=="SIMULATED"
    assert a["status"]=="FINITE_SYNTHETIC_REPLICATION_AND_FAILURE_LEDGER"
    assert not a["physical_measurement"]
    assert not a["consciousness_measured"]
    assert not a["action_authorized"]
    assert not a["phi_optimality_proven"]
