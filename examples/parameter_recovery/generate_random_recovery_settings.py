"""Generate reproducible randomized parameter-recovery settings.

The rendered reports use fixed settings JSON files so benchmark snapshots are
reviewable and repeatable. This script creates Latin-hypercube-style profiles:
each parameter is stratified across its configured range, then shuffled before
parameters are paired into profiles.
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path
from typing import Any


PROFILE_SEED = 20260618
PROFILE_COUNT = 24
RESPONSE_SEEDS = [101, 102, 103]
OUTPUT_DIR = Path(__file__).resolve().parent

RUN_SPECS = [
    {"strategy": "ado", "query": {"controller": "stan", "strategy": "ado"}},
    {"strategy": "random", "query": {"controller": "stan", "strategy": "random"}},
    {"strategy": "quest_plus", "query": {"controller": "quest_plus"}},
]


def round_sig(value: float, digits: int = 8) -> float:
    """Round to a fixed number of significant digits for stable readable JSON."""

    if value == 0:
        return 0
    places = digits - int(math.floor(math.log10(abs(value)))) - 1
    return round(value, places)


def stratified_uniform(rng: random.Random, low: float, high: float, n: int) -> list[float]:
    """Sample one randomized value from each equal-width interval."""

    values = [low + ((i + rng.random()) / n) * (high - low) for i in range(n)]
    rng.shuffle(values)
    return [round_sig(value) for value in values]


def stratified_log_uniform(rng: random.Random, low: float, high: float, n: int) -> list[float]:
    """Sample one randomized value from each equal-width log10 interval."""

    low_log = math.log10(low)
    high_log = math.log10(high)
    values = [10 ** (low_log + ((i + rng.random()) / n) * (high_log - low_log)) for i in range(n)]
    rng.shuffle(values)
    return [round_sig(value) for value in values]


def make_profiles(
    rng: random.Random,
    prefix: str,
    parameter_values: dict[str, list[float]],
) -> list[dict[str, Any]]:
    """Pair independently shuffled parameter values into named simulation profiles."""

    profiles = []
    for index in range(PROFILE_COUNT):
        params = {
            name: values[index]
            for name, values in parameter_values.items()
        }
        profiles.append({
            "profile_id": f"{prefix}_{index + 1:02d}",
            "sweep": "random",
            "params": params,
        })
    return profiles


def delay_discounting_settings() -> dict[str, Any]:
    """Settings for the delay-discounting randomized recovery report."""

    rng = random.Random(PROFILE_SEED)
    profiles = make_profiles(
        rng,
        "dd_random",
        {
            "k": stratified_log_uniform(rng, 1e-4, 2e-2, PROFILE_COUNT),
            "tau": stratified_uniform(rng, 0.5, 7.0, PROFILE_COUNT),
        },
    )
    return {
        "experiment_path": "experiments/delay_discounting/index.html",
        "model_id": "hyperbolic",
        "run_specs": RUN_SPECS,
        "simulation_profiles": profiles,
        "seeds": RESPONSE_SEEDS,
        "parameters": [
            {"name": "k", "scale": "log10", "label": "Discount rate k"},
            {"name": "tau", "scale": "linear", "label": "Choice sensitivity tau"},
        ],
        "selected_parameters": ["k", "tau"],
        "choice_task": "delay_discounting",
        "design_fields": ["r_ss", "t_ss", "r_ll", "t_ll"],
        "profile_seed": PROFILE_SEED,
        "profile_sampling": "stratified_random",
    }


def line_length_settings() -> dict[str, Any]:
    """Settings for the line-length randomized recovery report."""

    rng = random.Random(PROFILE_SEED + 1)
    profiles = make_profiles(
        rng,
        "line_random",
        {
            "sensitivity": stratified_uniform(rng, 0.6, 3.5, PROFILE_COUNT),
            "bias_b": stratified_uniform(rng, -0.8, 0.8, PROFILE_COUNT),
            "bias_c": stratified_uniform(rng, -0.8, 0.8, PROFILE_COUNT),
        },
    )
    return {
        "experiment_path": "experiments/line_length_discrimination/index.html",
        "model_id": "line_length_discrimination_3ifc",
        "run_specs": RUN_SPECS,
        "simulation_profiles": profiles,
        "seeds": RESPONSE_SEEDS,
        "parameters": [
            {"name": "sensitivity", "scale": "linear", "label": "Line sensitivity"},
            {"name": "bias_b", "scale": "linear", "label": "B response bias"},
            {"name": "bias_c", "scale": "linear", "label": "C response bias"},
        ],
        "selected_parameters": ["sensitivity", "bias_b", "bias_c"],
        "choice_task": "line_length_discrimination_3ifc",
        "design_fields": [
            "standard_length",
            "delta",
            "target_index",
            "target_label",
            "line_length_a",
            "line_length_b",
            "line_length_c",
        ],
        "profile_seed": PROFILE_SEED,
        "profile_sampling": "stratified_random",
    }


def write_settings(path: Path, settings: dict[str, Any]) -> None:
    """Write settings JSON with a stable final newline."""

    path.write_text(json.dumps(settings, indent=2) + "\n")


def main() -> None:
    """Generate both randomized recovery settings files."""

    write_settings(
        OUTPUT_DIR / "delay_discounting_random_recovery_settings.json",
        delay_discounting_settings(),
    )
    write_settings(
        OUTPUT_DIR / "line_length_discrimination_random_recovery_settings.json",
        line_length_settings(),
    )


if __name__ == "__main__":
    main()
