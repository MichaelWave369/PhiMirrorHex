"""Read-only E2 adapter contract proposals.

No outbound calls, API keys, tool dispatch, network I/O, or changes to
NestedBubbleGear or SuperPhiVessel. Recipients must independently validate.
"""

from __future__ import annotations

from .simulation import digest, verify_series

TARGETS = ("nestedbubblegear", "superphivessel")
BRIDGE_SCHEMA = "phimirrorhex.e2.readonly-receipt.v1"


def readonly_envelope(series: dict, target: str = "nestedbubblegear",
                      frame_index: int | None = None) -> dict:
    """Return an observation-only summary of a verified synthetic series."""
    if target not in TARGETS:
        raise ValueError(f"target must be one of {TARGETS}")
    if not verify_series(series):
        raise ValueError("invalid or altered E2 series")
    if frame_index is None:
        frame_index = len(series["frames"]) - 1
    if type(frame_index) is not int or not 0 <= frame_index < len(series["frames"]):
        raise ValueError("frame_index out of bounds")

    frame = series["frames"][frame_index]
    summary = {
        "step": frame["step"],
        "gate": frame["gate"],
        "flagged_channels": [x["id"] for x in frame["channels"] if x["flagged"]],
    }
    envelope = {
        "schema": BRIDGE_SCHEMA,
        "target": target,
        "status": "proposed_contract_no_destination_integration",
        "source_schema": series["schema"],
        "source_sha256": series["sha256"],
        "capabilities": ["read:synthetic-summary"],
        "commands": [],
        "authority_granted": False,
        "synthetic_only": True,
        "summary": summary,
    }
    return {**envelope, "sha256": digest(envelope)}
