"""E23: three local claims do not establish independent witness identities."""
import copy
from phimirrorhex.witness import SCHEMA,WITNESSES,audit_witnesses,claim,witness_qualification_report
from phimirrorhex.intake_chain import intake_qualification_report
from phimirrorhex.checkpoint import checkpoint

EXPECTED=[
"AGREEMENT_UNAUTHENTICATED","SPLIT_VIEW_DETECTED","SPLIT_VIEW_DETECTED",
"INCOMPARABLE_COUNTS","INSUFFICIENT_CLAIMS","INVALID_WITNESS_SET",
"INVALID_WITNESS_SET","FORK_DETECTED","ROLLBACK_DETECTED",
"AGREEMENT_UNAUTHENTICATED","AGREEMENT_UNAUTHENTICATED"]

def test_fixed_scenarios_and_replay():
    r=witness_qualification_report()
    assert r["schema"]==SCHEMA
    assert r["origin"]=="SIMULATED"
    assert r["checkpoint_count"]==4
    assert r["witness_labels"]==list(WITNESSES)
    assert not r["authentic_witnesses_present"]
    assert not r["independently_custodied_references_present"]
    assert not r["source_packet_signed"]
    assert [s["verdict"]["status"] for s in r["cases"]]==EXPECTED
    assert r["summary"]=={
      "scenarios":11,"agreement_unauthed":3,"split_views":2,
      "incomparable":1,"insufficient":1,"invalid_sets":2,
      "forks":1,"rollbacks":1,
      "co_rewritten_claims_pass_unauthed":True,
      "post_checkpoint_rewrite_pass_unauthed":True,
      "false_authority_promotions":0,"external_calls":0}
    for case in r["cases"]:
        v=case["verdict"]
        assert v["authority_granted"] is False
        assert v["authenticated_quorum"] is False
        assert v["independent_witnesses_established"] is False
        assert v["trusted_memory_write"] is False
        assert v["source_authenticated"] is False
        assert v["external_calls"]==0
    assert r==witness_qualification_report()

def test_majority_conflict_is_not_authentication():
    r=witness_qualification_report()
    two=r["cases"][1]["verdict"]
    assert two["matching_claims"]==2
    assert two["majority_claims"]==1
    assert two["status"]=="SPLIT_VIEW_DETECTED"
    assert [g["count"] for g in two["claim_groups"]]==[2,1]
    three=r["cases"][2]["verdict"]
    assert three["matching_claims"]==1
    assert three["majority_claims"]==0
    assert len(three["claim_groups"])==3

def test_fake_signing_and_duplicate_names_fail():
    ledger=intake_qualification_report()["ledger"]
    ref=checkpoint(ledger,4)
    base=[claim(w,ref) for w in WITNESSES]
    assert audit_witnesses(ledger,base)["status"]=="AGREEMENT_UNAUTHENTICATED"
    dup=copy.deepcopy(base);dup[2]["witness_id"]="field-a"
    assert audit_witnesses(ledger,dup)["status"]=="INVALID_WITNESS_SET"
    fake=copy.deepcopy(base);fake[0]["independence_verified"]=True
    assert audit_witnesses(ledger,fake)["status"]=="INVALID_WITNESS_SET"
    invalid=copy.deepcopy(base);invalid[0]["checkpoint"]["authority_granted"]=True
    assert audit_witnesses(ledger,invalid)["status"]=="INVALID_WITNESS_SET"
    assert audit_witnesses(ledger,base[:2])["status"]=="INSUFFICIENT_CLAIMS"
    assert audit_witnesses(ledger,None)["status"]=="INVALID_WITNESS_SET"
