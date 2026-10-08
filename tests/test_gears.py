"""Frozen E5 transport, delay, intervention, provenance and controls."""

from copy import deepcopy

import pytest

from phimirrorhex.gears import COUPLINGS, PROBE_GAINS, PROBE_STEP, gear_report


@pytest.mark.parametrize("coupling", COUPLINGS[1:])
@pytest.mark.parametrize("gain", PROBE_GAINS[1:])
def test_witness_has_delayed_transport_and_fixed_probe(coupling, gain):
    report = gear_report(coupling, gain)
    assert report["initial"]["same_coarse_observable"]
    assert report["witness"]["first_outer_hidden_arrival"] == 10
    assert report["witness"]["first_coarse_separation"] == PROBE_STEP
    assert report["witness"]["exists"]
    assert all(frame["coarse_equal"] for frame in report["history"][:PROBE_STEP])
    assert report["history"][PROBE_STEP]["outer_gap"] > 0
    assert report["two_case_prediction"]["outer_after_probe_correct"] == 2


@pytest.mark.parametrize("coupling,gain,enabled", [
    (0, .5, True), (.5, 0, True), (.5, .5, False),
    (0, 0, True), (0, .5, False), (.5, 0, False),
])
def test_negative_controls_refuse_separation(coupling, gain, enabled):
    report = gear_report(coupling, gain, enabled)
    assert report["witness"]["exists"] is False
    assert report["witness"]["first_coarse_separation"] is None
    assert all(frame["coarse_equal"] for frame in report["history"])
    assert report["two_case_prediction"]["outer_after_probe_correct"] == 1


def test_hidden_information_reaches_outer_ring_before_becoming_observable():
    r = gear_report()
    assert r["history"][9]["outer_hidden_distance"] == 0
    assert r["history"][10]["outer_hidden_distance"] > 0
    assert r["history"][10]["outer_gap"] == 0
    assert r["history"][11]["outer_gap"] == 0
    assert r["history"][12]["outer_gap"] > 0
    assert r["history"][12]["probe_applied"]
    assert all(not x["probe_applied"] for i, x in enumerate(r["history"]) if i != 12)


def test_contract_replay_and_information_boundary():
    r = gear_report()
    assert r == gear_report()
    assert len(r["sha256"]) == 64
    assert len(r["history"]) == 24
    assert all(len(frame["state_a"]) == 6 for frame in r["history"])
    assert all(len(row) == 6 for frame in r["history"] for row in frame["state_b"])
    assert r["epistemic_origin"] == "SIMULATED"
    assert r["status"] == "FINITE_SYNTHETIC_TOY_ONLY"
    assert not r["physical_measurement"]
    assert not r["consciousness_measured"]
    assert not r["action_authorized"]
    assert r["two_case_prediction"]["sum_only_initial_correct"] == 1
    assert r["two_case_prediction"]["full_initial_state_correct"] == 2


def test_controls_differ_from_positive_run():
    baseline = gear_report()
    no_probe = gear_report(probe_gain=0)
    no_conveyor = gear_report(conveyor_enabled=False)
    assert baseline["history"] != no_probe["history"]
    assert baseline["history"] != no_conveyor["history"]
    assert baseline["sha256"] != no_probe["sha256"]
    assert baseline["sha256"] != no_conveyor["sha256"]


def test_bad_configuration_rejected():
    for bad in (-1, .1, 1.5, True, float("nan")):
        with pytest.raises(ValueError):
            gear_report(coupling=bad)
        with pytest.raises(ValueError):
            gear_report(probe_gain=bad)
    for bad in (0, 1, "yes", None):
        with pytest.raises(ValueError):
            gear_report(conveyor_enabled=bad)
