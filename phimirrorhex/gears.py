"""E5 Nested Gear Coupling: finite synthetic delayed-conveyor witness.

Six coupled six-sector rings carry two counterposed initial states through
direction-dependent rotations and a one-step memory buffer (the conveyor).
The observable is deliberately the *outer ring sum*, not complete state.
An identical fixed-sector gain probes both trajectories at step 12.

All coefficients are binary fractions so Python/JS replay is exact.
No biology, sensor data, autonomous systems or evidence of consciousness.
"""

from __future__ import annotations

from hashlib import sha256
import json

SCHEMA = "phimirrorhex.e5.gear-coupling.v1"
LAYERS = (
    "Environmental coupling", "Sensory boundary", "Signal encoding",
    "Local feedback loops", "Integration proxy", "Behavioral expression proxy"
)
RADII = (1, 2, 3, 5, 8, 13)
COUPLINGS = (0.0, 0.25, 0.5, 1.0)
PROBE_GAINS = (0.0, 0.25, 0.5, 1.0)
RINGS = 6
SECTORS = 6
FRAMES = 24
PROBE_STEP = 12
PROBE_RING = 5
PROBE_SECTOR = 0
RETENTION = 0.5


def _empty() -> tuple[tuple[float, ...], ...]:
    return tuple(tuple(0.0 for _ in range(SECTORS)) for _ in range(RINGS))


def _initial(sign: int) -> tuple[tuple[float, ...], ...]:
    return ((float(sign), float(-sign), 0.0, 0.0, 0.0, 0.0),) + _empty()[1:]


def _advance(
    state: tuple[tuple[float, ...], ...],
    conveyor: tuple[tuple[float, ...], ...],
    coupling: float, probe_gain: float, next_step: int,
    conveyor_enabled: bool,
) -> tuple[tuple[tuple[float, ...], ...], tuple[tuple[float, ...], ...]]:
    future = []
    for ring in range(RINGS):
        values = state[ring]
        rotated = (values[-1],) + values[:-1] if ring % 2 == 0 else values[1:] + (values[0],)
        future.append(tuple(
            RETENTION * rotated[sector] +
            (coupling * conveyor[ring][sector] if conveyor_enabled else 0.0)
            for sector in range(SECTORS)
        ))
    if next_step == PROBE_STEP and probe_gain > 0:
        modified = list(future[PROBE_RING])
        modified[PROBE_SECTOR] *= 1.0 + probe_gain
        future[PROBE_RING] = tuple(modified)
    next_conveyor = tuple(
        state[ring - 1] if conveyor_enabled and ring > 0 else (0.0,) * SECTORS
        for ring in range(RINGS)
    )
    return tuple(future), next_conveyor


def _sum_ring(ring: tuple[float, ...]) -> float:
    return sum(ring)


def _l1(a: tuple[tuple[float, ...], ...], b: tuple[tuple[float, ...], ...]) -> float:
    return sum(abs(x - y) for ra, rb in zip(a, b) for x, y in zip(ra, rb))


def _fingerprint(result: dict) -> str:
    source = json.dumps(result, sort_keys=True, separators=(",", ":"),
                        ensure_ascii=True, allow_nan=False).encode("utf-8")
    return sha256(source).hexdigest()


def gear_report(coupling: float = 0.5, probe_gain: float = 0.5,
                conveyor_enabled: bool = True) -> dict:
    """Exactly 24 frames of six-layer delayed transport and identity-aware audit."""
    if type(coupling) not in (int, float) or coupling not in COUPLINGS:
        raise ValueError(f"coupling must be one of {COUPLINGS}")
    if type(probe_gain) not in (int, float) or probe_gain not in PROBE_GAINS:
        raise ValueError(f"probe_gain must be one of {PROBE_GAINS}")
    if type(conveyor_enabled) is not bool:
        raise ValueError("conveyor_enabled must be bool")
    coupling, probe_gain = float(coupling), float(probe_gain)
    state_a, state_b = _initial(1), _initial(-1)
    conveyor_a, conveyor_b = _empty(), _empty()
    history = []
    for step in range(FRAMES):
        outer_a, outer_b = _sum_ring(state_a[-1]), _sum_ring(state_b[-1])
        history.append({
            "step": step,
            "state_a": [list(row) for row in state_a],
            "state_b": [list(row) for row in state_b],
            "conveyor_a": [list(row) for row in conveyor_a],
            "conveyor_b": [list(row) for row in conveyor_b],
            "outer_a": outer_a,
            "outer_b": outer_b,
            "outer_gap": abs(outer_a - outer_b),
            "coarse_equal": outer_a == outer_b,
            "outer_hidden_distance": sum(abs(x - y) for x, y in zip(state_a[-1], state_b[-1])),
            "full_state_distance": _l1(state_a, state_b),
            "conveyor_distance": _l1(conveyor_a, conveyor_b),
            "probe_applied": step == PROBE_STEP and probe_gain > 0,
        })
        if step < FRAMES - 1:
            state_a, conveyor_a = _advance(
                state_a, conveyor_a, coupling, probe_gain, step + 1, conveyor_enabled
            )
            state_b, conveyor_b = _advance(
                state_b, conveyor_b, coupling, probe_gain, step + 1, conveyor_enabled
            )

    first_arrival = next(
        (frame["step"] for frame in history if frame["outer_hidden_distance"] > 0),
        None
    )
    first_separation = next(
        (frame["step"] for frame in history if not frame["coarse_equal"]),
        None
    )
    has_witness = first_separation is not None
    result = {
        "schema": SCHEMA,
        "status": "FINITE_SYNTHETIC_TOY_ONLY",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False,
        "human_data": False,
        "consciousness_measured": False,
        "action_authorized": False,
        "configuration": {
            "coupling": coupling,
            "probe_gain": probe_gain,
            "conveyor_enabled": conveyor_enabled,
            "ring_count": RINGS,
            "sector_count": SECTORS,
            "frames": FRAMES,
            "retention": RETENTION,
            "probe_step": PROBE_STEP,
            "probe_ring": PROBE_RING,
            "probe_sector": PROBE_SECTOR,
            "ring_radii": list(RADII),
            "layer_labels": list(LAYERS),
            "keyhole": "sum(outer ring sector values)",
            "interface": "alternating_sector_rotation_then_delayed_conveyor_transfer",
        },
        "initial": {
            "state_a_ring_0": list(_initial(1)[0]),
            "state_b_ring_0": list(_initial(-1)[0]),
            "same_coarse_observable": True,
        },
        "history": history,
        "witness": {
            "first_outer_hidden_arrival": first_arrival,
            "first_coarse_separation": first_separation,
            "exists": has_witness,
            "gate_kept_closed": not has_witness,
        },
        "controls": {
            "no_coupling": coupling == 0,
            "no_probe": probe_gain == 0,
            "conveyor_disabled": not conveyor_enabled,
            "identity_preserved": True,
            "observation_only": True,
        },
        "two_case_prediction": {
            "task": "recover the sign of initial sector zero of ring zero for balanced A/B",
            "sum_only_initial_correct": 1,
            "full_initial_state_correct": 2,
            "outer_after_probe_correct": 2 if has_witness else 1,
            "cases": 2,
            "note": "Constructed, balanced two-case sanity check; no held-out predictive claim.",
        },
    }
    return {**result, "sha256": _fingerprint(result)}
