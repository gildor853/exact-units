import { describe, expect, it } from "vitest";
import {
  DIMENSIONS,
  ExactUnitsError,
  getUnit,
  isConvertible,
  isExactUnitsError,
  isQuantity,
  isUnit,
  listUnits,
  parseQuantity,
  parseUnit,
  quantity,
  tryParseQuantity,
  tryParseUnit,
} from "../src/index.js";
import { show } from "../src/errors.js";
import { piBounds } from "../src/pi.js";
import { cmp, r } from "../src/rational.js";

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    expect(isExactUnitsError(e)).toBe(true);
    return (e as ExactUnitsError).code;
  }
  throw new Error("did not throw");
};

describe("catalogue", () => {
  it("dimensions and units", () => {
    expect(DIMENSIONS).toHaveLength(16);
    expect(listUnits()).toHaveLength(173);
    expect(listUnits("temperature").map((u) => u.id)).toEqual(["K", "degC", "degF", "degR"]);
    for (const d of DIMENSIONS) {
      const units = listUnits(d);
      expect(units.length).toBeGreaterThan(0);
      expect(units.every((u) => u.dimension === d)).toBe(true);
    }
    expect(code(() => listUnits("colour" as never))).toBe("InvalidOption");
  });

  it("names are unique and the info is frozen", () => {
    const names = listUnits().flatMap((u) => [u.id, ...u.aliases]);
    expect(new Set(names).size).toBe(names.length);
    const info = getUnit("m");
    expect(Object.isFrozen(info)).toBe(true);
    expect(Object.isFrozen(info.aliases)).toBe(true);
  });

  it("getUnit / parseUnit", () => {
    expect(getUnit("metre")).toMatchObject({ id: "m", dimension: "length", base: "m", factor: "1", kind: "linear", system: "metric" });
    expect(getUnit("°F")).toMatchObject({ id: "degF", kind: "affine", factor: "5/9", offset: "45967/180" });
    expect(getUnit("rad")).toMatchObject({ factor: "1/(2π)", rational: false, base: "turn" });
    expect(parseUnit("mph").id).toBe("mi/h");
    expect(code(() => parseUnit("MPH"))).toBe("UnknownUnit");
    expect(code(() => parseUnit(5 as never))).toBe("UnknownUnit");
    const r1 = tryParseUnit("kWh");
    expect(r1.ok && r1.value.id).toBe("kWh");
    const r2 = tryParseUnit("hasOwnProperty");
    expect(r2.ok).toBe(false);
  });

  it("isUnit / isConvertible ignore prototype keys", () => {
    expect(isUnit("km")).toBe(true);
    expect(isUnit("Km")).toBe(false);
    for (const k of ["__proto__", "constructor", "toString", "valueOf", "hasOwnProperty"]) expect(isUnit(k)).toBe(false);
    expect(isConvertible("km", "mi")).toBe(true);
    expect(isConvertible("km", "kg")).toBe(false);
    expect(isConvertible("degC", "delta_degC")).toBe(false);
    expect(isConvertible("km", "__proto__")).toBe(false);
  });
});

describe("parseQuantity", () => {
  it("number followed by a unit", () => {
    expect(parseQuantity("12.5 km").to("m").toString()).toBe("12500");
    expect(parseQuantity("-40 °F").to("degC").toString()).toBe("-40");
    expect(parseQuantity("3/4 cup").to("tbsp_us").toString()).toBe("12");
    expect(parseQuantity("90°").to("rad").toFraction()).toBe("π/2");
    expect(parseQuantity("  1e3m ").toString()).toBe("1000");
    expect(parseQuantity("5eV").unit).toBe("eV");
    expect(parseQuantity("100 km/h").unit).toBe("km/h");
    expect(parseQuantity("6 L/100km").unit).toBe("L/100km");
    expect(parseQuantity("2 square feet").unit).toBe("ft2");
    expect(parseQuantity("2 US gal").unit).toBe("gal_us");
    expect(parseQuantity("1 imp pt").to("imp fl oz").toString()).toBe("20");
  });

  it("rejects malformed text", () => {
    expect(code(() => parseQuantity("km"))).toBe("InvalidValue");
    expect(code(() => parseQuantity("12"))).toBe("UnknownUnit");
    expect(code(() => parseQuantity("12 parsecs"))).toBe("UnknownUnit");
    expect(code(() => parseQuantity("1.5/2 m"))).toBe("InvalidValue");
    expect(code(() => parseQuantity("1".repeat(1001)))).toBe("InvalidValue");
    expect(code(() => parseQuantity(12 as never))).toBe("InvalidValue");
    expect(tryParseQuantity("12 __proto__").ok).toBe(false);
    const ok = tryParseQuantity("1 ft");
    expect(ok.ok && ok.value.to("in").toString()).toBe("12");
  });

  it("long whitespace runs are linear", () => {
    const t = Date.now();
    expect(tryParseQuantity(`1${" ".repeat(998)}x`).ok).toBe(false);
    expect(Date.now() - t).toBeLessThan(200);
  });
});

describe("helpers", () => {
  it("isQuantity", () => {
    expect(isQuantity(quantity(1, "m"))).toBe(true);
    expect(isQuantity({ unit: "m" })).toBe(false);
  });

  it("show never throws", () => {
    expect(show("x".repeat(50))).toBe(`"${"x".repeat(40)}…"`);
    expect(show(10n ** 50n)).toBe(`${"1".padEnd(40, "0")}…n`);
    expect(show(5n)).toBe("5n");
    expect(show(Object.create(null))).toBe("[object Object]");
    expect(show(Symbol("s"))).toBe("Symbol(s)");
    expect(show(null)).toBe("null");
  });

  it("π bounds are rigorous and tight", () => {
    const pi1000 = r(
      "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679",
    );
    for (const digits of [5, 50, 90]) {
      const { lo, hi } = piBounds(digits);
      expect(cmp(lo, pi1000)).toBe(-1);
      expect(cmp(hi, pi1000)).toBe(1);
    }
  });
});
