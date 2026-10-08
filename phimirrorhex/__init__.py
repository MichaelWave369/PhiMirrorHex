"""Φ-Mirror Hex E1: experimental topology, audits, and causal controls."""

from .core import (
    ABOVE,
    BELOW,
    FIBONACCI_BUDGETS,
    PHI,
    audit_pairs,
    bipyramid,
    build_graph,
    coherence,
)

__all__ = [
    "ABOVE", "BELOW", "FIBONACCI_BUDGETS", "PHI",
    "audit_pairs", "bipyramid", "build_graph", "coherence",
]
__version__ = "0.1.0"
