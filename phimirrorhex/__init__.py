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
__version__ = "0.2.0"

from .simulation import simulate_frame, simulate_series, verify_series
from .bridges import readonly_envelope

__all__ += ["simulate_frame", "simulate_series", "verify_series", "readonly_envelope"]
