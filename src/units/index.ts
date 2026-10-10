import { fail, show } from "../errors.js";
import { fractionString, type Ratio, ZERO } from "../rational.js";
import { BASE_UNITS, CATALOG } from "./catalog.js";
import type { UnitKind, UnitSpec, UnitSystem } from "./define.js";

export type { UnitKind, UnitSystem };

type Catalog = typeof CATALOG;

/** A physical dimension, e.g. `"length"` or `"fuel-economy"`. */
export type Dimension = keyof Catalog;

type IdsByDimension = { [D in Dimension]: keyof Catalog[D] & string };
type AliasesByDimension = {
  [D in Dimension]: { [K in keyof Catalog[D]]: Catalog[D][K] extends { readonly aliases: readonly (infer A)[] } ? A : never }[keyof Catalog[D]];
};

/** Canonical unit id, optionally restricted to one dimension: `UnitId<"length">` is `"m" | "km" | …`. */
export type UnitId<D extends Dimension = Dimension> = IdsByDimension[D];

/** Any accepted unit name (canonical id or alias), optionally restricted to one dimension. */
export type UnitName<D extends Dimension = Dimension> = IdsByDimension[D] | AliasesByDimension[D];

/** The dimension a unit name belongs to: `DimensionOf<"km">` is `"length"`. */
export type DimensionOf<U extends UnitName> = { [D in Dimension]: U extends UnitName<D> ? D : never }[Dimension];

/** Public, frozen description of a unit. */
export interface UnitInfo<D extends Dimension = Dimension> {
  /** Canonical id, used by every function that returns a unit. */
  readonly id: UnitId<D>;
  readonly dimension: D;
  readonly name: string;
  /** Display symbol (not necessarily unique, e.g. `gal` for US and imperial gallons). */
  readonly symbol: string;
  /** Other accepted names. Matching is exact and case-sensitive (`mB` is not `MB`). */
  readonly aliases: readonly string[];
  readonly system: UnitSystem;
  readonly kind: UnitKind;
  /** The dimension's base unit. */
  readonly base: UnitId<D>;
  /**
   * Exact factor to the base unit as a fraction (`"127/5000"`); radian-based
   * angles contain π (`"1/(2π)"`).
   */
  readonly factor: string;
  /** Affine units only: base = value × factor + offset. */
  readonly offset?: string;
  /** `false` only for units whose factor involves π. */
  readonly rational: boolean;
  /** Where the definition comes from. */
  readonly source: string;
}

/** @internal Runtime unit record. */
export interface UnitDef {
  readonly id: string;
  readonly dimension: Dimension;
  readonly kind: UnitKind;
  readonly factor: Ratio;
  readonly offset: Ratio;
  readonly pi: number;
  readonly system: UnitSystem;
  readonly symbol: string;
  readonly info: UnitInfo;
}

const BY_NAME = new Map<string, UnitDef>();
const BY_DIMENSION = new Map<Dimension, UnitDef[]>();

/** @internal "π/2"-style rendering of q·π^k. */
export function piFraction(q: Ratio, k: number): string {
  if (k === 0 || q.n === 0n) return fractionString(q);
  const pi = k === 1 || k === -1 ? "π" : `π^${Math.abs(k)}`;
  if (k > 0) {
    const num = q.n === 1n ? pi : q.n === -1n ? `-${pi}` : `${q.n}${pi}`;
    return q.d === 1n ? num : `${num}/${q.d}`;
  }
  return q.d === 1n ? `${q.n}/${pi}` : `${q.n}/(${q.d}${pi})`;
}

for (const dimension of Object.keys(CATALOG) as Dimension[]) {
  const list: UnitDef[] = [];
  const group = CATALOG[dimension] as unknown as Record<string, UnitSpec>;
  for (const id of Object.keys(group)) {
    const spec = group[id] as UnitSpec;
    const kind: UnitKind = spec.kind ?? "linear";
    const pi = spec.pi ?? 0;
    const info: UnitInfo = Object.freeze({
      id: id as UnitId,
      dimension,
      name: spec.name,
      symbol: spec.symbol,
      aliases: Object.freeze([...spec.aliases]),
      system: spec.system,
      kind,
      base: BASE_UNITS[dimension] as UnitId,
      factor: piFraction(spec.factor, pi),
      ...(spec.offset ? { offset: fractionString(spec.offset) } : {}),
      rational: pi === 0,
      source: spec.source,
    });
    const def: UnitDef = Object.freeze({
      id,
      dimension,
      kind,
      factor: spec.factor,
      offset: spec.offset ?? ZERO,
      pi,
      system: spec.system,
      symbol: spec.symbol,
      info,
    });
    list.push(def);
    for (const name of [id, ...spec.aliases]) {
      /* v8 ignore next */
      if (BY_NAME.has(name)) throw new Error(`exact-units: duplicate unit name ${name}`);
      BY_NAME.set(name, def);
    }
  }
  BY_DIMENSION.set(dimension, list);
}

/** All dimensions, in catalogue order. */
export const DIMENSIONS: readonly Dimension[] = Object.freeze(Object.keys(CATALOG) as Dimension[]);

/** @internal */
export function lookup(name: unknown): UnitDef | undefined {
  return typeof name === "string" ? BY_NAME.get(name) : undefined;
}

/** @internal */
export function requireUnit(name: unknown): UnitDef {
  const def = lookup(name);
  if (def === undefined) {
    fail("UnknownUnit", typeof name === "string" ? `Unknown unit ${show(name)}.` : `Expected a unit name (string), got ${show(name)}.`);
  }
  return def;
}

/** @internal */
export function unitsOf(dimension: Dimension): readonly UnitDef[] {
  return BY_DIMENSION.get(dimension) as UnitDef[];
}

/** `true` when `name` is a known unit id or alias. Never throws. */
export function isUnit(name: unknown): name is UnitName {
  return lookup(name) !== undefined;
}
