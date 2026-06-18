# Stan Weber Fraction Model For Adaptive Stimuli

This folder includes a Stan model for estimating a participant's Weber fraction (`w`) from completed trials in the Halberda-style dot comparison task.

The model is intended for an adaptive-stimulus workflow. Another script or service can fit the model using the participant's completed trial history, then use the posterior estimate of `w` to choose the next dot comparison stimulus.

Model file:

```text
weber_dot_comparison.stan
```

## Core Variables

Each row in the model data corresponds to one completed dot-comparison trial.

```text
N          number of completed comparison trials
correct    participant accuracy on each trial; 1 = correct, 0 = incorrect
n_blue     number of blue dots shown on each completed trial
n_yellow   number of yellow dots shown on each completed trial
w          participant Weber fraction estimated by Stan
p_correct  predicted probability of a correct response for each completed trial
```

The model does not require separate `n_large` or `n_small` input columns. It derives them internally:

```stan
real n_large = max(n_blue[i], n_yellow[i]);
real n_small = min(n_blue[i], n_yellow[i]);
```

This means the same input format works whether blue or yellow is the larger set on a given trial.

## Psychometric Function

For each trial, it predicts the probability of a correct response using:

```text
p_correct = Phi((n_large - n_small) / (w * sqrt(n_large^2 + n_small^2)))
```

where:

- `n_large` is the larger dot count on that trial
- `n_small` is the smaller dot count on that trial
- `Phi` is the standard normal cumulative distribution function
- smaller `w` means sharper approximate-number discrimination
- larger `w` means noisier approximate-number discrimination

## Match To Experiment Variables

The model is written to match the raw CSV exported by `experiment.js`.

Required columns:

```text
correct
n_blue
n_yellow
```

These names are intentionally kept close to the jsPsych experiment output, so an adaptive controller can pass trial history into Stan without renaming the color-specific stimulus variables.

## Generated Quantities

The model saves:

```text
log_lik
correct_rep
```

`log_lik` can be used by external tooling for model checks.

`correct_rep` is a posterior predictive simulated accuracy value for each completed trial.

## Notes

This is a simple one-parameter model. It is a good starting point for estimating `w` from a single participant or session.

For a larger multi-participant project, this model can be extended to a hierarchical version with participant-level Weber fractions. For noisy behavioral data, a lapse-rate parameter may also be useful.
