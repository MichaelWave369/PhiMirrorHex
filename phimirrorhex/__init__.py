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
__version__ = "0.25.0"

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

from .consensus_transfer import transfer_consensus_report
__all__ += ["transfer_consensus_report"]

from .prospective_audit import prospective_audit_report
__all__ += ["prospective_audit_report"]

from .portable_evidence import portable_packet, portable_payload, verify_packet
__all__ += ["portable_packet", "portable_payload", "verify_packet"]

from .receivers import receive, receiver_qualification_report
__all__ += ["receive", "receiver_qualification_report"]

from .intake_chain import empty_ledger, intake, verify_chain, intake_qualification_report
__all__ += ["empty_ledger", "intake", "verify_chain", "intake_qualification_report"]

from .checkpoint import checkpoint, compare_checkpoint, checkpoint_qualification_report
__all__ += ["checkpoint", "compare_checkpoint", "checkpoint_qualification_report"]

from .witness import claim, audit_witnesses, witness_qualification_report
__all__ += ["claim", "audit_witnesses", "witness_qualification_report"]

from .signatures import sign_demo, inspect_signatures, signature_qualification_report
__all__ += ["sign_demo", "inspect_signatures", "signature_qualification_report"]

from .lifecycle import genesis, consume, rotate, sign_claim, sign_rotation, lifecycle_qualification_report
__all__ += ["genesis", "consume", "rotate", "sign_claim", "sign_rotation", "lifecycle_qualification_report"]
