"""E10: independently sampled synthetic hidden-state pairs, causal holdouts.

An exhaustive masked-observer policy is *selected only on training episodes*.
Performance is then reported on validation, new held-out episodes, unseen
source structure and an intervention-site shift with no retuning. This tests
generalization within a frozen toy, not in people, physics or real agents.
"""

from __future__ import annotations

from hashlib import sha256
import json

from .frontier import ALL_MASKS, gaps, selected_sectors

SCHEMA = "phimirrorhex.e10.generalization.v1"
SECTORS = 6
RINGS = 6
HORIZON = 12
PROBE_STEP = 12
FLOOR = 0.01
COUPLING = 0.5
PROBE_GAIN = 0.5
RETENTION = 0.5
TRAIN_SEED = 901
VALIDATION_SEED = 902
TEST_SEED = 903
TRAIN_N = 48
VALIDATION_N = 24
TEST_N = 48
MODES = ("identity_max", "masked_sum")
SCENARIOS = ("matched_probe", "shifted_probe", "no_probe", "no_coupling")
MASK_COUNTS = (1, 6, 15, 20, 15, 6, 1)
MASK = 0xFFFFFFFF


def _next(state: int) -> int:
    state ^= (state << 13) & MASK
    state ^= state >> 17
    state ^= (state << 5) & MASK
    return state & MASK


def _pair(seed: int, index: int, family: str) -> tuple[float, ...]:
    """Independent counter-based draws. Dense pairs occur only at test time."""
    if type(seed) is not int or not 0 <= seed <= 2**31-1:
        raise ValueError("invalid seed")
    if type(index) is not int or index < 0 or index >= 100000:
        raise ValueError("invalid episode index")
    if family not in ("sparse", "dense"):
        raise ValueError("unknown source family")
    state = (seed ^ (((index + 1) * 0x9E3779B9) & MASK)
             ^ (((seed + 1) * 0x85EBCA6B) & MASK)) & MASK
    if state == 0:
        state = 0x6D2B79F5
    draws = []
    for _ in range(8):
        state = _next(state)
        draws.append(state)
    if family == "sparse":
        a = draws[0] % SECTORS
        b = (a + 1 + draws[1] % 5) % SECTORS
        strength = 0.5 * (1 + draws[2] % 4)
        output = [0.0] * SECTORS
        output[a], output[b] = strength, -strength
        return tuple(output)
    values = [float(int(d % 7) - 3) for d in draws[:SECTORS]]
    average = sum(values) / SECTORS
    result = tuple((v-average) * 0.5 for v in values)
    if not any(result):
        return (1.0, -1.0, 0.0, 0.0, 0.0, 0.0)
    return result


def _zero() -> list[list[float]]:
    return [[0.0] * SECTORS for _ in range(RINGS)]


def _outer(initial: tuple[float, ...], *,
           coupling: float = COUPLING, probe_sector: int = 0,
           gain: float = PROBE_GAIN) -> tuple[float, ...]:
    """E5-style alternating gear rotation + one-step conveyor; fixed horizon."""
    if type(probe_sector) is not int or not 0 <= probe_sector < SECTORS:
        raise ValueError("invalid probe sector")
    state, conveyor = _zero(), _zero()
    state[0] = list(initial)
    for next_step in range(1, HORIZON + 1):
        future = _zero()
        for ring in range(RINGS):
            values = state[ring]
            rotated = [values[-1], *values[:-1]] if ring % 2 == 0 else [*values[1:], values[0]]
            for sector in range(SECTORS):
                future[ring][sector] = RETENTION * rotated[sector] + coupling * conveyor[ring][sector]
        next_conveyor = _zero()
        for ring in range(1, RINGS):
            next_conveyor[ring] = state[ring-1][:]
        if next_step == PROBE_STEP:
            future[RINGS-1][probe_sector] *= 1.0 + gain
        state, conveyor = future, next_conveyor
    return tuple(state[-1])


def _episode(seed: int, index: int, family: str) -> dict:
    initial = _pair(seed, index, family)
    opposite = tuple(-v for v in initial)
    a0 = _outer(initial)
    b0 = _outer(opposite)
    a3 = _outer(initial, probe_sector=3)
    b3 = _outer(opposite, probe_sector=3)
    an = _outer(initial, gain=0)
    bn = _outer(opposite, gain=0)
    ac = _outer(initial, coupling=0)
    bc = _outer(opposite, coupling=0)
    return {
        "id": f"{seed}-{index:03d}",
        "family": family,
        "initial": list(initial),
        "worlds": {
            "matched_probe": (a0, b0),
            "shifted_probe": (a3, b3),
            "no_probe": (an, bn),
            "no_coupling": (ac, bc),
        },
    }


def _data(seed: int, count: int, test: bool) -> list[dict]:
    return [_episode(seed, index, "dense" if test and index % 2 else "sparse")
            for index in range(count)]


