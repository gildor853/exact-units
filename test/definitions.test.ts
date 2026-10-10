import { describe, expect, it } from "vitest";
import { convert, getUnit, listUnits, type UnitId } from "../src/index.js";
import { definition } from "./helpers.js";

// Every unit's factor to its dimension's base unit, written from the cited
// definition (see README "Sources"): published exact decimals where they
// terminate, otherwise the defining expression. Angles are in turns.
const FACTORS: Record<UnitId, string> = {
  // length (m)
  m: "1", km: "1000", dm: "0.1", cm: "0.01", mm: "0.001", um: "1e-6", nm: "1e-9", angstrom: "1e-10",
  in: "0.0254", ft: "0.3048", yd: "0.9144", mi: "1609.344", nmi: "1852", mil: "0.0000254",
  fathom: "1.8288", furlong: "201.168", point: "0.0254/72", au: "149597870700", ly: "9460730472580800",
  // mass (kg)
  kg: "1", g: "0.001", mg: "1e-6", ug: "1e-9", t: "1000", lb: "0.45359237", oz: "0.028349523125",
  st: "6.35029318", gr: "0.00006479891", ton_us: "907.18474", ton_uk: "1016.0469088",
  oz_t: "0.0311034768", dwt: "0.00155517384", ct: "0.0002", slug: "0.45359237*9.80665/0.3048",
  // time (s)
  s: "1", ms: "0.001", us: "1e-6", ns: "1e-9", min: "60", h: "3600", d: "86400", wk: "604800", yr: "31557600",
  // area (m²)
  m2: "1", km2: "1e6", cm2: "1e-4", mm2: "1e-6", ha: "1e4", are: "100", in2: "0.00064516",
  ft2: "0.09290304", yd2: "0.83612736", mi2: "2589988.110336", ac: "4046.8564224",
  // volume (m³)
  m3: "1", cm3: "1e-6", L: "0.001", hL: "0.1", dL: "1e-4", cL: "1e-5", mL: "1e-6", uL: "1e-9",
  in3: "0.000016387064", ft3: "0.028316846592", yd3: "0.764554857984",
  gal_us: "0.003785411784", qt_us: "0.000946352946", pt_us: "0.000473176473", cup_us: "0.0002365882365",
  floz_us: "0.0000295735295625", tbsp_us: "0.00001478676478125", tsp_us: "0.00000492892159375",
  gal_imp: "0.00454609", qt_imp: "0.0011365225", pt_imp: "0.00056826125", floz_imp: "0.0000284130625",
  bbl: "0.158987294928",
  // speed (m/s)
  "m/s": "1", "km/h": "1000/3600", "km/s": "1000", "mi/h": "0.44704", "ft/s": "0.3048", kn: "1852/3600",
  // temperature (K); offsets checked below
  K: "1", degC: "1", degF: "5/9", degR: "5/9",
  delta_K: "1", delta_degC: "1", delta_degF: "5/9", delta_degR: "5/9",
  // pressure (Pa)
  Pa: "1", hPa: "100", kPa: "1000", MPa: "1e6", bar: "1e5", mbar: "100", atm: "101325", at: "98066.5",
  torr: "101325/760", mmHg: "133.322387415", inHg: "3386.388640341",
  psi: "0.45359237*9.80665/0.0254^2", ksi: "1000*0.45359237*9.80665/0.0254^2",
  // energy (J)
  J: "1", kJ: "1000", MJ: "1e6", GJ: "1e9", Wh: "3600", kWh: "3.6e6", MWh: "3.6e9",
  cal_th: "4.184", kcal_th: "4184", cal_IT: "4.1868", kcal_IT: "4186.8",
  eV: "1.602176634e-19", MeV: "1.602176634e-13", BTU: "1055.05585262", ft_lbf: "1.3558179483314004", erg: "1e-7",
  // power (W)
  W: "1", mW: "0.001", kW: "1000", MW: "1e6", GW: "1e9", hp: "745.69987158227022", hp_metric: "735.49875",
  hp_e: "746", "BTU/h": "1055.05585262/3600",
  // data (bit)
  bit: "1", kbit: "1000", Mbit: "1e6", Gbit: "1e9", Tbit: "1e12", Kibit: "1024", Mibit: "1048576", Gibit: "1073741824",
  B: "8", kB: "8000", MB: "8e6", GB: "8e9", TB: "8e12", PB: "8e15",
  KiB: "8192", MiB: "8388608", GiB: "8589934592", TiB: "8796093022208",
  // angle (turn)
  turn: "1", rad: "1/2/pi", mrad: "1/2000/pi", deg: "1/360", arcmin: "1/21600", arcsec: "1/1296000",
  grad: "1/400", mil_nato: "1/6400",
  // frequency (Hz)
  Hz: "1", kHz: "1000", MHz: "1e6", GHz: "1e9", THz: "1e12", rpm: "1/60",
  // force (N)
  N: "1", kN: "1000", dyn: "1e-5", kgf: "9.80665", lbf: "4.4482216152605", ozf: "0.27801385095378125",
  kip: "4448.2216152605", pdl: "0.138254954376",
  // fuel economy (L/100km); reciprocal units: L/100km = factor / value
  "L/100km": "1", "km/L": "100", mpg_us: "100*3.785411784/1.609344", mpg_imp: "100*4.54609/1.609344",
};

