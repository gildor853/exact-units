import { fail, show } from "./errors.js";
import { piBounds } from "./pi.js";
import {
  add,
  decimalsFor,
  div,
  magnitude,
  MAX_DIGITS,
  mul,
  pow,
  type Ratio,
  ratioToNumber,
  ratio,
  type Rounding,
  ROUNDINGS,
  sub,
  terminatingDecimals,
  toFixed,
  toRatio,
  type ValueInput,
} from "./rational.js";
import { type Dimension, type DimensionOf, piFraction, requireUnit, type UnitDef, type UnitId, type UnitName } from "./units/index.js";

/** Options for {@link Quantity.toDecimal}. */
export interface DecimalOptions {
  /** Round to this many digits after the decimal point (0–1000). */
  readonly decimals?: number;
  /** Round to this many significant digits (1–1000). Cannot be combined with `decimals`. */
  readonly significant?: number;
  /** Default `"half-even"`. `"half-up"` rounds ties away from zero. */
  readonly rounding?: Rounding;
  /** Keep trailing zeros (`"2.540"` for `decimals: 3`). Default `false`. */
  readonly fixed?: boolean;
}

/** Significant digits used when a value has no finite decimal expansion and no precision was requested. */
export const DEFAULT_SIGNIFICANT = 20;

interface Precision {
  readonly decimals: number | undefined;
  readonly significant: number | undefined;
  readonly rounding: Rounding;
  readonly fixed: boolean;
}

function readInt(options: Record<string, unknown>, key: string, min: number): number | undefined {
  const v = options[key];
  if (v === undefined) return undefined;
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > MAX_DIGITS) {
    fail("InvalidOption", `Option "${key}" must be an integer from ${min} to ${MAX_DIGITS}, got ${show(v)}.`);
  }
  return v;
}

/** @internal Validates decimal output options (null/undefined mean defaults). */
export function readPrecision(options: unknown, defaultRounding: Rounding = "half-even"): Precision {
  if (options === undefined || options === null) return { decimals: undefined, significant: undefined, rounding: defaultRounding, fixed: false };
  if (typeof options !== "object") fail("InvalidOption", `Expected an options object, got ${show(options)}.`);
  const o = options as Record<string, unknown>;
  const decimals = readInt(o, "decimals", 0);
  const significant = readInt(o, "significant", 1);
  if (decimals !== undefined && significant !== undefined) fail("InvalidOption", 'Use either "decimals" or "significant", not both.');
  const rounding = o.rounding === undefined ? defaultRounding : (o.rounding as Rounding);
  if (!ROUNDINGS.includes(rounding)) fail("InvalidOption", `Option "rounding" must be one of ${ROUNDINGS.join(", ")}, got ${show(o.rounding)}.`);
  if (o.fixed !== undefined && typeof o.fixed !== "boolean") fail("InvalidOption", `Option "fixed" must be a boolean, got ${show(o.fixed)}.`);
  return { decimals, significant, rounding, fixed: o.fixed === true };
}

function format(x: Ratio, p: Precision, significant: number): string {
  return toFixed(x, p.decimals ?? decimalsFor(x, significant), p.rounding, p.fixed);
}

/** Interval [lo, hi] containing q·π^k, from π bounds with `digits` digits. */
function piInterval(q: Ratio, k: number, digits: number): [Ratio, Ratio] {
  const { lo, hi } = piBounds(digits);
  const a = k > 0 ? pow(lo, k) : pow(hi, k);
  const b = k > 0 ? pow(hi, k) : pow(lo, k);
  return q.n > 0n ? [mul(q, a), mul(q, b)] : [mul(q, b), mul(q, a)];
}

/**
 * @internal Evaluates `render` on rigorous lower/upper bounds of q·π^k with
 * increasing precision until both agree. q·π^k (q ≠ 0, k ≠ 0) is irrational,
 * so it never sits exactly on a rounding boundary and the loop terminates.
 */
function refine<T>(q: Ratio, k: number, start: number, render: (x: Ratio) => T): T {
  for (let digits = start; ; digits *= 2) {
    const [lo, hi] = piInterval(q, k, digits);
    const a = render(lo);
    if (a === render(hi)) return a;
  }
}

const TOKEN = Symbol("Quantity");

/** @internal Internal value: q·π^k in some unit. */
interface Value {
  readonly q: Ratio;
  readonly k: number;
}

function toBase(def: UnitDef, v: Value): Value {
  switch (def.kind) {
    case "affine":
      return { q: add(mul(v.q, def.factor), def.offset), k: 0 };
    case "reciprocal":
      if (v.q.n === 0n) fail("OutOfRange", `0 ${def.id} has no equivalent in other ${def.dimension} units (division by zero).`);
      return { q: div(def.factor, v.q), k: 0 };
    default:
      return { q: mul(v.q, def.factor), k: v.k + def.pi };
  }
}

function fromBase(def: UnitDef, b: Value): Value {
  switch (def.kind) {
    case "affine":
      return { q: div(sub(b.q, def.offset), def.factor), k: 0 };
    case "reciprocal":
      if (b.q.n === 0n) fail("OutOfRange", `A zero ${def.dimension} value has no equivalent in ${def.id} (division by zero).`);
      return { q: div(def.factor, b.q), k: 0 };
    default:
      return { q: div(b.q, def.factor), k: b.k - def.pi };
  }
}

