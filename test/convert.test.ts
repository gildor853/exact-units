import { describe, expect, it } from "vitest";
import { convert, ExactUnitsError, listUnits, quantity, Quantity, tryConvert, type UnitId } from "../src/index.js";
import { definition } from "./helpers.js";

const err = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ExactUnitsError);
    return (e as ExactUnitsError).code;
  }
  throw new Error("did not throw");
};

describe("exact linear conversions", () => {
  it("1 in = 2.54 cm exactly", () => {
    const q = convert("1", "in", "cm");
    expect(q.toString()).toBe("2.54");
    expect(q.toFraction()).toBe("127/50");
    expect([q.numerator, q.denominator]).toEqual([127n, 50n]);
    expect(q.unit).toBe("cm");
    expect(q.dimension).toBe("length");
    expect(q.rational).toBe(true);
  });

  it("chains introduce no error", () => {
    expect(convert(1, "mi", "ft").to("in").to("m").toString()).toBe("1609.344");
    expect(convert("0.1", "m", "cm").toString()).toBe("10");
    expect(convert(0.1, "m", "mm").toString()).toBe("100");
    expect(convert(1, "gal_us", "in3").toString()).toBe("231");
    expect(convert(1, "gal_us", "L").toString()).toBe("3.785411784");
    expect(convert(1, "gal_imp", "L").toString()).toBe("4.54609");
    expect(convert(1, "pt_imp", "floz_imp").toString()).toBe("20");
    expect(convert(1, "lb", "oz").toString()).toBe("16");
    expect(convert(1, "st", "kg").toString()).toBe("6.35029318");
    expect(convert(1, "ac", "ft2").toString()).toBe("43560");
    expect(convert(1, "atm", "torr").toString()).toBe("760");
    expect(convert(1, "kcal_th", "kJ").toString()).toBe("4.184");
    expect(convert(1, "GiB", "B").toString()).toBe("1073741824");
    expect(convert(1, "GB", "GiB").toFraction()).toBe("1953125/2097152");
    expect(convert(1, "Mbit", "kB").toString()).toBe("125");
    expect(convert(1, "kn", "km/h").toString()).toBe("1.852");
    expect(convert(1, "yr", "d").toString()).toBe("365.25");
    expect(convert(1, "ly", "km").toString()).toBe("9460730472580.8");
  });

  it("psi from lbf/in² with gₙ", () => {
    expect(convert(1, "psi", "Pa").toFraction()).toBe("8896443230521/1290320000");
    expect(convert(1, "psi", "kPa").toDecimal({ decimals: 6 })).toBe("6.894757");
    expect(convert(1, "ksi", "psi").toString()).toBe("1000");
  });

  it("round-trips every unit through every unit of its dimension", () => {
    const units = listUnits();
    for (const a of units) {
      for (const b of units) {
        if (a.dimension !== b.dimension) continue;
        const value = a.dimension === "temperature" ? "300.125" : a.dimension === "fuel-economy" ? "12.375" : "-12.375";
        const there = convert(value, a.id as never, b.id as never);
        const back = there.to(a.id as never);
        expect(back.toFraction(), `${a.id} → ${b.id} → ${a.id}`).toBe(quantity(value, a.id as never).toFraction());
      }
    }
  });

  it("same unit returns the same quantity", () => {
    const q = quantity(5, "m");
    expect(q.to("m")).toBe(q);
    expect(q.to("metre")).toBe(q);
  });

  it("accepts aliases and normalises to canonical ids", () => {
    expect(convert(1, "inch", "centimetres").unit).toBe("cm");
    expect(convert(1, "µm", "nm").toString()).toBe("1000");
    expect(convert(1, "μm", "nm").toString()).toBe("1000");
    expect(convert(1, "Å", "nm").toString()).toBe("0.1");
    expect(convert(1, "\u212B", "nm").toString()).toBe("0.1");
  });
});

