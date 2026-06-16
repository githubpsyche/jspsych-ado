# jspsych-ado

Scaffold for a jsPsych/JATOS delay discounting experiment that gets adaptive designs from ADOpy through a small Python API.

The browser experiment lives in `experiments/delay_discounting/`. The Python service lives in `ado_service/`.

## Run the mock experiment

Open this file with Live Server:

```text
experiments/delay_discounting/index.html?ado=mock
```

The mock controller does not need Python. It returns deterministic designs so the timeline and data fields can be reviewed immediately.

## Run the Python ADO service

```bash
uv run uvicorn ado_service.app:app --reload --port 8000
```

Then open:

```text
experiments/delay_discounting/index.html?ado=api&api=http://127.0.0.1:8000
```

## Run tests

```bash
uv run pytest
```

## JATOS

Create a JATOS component pointing to:

```text
experiments/delay_discounting/index.html
```

The experiment uses the same local/JATOS base-path pattern as the existing `online_experiments` project.

