# Rendered parameter recovery reports

This folder contains maintained randomized recovery snapshots generated from the
reusable parameter recovery notebook.

- `delay_discounting_controller_benchmark.html`
- `delay_discounting_controller_benchmark.ipynb`
- `line_length_discrimination_controller_benchmark.html`
- `line_length_discrimination_controller_benchmark.ipynb`

Each report drives the real jsPsych experiment page in `simulate=data-only` mode
and compares the configured controller arms: Stan MI ADO, Stan random designs,
and Quest+. The reports use fixed randomized true-parameter profiles generated
by `../generate_random_recovery_settings.py`, so the empirical error bands,
final error distributions, and true-vs-recovered plots are reproducible.

The HTML files are intended for quick reading; the executed notebooks preserve
the same outputs in notebook form.

The reports are generated artifacts, but they are committed deliberately as
reader-facing benchmark snapshots. Raw browser JSON output is intentionally not
committed.
