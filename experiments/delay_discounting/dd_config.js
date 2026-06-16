function range(start, stop, step) {
  let values = [];
  for (let value = start; value < stop; value += step) {
    values.push(Number(value.toFixed(10)));
  }
  return values;
}

function linspace(start, stop, count) {
  let values = [];
  const step = (stop - start) / (count - 1);
  for (let i = 0; i < count; i++) {
    values.push(start + step * i);
  }
  return values;
}

function logspace(start, stop, count, base = 10) {
  return linspace(start, stop, count).map(value => Math.pow(base, value));
}

const default_dd_config = {
  n_trials: 42,
  grid_design: {
    t_ss: [0],
    t_ll: [
      0.43, 0.714, 1, 2, 3,
      4.3, 6.44, 8.6, 10.8, 12.9,
      17.2, 21.5, 26, 52, 104,
      156, 260, 520
    ],
    r_ss: range(12.5, 800, 12.5),
    r_ll: [800],
  },
  grid_param: {
    k: logspace(-5, 0, 50, 10),
    tau: linspace(0, 5, 11).slice(1),
  },
  response_labels: {
    0: "SS",
    1: "LL",
  }
};

export { default_dd_config, range, linspace, logspace };

