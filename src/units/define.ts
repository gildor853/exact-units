import { div, mul, ONE, pow, r, type Ratio } from "../rational.js";

/**
 * Where a unit comes from, for `bestUnit` defaults and documentation.
 * - `metric`: SI units, SI-prefixed units and metric units accepted with the SI (litre, tonne, bar, …).
 * - `customary`: units shared by US customary and imperial (inch, foot, pound, …; 1959 definitions).
 * - `us` / `imperial`: units that differ between the two systems (gallon, pint, …).
 * - `other`: everything else (nautical, astronomical, data, angle, …).
 */
export type UnitSystem = "metric" | "customary" | "us" | "imperial" | "other";

/** How a value in this unit maps to the dimension's base unit. */
export type UnitKind = "linear" | "affine" | "reciprocal";

/** @internal */
export interface UnitSpec {
  readonly name: string;
  readonly symbol: string;
  readonly aliases: readonly string[];
  /** linear: base = v·factor; affine: base = v·factor + offset; reciprocal: base = factor / v. */
  readonly factor: Ratio;
  readonly offset?: Ratio;
  readonly kind?: UnitKind;
  /** The factor is additionally multiplied by π^pi (radian-based angles). */
  readonly pi?: number;
  readonly system: UnitSystem;
  readonly source: string;
}

/**
 * @internal Identity helper that keeps ids and aliases as literal types. The
 * declared type exposes only the aliases, which is all the public types need
 * (keeps the emitted .d.ts small).
 */
export function units<const T extends Record<string, UnitSpec>>(spec: T): { readonly [K in keyof T]: { readonly aliases: T[K]["aliases"] } } {
  return spec;
}

/** @internal Product of exact constants (`"0.0254"`, `"1/3"`, numbers, ratios). */
export function x(...parts: Array<Ratio | string | number>): Ratio {
  return parts.reduce<Ratio>((acc, p) => mul(acc, typeof p === "object" ? p : r(String(p))), ONE);
}

/** @internal a / b of exact constants. */
export function per(a: Ratio | string | number, b: Ratio | string | number): Ratio {
  return div(x(a), x(b));
}

export { pow };

// Sources, cited per unit (see README "Sources").
export const SRC = {
  SI: "SI Brochure, 9th ed. (BIPM 2019): SI unit / SI prefix",
  SI_T8: "SI Brochure, 9th ed. (BIPM 2019), Table 8: non-SI unit accepted for use with the SI",
  SI_TEMP: "SI Brochure, 9th ed. (BIPM 2019), 2.3.1: t/°C = T/K − 273.15",
  YP1959: "International yard and pound agreement (1959): 1 yd = 0.9144 m, 1 lb = 0.45359237 kg; NIST SP 811 Appendix B.8",
  HB44: "NIST Handbook 44 (2024), Appendix C: general tables of units of measurement",
  NIST: "NIST SP 811 (2008), Appendix B.8",
  WMA: "UK Weights and Measures Act 1985, Schedule 1: 1 gallon = 4.54609 dm³",
  IAU: "IAU 2012 Resolution B2 (astronomical unit); SI Brochure, 9th ed., Table 8",
  IAU_JY: "IAU: Julian year = 365.25 d; light-year = c × Julian year, c = 299792458 m/s (SI Brochure, 9th ed.)",
  IEC: "IEC 80000-13:2008: bit, byte (octet) = 8 bit, binary prefixes Ki/Mi/Gi/Ti",
  CSS: "W3C CSS Values and Units Level 3: 1 pt = 1/72 in",
  GN: "Standard acceleration of gravity gₙ = 9.80665 m/s² (3rd CGPM 1901); NIST SP 811 Appendix B.8",
  DERIVED: "Derived from the definitions of its component units",
} as const;
