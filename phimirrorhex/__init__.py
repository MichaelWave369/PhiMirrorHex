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
__version__ = "0.16.0"

from .simulation import simulate_frame, simulate_series, verify_series
from .bridges import readonly_envelope

__all__ += ["simulate_frame", "simulate_series", "verify_series", "readonly_envelope"]

from .vessel import vessel_report
__all__ += ["vessel_report"]

from .gears import gear_report
__all__ += ["gear_report"]

from .coherence_bench import benchmark
__all__ += ["benchmark"]

from .adaptive import adaptive_benchmark
__all__ += ["adaptive_benchmark"]

from .robustness import robustness_benchmark
__all__ += ["robustness_benchmark"]

from .frontier import frontier_report
__all__ += ["frontier_report"]

from .generalization import generalization_report
__all__ += ["generalization_report"]

from .replication import replication_report
__all__ += ["replication_report"]

from .transfer import transfer_report
__all__ += ["transfer_report"]

from .calibration import calibration_report
__all__ += ["calibration_report"]

from .drift import drift_report
__all__ += ["drift_report"]

from .sequential import sequential_report
__all__ += ["sequential_report"]

from .consensus import consensus_report
__all__ += ["consensus_report"]
