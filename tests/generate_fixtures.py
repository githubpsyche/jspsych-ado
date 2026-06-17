"""Generate the ADOpy ground-truth fixture used by ``test_parity.py``.

This is a standalone script, not a test. Run it once (and again whenever ADOpy
or the default grids change) to regenerate the committed reference:

    python tests/generate_fixtures.py

It drives a *raw* ``adopy.Engine`` (the ground-truth implementation) directly,
using the same default grids as ``DelayDiscountingSession``. At each step it:

  1. asks ADOpy for the optimal design (``get_design("optimal")``),
  2. feeds it a fixed, pre-scripted response,
  3. records the design, the response, and the resulting posterior.

``test_parity.py`` then replays the identical response sequence through our
``DelayDiscountingSession`` wrapper and asserts that the selected designs and
posteriors match this fixture within tolerance. Because ADO's design selection
is a deterministic argmax over expected information gain, the same response
sequence must reproduce the same designs and posteriors every time. Any drift
between our wrapper and raw ADOpy will break the parity test.

The header records the ADOpy version and grid configuration so a future
mismatch is diagnosable rather than mysterious.
"""

import json
import os

import numpy as np

# ADOpy 0.4.1 still references NumPy aliases removed in modern NumPy.
if not hasattr(np, "int"):
    np.int = int
if not hasattr(np, "float"):
    np.float = float

import adopy
from adopy import Engine
from adopy.tasks.dd import ModelHyp, TaskDD

from ado_service.dd_engine import (
    get_default_grid_design,
    get_default_grid_param,
    get_default_grid_response,
    clean_design,
    to_float_dict,
)

# A fixed, deterministic response sequence (0 = smaller-sooner, 1 = larger-later).
# Mixed so the posterior moves in both directions rather than running off to an
# extreme. No randomness anywhere in this script.
RESPONSE_SEQUENCE = [1, 1, 0, 1, 0, 0, 1, 1, 0, 1]

FIXTURE_PATH = os.path.join(os.path.dirname(__file__), "fixtures", "adopy_reference_sequence.json")


def build_engine():
    return Engine(
        TaskDD(),
        ModelHyp(),
        get_default_grid_design(),
        get_default_grid_param(),
        get_default_grid_response(),
    )


def grid_config_signature():
    design = get_default_grid_design()
    param = get_default_grid_param()
    return {
        "grid_design": {k: [float(x) for x in np.atleast_1d(v)] for k, v in design.items()},
        "grid_param": {k: [float(x) for x in np.atleast_1d(v)] for k, v in param.items()},
    }


def main():
    engine = build_engine()

    trials = []
    for response in RESPONSE_SEQUENCE:
        design = clean_design(engine.get_design("optimal"))
        engine.update(clean_design(design), {"choice": int(response)})
        trials.append({
            "design": design,
            "response": {"choice": int(response)},
            "post_mean": to_float_dict(engine.post_mean.to_dict()),
            "post_sd": to_float_dict(engine.post_sd.to_dict()),
        })

    fixture = {
        "_comment": (
            "Ground-truth reference generated from raw ADOpy by "
            "tests/generate_fixtures.py. Do not edit by hand."
        ),
        "adopy_version": getattr(adopy, "__version__", "unknown"),
        "response_sequence": RESPONSE_SEQUENCE,
        "config": grid_config_signature(),
        "trials": trials,
    }

    os.makedirs(os.path.dirname(FIXTURE_PATH), exist_ok=True)
    with open(FIXTURE_PATH, "w") as handle:
        json.dump(fixture, handle, indent=2)

    print(f"Wrote {len(trials)} reference trials to {FIXTURE_PATH}")
    print(f"ADOpy version: {fixture['adopy_version']}")


if __name__ == "__main__":
    main()
