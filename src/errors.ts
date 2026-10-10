/**
 * Machine-readable reasons why a call failed.
 *
 * - `InvalidValue`: the value is not a finite number, a decimal/fraction string or a bigint, or exceeds the input limits.
 * - `UnknownUnit`: the unit name is not in the catalogue.
 * - `IncompatibleUnits`: the units measure different dimensions (e.g. length and mass).
 * - `OutOfRange`: the value has no meaning in the target unit (below absolute zero, zero fuel economy).
 * - `InvalidOption`: an option has a wrong type or is out of range.
 */
export type ErrorCode = "InvalidValue" | "UnknownUnit" | "IncompatibleUnits" | "OutOfRange" | "InvalidOption";

/** The single error class thrown by this library. Branch on `code`. */
export class ExactUnitsError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "ExactUnitsError";
    this.code = code;
  }
}

/** Result object returned by every `try*` function. Never throws for invalid input. */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ExactUnitsError };

/** Narrowing helper: `true` when `err` is an {@link ExactUnitsError}. */
export function isExactUnitsError(err: unknown): err is ExactUnitsError {
  return err instanceof ExactUnitsError;
}

/** @internal */
export function fail(code: ErrorCode, message: string): never {
  throw new ExactUnitsError(code, message);
}

/** @internal Wraps a throwing function into a `Result`. */
export function attempt<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    if (err instanceof ExactUnitsError) return { ok: false, error: err };
    throw err;
  }
}

/** @internal Short description of an untrusted value for error messages; never throws. */
export function show(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value.length > 40 ? `${value.slice(0, 40)}…` : value);
  if (typeof value === "bigint") {
    const s = value.toString();
    return s.length > 40 ? `${s.slice(0, 40)}…n` : `${s}n`;
  }
  if (value === null || (typeof value !== "object" && typeof value !== "function")) return String(value);
  return Object.prototype.toString.call(value);
}
