"""Pure mathematical primitives for Φ-Mirror Hex E1.

The bipyramid's physical edges and the audit graph's logical pairs are
different objects. Phi is a candidate tuning parameter, not a proven optimum.
"""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from itertools import combinations
from math import cos, exp, isfinite, pi, sin, sqrt

PHI = (1.0 + sqrt(5.0)) / 2.0

ABOVE = (
    "hypothesis", "imagination", "reasoning",
    "prediction", "synthesis", "planning",
)
BELOW = (
    "observation", "measurement", "simulation",
    "falsification", "audit", "execution",
)
GATE = "GATE"
FIBONACCI_BUDGETS = (55, 89, 144, 233, 377, 610, 666)

Edge = tuple[str, str]
Point = tuple[float, float, float]
Face = tuple[int, int, int]


@dataclass(frozen=True)
class Bipyramid:
    vertices: tuple[Point, ...]
    edges: tuple[tuple[int, int], ...]
    faces: tuple[Face, ...]


@dataclass(frozen=True)
class AuditGraph:
    channels: tuple[str, ...]
    nodes: tuple[str, ...]
    pairs: tuple[Edge, ...]
    gate_pairs: tuple[Edge, ...]
    peer_pairs: tuple[Edge, ...]


def bipyramid(side: float = 1.0, height_ratio: float = PHI) -> Bipyramid:
    """Hexagonal bipyramid. Apex height is side * height_ratio.

    Golden-ratio height is an optional aesthetic/test parameter, not a
    defining property of the mathematical solid.
    """
    if not isfinite(side) or side <= 0:
        raise ValueError("side must be a finite positive number")
    if not isfinite(height_ratio) or height_ratio <= 0:
        raise ValueError("height_ratio must be a finite positive number")
    ring: tuple[Point, ...] = tuple(
        (side * cos(i * pi / 3.0), side * sin(i * pi / 3.0), 0.0)
        for i in range(6)
    )
    vertices = ring + ((0.0, 0.0, side * height_ratio), (0.0, 0.0, -side * height_ratio))
    faces: tuple[Face, ...] = tuple(
        (6, i, (i + 1) % 6) for i in range(6)
    ) + tuple(
        (7, (i + 1) % 6, i) for i in range(6)
    )
    edges = tuple(sorted({
        tuple(sorted((face[i], face[(i + 1) % 3])))
        for face in faces for i in range(3)
    }))
    return Bipyramid(vertices, edges, faces)


def build_graph() -> AuditGraph:
    """36 cross-plane *channels*, each treated as a logical audit record."""
    channels = tuple(f"U{upper + 1}:L{lower + 1}" for upper in range(6) for lower in range(6))
    nodes = channels + (GATE,)
    gate_pairs = tuple((channel, GATE) for channel in channels)
    peer_pairs = tuple(combinations(channels, 2))
    pairs = peer_pairs + gate_pairs
    assert len(channels) == 36
    assert len(nodes) == 37
    assert len(peer_pairs) == 630
    assert len(gate_pairs) == 36
    assert len(pairs) == 666
    assert len(set(pairs)) == 666
    return AuditGraph(channels, nodes, pairs, gate_pairs, peer_pairs)


def audit_pairs(budget: int, seed: int = 369) -> tuple[Edge, ...]:
    """Deterministic, nested, gate-first pair sampler.

    Uses SHA-256 order as a reproducible random baseline. It does *not*
    currently claim to optimize information, risk, or coherence.
    """
    if type(budget) is not int or budget not in FIBONACCI_BUDGETS:
        raise ValueError(f"budget must be one of {FIBONACCI_BUDGETS}")
    if type(seed) is not int:
        raise ValueError("seed must be an integer")
    graph = build_graph()

    def key(pair: Edge) -> tuple[bytes, Edge]:
        material = f"{seed}|{pair[0]}|{pair[1]}".encode("utf-8")
        return (sha256(material).digest(), pair)

    ranked_peers = tuple(sorted(graph.peer_pairs, key=key))
    return graph.gate_pairs + ranked_peers[:budget - len(graph.gate_pairs)]


def coherence(evidence: float, replay: float, calibration: float,
              contradictions: float, penalty: float = PHI) -> float:
    """Candidate score in [0, 1]; *not* an authority grant.

    C = (E * R * U)^(1/3) * exp(-penalty * D)
    Inputs E, R, U, D are normalized to [0, 1].
    """
    values = (evidence, replay, calibration, contradictions)
    if any(not isfinite(x) or not 0.0 <= x <= 1.0 for x in values):
        raise ValueError("coherence inputs must be finite and in [0,1]")
    if not isfinite(penalty) or penalty < 0:
        raise ValueError("penalty must be finite and nonnegative")
    return (evidence * replay * calibration) ** (1.0 / 3.0) * exp(-penalty * contradictions)