describe("temperature (affine) and differences", () => {
  it("absolute temperatures", () => {
    expect(convert(100, "degC", "degF").toString()).toBe("212");
    expect(convert(-40, "degF", "degC").toString()).toBe("-40");
    expect(convert(0, "degC", "K").toString()).toBe("273.15");
    expect(convert(0, "K", "degF").toString()).toBe("-459.67");
    expect(convert(0, "K", "degR").toString()).toBe("0");
    expect(convert(491.67, "degR", "degC").toString()).toBe("0");
    expect(convert(98.6, "°F", "℃").toString()).toBe("37");
    expect(convert(20, "degC", "degF").toString()).toBe("68");
    expect(convert(1, "degF", "degC").toFraction()).toBe("-155/9");
  });

  it("differences scale without offset", () => {
    expect(convert(10, "delta_degC", "delta_degF").toString()).toBe("18");
    expect(convert(18, "Δ°F", "ΔK").toString()).toBe("10");
    expect(convert(1, "delta_degR", "delta_degF").toString()).toBe("1");
    expect(convert(-5, "delta_degC", "delta_K").toString()).toBe("-5");
  });

  it("rejects temperatures below absolute zero", () => {
    expect(err(() => convert(-274, "degC", "K"))).toBe("OutOfRange");
    expect(err(() => quantity("-0.01", "K"))).toBe("OutOfRange");
    expect(err(() => quantity(-460, "degF"))).toBe("OutOfRange");
    expect(err(() => quantity(-1, "degR"))).toBe("OutOfRange");
    expect(convert(-273.15, "degC", "K").toString()).toBe("0");
    expect(convert(-1, "delta_K", "delta_degC").toString()).toBe("-1");
  });

  it("absolute and difference units do not mix", () => {
    expect(err(() => convert(1, "degC" as never, "delta_degC" as never))).toBe("IncompatibleUnits");
  });
});

describe("fuel economy (reciprocal)", () => {
  it("L/100km ↔ mpg", () => {
    expect(convert(30, "mpg_us", "L/100km").toDecimal({ decimals: 4 })).toBe("7.8405");
    expect(convert(1, "mpg_us", "L/100km").toFraction()).toBe(convert(1, "L/100km", "mpg_us").toFraction());
    expect(convert(5, "L/100km", "km/L").toString()).toBe("20");
    expect(convert(20, "km/L", "L/100km").toString()).toBe("5");
    expect(convert(1, "mpg_imp", "mpg_us").toFraction()).toBe(definition("3.785411784/4.54609"));
    expect(convert(1, "mpg_imp", "mpg_us").toString()).toBe("0.83267418462898886736");
    expect(convert(10, "km/L", "mpg_us").to("km/L").toString()).toBe("10");
  });

  it("zero has no reciprocal", () => {
    expect(err(() => convert(0, "L/100km", "mpg_us"))).toBe("OutOfRange");
    expect(err(() => convert(0, "mpg_us", "km/L"))).toBe("OutOfRange");
    expect(convert(0, "L/100km", "L/100km").toString()).toBe("0");
  });

  it("negative values are rejected", () => {
    expect(err(() => quantity(-1, "L/100km"))).toBe("OutOfRange");
    expect(err(() => convert(-30, "mpg_us", "km/L"))).toBe("OutOfRange");
  });
});

describe("angles and π", () => {
  it("degree, gon, arcminute, arcsecond and turn are exact", () => {
    expect(convert(1, "turn", "deg").toString()).toBe("360");
    expect(convert(90, "deg", "grad").toString()).toBe("100");
    expect(convert(1, "deg", "arcsec").toString()).toBe("3600");
    expect(convert(1, "mil_nato", "arcmin").toString()).toBe("3.375");
    expect(convert(90, "deg", "turn").rational).toBe(true);
  });

  it("radians keep π symbolic", () => {
    const q = convert(90, "deg", "rad");
    expect(q.rational).toBe(false);
    expect(q.piPower).toBe(1);
    expect(q.toFraction()).toBe("π/2");
    expect(q.toNumber()).toBe(Math.PI / 2);
    expect(q.toString()).toBe("1.5707963267948966192");
    expect(q.toDecimal({ decimals: 50 })).toBe("1.57079632679489661923132169163975144209858469968755");
    expect(q.to("deg").toString()).toBe("90");
    expect(q.to("deg").rational).toBe(true);
    expect(convert(1, "rad", "deg").toFraction()).toBe("180/π");
    expect(convert(1, "rad", "deg").toDecimal({ decimals: 30 })).toBe("57.295779513082320876798154814105");
    expect(convert(1, "rad", "grad").toFraction()).toBe("200/π");
    expect(convert(3, "rad", "turn").toFraction()).toBe("3/(2π)");
    expect(convert(-180, "deg", "rad").toFraction()).toBe("-π");
    expect(convert(270, "deg", "rad").toFraction()).toBe("3π/2");
    expect(convert(360, "deg", "mrad").toFraction()).toBe("2000π");
    expect(convert(1, "mrad", "rad").toString()).toBe("0.001");
    expect(convert(0, "deg", "rad").rational).toBe(true);
    expect(convert(0, "deg", "rad").toFraction()).toBe("0");
  });

  it("π decimals are correctly rounded in every mode", () => {
    const q = convert(180, "deg", "rad"); // π
    expect(q.toDecimal({ decimals: 4, rounding: "trunc" })).toBe("3.1415");
    expect(q.toDecimal({ decimals: 4, rounding: "half-up" })).toBe("3.1416");
    expect(q.toDecimal({ decimals: 4, rounding: "floor" })).toBe("3.1415");
    expect(q.toDecimal({ decimals: 4, rounding: "ceil" })).toBe("3.1416");
    expect(convert(-180, "deg", "rad").toDecimal({ decimals: 2, rounding: "floor" })).toBe("-3.15");
    expect(q.toDecimal({ significant: 3 })).toBe("3.14");
    const many = q.toDecimal({ decimals: 1000 });
    expect(many.slice(0, 12)).toBe("3.1415926535");
    expect(many.slice(-10)).toBe("2164201989"); // digits 991–1000 of π
    expect(convert(1, "rad", "deg").toNumber()).toBe(180 / Math.PI);
    expect(convert("1e-300", "rad", "turn").toNumber()).toBe(1e-300 / (2 * Math.PI));
  });
});

