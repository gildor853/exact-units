import { describe, expect, it } from "vitest";
import { bestUnit, convert, ExactUnitsError, format, quantity } from "../src/index.js";

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ExactUnitsError);
    return (e as ExactUnitsError).code;
  }
  throw new Error("did not throw");
};
const show = (q: { toString(): string; unit: string }) => `${q.toString()} ${q.unit}`;

describe("bestUnit", () => {
  it("picks the largest unit with |value| ≥ 1", () => {
    expect(show(bestUnit(1500, "m"))).toBe("1.5 km");
    expect(show(bestUnit(999, "m"))).toBe("999 m");
    expect(show(bestUnit("0.0004", "km"))).toBe("40 cm");
    expect(show(bestUnit("0.0000004", "km"))).toBe("0.4 mm");
    expect(show(bestUnit(-2500, "g"))).toBe("-2.5 kg");
    expect(show(bestUnit(90, "min"))).toBe("1.5 h");
    expect(show(bestUnit(5280, "ft"))).toBe("1 mi");
    expect(show(bestUnit(5000, "ft"))).toBe("5000 ft");
    expect(show(bestUnit(1, "mi", { system: "metric" }))).toBe("1.609344 km");
    expect(show(bestUnit(1, "km", { system: "imperial" }))).toBe(`${convert(1, "km", "ft").toString()} ft`);
    expect(show(bestUnit(2, "L", { system: "us" }))).toBe(`${convert(2, "L", "floz_us").toString()} floz_us`);
    expect(show(bestUnit(10, "L", { system: "us" }))).toBe(`${convert(10, "L", "gal_us").toString()} gal_us`);
    expect(show(bestUnit(1, "L", { system: "imperial" }))).toBe(`${convert(1, "L", "pt_imp").toString()} pt_imp`);
    expect(show(bestUnit(1, "gal_us"))).toBe("1 gal_us");
    expect(show(bestUnit(100, "degF", { system: "metric" }))).toBe(`${convert(100, "degF", "degC").toString()} degC`);
    expect(show(bestUnit(20, "degC"))).toBe("20 degC");
    expect(show(bestUnit(37, "K"))).toBe(`${convert(37, "K", "degC").toString()} degC`);
    expect(show(bestUnit(5, "delta_K"))).toBe("5 delta_degC");
    expect(show(bestUnit(30, "mpg_us", { system: "metric" }))).toBe(`${convert(30, "mpg_us", "L/100km").toString()} L/100km`);
    expect(show(bestUnit(1, "hp", { system: "metric" }))).toBe("745.69987158227022 W");
    expect(show(bestUnit(2.5e9, "Hz"))).toBe("2.5 GHz");
    expect(show(bestUnit(1, "kip", { system: "metric" }))).toBe("4.4482216152605 kN");
  });

  it("data units follow the input's decimal/binary and bit/byte family", () => {
    expect(show(bestUnit(3e9, "B"))).toBe("3 GB");
    expect(show(bestUnit(3 * 2 ** 30, "B", { binary: true }))).toBe("3 GiB");
    expect(show(bestUnit(1536, "KiB"))).toBe("1.5 MiB");
    expect(show(bestUnit(1, "TB", { binary: true }))).toBe(`${convert(1, "TB", "GiB").toString()} GiB`);
    expect(show(bestUnit(2, "TB", { binary: true }))).toBe(`${convert(2, "TB", "TiB").toString()} TiB`);
    expect(show(bestUnit(1e9, "bit"))).toBe("1 Gbit");
    expect(show(bestUnit(2048, "Kibit"))).toBe("2 Mibit");
    expect(show(bestUnit(1500, "Kibit", { binary: false }))).toBe("1.536 Mbit");
  });

  it("zero, angles and systems without a ladder", () => {
    expect(show(bestUnit(0, "km"))).toBe("0 km");
    expect(show(bestUnit(0, "yd"))).toBe("0 in");
    expect(show(bestUnit(0, "ft", { system: "metric" }))).toBe("0 mm");
    expect(show(bestUnit(720, "deg"))).toBe("720 deg");
    expect(bestUnit(1, "rad").unit).toBe("rad");
    expect(show(bestUnit(1, "nmi"))).toBe("1.852 km");
    expect(code(() => bestUnit(0, "L/100km", { system: "us" }))).toBe("OutOfRange");
  });

  it("validates options", () => {
    expect(code(() => bestUnit(1, "m", { system: "SI" as never }))).toBe("InvalidOption");
    expect(code(() => bestUnit(1, "B", { binary: "yes" as never }))).toBe("InvalidOption");
    expect(code(() => bestUnit(1, "m", 5 as never))).toBe("InvalidOption");
    expect(show(bestUnit(1500, "m", null as never))).toBe("1.5 km");
    expect(code(() => bestUnit(1, "parsec" as never))).toBe("UnknownUnit");
  });
});

