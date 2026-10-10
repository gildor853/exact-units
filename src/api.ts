import { attempt, fail, type Result, show } from "./errors.js";
import { type Quantity, quantity } from "./quantity.js";
import { MAX_INPUT_LENGTH, type ValueInput } from "./rational.js";
import { type Dimension, DIMENSIONS, type DimensionOf, lookup, requireUnit, type UnitInfo, type UnitName, unitsOf } from "./units/index.js";

/** Describes a unit by id or alias: `getUnit("metre").id` → `"m"`. */
export function getUnit<U extends UnitName>(name: U): UnitInfo<DimensionOf<U>> {
  return requireUnit(name).info as unknown as UnitInfo<DimensionOf<U>>;
}

/** Like {@link getUnit} for untrusted strings; throws `UnknownUnit`. */
export function parseUnit(name: string): UnitInfo {
  return requireUnit(name).info;
}

/** Non-throwing {@link parseUnit}. */
export function tryParseUnit(name: unknown): Result<UnitInfo> {
  return attempt(() => requireUnit(name).info);
}

/** All units, or the units of one dimension, in catalogue order. */
export function listUnits<D extends Dimension>(dimension?: D): Array<UnitInfo<D>> {
  if (dimension === undefined) return DIMENSIONS.flatMap((d) => unitsOf(d).map((u) => u.info)) as unknown as Array<UnitInfo<D>>;
  if (!DIMENSIONS.includes(dimension)) fail("InvalidOption", `Unknown dimension ${show(dimension)}.`);
  return unitsOf(dimension).map((u) => u.info) as unknown as Array<UnitInfo<D>>;
}

/** `true` when both are known units of the same dimension. Never throws. */
export function isConvertible(from: unknown, to: unknown): boolean {
  const a = lookup(from);
  const b = lookup(to);
  return a !== undefined && b !== undefined && a.dimension === b.dimension;
}

/**
 * Non-throwing {@link convert} for untrusted input: any value and unit names
 * are accepted at the type level and validated at runtime.
 */
export function tryConvert(value: unknown, from: unknown, to: unknown): Result<Quantity> {
  return attempt(() => quantity(value as ValueInput, requireUnit(from).id as UnitName).to(requireUnit(to).id as never));
}

const NUMBER_PREFIX = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?(?:\/\d+)?/;

/**
 * Parses text such as `"12.5 km"`, `"-40 °F"`, `"3/4 cup"` or `"90°"`: a
 * number followed by a unit id or alias (whitespace between is optional).
 */
export function parseQuantity(text: string): Quantity {
  if (typeof text !== "string") fail("InvalidValue", `Expected a string, got ${show(text)}.`);
  if (text.length > MAX_INPUT_LENGTH) fail("InvalidValue", `The text is longer than ${MAX_INPUT_LENGTH} characters.`);
  const trimmed = text.trim();
  const m = NUMBER_PREFIX.exec(trimmed);
  if (!m) fail("InvalidValue", `Expected a number followed by a unit, got ${show(text)}.`);
  const unit = trimmed.slice(m[0].length).trim();
  if (unit === "") fail("UnknownUnit", `Missing unit in ${show(text)}.`);
  return quantity(m[0], requireUnit(unit).id as UnitName);
}

/** Non-throwing {@link parseQuantity}. */
export function tryParseQuantity(text: unknown): Result<Quantity> {
  return attempt(() => parseQuantity(text as string));
}
