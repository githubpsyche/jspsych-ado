# Contributing to jspsych-ado

Thanks for taking the time to contribute. Contributions can be bug reports,
documentation improvements, tests, examples, task/model packages, or changes to
the adaptive engine itself.

## How Can I Contribute?

### Reporting Bugs

Before opening a bug report, check the
[issue tracker](https://github.com/githubpsyche/jspsych-ado/issues) to see
whether the problem has already been reported.

When filing a bug, please include:

- the browser, operating system, and Node.js version, if relevant;
- the package version or commit you are using;
- the demo, task, model, or API call involved;
- a minimal reproduction or the smallest set of steps that triggers the issue;
- any console output, stack trace, or failed test output.

For browser/WASM issues, it is especially helpful to say whether the problem
appears in a static demo page, a bundler project, or both.

### Suggesting Enhancements

Open an issue before starting substantial work. Please describe:

- the research or user workflow the change supports;
- whether the change affects a task, model, controller, documentation, tests, or
  the public API;
- whether the change should be part of the main package or only a demo/example;
- any validation that would show the change works.

This keeps feature work reviewable and helps separate near-term maintenance from
longer-term research directions.

### Pull Requests

1. Fork the repository and create a branch from `main`.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Keep the change focused. A small PR that fixes one issue is easier to review
   than a broad PR that mixes API, documentation, and example changes.
4. Match the existing style. The package uses plain ES modules, browser-friendly
   static assets, and small task/model/controller boundaries rather than a large
   application framework.
5. Add or update tests when behavior changes. Update documentation or examples
   when public usage changes.
6. Run the relevant checks before opening the PR:

   ```bash
   npm test
   npm run test:smoke
   npm run test:browser
   npm run test:bundler
   ```

   If you recompile a Stan model and update a committed `main.js`, run:

   ```bash
   npm run patch:wasm
   ```

7. Open a PR with a concise title, a description of what changed, the issue it
   addresses if applicable, and the checks you ran.

## Coding Standards

- Keep the task/model/controller split clear. Tasks own presentation, response
  coding, and design grids. Models own statistical response functions, priors,
  Stan data mapping, and compiled Stan artifacts. Controllers own adaptive
  policy and inference state.
- Do not add a dependency, build tool, or abstraction unless it solves a concrete
  problem for the package.
- Keep demos runnable as static browser pages unless there is a clear reason to
  require a bundler.
- When changing public API behavior, update the README, demos, and tests that
  exercise that behavior.

## Adding Tasks or Models

Task packages live under `jspsych-ado/tasks/<name>/`. Model packages live under
`jspsych-ado/models/<name>/`.

Before adding a new task or model, read:

- [tasks README](jspsych-ado/tasks/README.md)
- [models README](jspsych-ado/models/README.md)
- [demos README](demos/README.md)

The bring-your-own-task and bring-your-own-model demos show the expected shape
for extension examples.

## Code of Conduct

By participating in this project, you agree to maintain a respectful,
inclusive, and professional environment.
