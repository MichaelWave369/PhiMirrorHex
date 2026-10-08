"""CLI: E1 report, E2 simulation series or observation-only bridge envelope."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .bridges import TARGETS, readonly_envelope
from .core import FIBONACCI_BUDGETS
from .experiments import experiment_report
from .simulation import simulate_series
from .vessel import GAINS, SCHEMA as VESSEL_SCHEMA, vessel_report
from .gears import COUPLINGS, PROBE_GAINS, SCHEMA as GEARS_SCHEMA, gear_report
from .coherence_bench import benchmark


def main() -> None:
    parser = argparse.ArgumentParser(description="PhiMirrorHex deterministic research tools")
    parser.add_argument("--mode", choices=("e1", "e2", "e2-bridge", "vessel", "vessel-fixtures", "gears", "gears-fixtures", "coherence"), default="e1")
    parser.add_argument("--budget", type=int, choices=FIBONACCI_BUDGETS, default=144)
    parser.add_argument("--seed", type=int, default=369)
    parser.add_argument("--steps", type=int, default=24)
    parser.add_argument("--no-anomaly", action="store_true", help="Disable synthetic anomaly injection")
    parser.add_argument("--target", choices=TARGETS, default="nestedbubblegear")
    parser.add_argument("--probe-layer", type=int, default=3, choices=range(1, 6))
    parser.add_argument("--observer-depth", type=int, default=3, choices=range(6))
    parser.add_argument("--gain", type=float, default=0.5, choices=GAINS)
    parser.add_argument("--coupling", type=float, choices=COUPLINGS, default=0.5)
    parser.add_argument("--probe-gain", type=float, choices=PROBE_GAINS, default=0.5)
    parser.add_argument("--no-conveyor", action="store_true")
    parser.add_argument("--output", type=Path, help="Optional local JSON output (no network upload)")
    args = parser.parse_args()

    if args.mode == "e1":
        report = experiment_report(args.budget, args.seed)
    elif args.mode in ("e2", "e2-bridge"):
        series = simulate_series(args.steps, args.seed, not args.no_anomaly)
        report = series if args.mode == "e2" else readonly_envelope(series, args.target)
    elif args.mode == "vessel":
        report = vessel_report(args.probe_layer, args.gain, args.observer_depth)
    elif args.mode == "coherence":
        report = benchmark()
    elif args.mode == "gears":
        report = gear_report(args.coupling, args.probe_gain, not args.no_conveyor)
    elif args.mode == "gears-fixtures":
        report = {
            "schema": "phimirrorhex.e5.parity-suite.v1",
            "source_schema": GEARS_SCHEMA,
            "epistemic_origin": "SIMULATED",
            "cases": [
                {"coupling": coupling, "probe_gain": gain, "conveyor_enabled": enabled,
                 "report": gear_report(coupling, gain, enabled)}
                for coupling in COUPLINGS for gain in PROBE_GAINS
                for enabled in (True, False)
            ],
        }
    else:
        report = {
            "schema": "phimirrorhex.e4.parity-suite.v1",
            "source_schema": VESSEL_SCHEMA,
            "epistemic_origin": "SIMULATED",
            "cases": [
                {"probe_layer": probe, "gain": gain, "observer_depth": depth,
                 "report": vessel_report(probe, gain, depth)}
                for probe in range(1, 6) for gain in GAINS for depth in (0, 2, 3, 5)
            ],
        }
    content = json.dumps(report, indent=2, sort_keys=True, allow_nan=False) + "\n"
    if args.output is not None:
        args.output.write_text(content, encoding="utf-8")
        print(f"Wrote {args.output}")
    else:
        print(content, end="")


if __name__ == "__main__":
    main()
