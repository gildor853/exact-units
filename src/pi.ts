/**
 * Rigorous rational bounds for π, used to print values that contain π
 * (radians) to any requested precision. Internal module.
 *
 * Machin's formula π = 16·atan(1/5) − 4·atan(1/239), evaluated in bigint
 * fixed point. Every truncating division errs by less than one unit in the
 * last place, so the accumulated error is bounded by the number of divisions;
 * that bound is subtracted/added to give a guaranteed interval.
 */
import { ratio, type Ratio } from "./rational.js";

/** atan(1/x)·scale with a bound on the absolute error (in units of 1/scale). */
function atanInv(x: bigint, scale: bigint): { value: bigint; error: bigint } {
  const x2 = x * x;
  let power = scale / x;
  let sum = 0n;
  let k = 0n;
  while (power !== 0n) {
    const term = power / (2n * k + 1n);
    sum += k % 2n === 0n ? term : -term;
    power /= x2;
    k++;
  }
  // The truncation error carried in `power` stays below 1/(1 − 1/x²) < 1.05,
  // so each term errs by less than 2.05 units; the alternating tail after the
  // last non-zero power is below one unit. 3 per term (+3) is a safe bound.
  return { value: sum, error: 3n * k + 3n };
}

let cached: { digits: number; lo: Ratio; hi: Ratio } | undefined;

/** @internal Bounds lo < π < hi with hi − lo ≤ 10^−digits. */
export function piBounds(digits: number): { lo: Ratio; hi: Ratio } {
  if (cached !== undefined && cached.digits >= digits) return cached;
  const scale = 10n ** BigInt(digits + 10);
  const a = atanInv(5n, scale);
  const b = atanInv(239n, scale);
  const value = 16n * a.value - 4n * b.value;
  const error = 16n * a.error + 4n * b.error;
  cached = { digits, lo: ratio(value - error, scale), hi: ratio(value + error, scale) };
  return cached;
}
