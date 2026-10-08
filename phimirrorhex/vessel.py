"""E4 Nested Vessel: a finite NBG-style Keyhole separation witness.

This is a mathematical toy, not a model of actual neural states, biological
photons, a soul, or subjective experience. Six layer names are *analogies*.
"""

from __future__ import annotations

from hashlib import sha256
import json

SCHEMA = "phimirrorhex.e4.nested-vessel.v1"
LAYERS = (
    "Environmental coupling",
    "Sensory boundary",
    "Signal encoding",
    "Local feedback loops",
    "Integration proxy",
    "Behavioral expression proxy",
)
RING_SIZES = (1, 2, 3, 5, 8, 13)
SECTORS = 6
GAINS = (0.0, 0.25, 0.5, 1.0)
INITIAL_A = (1, -1, 0, 0, 0, 0)
INITIAL_B = (-1, 1, 0, 0, 0, 0)


def _rotate_right(values: tuple[float, ...]) -> tuple[float, ...]:
    return (values[-1],) + values[:-1]


def _transition(values: tuple[float, ...], layer: int,
                probe_layer: int, gain: float) -> tuple[float, ...]:
    shifted = list(_rotate_right(values))
    if layer == probe_layer:
        # A fixed observer-independent interface rule. The same operation
        # is applied to both states; no access to their hidden identity.
        shifted[layer] *= (1 + gain)
    return tuple(shifted)


def _trajectory(initial: tuple[float, ...], probe_layer: int,
                gain: float) -> tuple[tuple[float, ...], ...]:
    states = [initial]
    for layer in range(1, len(LAYERS)):
        states.append(_transition(states[-1], layer, probe_layer, gain))
    return tuple(states)


def _fingerprint(value: dict) -> str:
    blob = json.dumps(value, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=True, allow_nan=False).encode("utf-8")
    return sha256(blob).hexdigest()


def vessel_report(probe_layer: int = 3, gain: float = 0.5,
                  observer_depth: int = 3) -> dict:
    """Two states identical at P(x)=sum(x) but separable by a fixed gear.

    Initial A = (+1,-1,0,0,0,0); B = (-1,+1,0,0,0,0).
    The interface rotates all six sectors one place to the right at each
    layer. At the selected probe layer (1..5), it amplifies one predetermined
    sector by (1+gain), revealing a difference in the coarse projection.
    Gain zero is a necessary no-separation negative control.
    """
    if type(probe_layer) is not int or not 1 <= probe_layer <= 5:
        raise ValueError("probe_layer must be an integer in [1,5]")
    if type(observer_depth) is not int or not 0 <= observer_depth <= 5:
        raise ValueError("observer_depth must be an integer in [0,5]")
    if type(gain) not in (int, float) or gain not in GAINS:
        raise ValueError(f"gain must be one of {GAINS}")

    a_states = _trajectory(INITIAL_A, probe_layer, gain)
    b_states = _trajectory(INITIAL_B, probe_layer, gain)
    layers: list[dict] = []
    for i, (a, b) in enumerate(zip(a_states, b_states)):
        pa, pb = sum(a), sum(b)
        layers.append({
            "index": i,
            "name": LAYERS[i],
            "radius": RING_SIZES[i],
            "state_a": list(a),
            "state_b": list(b),
            "keyhole_a": pa,
            "keyhole_b": pb,
            "equal_through_keyhole": pa == pb,
            "observable_gap": abs(pa - pb),
            "latent_l1_difference": sum(abs(x - y) for x, y in zip(a, b)),
            "operation": ("INITIAL" if i == 0 else
                          "ROTATE_GAIN" if i == probe_layer else "ROTATE"),
        })
    first_witness = next((entry["index"] for entry in layers
                          if not entry["equal_through_keyhole"]), None)
    selected = layers[observer_depth]
    result = {
        "schema": SCHEMA,
        "status": "DEMONSTRATED_FINITE_TOY_ONLY",
        "concept": "Nested Vessel / NBG Keyhole depth",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False,
        "biometric_data": False,
        "consciousness_measured": False,
        "causal_claim_about_humans": False,
        "action_authorized": False,
        "observer": {"projection": "P(x)=sum(six sectors)",
                     "depth": observer_depth},
        "experiment": {"probe_layer": probe_layer,
                       "gain": float(gain),
                       "transition": "cyclic_right_rotation_then_fixed_sector_gain",
                       "positive_control": gain > 0,
                       "negative_control": gain == 0},
        "initial": {"state_a": list(INITIAL_A), "state_b": list(INITIAL_B),
                    "keyhole_equal": True, "hidden_states_differ": True},
        "layers": layers,
        "selected": {"index": observer_depth, "keyhole_a": selected["keyhole_a"],
                     "keyhole_b": selected["keyhole_b"],
                     "equal_through_keyhole": selected["equal_through_keyhole"],
                     "observable_gap": selected["observable_gap"]},
        "witness": {"exists": first_witness is not None,
                    "first_layer": first_witness,
                    "initial_keyhole_equal": True,
                    "fixed_transition_same_for_both": True},
        "controls": {
            "no_probe_stays_coarse_equal": all(
                sum(x) == sum(y)
                for x, y in zip(_trajectory(INITIAL_A, probe_layer, 0),
                                _trajectory(INITIAL_B, probe_layer, 0))
            ),
            "initial_sum_only_cannot_separate": True,
            "initial_full_state_can_separate": True,
        },
    }
    return {**result, "sha256": _fingerprint(result)}
