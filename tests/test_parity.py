"""Parity regression test: our wrapper vs. raw ADOpy ground truth.

Replays the exact response sequence recorded in
``tests/fixtures/adopy_reference_sequence.json`` through
``DelayDiscountingSession`` and asserts that, at every step, the adaptively
selected design and the resulting posterior match the committed ADOpy
reference within tolerance.

The fixture is produced by ``tests/generate_fixtures.py`` driving a raw
``adopy.Engine``. Regenerate it whenever ADOpy or the default grids change:

    python tests/generate_fixtures.py

If the fixture is missing (e.g. on a fresh checkout where it has not been
generated yet), the tests skip with an explanatory message rather than fail,
so the rest of the suite still runs.
"""

import json
import math
import os

import pytest

from ado_service.dd_engine import DelayDiscountingSession

FIXTURE_PATH = os.path.join(
    os.path.dirname(__file__), "fixtures", "adopy_reference_sequence.json"
)
REL_TOLERANCE = 1e-6


def load_fixture():
    if not os.path.exists(FIXTURE_PATH):
        pytest.skip(
            "Reference fixture not found. Generate it with "
            "`python tests/generate_fixtures.py` (requires ADOpy)."
        )
    with open(FIXTURE_PATH) as handle:
        return json.load(handle)


def replay_through_wrapper(fixture):
    """Feed the fixture's responses through our session, collecting per-step
    selected designs and posteriors."""
    session = DelayDiscountingSession()
    steps = []
    for trial in fixture["trials"]:
        design = session.next_design
        result = session.update(design, trial["response"])
        steps.append({
            "design": design,
            "post_mean": result["post_mean"],
            "post_sd": result["post_sd"],
        })
    return steps


def assert_close(actual, expected, label):
    assert math.isclose(actual, expected, rel_tol=REL_TOLERANCE, abs_tol=1e-12), (
        f"{label}: got {actual!r}, expected {expected!r} "
        f"(rel_tol={REL_TOLERANCE})"
    )


def test_selected_designs_match_reference():
    fixture = load_fixture()
    steps = replay_through_wrapper(fixture)

    for index, (step, reference) in enumerate(zip(steps, fixture["trials"])):
        for field in ("t_ss", "t_ll", "r_ss", "r_ll"):
            assert_close(
                step["design"][field],
                reference["design"][field],
                f"trial {index} design.{field}",
            )


def test_posterior_means_match_reference():
    fixture = load_fixture()
    steps = replay_through_wrapper(fixture)

    for index, (step, reference) in enumerate(zip(steps, fixture["trials"])):
        for param in ("k", "tau"):
            assert_close(
                step["post_mean"][param],
                reference["post_mean"][param],
                f"trial {index} post_mean.{param}",
            )


def test_posterior_sds_match_reference():
    fixture = load_fixture()
    steps = replay_through_wrapper(fixture)

    for index, (step, reference) in enumerate(zip(steps, fixture["trials"])):
        for param in ("k", "tau"):
            assert_close(
                step["post_sd"][param],
                reference["post_sd"][param],
                f"trial {index} post_sd.{param}",
            )
