/**
 * Exact rational arithmetic on bigint numerator/denominator pairs.
 * Every `Ratio` is normalised: `d > 0` and `gcd(|n|, d) = 1`, so equal values
 * have equal representations. Internal module.
 */
import { fail, show } from "./errors.js";

/** @internal */
export interface Ratio {
  readonly n: bigint;
  readonly d: bigint;
}

/** Longest accepted value string (characters). */
export const MAX_INPUT_LENGTH = 1000;
/** Largest accepted decimal exponent magnitude, e.g. `"1e1000"`. */
export const MAX_EXPONENT = 1000;
/** Largest accepted `decimals` / `significant` option. */
export const MAX_DIGITS = 1000;
const MAX_BIGINT = 10n ** 1000n;

function gcd(a: bigint, b: bigint): bigint {
  if (a < 0n) a = -a;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

/** @internal Builds a normalised ratio. `d` must not be zero. */
export function ratio(n: bigint, d: bigint = 1n): Ratio {
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return g === 1n ? { n, d } : { n: n / g, d: d / g };
}

export const ZERO: Ratio = { n: 0n, d: 1n };
export const ONE: Ratio = { n: 1n, d: 1n };

export const add = (a: Ratio, b: Ratio): Ratio => ratio(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Ratio, b: Ratio): Ratio => ratio(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Ratio, b: Ratio): Ratio => ratio(a.n * b.n, a.d * b.d);
/** `b` must not be zero. */
export const div = (a: Ratio, b: Ratio): Ratio => ratio(a.n * b.d, a.d * b.n);
export const cmp = (a: Ratio, b: Ratio): number => {
  const x = a.n * b.d - b.n * a.d;
  return x < 0n ? -1 : x > 0n ? 1 : 0;
};
export const eq = (a: Ratio, b: Ratio): boolean => a.n === b.n && a.d === b.d;
export const abs = (a: Ratio): Ratio => (a.n < 0n ? { n: -a.n, d: a.d } : a);

export function pow(a: Ratio, k: number): Ratio {
  if (k < 0) return pow(ratio(a.d, a.n), -k);
  const e = BigInt(k);
  return { n: a.n ** e, d: a.d ** e };
}

const DECIMAL = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d{1,6}))?$/;
const FRACTION = /^([+-]?)(\d+)\/(\d+)$/;

/**
 * @internal Parses a decimal (`"-1.5e3"`, `".5"`, `"2."`) or an integer
 * fraction (`"1/3"`). Returns undefined for anything else.
 */
export function parseRatio(text: string): Ratio | undefined {
  const f = FRACTION.exec(text);
  if (f) {
    const d = BigInt(f[3] as string);
    if (d === 0n) return undefined;
    const n = BigInt(f[2] as string);
    return ratio(f[1] === "-" ? -n : n, d);
  }
  const m = DECIMAL.exec(text);
  if (!m) return undefined;
  const int = m[2] as string;
  const frac = m[3] ?? "";
  if (int === "" && frac === "") return undefined;
  const exp = m[4] === undefined ? 0 : Number(m[4]);
  if (Math.abs(exp) > MAX_EXPONENT) return undefined;
  let n = BigInt(int + frac || "0");
  if (m[1] === "-") n = -n;
  const scale = exp - frac.length;
  return scale >= 0 ? ratio(n * 10n ** BigInt(scale)) : ratio(n, 10n ** BigInt(-scale));
}

/** @internal Parses a catalogue constant; throws on a programming error. */
export function r(text: string): Ratio {
  const v = parseRatio(text);
  /* v8 ignore next */
  if (v === undefined) throw new Error(`bad constant ${text}`);
  return v;
}

/** Values accepted wherever a number is expected. */
export type ValueInput = number | string | bigint;

/**
 * @internal Converts an untrusted value to an exact ratio.
 * Numbers are read through their shortest round-trip decimal form (what
 * `String(x)` prints), so `0.1` means exactly 1/10.
 */
export function toRatio(value: unknown): Ratio {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("InvalidValue", `Expected a finite number, got ${show(value)}.`);
    return parseRatio(String(value)) as Ratio;
  }
  if (typeof value === "bigint") {
    if (value > MAX_BIGINT || value < -MAX_BIGINT) fail("InvalidValue", "The bigint exceeds 10^1000 in magnitude.");
    return { n: value, d: 1n };
  }
  if (typeof value === "string") {
    if (value.length > MAX_INPUT_LENGTH) fail("InvalidValue", `The value string is longer than ${MAX_INPUT_LENGTH} characters.`);
    const v = parseRatio(value.trim());
    if (v === undefined) {
      fail("InvalidValue", `Expected a decimal number like "1.5", "-2e3" or a fraction like "1/3", got ${show(value)}.`);
    }
    return v;
  }
  return fail("InvalidValue", `Expected a number, string or bigint, got ${show(value)}.`);
}

