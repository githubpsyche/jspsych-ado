"""Simulated-participant recovery tests (slow).

The strongest end-to-end check of the ADO loop: invent a participant whose true
discount rate ``k`` we know, generate their choices from the hyperbolic logistic
model, run the full adaptive loop, and confirm the posterior lands in the right
region of parameter space.

Per the plan, assertions are *directional* rather than tolerance-based: a
high-discount participant should end up estimated above the grid's centre and a
low-discount participant below it. This is robust to grid resolution and avoids
brittle numeric thresholds while still proving the loop recovers the correct
region.

Marked ``slow`` so routine CI can skip them with ``-m "not slow"``; run them
explicitly before releases.
"""

import math
import statistics

import pytest

from ado_service.dd_engine import DelayDiscountingSession, get_default_grid_param

N_TRIALS = 20
TAU_TRUE = 2.0

pytestmark = pytest.mark.slow


def hyperbolic_value(reward, delay, k):
    return reward / (1.0 + k * delay)


def prob_choose_ll(design, k, tau):
    v_ss = hyperbolic_value(design["r_ss"], design["t_ss"], k)
    v_ll = hyperbolic_value(design["r_ll"], design["t_ll"], k)
    # Logistic choice rule with inverse-temperature tau.
    return 1.0 / (1.0 + math.exp(-tau * (v_ll - v_ss)))


def grid_median_k():
    k_grid = sorted(float(v) for v in get_default_grid_param()["k"])
    return statistics.median(k_grid)


def simulate_recovery(k_true, seed):
    """Run the adaptive loop against a synthetic participant with known k_true.

    Responses are drawn deterministically from a seeded PRNG so the test is
    fully reproducible.
    """
    rng = _Lcg(seed)
    session = DelayDiscountingSession()
    for _ in range(N_TRIALS):
        design = session.next_design
        p_ll = prob_choose_ll(design, k_true, TAU_TRUE)
        choice = 1 if rng.random() < p_ll else 0
        session.update(design, {"choice": choice})
    return session.summary()


class _Lcg:
    """Tiny self-contained linear congruential generator.

    Used instead of ``random``/``numpy`` so the synthetic responses are
    reproducible regardless of the environment's global RNG state.
    """

    def __init__(self, seed):
        self.state = seed & 0xFFFFFFFF

    def random(self):
        # Numerical Recipes LCG constants.
        self.state = (1664525 * self.state + 1013904223) & 0xFFFFFFFF
        return self.state / 0x100000000


def test_recovers_high_discount_participant_above_grid_centre():
    summary = simulate_recovery(k_true=0.1, seed=1)
    assert summary["post_mean"]["k"] > grid_median_k()


def test_recovers_low_discount_participant_below_grid_centre():
    summary = simulate_recovery(k_true=0.001, seed=2)
    assert summary["post_mean"]["k"] < grid_median_k()


def test_high_discount_estimate_exceeds_low_discount_estimate():
    high = simulate_recovery(k_true=0.1, seed=3)
    low = simulate_recovery(k_true=0.001, seed=4)
    assert high["post_mean"]["k"] > low["post_mean"]["k"]


def test_posterior_uncertainty_shrinks_over_the_run():
    session = DelayDiscountingSession()
    rng = _Lcg(seed=5)

    session.update(session.next_design, {"choice": 1})
    sd_start = session.summary()["post_sd"]["k"]

    for _ in range(N_TRIALS):
        design = session.next_design
        p_ll = prob_choose_ll(design, 0.01, TAU_TRUE)
        choice = 1 if rng.random() < p_ll else 0
        session.update(design, {"choice": choice})
    sd_end = session.summary()["post_sd"]["k"]

    assert sd_end < sd_start
