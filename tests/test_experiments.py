"""Toy causal controls and deterministic report invariants."""

from phimirrorhex.experiments import causal_memory_controls, experiment_report


def test_cancellation_controls_have_explicit_failure_baselines():
    result = causal_memory_controls()
    assert result["aggregates"] == [0, 0]
    assert result["case_count"] == 2
    assert result["sum_only_correct"] == 1
    assert result["identity_preserving_correct"] == 2
    assert result["swapped_identity_correct"] == 0


def test_report_stable_and_non_authorizing():
    r = experiment_report(144, 369)
    assert r == experiment_report(144, 369)
    assert r["audit"]["selected_pairs"] == 144
    assert r["audit"]["mandatory_gate_pairs"] == 36
    assert r["audit"]["total_possible_pairs"] == 666
    assert len(r["audit"]["sha256"]) == 64
    assert not r["authority_granted"]
    assert r["geometry"] == {"vertices": 8, "edges": 18, "faces": 12}


def test_report_fingerprint_depends_on_selected_pairs():
    assert experiment_report(55, 369)["audit"]["sha256"] != experiment_report(89, 369)["audit"]["sha256"]
    assert experiment_report(55, 369)["audit"]["sha256"] != experiment_report(55, 370)["audit"]["sha256"]