/** Rounding modes for decimal output. `half-up` rounds ties away from zero. */
export type Rounding = "half-up" | "half-even" | "trunc" | "floor" | "ceil";
export const ROUNDINGS: readonly Rounding[] = ["half-up", "half-even", "trunc", "floor", "ceil"];

/** @internal Rounds n/d (d > 0) to an integer. */
export function roundDiv(n: bigint, d: bigint, mode: Rounding): bigint {
  const q = n / d;
  const rem = n % d;
  if (rem === 0n) return q;
  const away = n < 0n ? q - 1n : q + 1n;
  switch (mode) {
    case "trunc":
      return q;
    case "floor":
      return n < 0n ? away : q;
    case "ceil":
      return n > 0n ? away : q;
    default: {
      const twice = 2n * (rem < 0n ? -rem : rem);
      if (twice > d) return away;
      if (twice < d) return q;
      return mode === "half-up" || q % 2n !== 0n ? away : q;
    }
  }
}

/** @internal floor(log10(|x|)) for x ≠ 0. */
export function magnitude(x: Ratio): number {
  const a = x.n < 0n ? -x.n : x.n;
  let e = a.toString().length - x.d.toString().length;
  if (e >= 0 ? a < x.d * 10n ** BigInt(e) : a * 10n ** BigInt(-e) < x.d) e--;
  return e;
}

/** @internal Number of decimals needed to write x exactly, or undefined if it does not terminate. */
export function terminatingDecimals(x: Ratio): number | undefined {
  let d = x.d;
  let twos = 0;
  let fives = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    twos++;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    fives++;
  }
  return d === 1n ? Math.max(twos, fives) : undefined;
}

const q0 = (digits: string): boolean => /^0*$/.test(digits);

/**
 * @internal Writes x rounded to `decimals` fraction digits (negative values
 * round to tens, hundreds, …). Trailing zeros are removed unless `fixed`.
 */
export function toFixed(x: Ratio, decimals: number, mode: Rounding, fixed: boolean): string {
  let digits: string;
  let negative: boolean;
  if (decimals >= 0) {
    const q = roundDiv(x.n * 10n ** BigInt(decimals), x.d, mode);
    negative = q < 0n;
    digits = (negative ? -q : q).toString().padStart(decimals + 1, "0");
  } else {
    const unit = 10n ** BigInt(-decimals);
    const q = roundDiv(x.n, x.d * unit, mode) * unit;
    negative = q < 0n;
    digits = (negative ? -q : q).toString();
    decimals = 0;
  }
  let int = digits.slice(0, digits.length - decimals);
  let frac = digits.slice(digits.length - decimals);
  if (!fixed) {
    let end = frac.length;
    while (end > 0 && frac.charCodeAt(end - 1) === 48) end--;
    frac = frac.slice(0, end);
  }
  if (int === "") int = "0";
  const zero = q0(int) && q0(frac);
  return `${negative && !zero ? "-" : ""}${int}${frac ? `.${frac}` : ""}`;
}

/** @internal Decimal places that give `significant` significant digits for x. */
export function decimalsFor(x: Ratio, significant: number): number {
  return x.n === 0n ? significant - 1 : significant - 1 - magnitude(x);
}

function bitLength(v: bigint): number {
  return v.toString(2).length;
}

const TWO53 = 2n ** 53n;

/** @internal The double nearest to x (ties to even), like parsing its exact decimal. */
export function ratioToNumber(x: Ratio): number {
  if (x.n === 0n) return 0;
  const negative = x.n < 0n;
  const a = negative ? -x.n : x.n;
  let e = Math.max(bitLength(a) - bitLength(x.d) - 54, -1074);
  let q: bigint;
  let rem: bigint;
  let den: bigint;
  for (;;) {
    const num = e >= 0 ? a : a << BigInt(-e);
    den = e >= 0 ? x.d << BigInt(e) : x.d;
    q = num / den;
    rem = num % den;
    if (q < TWO53) break;
    e++;
  }
  const twice = 2n * rem;
  if (twice > den || (twice === den && q % 2n === 1n)) q++;
  // q <= 2^53 and e >= -1074, so the product is exact (or overflows to Infinity).
  const v = Number(q) * 2 ** e;
  return negative ? -v : v;
}

/** @internal "n/d", or "n" for integers. */
export function fractionString(x: Ratio): string {
  return x.d === 1n ? x.n.toString() : `${x.n}/${x.d}`;
}
