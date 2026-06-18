# Parameter recovery example

This folder contains a reusable experiment-level parameter recovery audit.

The notebook drives a real jsPsych experiment page in `simulate=data-only` mode,
reads the displayed jsPsych JSON, and normalizes posterior summaries into a long
parameter table. It is configured for delay discounting by default, but the
experiment path, task-row label, parameter metadata, simulation profiles, and
selected design fields can be supplied through a settings JSON file.

The helper uses the experiment's public URL API. The delay-discounting template
currently compares:

- `controller=stan&strategy=ado&simulate=data-only`
- `controller=stan&strategy=random&simulate=data-only`
- `controller=quest_plus&simulate=data-only`

The Stan strategies share the same Stan/WASM posterior update path; only the
design-selection policy changes. Quest+ is a separate discrete-grid adaptive
controller, so its posterior summaries are useful comparator evidence but are not
identical to Stan posterior draws.

This is an explainer/audit workflow, not a normal CI test. The quick helper mode
is useful as a smoke check. Settings files may also define optional directional
checks so the notebook can report whether recovered posterior means preserve
expected profile orderings.

Committed rendered reports are available in `reports/`:

- `reports/delay_discounting_controller_benchmark.html`
- `reports/line_length_discrimination_controller_benchmark.html`

These reports are snapshot artifacts for readers who want to inspect the current
benchmark outputs without rerunning the browser simulations. The executed
notebooks are committed next to the HTML files; raw JSON dumps are intentionally
not committed.

Install the Playwright browser once:

```bash
uv run --with playwright python -m playwright install chromium
```

Then run the quick browser check:

```bash
uv run --with playwright python examples/parameter_recovery/parameter_recovery_browser.py --quick
```

Run the 3IFC line-length categorical audit:

```bash
uv run --with playwright python examples/parameter_recovery/parameter_recovery_browser.py \
  --settings-json "$(cat examples/parameter_recovery/line_length_discrimination_settings.json)"
```

Run the default delay-discounting notebook without overwriting the unexecuted
template:

```bash
uv run \
  --with jupyter \
  --with pandas \
  --with matplotlib \
  --with playwright \
  jupyter nbconvert --to notebook --execute \
  examples/parameter_recovery/parameter_recovery.ipynb \
  --output-dir=examples/parameter_recovery/reports \
  --output=delay_discounting_controller_benchmark.ipynb
```

Render the delay-discounting report to static HTML:

```bash
uv run --with jupyter \
  jupyter nbconvert --to html \
  examples/parameter_recovery/reports/delay_discounting_controller_benchmark.ipynb
```

Run the same notebook template for the 3IFC line-length experiment with
papermill:

```bash
uv run \
  --with papermill \
  --with ipykernel \
  --with pandas \
  --with matplotlib \
  --with playwright \
  papermill \
  examples/parameter_recovery/parameter_recovery.ipynb \
  examples/parameter_recovery/reports/line_length_discrimination_controller_benchmark.ipynb \
  -p SETTINGS_PATH examples/parameter_recovery/line_length_discrimination_settings.json
```

Render the line-length report to static HTML:

```bash
uv run --with jupyter \
  jupyter nbconvert --to html \
  examples/parameter_recovery/reports/line_length_discrimination_controller_benchmark.ipynb
```

These commands do not require committed Python dependency metadata. `uv` resolves
the listed packages on demand for the command being run.
