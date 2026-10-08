"""CLI: E1 report, E2 simulation series or observation-only bridge envelope."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .bridges import TARGETS, readonly_envelope
from .core import FIBONACCI_BUDGETS
from .experiments import experiment_report
from .simulation import simulate_series


def main() -> None:
    parser = argparse.ArgumentParser(description="PhiMirrorHex deterministic research tools")
    parser.add_argument("--mode", choices=("e1", "e2", "e2-bridge"), default="e1")
    parser.add_argument("--budget", type=int, choices=FIBONACCI_BUDGETS, default=144)
    parser.add_argument("--seed", type=int, default=369)
    parser.add_argument("--steps", type=int, default=24)
    parser.add_argument("--no-anomaly", action="store_true", help="Disable synthetic anomaly injection")
    parser.add_argument("--target", choices=TARGETS, default="nestedbubblegear")
    parser.add_argument("--output", type=Path, help="Optional local JSON output (no network upload)")
    args = parser.parse_args()

    if args.mode == "e1":
        report = experiment_report(args.budget, args.seed)
    else:
        series = simulate_series(args.steps, args.seed, not args.no_anomaly)
        report = series if args.mode == "e2" else readonly_envelope(series, args.target)
    content = json.dumps(report, indent=2, sort_keys=True, allow_nan=False) + "\n"
    if args.output is not None:
        args.output.write_text(content, encoding="utf-8")
        print(f"Wrote {args.output}")
    else:
        print(content, end="")


if __name__ == "__main__":
    main()
