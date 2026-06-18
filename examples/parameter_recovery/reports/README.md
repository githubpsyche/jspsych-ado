# Rendered parameter recovery reports

This folder contains maintained snapshot reports generated from the reusable
parameter recovery notebook.

- `delay_discounting_controller_benchmark.html`
- `delay_discounting_controller_benchmark.ipynb`
- `line_length_discrimination_controller_benchmark.html`
- `line_length_discrimination_controller_benchmark.ipynb`

Each report drives the real jsPsych experiment page in `simulate=data-only` mode
and compares the configured controller arms: Stan MI ADO, Stan random designs,
and Quest+. The HTML files are intended for quick reading; the executed
notebooks preserve the same outputs in notebook form.

The reports are generated artifacts, but they are committed deliberately as
reader-facing benchmark snapshots. Raw browser JSON output is intentionally not
committed.
