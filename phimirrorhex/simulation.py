"""E2 deterministic synthetic channel simulator.

Signals in this module are deliberately synthetic. 'Claim' and 'observation'
are numeric toy streams, not empirical evidence, agent thoughts or model output.
No clock, network, randomness state, filesystem or execution authority.
"""

from __future__ import annotations

from hashlib import sha256
import json
from math import cos, isfinite, sin

from .core import ABOVE, BELOW, FIBONACCI_BUDGETS, PHI, audit_pairs, build_graph, coherence

SCHEMA = "phimirrorhex.e2.series.v1"
ALERT_THRESHOLD = 0.45
ANOMALY_START = 10
ANOMALY_END = 17
ANOMALY_CHANNELS = frozenset({(0, 3), (2, 4), (4, 1)})
MAX_FRAMES = 256


def _clip(value: float) -> float:
    return max(0.0, min(1.0, value))


def _quantize(value: float) -> float:
    return round(value, 6)


def _valid_int(value: int, label: str, *, minimum: int, maximum: int) -> int:
    if type(value) is not int or not minimum <= value <= maximum:
        raise ValueError(f"{label} must be an integer in [{minimum}, {maximum}]")
    return value


def simulate_frame(step: int, seed: int = 369, anomaly: bool = True) -> dict:
    """Pure replayable frame containing all 36 labeled channel measurements."""
    _valid_int(step, "step", minimum=0, maximum=MAX_FRAMES - 1)
    _valid_int(seed, "seed", minimum=0, maximum=2**31 - 1)
    if type(anomaly) is not bool:
        raise ValueError("anomaly must be a bool")
    channels = []
    for upper in range(6):
        for lower in range(6):
            phase = (step + 1) * (0.13 + upper * 0.011) + lower * 0.73 + seed * 0.0001
            claim = _quantize(_clip(0.5 + 0.33 * sin(phase)))
            observation = _clip(claim + 0.07 * cos(step * 0.17 + lower * 0.47 + upper * 0.31))
            injected = (
                anomaly
                and ANOMALY_START <= step <= ANOMALY_END
                and (upper, lower) in ANOMALY_CHANNELS
            )
            if injected:
                observation = 0.0 if claim >= 0.5 else 1.0
            observation = _quantize(observation)
            disagreement = _quantize(abs(claim - observation))
            activity = _quantize((claim + observation) / 2.0)
            channels.append({
                "id": f"U{upper + 1}:L{lower + 1}",
                "upper": ABOVE[upper],
                "lower": BELOW[lower],
                "claim": claim,
                "observation": observation,
                "disagreement": disagreement,
                "activity": activity,
                "flagged": disagreement >= ALERT_THRESHOLD,
                "injected": injected,
            })
    mean_disagreement = _quantize(sum(x["disagreement"] for x in channels) / 36)
    max_disagreement = max(x["disagreement"] for x in channels)
    flagged_count = sum(x["flagged"] for x in channels)
    candidate_score = _quantize(coherence(
        1.0 - mean_disagreement, 1.0, 1.0, max_disagreement, penalty=PHI
    ))
    return {
        "step": step,
        "channels": channels,
        "gate": {
            "flagged_count": flagged_count,
            "mean_disagreement": mean_disagreement,
            "max_disagreement": max_disagreement,
            "candidate_score": candidate_score,
            "alert": flagged_count > 0,
        },
    }


def canonical_bytes(payload: dict) -> bytes:
    return json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True,
        allow_nan=False,
    ).encode("utf-8")


def digest(payload: dict) -> str:
    return sha256(canonical_bytes(payload)).hexdigest()


def simulate_series(steps: int = 24, seed: int = 369, anomaly: bool = True) -> dict:
    """Deterministic immutable-by-convention JSON-compatible series with receipt."""
    _valid_int(steps, "steps", minimum=1, maximum=MAX_FRAMES)
    _valid_int(seed, "seed", minimum=0, maximum=2**31 - 1)
    if type(anomaly) is not bool:
        raise ValueError("anomaly must be a bool")
    graph = build_graph()
    payload = {
        "schema": SCHEMA,
        "status": "synthetic_demonstration_only",
        "seed": seed,
        "steps": steps,
        "anomaly_enabled": anomaly,
        "synthetic_only": True,
        "authority_granted": False,
        "network_actions": [],
        "topology": {
            "cross_plane_channels": len(graph.channels),
            "audit_nodes": len(graph.nodes),
            "audit_pairs": len(graph.pairs),
            "mandatory_gate_pairs": len(graph.gate_pairs),
            "fibonacci_budgets": list(FIBONACCI_BUDGETS),
            "ring_sizes": [1, 2, 3, 5, 8, 13],
            "ring_size_semantics": "six nested six-point orbit radii; not physical lengths",
        },
        "audit_peer_order": [
            [graph.channels.index(left), graph.channels.index(right)]
            for left, right in audit_pairs(666, seed)[36:]
        ],
        "frames": [simulate_frame(step, seed, anomaly) for step in range(steps)],
    }
    return {**payload, "sha256": digest(payload)}


def verify_series(series: dict) -> bool:
    """Checks integrity and basic contract shape. SHA-256 is *not* a signature."""
    if not isinstance(series, dict):
        return False
    payload = {k: v for k, v in series.items() if k != "sha256"}
    try:
        return (
            series.get("schema") == SCHEMA
            and series.get("synthetic_only") is True
            and series.get("authority_granted") is False
            and series.get("network_actions") == []
            and type(series.get("seed")) is int
            and type(series.get("steps")) is int
            and 1 <= series["steps"] <= MAX_FRAMES
            and type(series.get("anomaly_enabled")) is bool
            and isinstance(series.get("frames"), list)
            and len(series["frames"]) == series["steps"]
            and isinstance(series.get("sha256"), str)
            and series["sha256"] == digest(payload)
        )
    except (TypeError, ValueError, OverflowError):
        return False