def _count(rows: list[dict], mask: int, mode: str, scenario: str) -> int:
    return sum(gaps(*row["worlds"][scenario], mask)[mode] > FLOOR for row in rows)


def _policy(rows: list[dict], budget: int, mode: str) -> tuple[int, int]:
    """Frozen train-only maximizer, tie break to smallest numeric mask."""
    options = [mask for mask in ALL_MASKS if len(selected_sectors(mask)) == budget]
    if not options:
        raise ValueError("empty mask budget")
    scored = [(_count(rows, mask, mode, "matched_probe"), mask) for mask in options]
    winner = min(scored, key=lambda item: (-item[0], item[1]))
    return winner[1], winner[0]


def generalization_report() -> dict:
    train = _data(TRAIN_SEED, TRAIN_N, False)
    validation = _data(VALIDATION_SEED, VALIDATION_N, False)
    holdout = _data(TEST_SEED, TEST_N, True)
    policies = []
    for budget in range(SECTORS + 1):
        for mode in MODES:
            selected, correct_train = _policy(train, budget, mode)
            fixed = (1 << budget) - 1
            counts = {
                scenario: _count(holdout, selected, mode, scenario)
                for scenario in SCENARIOS
            }
            policies.append({
                "budget": budget, "readout": mode,
                "train_selected_mask": selected,
                "train_detected": correct_train,
                "train_total": TRAIN_N,
                "validation_detected": _count(validation, selected, mode, "matched_probe"),
                "validation_total": VALIDATION_N,
                "heldout_detected": counts,
                "heldout_total": TEST_N,
                "fixed_first_k_mask": fixed,
                "fixed_first_k_heldout": {
                    scenario: _count(holdout, fixed, mode, scenario)
                    for scenario in SCENARIOS
                },
                "posthoc_best_test_count_diagnostic_only": max(
                    _count(holdout, mask, mode, "matched_probe")
                    for mask in ALL_MASKS
                    if len(selected_sectors(mask)) == budget
                ),
                "sensor_readings": budget,
                "selection_split": "train_only",
                "reoptimized_on_test": False,
            })
    examples = []
    for i in range(6):
        row = holdout[i]
        examples.append({
            "id": row["id"], "family": row["family"],
            "initial": row["initial"],
            "outer_by_scenario": {
                name: {"a": list(pair[0]), "b": list(pair[1]),
                       "global_sum_gap": abs(sum(pair[0])-sum(pair[1]))}
                for name, pair in row["worlds"].items()
            },
        })
    report = {
        "schema": SCHEMA,
        "status": "SYNTHETIC_HELDOUT_CAUSAL_GENERALIZATION_TOY",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False,
        "consciousness_measured": False,
        "action_authorized": False,
        "phi_optimality_proven": False,
        "protocol": {
            "train_seed": TRAIN_SEED, "validation_seed": VALIDATION_SEED,
            "holdout_seed": TEST_SEED,
            "train_count": TRAIN_N, "validation_count": VALIDATION_N,
            "holdout_count": TEST_N,
            "heldout_families": ["sparse", "dense"],
            "train_families": ["sparse"],
            "holdout_dense_count": TEST_N // 2,
            "readout_floor": FLOOR, "horizon": HORIZON,
            "same_mask_same_budget": True,
            "masks_total": len(ALL_MASKS),
            "selection_rule": "max training matched-probe detection, smallest-mask tie-break",
            "matched_probe_sector": 0, "shifted_probe_sector": 3,
            "intervention_at_step": PROBE_STEP,
            "coupling": COUPLING, "probe_gain": PROBE_GAIN,
            "retention": RETENTION,
            "negative_controls": ["no_probe", "no_coupling"],
            "sources_are_generated_not_empirical": True,
            "heldout_used_for_selection": False,
            "validation_used_for_selection": False,
            "posthoc_diagnostic_never_selected": True,
            "no_conveyor_modification": "not tested separately: see E5/E9",
            "claim_boundary": "held-out toy episodes; no real causal generalization claim",
        },
        "policies": policies,
        "heldout_examples": examples,
        "controls": {
            "full_mask_readings": 6,
            "empty_mask_always_blind": all(
                p["heldout_detected"]["matched_probe"] == 0 for p in policies
                if p["budget"] == 0
            ),
            "no_coupling_always_blind": all(
                p["heldout_detected"]["no_coupling"] == 0 for p in policies
            ),
            "no_probe_can_still_separate_partial_sums": any(
                p["readout"] == "masked_sum" and p["heldout_detected"]["no_probe"] > 0
                for p in policies
            ),
        },
    }
    digest = sha256(json.dumps(report, sort_keys=True, separators=(",", ":"),
                               allow_nan=False).encode()).hexdigest()
    return {**report, "sha256": digest}