describe("unit definitions", () => {
  it("the table covers exactly the catalogue", () => {
    expect(Object.keys(FACTORS).sort()).toEqual(listUnits().map((u) => u.id).sort());
  });

  it.each(Object.entries(FACTORS))("%s matches its definition", (id, expr) => {
    const info = getUnit(id as UnitId);
    expect(info.factor).toBe(definition(expr));
    expect(info.rational).toBe(!expr.includes("pi"));
    expect(info.source.length).toBeGreaterThan(10);
  });

  it("temperature offsets", () => {
    expect(getUnit("degC").offset).toBe(definition("273.15"));
    expect(getUnit("degF").offset).toBe(definition("459.67*5/9"));
    expect(getUnit("K").offset).toBeUndefined();
    expect(getUnit("degR").offset).toBeUndefined();
  });

  it("reciprocal units are exactly the distance-per-volume ones", () => {
    expect(listUnits().filter((u) => u.kind === "reciprocal").map((u) => u.id)).toEqual(["km/L", "mpg_us", "mpg_imp"]);
    expect(listUnits().filter((u) => u.kind === "affine").map((u) => u.id)).toEqual(["degC", "degF"]);
  });

  it("each base unit has factor 1", () => {
    for (const u of listUnits()) expect(getUnit(u.base).factor).toBe("1");
  });
});

// NIST SP 811 (2008), Appendix B.8/B.9 conversion factors to SI, as printed
// (7 significant digits unless exact). Checked by rounding our exact value.
const NIST: Array<[UnitId, UnitId, string]> = [
  ["in", "m", "0.0254"], ["ft", "m", "0.3048"], ["mi", "m", "1609.344"], ["nmi", "m", "1852"],
  ["lb", "kg", "0.45359237"], ["oz", "kg", "0.02834952"], ["ton_us", "kg", "907.1847"], ["ton_uk", "kg", "1016.047"],
  ["gr", "kg", "0.00006479891"], ["oz_t", "kg", "0.03110348"], ["slug", "kg", "14.59390"],
  ["gal_us", "m3", "0.003785412"], ["gal_imp", "m3", "0.00454609"], ["floz_us", "m3", "0.00002957353"],
  ["bbl", "m3", "0.1589873"], ["ft3", "m3", "0.02831685"], ["in3", "m3", "0.00001638706"],
  ["psi", "Pa", "6894.757"], ["atm", "Pa", "101325"], ["torr", "Pa", "133.3224"], ["mmHg", "Pa", "133.3224"],
  ["inHg", "Pa", "3386.389"], ["at", "Pa", "98066.5"],
  ["BTU", "J", "1055.056"], ["cal_th", "J", "4.184"], ["cal_IT", "J", "4.1868"], ["ft_lbf", "J", "1.355818"],
  ["kWh", "J", "3600000"], ["erg", "J", "0.0000001"],
  ["hp", "W", "745.6999"], ["hp_metric", "W", "735.4988"], ["hp_e", "W", "746"], ["BTU/h", "W", "0.2930711"],
  ["lbf", "N", "4.448222"], ["kgf", "N", "9.80665"], ["kip", "N", "4448.222"], ["pdl", "N", "0.1382550"], ["ozf", "N", "0.2780139"],
  ["dyn", "N", "0.00001"], ["kn", "m/s", "0.5144444"], ["mi/h", "m/s", "0.44704"], ["km/h", "m/s", "0.2777778"],
  ["deg", "rad", "0.01745329"], ["ly", "m", "9460730000000000"], ["au", "m", "149597900000"],
];

describe("NIST SP 811 printed factors", () => {
  it.each(NIST)("1 %s → %s ≈ %s", (from, to, printed) => {
    const digits = printed.includes(".") ? printed.replace(".", "").replace(/^0+/, "") : printed.replace(/0+$/, "");
    const ours = convert(1, from as never, to as never).toDecimal({ significant: digits.length, rounding: "half-up" });
    expect(Number(ours)).toBe(Number(printed));
  });
});