function checkRange(def: UnitDef, v: Value): void {
  if (def.dimension === "temperature" && toBase(def, v).q.n < 0n) {
    fail("OutOfRange", `Temperature below absolute zero (0 K). For temperature differences use delta units such as "delta_degC".`);
  }
  if (def.dimension === "fuel-economy" && v.q.n < 0n) fail("OutOfRange", "Fuel consumption / economy cannot be negative.");
}

/**
 * An exact amount in a unit: `numerator / denominator × π^piPower`.
 * Immutable; create it with {@link quantity} or {@link convert}.
 */
export class Quantity<out D extends Dimension = Dimension> {
  /** Canonical unit id. */
  readonly unit: UnitId<D>;
  readonly dimension: D;
  /** Exact value is `numerator / denominator × π^piPower` (fraction in lowest terms, denominator > 0). */
  readonly numerator: bigint;
  readonly denominator: bigint;
  /** Power of π in the exact value; non-zero only for radian ↔ non-radian angle conversions. */
  readonly piPower: number;
  /** `true` when the value is a rational number (`piPower === 0`). */
  readonly rational: boolean;
  /** @internal */
  readonly #def: UnitDef;

  /** @internal Use {@link quantity} or {@link convert}. */
  constructor(token: typeof TOKEN, def: UnitDef, value: Value) {
    if (token !== TOKEN) fail("InvalidValue", "Use quantity() or convert() to create a Quantity.");
    this.#def = def;
    this.unit = def.id as UnitId<D>;
    this.dimension = def.dimension as D;
    this.numerator = value.q.n;
    this.denominator = value.q.d;
    this.piPower = value.q.n === 0n ? 0 : value.k;
    this.rational = this.piPower === 0;
    Object.freeze(this);
  }

  /** Converts to another unit of the same dimension. */
  to(unit: UnitName<D>): Quantity<D> {
    const target = requireUnit(unit);
    const def = this.#def;
    if (target.dimension !== def.dimension) {
      fail("IncompatibleUnits", `Cannot convert ${def.dimension} (${def.id}) to ${target.dimension} (${target.id}).`);
    }
    if (target === def) return this;
    const value: Value = { q: ratio(this.numerator, this.denominator), k: this.piPower };
    return new Quantity<D>(TOKEN, target, fromBase(target, toBase(def, value)));
  }

  /**
   * Decimal string. Without options the result is exact when the value has a
   * finite decimal expansion (`"2.54"`), otherwise rounded (half-even) to
   * {@link DEFAULT_SIGNIFICANT} significant digits.
   */
  toDecimal(options?: DecimalOptions): string {
    const p = readPrecision(options);
    const q = ratio(this.numerator, this.denominator);
    if (this.rational) {
      if (p.decimals === undefined && p.significant === undefined) {
        const exact = terminatingDecimals(q);
        if (exact !== undefined) return toFixed(q, exact, p.rounding, false);
      }
      return format(q, p, p.significant ?? DEFAULT_SIGNIFICANT);
    }
    const sig = p.significant ?? DEFAULT_SIGNIFICANT;
    const need = (p.decimals ?? sig) + Math.abs(magnitude(q)) + 20;
    return refine(q, this.piPower, need, (x) => format(x, p, sig));
  }

  /** Exact fraction in lowest terms: `"127/50"`, `"-3"`, `"π/2"`, `"180/π"`. */
  toFraction(): string {
    return piFraction(ratio(this.numerator, this.denominator), this.piPower);
  }

  /** Nearest double (correctly rounded, also for values containing π). */
  toNumber(): number {
    const q = ratio(this.numerator, this.denominator);
    if (this.rational) return ratioToNumber(q);
    return refine(q, this.piPower, 40, ratioToNumber);
  }

  /** Same as {@link toDecimal} without options. */
  toString(): string {
    return this.toDecimal();
  }

  /** `{ value, unit }` with the default decimal string (bigints are not JSON-serialisable). */
  toJSON(): { value: string; unit: UnitId<D> } {
    return { value: this.toDecimal(), unit: this.unit };
  }
}

/** `true` when `value` is a {@link Quantity} created by this library. Never throws. */
export function isQuantity(value: unknown): value is Quantity {
  return value instanceof Quantity;
}

/**
 * Creates an exact quantity. `value` may be a finite number (read through its
 * shortest decimal form, so `0.1` is exactly 1/10), a decimal or fraction
 * string (`"2.54"`, `"-1e-3"`, `"1/3"`) or a bigint.
 */
export function quantity<U extends UnitName>(value: ValueInput, unit: U): Quantity<DimensionOf<U>> {
  const def = requireUnit(unit);
  const v: Value = { q: toRatio(value), k: 0 };
  checkRange(def, v);
  return new Quantity<DimensionOf<U>>(TOKEN, def, v);
}

/**
 * Converts `value` from one unit to another of the same dimension, exactly.
 * Mixing dimensions (`convert(1, "km", "kg")`) is a compile-time error.
 */
export function convert<F extends UnitName>(value: ValueInput, from: F, to: UnitName<DimensionOf<F>>): Quantity<DimensionOf<F>> {
  return quantity(value, from).to(to);
}
