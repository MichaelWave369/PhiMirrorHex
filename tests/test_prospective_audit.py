"""E18 fresh-test selection audit: frozen rule, full failures, per-frame parity."""
from phimirrorhex.prospective_audit import (
    STREAMS, _uniform, _noise, _amp, _select, prospective_audit_report
)
from phimirrorhex.consensus_transfer import transfer_consensus_report


def test_selection_only_reuses_e17_and_not_e18():
    old=transfer_consensus_report()
    selection=_select(old)
    r=prospective_audit_report()
    assert r["selection"]==selection
    assert r["summary"]["selected_quorum"]==selection["selected_quorum"]
    assert not selection["selection_uses_e18_sealed_data"]
    assert not selection["selection_is_originally_preregistered_e17_training"]
    assert r["protocol"]["development_reuse_disclosed"]
    assert r["protocol"]["quorum_selected_before_e18_outcomes"]
    assert r["protocol"]["no_threshold_or_quorum_adaptation_on_sealed_set"]
    assert r["members"]==old["members"]
    assert r["summary"]["evaluation_cells"]==36
    assert r["summary"]["frame_cells"]==3456
    assert len({s for _,s,_ in STREAMS})==12
    assert all(s>4000 for _,s,_ in STREAMS)
    assert [p["quorum"] for p in r["policies"]]==[1,2,3]
    assert sum(p["selected_from_e17"] for p in r["policies"])==1


def test_fresh_noise_generator_and_prespecified_noise_shift():
    assert _uniform(4101,17,1)==_uniform(4101,17,1)
    assert _uniform(4101,17,1)!=_uniform(4101,17,2)
    assert _noise(4105,50,"lagged_step")==_noise(4105,50,"lagged_step")
    assert _noise(4105,50,"lagged_step")!=_noise(4106,50,"lagged_step")
    assert _amp("lagged_step",47)==.018
    assert _amp("lagged_step",48)==.054
    assert _amp("burst_null",48)==.054
    assert _amp("burst_null",51)==.054
    assert _amp("burst_null",52)==.018
    assert _amp("lagged_ramp",48)==.018
    assert abs(_amp("lagged_ramp",80)-.054)<1e-12
    a,b=_noise(4109,2,"burst_null")
    assert len(a)==len(b)==6


def test_votes_explicit_refusal_and_one_shot_alarm():
    r=prospective_audit_report()
    for p in r["policies"]:
        for trial in p["trials"]:
            assert len(trial["observations"])==96
            assert trial["attempted"]+trial["abstained"]==96
            assert trial["coverage"]==trial["attempted"]/96
            alerts=[f["step"] for f in trial["observations"] if f["new_alert"]]
            assert len(alerts)<=1
            assert trial["first_alarm_step"]==(alerts[0] if alerts else None)
            for f in trial["observations"]:
                assert f["eligible"]==sum(f["member_available"])
                assert f["votes"]==sum(f["member_votes"])
                assert f["abstained"]==(f["eligible"]<p["quorum"])
                assert all(not v or available for v,available
                           in zip(f["member_votes"],f["member_available"]))
                assert all(gap is None for gap,available
                           in zip(f["member_gaps"],f["member_available"])
                           if not available)
            if trial["persistent_change_detected"]:
                assert trial["first_alarm_step"]>=48
                assert trial["detection_delay"]==trial["first_alarm_step"]-48
            assert not(trial["false_alarm"] and trial["persistent_change_detected"])


def test_all_failures_and_no_promotion():
    r=prospective_audit_report()
    expected=[(p["quorum"],t["family"],t["seed"])
              for p in r["policies"] for t in p["trials"]
              if t["false_alarm"] or t["persistent_change_missed"]
              or t["coverage"]<.75]
    actual=[(f["quorum"],f["family"],f["seed"]) for f in r["failure_ledger"]]
    assert expected==actual
    assert r["summary"]["total_failure_cells"]==len(expected)
    assert r["summary"]["all_failures_retained"]
    selected=next(p for p in r["policies"] if p["selected_from_e17"])
    assert selected["quorum"]==r["summary"]["selected_quorum"]
    assert selected["false_alarm_cells"]==r["summary"]["selected_false_alarm_cells"]
    assert selected["missed_persistent_cells"]==r["summary"]["selected_missed_persistent_cells"]
    assert r["summary"]["deployments_authorized"]==0
    assert r["epistemic_origin"]=="SIMULATED"
    assert not r["physical_measurement"]
    assert not r["consciousness_measured"]
    assert not r["action_authorized"]
    assert not r["phi_optimality_proven"]
    assert not r["protocol"]["independent_physical_witnesses"]
    assert len(r["sha256"])==64
    assert len(r["protocol"]["parent_sha256"])==64