describe("input values", () => {
  it("numbers, strings, bigints and fractions", () => {
    expect(quantity(1.5, "m").toString()).toBe("1.5");
    expect(quantity(-0, "m").toString()).toBe("0");
    expect(quantity(1e21, "m").toString()).toBe("1000000000000000000000");
    expect(quantity(5e-324, "m").toFraction()).toBe(`1/${10n ** 324n / 5n}`);
    expect(quantity(10n, "m").toString()).toBe("10");
    expect(quantity(" 2.5e3 ", "m").toString()).toBe("2500");
    expect(quantity(".5", "m").toString()).toBe("0.5");
    expect(quantity("5.", "m").toString()).toBe("5");
    expect(quantity("+1E-2", "m").toString()).toBe("0.01");
    expect(quantity("-1/3", "m").toFraction()).toBe("-1/3");
    expect(quantity("6/4", "m").toFraction()).toBe("3/2");
  });

  it("rejects invalid values", () => {
    for (const v of ["", " ", ".", "e5", "1e", "1..2", "0x10", "1_000", "Infinity", "NaN", "1/0", "1/-2", "1.5/2", "--1", "1e1001", "1e0000001"]) {
      expect(err(() => quantity(v, "m")), v).toBe("InvalidValue");
    }
    for (const v of [Number.NaN, Number.POSITIVE_INFINITY, null, undefined, {}, [], true]) {
      expect(err(() => quantity(v as never, "m"))).toBe("InvalidValue");
    }
    expect(err(() => quantity("1".repeat(1001), "m"))).toBe("InvalidValue");
    expect(err(() => quantity(10n ** 1000n + 1n, "m"))).toBe("InvalidValue");
    expect(err(() => quantity(-(10n ** 1000n) - 1n, "m"))).toBe("InvalidValue");
    expect(quantity(10n ** 1000n, "m").numerator).toBe(10n ** 1000n);
    expect(quantity("1e1000", "m").numerator).toBe(10n ** 1000n);
    expect(quantity("1e-1000", "m").denominator).toBe(10n ** 1000n);
  });

  it("huge inputs stay fast", () => {
    const t = Date.now();
    convert(`${"9".repeat(999)}`, "ly", "nm").toDecimal({ significant: 1000 });
    convert(`0.${"7".repeat(990)}e-1000`, "mpg_us", "L/100km").toDecimal({ significant: 1000 });
    convert("1e1000", "rad", "deg").toDecimal({ decimals: 1000 });
    expect(Date.now() - t).toBeLessThan(2000);
  });
});

