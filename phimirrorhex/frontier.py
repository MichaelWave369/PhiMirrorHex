"""E9: exhaustive synthetic six-sector observability frontier.

For each E5 causal-control world, enumerate all 64 masks of six outer-ring
channels, four predeclared detection floors, and all 24 time steps. A restricted
observer may retain signed identities or compress the same selected channels
to one sum. The 'coverage' counts mask subsets in this *constructed pair*,
never probabilities, biological observations, or benchmark accuracy.
"""

from __future__ import annotations

from hashlib import sha256
from math import comb
import json

from .gears import gear_report

SCHEMA = "phimirrorhex.e9.observability-frontier.v1"
THRESHOLDS = (0.0, 0.001, 0.01, 0.05)
DEFAULT_THRESHOLD = 0.01
CONDITIONS = (
    ("coupled_probe", 0.5, 0.5, True),
    ("no_probe", 0.5, 0.0, True),
    ("no_coupling", 0.0, 0.5, True),
    ("no_conveyor", 0.5, 0.5, False),
)
SECTORS = 6
FRAME_COUNT = 24
ALL_MASKS = tuple(range(1 << SECTORS))
READOUTS = ("identity_max", "masked_sum")


def selected_sectors(mask: int) -> tuple[int, ...]:
    if type(mask) is not int or mask < 0 or mask >= 1 << SECTORS:
        raise ValueError("mask must be an integer in [0,63]")
    return tuple(index for index in range(SECTORS) if mask & (1 << index))


def gaps(a: tuple[float, ...], b: tuple[float, ...], mask: int) -> dict:
    """Identity max and aggregated sum inspect exactly the SAME mask."""
    if len(a) != SECTORS or len(b) != SECTORS:
        raise ValueError("expected six sectors per state")
    indices = selected_sectors(mask)
    return {
        "identity_max": max((abs(a[i] - b[i]) for i in indices), default=0.0),
        "masked_sum": abs(sum(a[i] for i in indices) - sum(b[i] for i in indices)),
    }


def _snapshot(frame: dict, threshold: float) -> dict:
    a = tuple(frame["state_a"][-1])
    b = tuple(frame["state_b"][-1])
    by_budget = []
    for count in range(SECTORS + 1):
        masks = [mask for mask in ALL_MASKS if len(selected_sectors(mask)) == count]
        detected = {
            key: [mask for mask in masks if gaps(a, b, mask)[key] > threshold]
            for key in READOUTS
        }
        by_budget.append({
            "budget": count,
            "total_masks": comb(SECTORS, count),
            "identity_detected": len(detected["identity_max"]),
            "sum_detected": len(detected["masked_sum"]),
            "identity_fraction": len(detected["identity_max"]) / len(masks),
            "sum_fraction": len(detected["masked_sum"]) / len(masks),
            "first_identity_mask": detected["identity_max"][0]
                if detected["identity_max"] else None,
            "first_sum_mask": detected["masked_sum"][0]
                if detected["masked_sum"] else None,
        })
    return {
        "step": frame["step"],
        "threshold": threshold,
        "global_sum_gap": abs(sum(a) - sum(b)),
        "outer_hidden_l1": sum(abs(x-y) for x, y in zip(a, b)),
        "by_budget": by_budget,
    }


def _first_detection(history: list[dict], threshold: float, mode: str) -> int | None:
    for frame in history:
        a = tuple(frame["state_a"][-1])
        b = tuple(frame["state_b"][-1])
        if any(gaps(a, b, mask)[mode] > threshold for mask in ALL_MASKS):
            return frame["step"]
    return None


def frontier_report() -> dict:
    worlds = []
    for condition, coupling, gain, enabled in CONDITIONS:
        source = gear_report(coupling=coupling, probe_gain=gain,
                             conveyor_enabled=enabled)
        history = source["history"]
        snapshots = [
            {"threshold": threshold,
             "frames": [_snapshot(frame, threshold) for frame in history]}
            for threshold in THRESHOLDS
        ]
        selected_threshold = DEFAULT_THRESHOLD
        onset = {
            "identity_max": _first_detection(history, selected_threshold, "identity_max"),
            "masked_sum": _first_detection(history, selected_threshold, "masked_sum"),
            "global_sum": next(
                (frame["step"] for frame in history
                 if abs(sum(frame["state_a"][-1]) - sum(frame["state_b"][-1]))
                 > selected_threshold), None),
        }
        a10, b10 = (tuple(history[10][state][-1]) for state in ("state_a", "state_b"))
        a12, b12 = (tuple(history[12][state][-1]) for state in ("state_a", "state_b"))
        worlds.append({
            "condition": condition,
            "coupling": coupling,
            "probe_gain": gain,
            "conveyor_enabled": enabled,
            "e5_sha256": source["sha256"],
            "snapshots": snapshots,
            "first_detection_at_default_threshold": onset,
            "selected_frames": [
                {"step": 10, "a": list(a10), "b": list(b10)},
                {"step": 12, "a": list(a12), "b": list(b12)},
            ],
        })
    payload = {
        "schema": SCHEMA,
        "status": "EXHAUSTIVE_FINITE_SYNTHETIC_MASK_ENUMERATION",
        "epistemic_origin": "SIMULATED",
        "physical_measurement": False,
        "consciousness_measured": False,
        "agent_data_used": False,
        "action_authorized": False,
        "universal_optimality_proven": False,
        "protocol": {
            "sectors": SECTORS, "frames": FRAME_COUNT,
            "all_masks_including_empty": len(ALL_MASKS),
            "thresholds": list(THRESHOLDS),
            "default_threshold": DEFAULT_THRESHOLD,
            "conditions": [row[0] for row in CONDITIONS],
            "readouts": list(READOUTS),
            "identity_max": "max absolute sector gap among selected identities",
            "masked_sum": "absolute difference between sums over identical selected sectors",
            "global_sum": "six-channel aggregate, deliberately different sensor budget",
            "detection_rule": "strictly greater than threshold; no inference or training",
            "mask_fraction": "fraction of enumerated subsets, NOT probability or predictive accuracy",
            "predeclared": True,
            "provenance": "read-only synthetic E5 histories; no NBG external call",
        },
        "worlds": worlds,
        "controls": {
            "empty_mask_never_detects": True,
            "identical_state_never_detects": all(
                gaps(tuple(frame["state_a"][-1]), tuple(frame["state_a"][-1]), mask)
                == {"identity_max": 0.0, "masked_sum": 0.0}
                for frame in gear_report()["history"] for mask in ALL_MASKS
            ),
            "sum_may_cancel_signed_structure": True,
            "mask_identity_is_kept": True,
            "candidate_selection_on_test": False,
        },
    }
    digest = sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"),
                               allow_nan=False).encode()).hexdigest()
    return {**payload, "sha256": digest}
