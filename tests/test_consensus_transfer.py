"""E17 out-of-family synthetic transfer, no post-hoc quorum selection."""
from phimirrorhex.consensus_transfer import (
    SEEDS, QUORUMS, _noise, _amp, transfer_consensus_report
)
from phimirrorhex.consensus import consensus_report


def test_new_generator_provenance_and_frozen_members():
    r=transfer_consensus_report()
    old=consensus_report()
    assert r["members"]==old["members"]
    assert r["protocol"]["frozen_quorums"]==list(QUORUMS)
    assert r["protocol"]["no_quorum_selected_after_test"]
    assert r["protocol"]["new_streams_disjoint_from_e15"]
    assert not r["protocol"]["pairwise_member_independence"]
    assert len(SEEDS)==12
    assert len({s for _,s,_ in SEEDS})==12
    assert all(s>3000 for _,s,_ in SEEDS)
    assert _noise(3105,4,"correlated_step")==_noise(3105,4,"correlated_step")
    assert _noise(3105,4,"correlated_step")!=_noise(3106,4,"correlated_step")
    assert _amp("correlated_step",47)==0.018
    assert _amp("correlated_step",48)==0.054
    assert _amp("impulse_stationary",50)==0.054
    assert _amp("impulse_stationary",51)==0.018


def test_frame_local_quorum_votes_and_explicit_refusal():
    r=transfer_consensus_report()
    assert r["summary"]["evaluation_cells"]==36
    assert r["summary"]["total_frame_evaluations"]==3456
    assert r["summary"]["sealed_stream_count"]==12
    for policy in r["policies"]:
        q=policy["quorum"]
        assert len(policy["trials"])==12
        assert not policy["decision_authorized"]
        for t in policy["trials"]:
            assert len(t["observations"])==96
            assert t["attempted"]+t["abstained"]==96
            alerts=[f["step"] for f in t["observations"] if f["new_alert"]]
            assert len(alerts)<=1
            assert t["first_alarm_step"]==(alerts[0] if alerts else None)
            for f in t["observations"]:
                assert f["eligible"]==sum(f["member_available"])
                assert f["votes"]==sum(f["member_votes"])
                assert f["abstained"]==(f["eligible"]<q)
                assert all(not v or a for v,a in zip(f["member_votes"],f["member_available"]))
                assert all(x is None for x,a in zip(f["member_gaps"],f["member_available"]) if not a)
                assert not f["new_alert"] or (f["votes"]>=q and not f["abstained"])
            if t["persistent_change_detected"]:
                assert t["first_alarm_step"]>=48
                assert t["detection_delay"]==t["first_alarm_step"]-48
            assert not(t["false_alarm"] and t["persistent_change_detected"])


def test_exhaustive_failure_ledger_and_replay():
    r=transfer_consensus_report()
    actual=[(p["quorum"],t["family"],t["seed"])
            for p in r["policies"] for t in p["trials"]
            if t["false_alarm"] or t["persistent_change_missed"] or t["coverage"]<.75]
    logged=[(x["quorum"],x["family"],x["seed"]) for x in r["failure_ledger"]]
    assert actual==logged
    assert r["summary"]["failure_cells"]==len(logged)
    for p in r["policies"]:
        context=p["legacy_e16_context"]
        assert context["seeds_reused"] is False
        assert 0<=context["e16_coverage_min"]<=1
    assert r["summary"]["deployments_authorized"]==0
    assert r["epistemic_origin"]=="SIMULATED"
    assert not r["physical_measurement"]
    assert not r["consciousness_measured"]
    assert not r["action_authorized"]
    assert not r["phi_optimality_proven"]
    assert len(r["sha256"])==64 and len(r["protocol"]["parent_sha256"])==64
    assert r==transfer_consensus_report()
