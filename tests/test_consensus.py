"""E16 correlated witness quorum, abstention, loss ledger and claim controls."""
from phimirrorhex.consensus import MEMBERS, QUORUMS, _mask_jaccard, consensus_report
from phimirrorhex.sequential import sequential_report


def test_frozen_individual_limits_and_explicit_overlap():
    result = consensus_report()
    parent = sequential_report()
    assert len(result["members"]) == 3
    for member, (k, mode) in zip(result["members"], MEMBERS):
        old = next(p for p in parent["policies"]
                   if p["budget"] == k and p["readout"] == mode)
        assert member["mask"] == old["frozen_mask"]
        assert member["alert_limit"] == old["sequential_alert_limit"]
        assert member["floor"] == old["frozen_e13_floor"]
    assert len(result["overlap_diagnostics"]) == 3
    assert len(result["co_vote_diagnostics"]) == 3
    for overlap in result["overlap_diagnostics"]:
        assert 0 <= overlap["jaccard"] <= 1
    assert not result["protocol"]["witness_independence_assumed"]
    assert result["protocol"]["same_noise_realization_shared_by_all_members"]
    assert _mask_jaccard(3, 6)["intersection"] == 1


def test_quorum_is_frame_local_refusal_and_single_shot():
    report = consensus_report()
    assert report["summary"]["evaluation_cells"] == 24
    for policy, q in zip(report["policies"], QUORUMS):
        for trial in policy["trials"]:
            assert trial["attempted"] + trial["abstained"] == 96
            assert len(trial["observations"]) == 96
            alerts = [f["step"] for f in trial["observations"] if f["new_alert"]]
            assert len(alerts) <= 1
            assert trial["first_alarm_step"] == (alerts[0] if alerts else None)
            for frame in trial["observations"]:
                assert frame["eligible"] == sum(frame["member_available"])
                assert frame["votes"] == sum(frame["member_votes"])
                assert all(not vote or available
                           for vote, available in zip(
                               frame["member_votes"], frame["member_available"]))
                assert frame["abstained"] == (frame["eligible"] < q)
                assert not frame["new_alert"] or (
                    frame["votes"] >= q and not frame["abstained"])
            if trial["persistent_change_detected"]:
                assert trial["detection_delay"] is not None
                assert trial["first_alarm_step"] >= 48
            assert not (trial["false_alarm"] and
                        trial["persistent_change_detected"])
    # More restrictive voting cannot increase frame-local eligibility.
    for lo, hi in ((0, 1), (1, 2)):
        for a, b in zip(report["policies"][lo]["trials"],
                        report["policies"][hi]["trials"]):
            assert b["attempted"] <= a["attempted"]


def test_failure_receipts_complete_and_non_authorizing():
    r = consensus_report()
    expected = [
        (p["quorum"], t["regime"], t["seed"])
        for p in r["policies"] for t in p["trials"]
        if t["false_alarm"] or t["persistent_change_missed"] or
        t["coverage"] < .75
    ]
    actual = [
        (f["quorum"], f["regime"], f["seed"])
        for f in r["failure_ledger"]
    ]
    assert expected == actual
    assert len(actual) == r["summary"]["failure_cells"]
    assert r["summary"]["deployments_authorized"] == 0
    assert r["epistemic_origin"] == "SIMULATED"
    assert not r["physical_measurement"]
    assert not r["consciousness_measured"]
    assert not r["action_authorized"]
    assert not r["phi_optimality_proven"]
    assert not r["protocol"]["calibration_sees_sealed_data"]
    assert len(r["sha256"]) == 64
    assert len(r["protocol"]["parent_sha256"]) == 64
    assert r == consensus_report()