describe("format", () => {
  it("formats with locale separators and the unit symbol", () => {
    expect(format(convert(1, "in", "cm"))).toMatch(/^2[.,]54 cm$/);
    expect(format(quantity("1234567.891", "m"), { locale: "en-US" })).toBe("1,234,567.891 m");
    expect(format("1234567.891", "m", { locale: "de-DE" })).toBe("1.234.567,891 m");
    expect(format("1234.5", "km", { locale: "cs-CZ" })).toBe("1\u00a0234,5 km");
    expect(format("1234.5", "km", { locale: "es-ES" })).toBe("1234,5 km"); // no grouping below 5 digits
    expect(format("12345.5", "km", { locale: "es-ES" })).toBe("12.345,5 km");
    expect(format("-1234567.5", "m", { locale: "en-IN" })).toBe("-12,34,567.5 m");
    expect(format("12345.678", "m", { locale: "ar-EG" })).toBe("١٢٬٣٤٥٫٦٧٨ m");
    expect(format(-5, "degC", { locale: "en-US" })).toBe("-5 °C");
    expect(format(90, "deg", { locale: "en-US" })).toBe("90°");
    expect(format(convert(1, "rad", "deg"), { locale: "en-US", decimals: 2 })).toBe("57.3°");
    expect(format(30, "arcmin", { locale: "en-US" })).toBe("30′");
    // US and imperial units with the same traditional symbol are told apart
    expect(format(1, "gal_imp", { locale: "en-GB" })).toBe("1 imp gal");
    expect(format(1, "gal_us", { locale: "en-US" })).toBe("1 US gal");
    expect(format(40, "mpg_imp", { locale: "en-GB" })).toBe("40 mpg (imp)");
  });

  it("precision options", () => {
    expect(format("2.0005", "m", { locale: "en-US" })).toBe("2.001 m"); // default 3 decimals, half-up
    expect(format("2.0005", "m", { locale: "en-US", rounding: "half-even" })).toBe("2 m");
    expect(format("2.5", "m", { locale: "en-US", decimals: 2, fixed: true })).toBe("2.50 m");
    expect(format("123456", "m", { locale: "en-US", significant: 2 })).toBe("120,000 m");
    expect(format("1234567", "m", { locale: "en-US", grouping: false })).toBe("1234567 m");
    expect(format("1234567", "m", { locale: "en-US", display: "none" })).toBe("1,234,567");
    expect(format(convert(1, "mi", "m"), { locale: "fr-FR" })).toBe("1\u202f609,344 m");
    expect(format("1e30", "m", { locale: "en-US" })).toBe("1,000,000,000,000,000,000,000,000,000,000 m");
  });

  it("validates arguments", () => {
    expect(code(() => format(1, "m", { locale: "not a locale!" }))).toBe("InvalidOption");
    expect(code(() => format(1, "m", { locale: 5 as never }))).toBe("InvalidOption");
    expect(code(() => format(1, "m", { grouping: "no" as never }))).toBe("InvalidOption");
    expect(code(() => format(1, "m", { display: "name" as never }))).toBe("InvalidOption");
    expect(code(() => format(1, "m", { decimals: -1 }))).toBe("InvalidOption");
    expect(code(() => format(1, "lightyear" as never))).toBe("UnknownUnit");
    expect(code(() => format("x", "m"))).toBe("InvalidValue");
    expect(format(1, "m", null as never)).toMatch(/^1 m$/);
  });

  it("caches a bounded number of locales", () => {
    const tags = ["en", "de", "fr", "cs", "sk", "pl", "it", "es", "pt", "nl", "sv", "da", "fi", "nb", "hu", "ro", "bg", "el", "tr", "ru", "uk", "ja", "zh", "ko", "he", "ar", "hi", "th", "vi", "id", "ms", "lt", "lv", "et"];
    for (const t of tags) expect(format(1, "m", { locale: t })).toContain("m");
  });
});
