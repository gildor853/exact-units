import { fail, show } from "./errors.js";
import { type DecimalOptions, isQuantity, type Quantity, quantity, readPrecision } from "./quantity.js";
import type { ValueInput } from "./rational.js";
import type { UnitName } from "./units/index.js";
import { requireUnit } from "./units/index.js";

/** Options for {@link format}. Precision defaults to at most 3 decimals, rounded half-up. */
export interface FormatOptions extends DecimalOptions {
  /** BCP 47 locale tag (`"en-US"`, `"cs-CZ"`, `"de"`). Default: the runtime's default locale. */
  readonly locale?: string;
  /** Use the locale's digit grouping. Default `true`. */
  readonly grouping?: boolean;
  /** `"symbol"` (default) appends the unit symbol, `"none"` returns the number only. */
  readonly display?: "symbol" | "none";
}

interface Symbols {
  readonly decimal: string;
  readonly group: string;
  readonly primary: number;
  readonly secondary: number;
  readonly minGroup: number;
  readonly negPrefix: string;
  readonly negSuffix: string;
  readonly digits: readonly string[];
}

const CACHE = new Map<string, Symbols>();
const CACHE_LIMIT = 32;
const NO_SPACE = new Set(["deg", "arcmin", "arcsec"]);

/**
 * Reads the locale's separators, grouping and digits from Intl.NumberFormat.
 * The digits themselves are produced exactly by this library (Intl would
 * round through a double on older runtimes).
 */
function symbolsFor(locale: string | undefined): Symbols {
  const key = locale ?? "";
  const hit = CACHE.get(key);
  if (hit) return hit;
  let nf: Intl.NumberFormat;
  try {
    nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  } catch {
    return fail("InvalidOption", `Invalid locale ${show(locale)}.`);
  }
  const parts = nf.formatToParts(1234567.5);
  const ints = parts.filter((p) => p.type === "integer").map((p) => p.value);
  const neg = nf.formatToParts(-1);
  const at = neg.findIndex((p) => p.type === "integer");
  const symbols: Symbols = {
    decimal: parts.find((p) => p.type === "decimal")?.value ?? ".",
    group: parts.find((p) => p.type === "group")?.value ?? "",
    primary: (ints[ints.length - 1] as string).length,
    secondary: (ints.length >= 3 ? (ints[ints.length - 2] as string) : (ints[ints.length - 1] as string)).length,
    minGroup: nf.formatToParts(1234).some((p) => p.type === "group") ? 1 : 2,
    negPrefix: neg.slice(0, at).map((p) => p.value).join(""),
    negSuffix: neg.slice(at + 1).map((p) => p.value).join(""),
    digits: Array.from({ length: 10 }, (_, d) => nf.format(d)),
  };
  if (CACHE.size >= CACHE_LIMIT) CACHE.clear();
  CACHE.set(key, symbols);
  return symbols;
}

function localize(decimal: string, s: Symbols, grouping: boolean): string {
  const negative = decimal.startsWith("-");
  const [int = "", frac] = (negative ? decimal.slice(1) : decimal).split(".");
  let grouped = int;
  if (grouping && s.group !== "" && int.length >= s.primary + s.minGroup) {
    const chunks = [int.slice(-s.primary)];
    let rest = int.slice(0, -s.primary);
    while (rest.length > s.secondary) {
      chunks.unshift(rest.slice(-s.secondary));
      rest = rest.slice(0, -s.secondary);
    }
    chunks.unshift(rest);
    grouped = chunks.join("\u0000");
  }
  let out = grouped + (frac === undefined ? "" : `.${frac}`);
  out = out.replace(/[0-9.\u0000]/g, (c) => (c === "." ? s.decimal : c === "\u0000" ? s.group : (s.digits[Number(c)] as string)));
  return negative ? `${s.negPrefix}${out}${s.negSuffix}` : out;
}

/**
 * Formats a quantity for display with locale-aware separators:
 * `format(quantity("1234.5", "km"), { locale: "de" })` → `"1.234,5 km"`.
 * Also accepts `(value, unit, options)`.
 */
export function format(q: Quantity, options?: FormatOptions): string;
export function format(value: ValueInput, unit: UnitName, options?: FormatOptions): string;
export function format(a: unknown, b?: unknown, c?: unknown): string {
  let q: Quantity;
  let options: unknown;
  if (isQuantity(a)) {
    q = a;
    options = b;
  } else {
    requireUnit(b);
    q = quantity(a as ValueInput, b as UnitName);
    options = c;
  }
  const precision = readPrecision(options, "half-up");
  const o = (options ?? {}) as Record<string, unknown>;
  if (o.locale !== undefined && typeof o.locale !== "string") fail("InvalidOption", `Option "locale" must be a string, got ${show(o.locale)}.`);
  if (o.grouping !== undefined && typeof o.grouping !== "boolean") fail("InvalidOption", `Option "grouping" must be a boolean, got ${show(o.grouping)}.`);
  if (o.display !== undefined && o.display !== "symbol" && o.display !== "none") {
    fail("InvalidOption", `Option "display" must be "symbol" or "none", got ${show(o.display)}.`);
  }
  const decimal = q.toDecimal({
    ...(precision.significant === undefined ? { decimals: precision.decimals ?? 3 } : { significant: precision.significant }),
    rounding: precision.rounding,
    fixed: precision.fixed,
  });
  const text = localize(decimal, symbolsFor(o.locale as string | undefined), o.grouping !== false);
  if (o.display === "none") return text;
  const symbol = requireUnit(q.unit).symbol;
  return NO_SPACE.has(q.unit) ? `${text}${symbol}` : `${text} ${symbol}`;
}
