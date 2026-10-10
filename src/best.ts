import { fail, show } from "./errors.js";
import { abs, cmp, ONE, ratio } from "./rational.js";
import { type Quantity, quantity } from "./quantity.js";
import type { ValueInput } from "./rational.js";
import { type Dimension, type DimensionOf, requireUnit, type UnitDef, type UnitName } from "./units/index.js";

/** Measurement system preference for {@link bestUnit}. */
export type PreferredSystem = "metric" | "imperial" | "us";

/** Options for {@link bestUnit}. */
export interface BestUnitOptions {
  /**
   * Which units to choose from. Default: the system of the input unit
   * (customary units such as `ft` or `lb` count as `imperial`; for volume and
   * fuel economy `imperial` means UK units and `us` US units).
   */
  readonly system?: PreferredSystem;
  /** Data only: use IEC binary units (KiB, MiB, …). Default: `true` when the input unit is binary. */
  readonly binary?: boolean;
}

type Ladders = Partial<Record<Dimension, Record<PreferredSystem, readonly string[]>>>;

const same = (list: readonly string[]): Record<PreferredSystem, readonly string[]> => ({ metric: list, imperial: list, us: list });

// Candidate units from smallest to largest. The chosen unit is the largest
// one in which the absolute value is at least 1 (else the smallest).
const LADDERS: Ladders = {
  length: { metric: ["mm", "cm", "m", "km"], imperial: ["in", "ft", "mi"], us: ["in", "ft", "mi"] },
  mass: { metric: ["mg", "g", "kg", "t"], imperial: ["oz", "lb"], us: ["oz", "lb"] },
  time: same(["ns", "us", "ms", "s", "min", "h", "d"]),
  area: { metric: ["mm2", "cm2", "m2", "ha", "km2"], imperial: ["in2", "ft2", "ac", "mi2"], us: ["in2", "ft2", "ac", "mi2"] },
  volume: { metric: ["mL", "L", "m3"], imperial: ["floz_imp", "pt_imp", "gal_imp"], us: ["floz_us", "gal_us"] },
  speed: { metric: ["km/h"], imperial: ["mi/h"], us: ["mi/h"] },
  temperature: { metric: ["degC"], imperial: ["degF"], us: ["degF"] },
  "temperature-difference": { metric: ["delta_degC"], imperial: ["delta_degF"], us: ["delta_degF"] },
  pressure: { metric: ["Pa", "kPa", "MPa"], imperial: ["psi", "ksi"], us: ["psi", "ksi"] },
  energy: { metric: ["J", "kJ", "MJ", "GJ"], imperial: ["BTU"], us: ["BTU"] },
  power: { metric: ["mW", "W", "kW", "MW", "GW"], imperial: ["hp"], us: ["hp"] },
  frequency: same(["Hz", "kHz", "MHz", "GHz", "THz"]),
  force: { metric: ["N", "kN"], imperial: ["lbf", "kip"], us: ["lbf", "kip"] },
  "fuel-economy": { metric: ["L/100km"], imperial: ["mpg_imp"], us: ["mpg_us"] },
};

const DATA = {
  decimalBytes: ["B", "kB", "MB", "GB", "TB", "PB"],
  binaryBytes: ["B", "KiB", "MiB", "GiB", "TiB"],
  decimalBits: ["bit", "kbit", "Mbit", "Gbit", "Tbit"],
  binaryBits: ["bit", "Kibit", "Mibit", "Gibit"],
} as const;

const SYSTEMS: readonly PreferredSystem[] = ["metric", "imperial", "us"];

function defaultSystem(def: UnitDef): PreferredSystem {
  if (def.system === "us") return "us";
  return def.system === "imperial" || def.system === "customary" ? "imperial" : "metric";
}

function ladderFor(def: UnitDef, options: Record<string, unknown>): readonly string[] | undefined {
  if (def.dimension === "data") {
    const binary = options.binary ?? /i(B|bit)$/.test(def.id);
    if (typeof binary !== "boolean") fail("InvalidOption", `Option "binary" must be a boolean, got ${show(binary)}.`);
    const bits = def.id.endsWith("bit");
    return binary ? (bits ? DATA.binaryBits : DATA.binaryBytes) : bits ? DATA.decimalBits : DATA.decimalBytes;
  }
  const system = options.system ?? defaultSystem(def);
  if (!SYSTEMS.includes(system as PreferredSystem)) fail("InvalidOption", `Option "system" must be "metric", "imperial" or "us", got ${show(system)}.`);
  return LADDERS[def.dimension]?.[system as PreferredSystem];
}

/**
 * Re-expresses a value in a human-friendly unit: the largest unit of the
 * preferred system in which the absolute value is at least 1.
 * `bestUnit(1500, "m")` → 1.5 km. Zero keeps its unit when the unit is a
 * candidate. Angles are returned unchanged.
 */
export function bestUnit<U extends UnitName>(value: ValueInput, unit: U, options?: BestUnitOptions): Quantity<DimensionOf<U>> {
  const def = requireUnit(unit);
  if (options !== undefined && options !== null && typeof options !== "object") fail("InvalidOption", `Expected an options object, got ${show(options)}.`);
  const ladder = ladderFor(def, (options ?? {}) as Record<string, unknown>);
  const q = quantity(value, unit);
  if (ladder === undefined) return q;
  if (q.numerator === 0n) return q.to((ladder.includes(def.id) ? def.id : ladder[0]) as UnitName<DimensionOf<U>>);
  const candidates = ladder.map((id) => q.to(id as UnitName<DimensionOf<U>>));
  for (let i = candidates.length - 1; i > 0; i--) {
    const c = candidates[i] as Quantity<DimensionOf<U>>;
    if (cmp(abs(ratio(c.numerator, c.denominator)), ONE) >= 0) return c;
  }
  return candidates[0] as Quantity<DimensionOf<U>>;
}
