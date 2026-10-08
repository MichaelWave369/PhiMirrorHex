"""Run: python -m phimirrorhex --budget 144 --seed 369"""

from __future__ import annotations

import argparse
import json

from .core import FIBONACCI_BUDGETS
from .experiments import experiment_report


def main() -> None:
    parser = argparse.ArgumentParser(description="PhiMirrorHex E1 deterministic research report")
    parser.add_argument("--budget", type=int, choices=FIBONACCI_BUDGETS, default=144)
    parser.add_argument("--seed", type=int, default=369)
    args = parser.parse_args()
    print(json.dumps(experiment_report(args.budget, args.seed), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
