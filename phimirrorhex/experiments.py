"""Frozen, transparent E1 demo measurements and toy negative controls."""

from __future__ import annotations

from hashlib import sha256
import json

from .core import ABOVE, BELOW, FIBONACCI_BUDGETS, PHI, audit_pairs, bipyramid, build_graph, coherence


def causal_memory_controls() -> dict:
    """Two balanced cancellation cases.

    An aggregate of zero cannot distinguish the two cases. Storing labeled
    channels can. Swapping identities is a negative control. These are toy
    diagnostics, not empirical claims about real agent memory.
    """
    cases = ((+1, -1), (-1, +1))
    correct = lambda predictions: sum(
        int(prediction == channel_one)
        for prediction, (channel_one, _) in zip(predictions, cases)
    )
    aggregate_only = tuple(+1 for _ in cases)
    channel_preserving = tuple(a for a, _ in cases)
    swapped_identity = tuple(b for _, b in cases)
    assert all(a + b == 0 for a, b in cases)
    return {
        "case_count": len(cases),
        "aggregates": [a + b for a, b in cases],
        "target": "recover sign of named first channel",
        "sum_only_correct": correct(aggregate_only),
        "identity_preserving_correct": correct(channel_preserving),
        "swapped_identity_correct": correct(swapped_identity),
        "note": "Balanced toy example; no generalization or performance claim",
    }


def experiment_report(budget: int = 144, seed: int = 369) -> dict:
    """Machine-readable deterministic snapshot for reproducibility."""
    if budget not in FIBONACCI_BUDGETS:
        raise ValueError("unsupported Fibonacci audit budget")
    graph = build_graph()
    solid = bipyramid()
    selected = audit_pairs(budget, seed)
    raw = json.dumps(selected, separators=(",", ":"), ensure_ascii=True)
    fingerprint = sha256(raw.encode("utf-8")).hexdigest()
    return {
        "schema": "phimirrorhex.e1.v1",
        "status": "toy-research-prototype",
        "seed": seed,
        "phi": PHI,
        "geometry": {
            "vertices": len(solid.vertices),
            "edges": len(solid.edges),
            "faces": len(solid.faces),
        },
        "functions": {"above": list(ABOVE), "below": list(BELOW)},
        "audit": {
            "channels": len(graph.channels),
            "nodes": len(graph.nodes),
            "total_possible_pairs": len(graph.pairs),
            "mandatory_gate_pairs": len(graph.gate_pairs),
            "candidate_peer_pairs": len(graph.peer_pairs),
            "selected_pairs": len(selected),
            "pair_coverage": len(selected) / len(graph.pairs),
            "sha256": fingerprint,
        },
        "candidate_coherence_example": coherence(.9, .9, .9, .1),
        "causal_controls": causal_memory_controls(),
        "authority_granted": False,
    }