describe("output", () => {
  it("rounding modes", () => {
    const cases: Array<[string, string, string, string, string, string]> = [
      // value, half-up, half-even, trunc, floor, ceil (to 0 decimals)
      ["2.5", "3", "2", "2", "2", "3"],
      ["3.5", "4", "4", "3", "3", "4"],
      ["-2.5", "-3", "-2", "-2", "-3", "-2"],
      ["2.4", "2", "2", "2", "2", "3"],
      ["-2.6", "-3", "-3", "-2", "-3", "-2"],
      ["-0.4", "0", "0", "0", "-1", "0"],
    ];
    for (const [v, ...expected] of cases) {
      const q = quantity(v, "m");
      const got = (["half-up", "half-even", "trunc", "floor", "ceil"] as const).map((rounding) => q.toDecimal({ decimals: 0, rounding }));
      expect(got, v).toEqual(expected);
    }
  });

  it("decimals, significant digits and fixed", () => {
    const q = convert(1, "ft", "m");
    expect(q.toDecimal({ decimals: 2 })).toBe("0.3");
    expect(q.toDecimal({ decimals: 2, fixed: true })).toBe("0.30");
    expect(q.toDecimal({ decimals: 6, fixed: true })).toBe("0.304800");
    expect(q.toDecimal({ significant: 2 })).toBe("0.3");
    expect(quantity("123456", "m").toDecimal({ significant: 2 })).toBe("120000");
    expect(quantity("987654", "m").toDecimal({ significant: 1, rounding: "ceil" })).toBe("1000000");
    expect(quantity("0.000123456", "m").toDecimal({ significant: 3 })).toBe("0.000123");
    expect(quantity(0, "m").toDecimal({ significant: 3, fixed: true })).toBe("0.00");
    expect(quantity("-0.0004", "m").toDecimal({ decimals: 3 })).toBe("0");
    expect(quantity("1/3", "m").toString()).toBe("0.33333333333333333333");
    expect(quantity("2/3", "m").toDecimal({ decimals: 3, rounding: "trunc" })).toBe("0.666");
    expect(quantity("1/1024", "m").toString()).toBe("0.0009765625");
  });

  it("trailing-zero trimming is linear on long zero runs", () => {
    const t = Date.now();
    const q = quantity(`1${"0".repeat(998)}1`, "m");
    for (let i = 0; i < 50; i++) q.toDecimal({ decimals: 1000 });
    expect(q.toDecimal({ decimals: 1000 })).toBe(`1${"0".repeat(998)}1`);
    expect(quantity(`0.${"0".repeat(990)}1`, "m").toDecimal({ decimals: 1000 })).toBe(`0.${"0".repeat(990)}1`);
    expect(Date.now() - t).toBeLessThan(1000);
  });

  it("rejects bad output options", () => {
    const q = quantity(1, "m");
    for (const o of [{ decimals: -1 }, { decimals: 1.5 }, { decimals: 1001 }, { significant: 0 }, { decimals: 1, significant: 1 }, { rounding: "up" }, { fixed: 1 }, { decimals: "2" }, 5, "x"]) {
      expect(err(() => q.toDecimal(o as never)), JSON.stringify(o)).toBe("InvalidOption");
    }
    expect(q.toDecimal(null as never)).toBe("1");
  });

  it("toNumber is correctly rounded", () => {
    expect(quantity("0.1", "m").toNumber()).toBe(0.1);
    expect(quantity("1/3", "m").toNumber()).toBe(1 / 3);
    expect(quantity("-2.5e-320", "m").toNumber()).toBe(-2.5e-320);
    expect(quantity("1e400", "m").toNumber()).toBe(Number.POSITIVE_INFINITY);
    expect(quantity("1e-400", "m").toNumber()).toBe(0);
    expect(quantity(Number.MAX_VALUE, "m").toNumber()).toBe(Number.MAX_VALUE);
    expect(quantity(Number.MIN_VALUE, "m").toNumber()).toBe(Number.MIN_VALUE);
    expect(quantity(String(2n ** 53n + 1n), "m").toNumber()).toBe(2 ** 53); // tie → even
    expect(quantity(String(2n ** 53n + 3n), "m").toNumber()).toBe(2 ** 53 + 4);
    expect(convert(1, "eV", "J").toNumber()).toBe(1.602176634e-19);
    // random terminating decimals: compare with the engine's own decimal parser
    let seed = 42;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
    for (let i = 0; i < 2000; i++) {
      const digits = String(rnd()) + String(rnd());
      const exp = (rnd() % 700) - 350;
      const text = `${rnd() % 2 ? "-" : ""}${digits}e${exp}`;
      expect(quantity(text, "m").toNumber(), text).toBe(Number(text));
    }
  });

  it("JSON", () => {
    expect(JSON.stringify(convert(1, "ft", "cm"))).toBe('{"value":"30.48","unit":"cm"}');
    expect(String(convert(1, "ft", "cm"))).toBe("30.48");
  });

  it("Quantity cannot be constructed directly and is frozen", () => {
    expect(err(() => new (Quantity as unknown as new () => unknown)())).toBe("InvalidValue");
    const q = quantity(1, "m");
    expect(Object.isFrozen(q)).toBe(true);
  });
});

describe("tryConvert", () => {
  it("returns results for untrusted input", () => {
    const ok = tryConvert("1", "in", "cm");
    expect(ok.ok && ok.value.toString()).toBe("2.54");
    const codes = (r: ReturnType<typeof tryConvert>) => (r.ok ? "ok" : r.error.code);
    expect(codes(tryConvert("1", "km", "kg"))).toBe("IncompatibleUnits");
    expect(codes(tryConvert("1", "furlongs/fortnight", "m"))).toBe("UnknownUnit");
    expect(codes(tryConvert("1", "m", "MM"))).toBe("UnknownUnit");
    expect(codes(tryConvert("abc", "m", "km"))).toBe("InvalidValue");
    expect(codes(tryConvert(1, "__proto__", "m"))).toBe("UnknownUnit");
    expect(codes(tryConvert(1, "constructor", "toString"))).toBe("UnknownUnit");
    expect(codes(tryConvert(-300, "degC", "K"))).toBe("OutOfRange");
    expect(codes(tryConvert(1, "m" as UnitId, 5))).toBe("UnknownUnit");
  });
});
