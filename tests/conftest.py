"""Shared pytest configuration for the test suite."""


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "slow: marks tests that run a full adaptive recovery loop "
        "(deselect with '-m \"not slow\"')",
    )
