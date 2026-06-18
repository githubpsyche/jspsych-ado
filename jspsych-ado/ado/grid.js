// Numeric helpers for building design-grid axes (the candidate values an MI design
// search ranges over). These replace per-task `range()` helpers that disagreed on
// whether the endpoint was inclusive — the two semantics now have two clearly named
// functions, mirroring numpy:
//
//   arange(start, stop, step) — HALF-OPEN [start, stop): stop is EXCLUDED   (np.arange)
//   linspace(start, stop, num) — INCLUSIVE [start, stop]: num points        (np.linspace)
//
// Both round to 10 decimals (matching the prior helpers) so floating-point step
// accumulation produces clean values (e.g. 12.5, 25, 37.5, ...).

const round10 = (value) => Number(value.toFixed(10));

/**
 * Evenly spaced values over a half-open interval [start, stop), stepping by `step`.
 * The stop is never included — arange(12.5, 800, 12.5) ends at 787.5, not 800.
 *
 * @param {number} start - First value.
 * @param {number} stop - Exclusive upper bound.
 * @param {number} [step=1] - Spacing (> 0).
 * @returns {number[]} Values start, start+step, ... up to but excluding stop.
 */
function arange(start, stop, step = 1) {
  if (!(step > 0)) {
    throw new Error(`arange(${start}, ${stop}, ${step}): step must be a positive number.`);
  }
  const values = [];
  for (let value = start; value < stop; value += step) {
    values.push(round10(value));
  }
  return values;
}

/**
 * `num` evenly spaced values over the closed interval [start, stop] — both endpoints
 * included. linspace(4, 48, 12) gives [4, 8, ..., 48].
 *
 * @param {number} start - First value (included).
 * @param {number} stop - Last value (included).
 * @param {number} num - Number of points (integer >= 1). num === 1 returns [start].
 * @returns {number[]} The `num` evenly spaced values.
 */
function linspace(start, stop, num) {
  if (!Number.isInteger(num) || num < 1) {
    throw new Error(`linspace(${start}, ${stop}, ${num}): num must be an integer >= 1.`);
  }
  if (num === 1) {
    return [round10(start)];
  }
  const step = (stop - start) / (num - 1);
  const values = [];
  for (let i = 0; i < num; i++) {
    values.push(round10(start + i * step));
  }
  return values;
}

export { arange, linspace };
