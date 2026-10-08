"""E4 frozen Keyhole-depth and NBG claim firewall contracts."""

import pytest

from phimirrorhex.vessel import GAINS, vessel_report


@pytest.mark.parametrize("probe_layer", [1, 2, 3, 4, 5])
@pytest.mark.parametrize("gain", [0.25, 0.5, 1.0])
def test_admissible_probe_creates_delayed_witness(probe_layer, gain):
    report = vessel_report(probe_layer, gain, probe_layer)
    assert report["initial"]["keyhole_equal"]
    assert report["initial"]["hidden_states_differ"]
    assert report["witness"] == {
        "exists": True,
        "first_layer": probe_layer,
        "initial_keyhole_equal": True,
        "fixed_transition_same_for_both": True,
    }
    assert all(row["equal_through_keyhole"]
               for row in report["layers"][:probe_layer])
    assert all(not row["equal_through_keyhole"]
               for row in report["layers"][probe_layer:])
    assert report["selected"]["observable_gap"] == pytest.approx(2 * gain)


@pytest.mark.parametrize("probe_layer", [1, 3, 5])
def test_no_probe_is_complete_negative_control(probe_layer):
    report = vessel_report(probe_layer, 0, 5)
    assert report["witness"]["exists"] is False
    assert report["witness"]["first_layer"] is None
    assert all(row["equal_through_keyhole"] for row in report["layers"])
    assert all(row["latent_l1_difference"] > 0 for row in report["layers"])
    assert report["controls"]["no_probe_stays_coarse_equal"]


def test_report_is_replay_exact_and_origin_never_promoted():
    a = vessel_report()
    b = vessel_report()
    assert a == b
    assert len(a["sha256"]) == 64
    assert len(a["layers"]) == 6
    assert all(len(row["state_a"]) == 6 and len(row["state_b"]) == 6
               for row in a["layers"])
    assert a["epistemic_origin"] == "SIMULATED"
    assert not a["physical_measurement"]
    assert not a["biometric_data"]
    assert not a["consciousness_measured"]
    assert not a["causal_claim_about_humans"]
    assert not a["action_authorized"]


def test_keyhole_depth_updates_view_without_changing_underlying_trajectory():
    a = vessel_report(observer_depth=0)
    b = vessel_report(observer_depth=5)
    assert a["layers"] == b["layers"]
    assert a["selected"]["equal_through_keyhole"] is True
    assert b["selected"]["equal_through_keyhole"] is False


def test_invalid_inputs_fail_closed():
    for bad in (-1, 0, 6, True, 2.5):
        with pytest.raises(ValueError):
            vessel_report(probe_layer=bad)
    for bad in (-1, 6, False, 2.2):
        with pytest.raises(ValueError):
            vessel_report(observer_depth=bad)
    for bad in (-1, 0.1, 2, True, float("nan")):
        with pytest.raises(ValueError):
            vessel_report(gain=bad)
