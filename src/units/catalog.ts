/**
 * The unit catalogue. Every factor is an exact rational derived from the
 * cited definition; only radian-based angles additionally carry a power of π
 * (kept symbolic, see `pi`). Tests check each unit against its definition.
 */
import { ONE, r } from "../rational.js";
import { per, pow, SRC, units, x } from "./define.js";

// Exact base definitions.
const IN = r("0.0254"); // 1959 agreement
const FT = x(IN, 12);
const YD = x(FT, 3);
const MI = x(FT, 5280);
const LB = r("0.45359237"); // 1959 agreement
const GN = r("9.80665"); // standard gravity
const LBF = x(LB, GN);
const GAL_US = x(231, pow(IN, 3)); // 231 in³
const GAL_IMP = r("0.00454609"); // 4.54609 dm³
const BTU = r("1055.05585262"); // International Table Btu
const MMHG = x("13595.1", GN, "0.001"); // conventional: 13.5951 g/cm³ × gₙ × 1 mm
const JULIAN_YEAR = x("365.25", 86400);
const C = r("299792458");

export const LENGTH = units({
  m: { name: "metre", symbol: "m", aliases: ["meter", "meters", "metre", "metres"], factor: ONE, system: "metric", source: SRC.SI },
  km: { name: "kilometre", symbol: "km", aliases: ["kilometer", "kilometers", "kilometre", "kilometres"], factor: x(1000), system: "metric", source: SRC.SI },
  dm: { name: "decimetre", symbol: "dm", aliases: ["decimeter", "decimeters", "decimetre", "decimetres"], factor: x("0.1"), system: "metric", source: SRC.SI },
  cm: { name: "centimetre", symbol: "cm", aliases: ["centimeter", "centimeters", "centimetre", "centimetres"], factor: x("0.01"), system: "metric", source: SRC.SI },
  mm: { name: "millimetre", symbol: "mm", aliases: ["millimeter", "millimeters", "millimetre", "millimetres"], factor: x("0.001"), system: "metric", source: SRC.SI },
  um: { name: "micrometre", symbol: "µm", aliases: ["µm", "μm", "micrometer", "micrometers", "micrometre", "micrometres", "micron", "microns"], factor: x("1e-6"), system: "metric", source: SRC.SI },
  nm: { name: "nanometre", symbol: "nm", aliases: ["nanometer", "nanometers", "nanometre", "nanometres"], factor: x("1e-9"), system: "metric", source: SRC.SI },
  angstrom: { name: "ångström", symbol: "Å", aliases: ["Å", "Å", "ångström", "angstroms"], factor: x("1e-10"), system: "other", source: SRC.NIST },
  in: { name: "inch", symbol: "in", aliases: ["inch", "inches"], factor: IN, system: "customary", source: SRC.YP1959 },
  ft: { name: "foot", symbol: "ft", aliases: ["foot", "feet"], factor: FT, system: "customary", source: SRC.YP1959 },
  yd: { name: "yard", symbol: "yd", aliases: ["yard", "yards"], factor: YD, system: "customary", source: SRC.YP1959 },
  mi: { name: "mile", symbol: "mi", aliases: ["mile", "miles"], factor: MI, system: "customary", source: `${SRC.YP1959}; 1 mi = 5280 ft (${SRC.HB44})` },
  nmi: { name: "nautical mile", symbol: "nmi", aliases: ["nautical mile", "nautical miles"], factor: x(1852), system: "other", source: `${SRC.NIST}: 1852 m (International Hydrographic Conference 1929)` },
  mil: { name: "mil (thou)", symbol: "mil", aliases: ["thou", "mils"], factor: x(IN, "0.001"), system: "customary", source: `${SRC.NIST}: 0.001 in` },
  fathom: { name: "fathom", symbol: "ftm", aliases: ["fathoms", "ftm"], factor: x(FT, 6), system: "customary", source: `${SRC.HB44}: 6 ft` },
  furlong: { name: "furlong", symbol: "fur", aliases: ["furlongs", "fur"], factor: x(FT, 660), system: "customary", source: `${SRC.HB44}: 660 ft` },
  point: { name: "point (typographic)", symbol: "pt", aliases: ["points"], factor: per(IN, 72), system: "other", source: SRC.CSS },
  au: { name: "astronomical unit", symbol: "au", aliases: ["astronomical unit", "astronomical units"], factor: x("149597870700"), system: "other", source: SRC.IAU },
  ly: { name: "light-year", symbol: "ly", aliases: ["light-year", "light-years", "light year", "light years"], factor: x(C, JULIAN_YEAR), system: "other", source: SRC.IAU_JY },
});

export const MASS = units({
  kg: { name: "kilogram", symbol: "kg", aliases: ["kilogram", "kilograms"], factor: ONE, system: "metric", source: SRC.SI },
  g: { name: "gram", symbol: "g", aliases: ["gram", "grams"], factor: x("0.001"), system: "metric", source: SRC.SI },
  mg: { name: "milligram", symbol: "mg", aliases: ["milligram", "milligrams"], factor: x("1e-6"), system: "metric", source: SRC.SI },
  ug: { name: "microgram", symbol: "µg", aliases: ["µg", "μg", "mcg", "microgram", "micrograms"], factor: x("1e-9"), system: "metric", source: SRC.SI },
  t: { name: "tonne", symbol: "t", aliases: ["tonne", "tonnes", "metric ton", "metric tons"], factor: x(1000), system: "metric", source: SRC.SI_T8 },
  lb: { name: "pound", symbol: "lb", aliases: ["pound", "pounds", "lbs"], factor: LB, system: "customary", source: SRC.YP1959 },
  oz: { name: "ounce", symbol: "oz", aliases: ["ounce", "ounces"], factor: per(LB, 16), system: "customary", source: `${SRC.HB44}: 1/16 lb` },
  st: { name: "stone", symbol: "st", aliases: ["stone", "stones"], factor: x(LB, 14), system: "imperial", source: "UK Weights and Measures Act 1985, Schedule 1: 14 lb" },
  gr: { name: "grain", symbol: "gr", aliases: ["grain", "grains"], factor: per(LB, 7000), system: "customary", source: `${SRC.HB44}: 1/7000 lb` },
  ton_us: { name: "short ton", symbol: "short ton", aliases: ["short ton", "short tons"], factor: x(LB, 2000), system: "us", source: `${SRC.HB44}: 2000 lb` },
  ton_uk: { name: "long ton", symbol: "long ton", aliases: ["long ton", "long tons"], factor: x(LB, 2240), system: "imperial", source: `${SRC.HB44}: 2240 lb` },
  oz_t: { name: "troy ounce", symbol: "oz t", aliases: ["troy ounce", "troy ounces", "ozt"], factor: x(per(LB, 7000), 480), system: "customary", source: `${SRC.HB44}: 480 gr` },
  dwt: { name: "pennyweight", symbol: "dwt", aliases: ["pennyweight", "pennyweights"], factor: x(per(LB, 7000), 24), system: "customary", source: `${SRC.HB44}: 24 gr` },
  ct: { name: "carat (metric)", symbol: "ct", aliases: ["carat", "carats"], factor: x("0.0002"), system: "metric", source: `${SRC.NIST}: 200 mg` },
  slug: { name: "slug", symbol: "slug", aliases: ["slugs"], factor: per(LBF, FT), system: "customary", source: `${SRC.NIST}: lbf·s²/ft` },
});

export const TIME = units({
  s: { name: "second", symbol: "s", aliases: ["second", "seconds", "sec", "secs"], factor: ONE, system: "metric", source: SRC.SI },
  ms: { name: "millisecond", symbol: "ms", aliases: ["millisecond", "milliseconds"], factor: x("0.001"), system: "metric", source: SRC.SI },
  us: { name: "microsecond", symbol: "µs", aliases: ["µs", "μs", "microsecond", "microseconds"], factor: x("1e-6"), system: "metric", source: SRC.SI },
  ns: { name: "nanosecond", symbol: "ns", aliases: ["nanosecond", "nanoseconds"], factor: x("1e-9"), system: "metric", source: SRC.SI },
  min: { name: "minute", symbol: "min", aliases: ["minute", "minutes", "mins"], factor: x(60), system: "metric", source: SRC.SI_T8 },
  h: { name: "hour", symbol: "h", aliases: ["hour", "hours", "hr", "hrs"], factor: x(3600), system: "metric", source: SRC.SI_T8 },
  d: { name: "day", symbol: "d", aliases: ["day", "days"], factor: x(86400), system: "metric", source: SRC.SI_T8 },
  wk: { name: "week", symbol: "wk", aliases: ["week", "weeks"], factor: x(7, 86400), system: "other", source: `${SRC.NIST}: 7 d` },
  yr: { name: "Julian year", symbol: "a", aliases: ["year", "years", "julian year"], factor: JULIAN_YEAR, system: "other", source: SRC.IAU_JY },
});

export const AREA = units({
  m2: { name: "square metre", symbol: "m²", aliases: ["m²", "m^2", "square meter", "square meters", "square metre", "square metres"], factor: ONE, system: "metric", source: SRC.SI },
  km2: { name: "square kilometre", symbol: "km²", aliases: ["km²", "km^2", "square kilometer", "square kilometers", "square kilometre", "square kilometres"], factor: x("1e6"), system: "metric", source: SRC.SI },
  cm2: { name: "square centimetre", symbol: "cm²", aliases: ["cm²", "cm^2"], factor: x("1e-4"), system: "metric", source: SRC.SI },
  mm2: { name: "square millimetre", symbol: "mm²", aliases: ["mm²", "mm^2"], factor: x("1e-6"), system: "metric", source: SRC.SI },
  ha: { name: "hectare", symbol: "ha", aliases: ["hectare", "hectares"], factor: x("1e4"), system: "metric", source: SRC.SI_T8 },
  are: { name: "are", symbol: "a", aliases: ["ares"], factor: x(100), system: "metric", source: `${SRC.NIST}: 100 m²` },
  in2: { name: "square inch", symbol: "in²", aliases: ["in²", "in^2", "sq in", "square inch", "square inches"], factor: pow(IN, 2), system: "customary", source: SRC.DERIVED },
  ft2: { name: "square foot", symbol: "ft²", aliases: ["ft²", "ft^2", "sq ft", "square foot", "square feet"], factor: pow(FT, 2), system: "customary", source: SRC.DERIVED },
  yd2: { name: "square yard", symbol: "yd²", aliases: ["yd²", "yd^2", "sq yd", "square yard", "square yards"], factor: pow(YD, 2), system: "customary", source: SRC.DERIVED },
  mi2: { name: "square mile", symbol: "mi²", aliases: ["mi²", "mi^2", "sq mi", "square mile", "square miles"], factor: pow(MI, 2), system: "customary", source: SRC.DERIVED },
  ac: { name: "acre", symbol: "ac", aliases: ["acre", "acres"], factor: x(4840, pow(YD, 2)), system: "customary", source: `${SRC.HB44}: 4840 yd² (international foot)` },
});

export const VOLUME = units({
  m3: { name: "cubic metre", symbol: "m³", aliases: ["m³", "m^3", "cubic meter", "cubic meters", "cubic metre", "cubic metres"], factor: ONE, system: "metric", source: SRC.SI },
  cm3: { name: "cubic centimetre", symbol: "cm³", aliases: ["cm³", "cm^3", "cc"], factor: x("1e-6"), system: "metric", source: SRC.SI },
  L: { name: "litre", symbol: "L", aliases: ["l", "ℓ", "liter", "liters", "litre", "litres", "dm3", "dm³", "dm^3"], factor: x("0.001"), system: "metric", source: `${SRC.SI_T8}: 1 L = 1 dm³` },
  hL: { name: "hectolitre", symbol: "hL", aliases: ["hl", "hectoliter", "hectoliters", "hectolitre", "hectolitres"], factor: x("0.1"), system: "metric", source: SRC.SI_T8 },
  dL: { name: "decilitre", symbol: "dL", aliases: ["dl", "deciliter", "deciliters", "decilitre", "decilitres"], factor: x("1e-4"), system: "metric", source: SRC.SI_T8 },
  cL: { name: "centilitre", symbol: "cL", aliases: ["cl", "centiliter", "centiliters", "centilitre", "centilitres"], factor: x("1e-5"), system: "metric", source: SRC.SI_T8 },
  mL: { name: "millilitre", symbol: "mL", aliases: ["ml", "milliliter", "milliliters", "millilitre", "millilitres"], factor: x("1e-6"), system: "metric", source: SRC.SI_T8 },
  uL: { name: "microlitre", symbol: "µL", aliases: ["µL", "μL", "µl", "μl", "ul", "microliter", "microliters", "microlitre", "microlitres"], factor: x("1e-9"), system: "metric", source: SRC.SI_T8 },
  in3: { name: "cubic inch", symbol: "in³", aliases: ["in³", "in^3", "cu in", "cubic inch", "cubic inches"], factor: pow(IN, 3), system: "customary", source: SRC.DERIVED },
  ft3: { name: "cubic foot", symbol: "ft³", aliases: ["ft³", "ft^3", "cu ft", "cubic foot", "cubic feet"], factor: pow(FT, 3), system: "customary", source: SRC.DERIVED },
  yd3: { name: "cubic yard", symbol: "yd³", aliases: ["yd³", "yd^3", "cu yd", "cubic yard", "cubic yards"], factor: pow(YD, 3), system: "customary", source: SRC.DERIVED },
  gal_us: { name: "US gallon", symbol: "US gal", aliases: ["US gal", "US gallon", "US gallons", "gal (US)"], factor: GAL_US, system: "us", source: `${SRC.HB44}: 231 in³` },
  qt_us: { name: "US quart", symbol: "US qt", aliases: ["US qt", "US quart", "US quarts", "qt (US)"], factor: per(GAL_US, 4), system: "us", source: `${SRC.HB44}: 1/4 gal` },
  pt_us: { name: "US pint", symbol: "US pt", aliases: ["US pt", "US pint", "US pints", "pt (US)"], factor: per(GAL_US, 8), system: "us", source: `${SRC.HB44}: 1/8 gal` },
  cup_us: { name: "US cup", symbol: "cup", aliases: ["cup", "cups", "US cup", "US cups"], factor: per(GAL_US, 16), system: "us", source: `${SRC.HB44}: 8 fl oz` },
  floz_us: { name: "US fluid ounce", symbol: "US fl oz", aliases: ["US fl oz", "US fluid ounce", "US fluid ounces", "fl oz (US)"], factor: per(GAL_US, 128), system: "us", source: `${SRC.HB44}: 1/128 gal` },
  tbsp_us: { name: "US tablespoon", symbol: "tbsp", aliases: ["tbsp", "tablespoon", "tablespoons"], factor: per(GAL_US, 256), system: "us", source: `${SRC.HB44}: 1/2 fl oz` },
  tsp_us: { name: "US teaspoon", symbol: "tsp", aliases: ["tsp", "teaspoon", "teaspoons"], factor: per(GAL_US, 768), system: "us", source: `${SRC.HB44}: 1/6 fl oz` },
  gal_imp: { name: "imperial gallon", symbol: "imp gal", aliases: ["imp gal", "imperial gallon", "imperial gallons", "UK gallon", "UK gallons", "gal (imp)"], factor: GAL_IMP, system: "imperial", source: SRC.WMA },
  qt_imp: { name: "imperial quart", symbol: "imp qt", aliases: ["imp qt", "imperial quart", "imperial quarts", "qt (imp)"], factor: per(GAL_IMP, 4), system: "imperial", source: `${SRC.WMA}; 1 qt = 1/4 gal` },
  pt_imp: { name: "imperial pint", symbol: "imp pt", aliases: ["imp pt", "imperial pint", "imperial pints", "UK pint", "UK pints", "pt (imp)"], factor: per(GAL_IMP, 8), system: "imperial", source: `${SRC.WMA}; 1 pt = 1/8 gal` },
  floz_imp: { name: "imperial fluid ounce", symbol: "imp fl oz", aliases: ["imp fl oz", "imperial fluid ounce", "imperial fluid ounces", "fl oz (imp)"], factor: per(GAL_IMP, 160), system: "imperial", source: `${SRC.WMA}; 1 fl oz = 1/20 pt` },
  bbl: { name: "oil barrel", symbol: "bbl", aliases: ["oil barrel", "oil barrels", "barrel (oil)"], factor: x(GAL_US, 42), system: "us", source: `${SRC.NIST}: 42 US gal (petroleum)` },
});

export const SPEED = units({
  "m/s": { name: "metre per second", symbol: "m/s", aliases: ["m s-1", "m·s⁻¹", "meters per second", "metres per second"], factor: ONE, system: "metric", source: SRC.SI },
  "km/h": { name: "kilometre per hour", symbol: "km/h", aliases: ["kph", "kmh", "km/hr", "kilometers per hour", "kilometres per hour"], factor: per(1000, 3600), system: "metric", source: SRC.DERIVED },
  "km/s": { name: "kilometre per second", symbol: "km/s", aliases: ["kilometers per second", "kilometres per second"], factor: x(1000), system: "metric", source: SRC.DERIVED },
  "mi/h": { name: "mile per hour", symbol: "mph", aliases: ["mph", "miles per hour"], factor: per(MI, 3600), system: "customary", source: SRC.DERIVED },
  "ft/s": { name: "foot per second", symbol: "ft/s", aliases: ["fps", "feet per second"], factor: FT, system: "customary", source: SRC.DERIVED },
  kn: { name: "knot", symbol: "kn", aliases: ["knot", "knots", "kt"], factor: per(1852, 3600), system: "other", source: `${SRC.NIST}: 1 nmi/h` },
});

export const TEMPERATURE = units({
  K: { name: "kelvin", symbol: "K", aliases: ["kelvin", "kelvins"], factor: ONE, system: "metric", source: SRC.SI },
  degC: { name: "degree Celsius", symbol: "°C", aliases: ["°C", "℃", "celsius", "degree Celsius", "degrees Celsius"], factor: ONE, offset: r("273.15"), kind: "affine", system: "metric", source: SRC.SI_TEMP },
  degF: { name: "degree Fahrenheit", symbol: "°F", aliases: ["°F", "℉", "fahrenheit", "degree Fahrenheit", "degrees Fahrenheit"], factor: per(5, 9), offset: x("459.67", per(5, 9)), kind: "affine", system: "customary", source: `${SRC.NIST}: T/K = (t/°F + 459.67)/1.8` },
  degR: { name: "degree Rankine", symbol: "°R", aliases: ["°R", "rankine", "degree Rankine", "degrees Rankine"], factor: per(5, 9), system: "customary", source: `${SRC.NIST}: T/K = (T/°R)/1.8` },
});

export const TEMPERATURE_DIFFERENCE = units({
  delta_K: { name: "kelvin (difference)", symbol: "K", aliases: ["ΔK"], factor: ONE, system: "metric", source: SRC.SI },
  delta_degC: { name: "degree Celsius (difference)", symbol: "°C", aliases: ["Δ°C", "Δ℃"], factor: ONE, system: "metric", source: `${SRC.SI_TEMP}; a difference of 1 °C equals 1 K` },
  delta_degF: { name: "degree Fahrenheit (difference)", symbol: "°F", aliases: ["Δ°F", "Δ℉"], factor: per(5, 9), system: "customary", source: `${SRC.NIST}: 1 °F (difference) = 5/9 K` },
  delta_degR: { name: "degree Rankine (difference)", symbol: "°R", aliases: ["Δ°R"], factor: per(5, 9), system: "customary", source: `${SRC.NIST}: 1 °R = 5/9 K` },
});

export const PRESSURE = units({
  Pa: { name: "pascal", symbol: "Pa", aliases: ["pascal", "pascals"], factor: ONE, system: "metric", source: SRC.SI },
  hPa: { name: "hectopascal", symbol: "hPa", aliases: ["hectopascal", "hectopascals"], factor: x(100), system: "metric", source: SRC.SI },
  kPa: { name: "kilopascal", symbol: "kPa", aliases: ["kilopascal", "kilopascals"], factor: x(1000), system: "metric", source: SRC.SI },
  MPa: { name: "megapascal", symbol: "MPa", aliases: ["megapascal", "megapascals"], factor: x("1e6"), system: "metric", source: SRC.SI },
  bar: { name: "bar", symbol: "bar", aliases: ["bars"], factor: x("1e5"), system: "metric", source: `${SRC.NIST}: 10⁵ Pa` },
  mbar: { name: "millibar", symbol: "mbar", aliases: ["millibar", "millibars"], factor: x(100), system: "metric", source: `${SRC.NIST}: 10² Pa` },
  atm: { name: "standard atmosphere", symbol: "atm", aliases: ["atmosphere", "atmospheres", "standard atmosphere"], factor: x(101325), system: "other", source: `${SRC.NIST}: 101325 Pa (10th CGPM 1954)` },
  at: { name: "technical atmosphere", symbol: "at", aliases: ["technical atmosphere", "kgf/cm2", "kgf/cm²"], factor: per(GN, "0.0001"), system: "other", source: `${SRC.NIST}: 1 kgf/cm²` },
  torr: { name: "torr", symbol: "Torr", aliases: ["Torr"], factor: per(101325, 760), system: "other", source: `${SRC.NIST}: 101325/760 Pa` },
  mmHg: { name: "millimetre of mercury (conventional)", symbol: "mmHg", aliases: ["mm Hg", "millimeter of mercury", "millimetre of mercury"], factor: MMHG, system: "other", source: `${SRC.NIST}: conventional, 13.5951 g/cm³ × gₙ × 1 mm` },
  inHg: { name: "inch of mercury (conventional)", symbol: "inHg", aliases: ["in Hg", "inch of mercury"], factor: x(MMHG, "25.4"), system: "customary", source: `${SRC.NIST}: conventional, 13.5951 g/cm³ × gₙ × 1 in` },
  psi: { name: "pound-force per square inch", symbol: "psi", aliases: ["lbf/in2", "lbf/in²", "pound per square inch"], factor: per(LBF, pow(IN, 2)), system: "customary", source: `${SRC.NIST}: lbf/in², lbf = lb × gₙ` },
  ksi: { name: "kilopound-force per square inch", symbol: "ksi", aliases: ["kip/in2", "kip/in²"], factor: per(x(LBF, 1000), pow(IN, 2)), system: "customary", source: `${SRC.NIST}: 1000 lbf/in²` },
});

export const ENERGY = units({
  J: { name: "joule", symbol: "J", aliases: ["joule", "joules"], factor: ONE, system: "metric", source: SRC.SI },
  kJ: { name: "kilojoule", symbol: "kJ", aliases: ["kilojoule", "kilojoules"], factor: x(1000), system: "metric", source: SRC.SI },
  MJ: { name: "megajoule", symbol: "MJ", aliases: ["megajoule", "megajoules"], factor: x("1e6"), system: "metric", source: SRC.SI },
  GJ: { name: "gigajoule", symbol: "GJ", aliases: ["gigajoule", "gigajoules"], factor: x("1e9"), system: "metric", source: SRC.SI },
  Wh: { name: "watt hour", symbol: "Wh", aliases: ["watt hour", "watt hours"], factor: x(3600), system: "metric", source: SRC.DERIVED },
  kWh: { name: "kilowatt hour", symbol: "kWh", aliases: ["kilowatt hour", "kilowatt hours"], factor: x("3.6e6"), system: "metric", source: SRC.DERIVED },
  MWh: { name: "megawatt hour", symbol: "MWh", aliases: ["megawatt hour", "megawatt hours"], factor: x("3.6e9"), system: "metric", source: SRC.DERIVED },
  cal_th: { name: "calorie (thermochemical)", symbol: "cal", aliases: ["cal", "calorie", "calories"], factor: r("4.184"), system: "metric", source: `${SRC.NIST}: 4.184 J` },
  kcal_th: { name: "kilocalorie (thermochemical)", symbol: "kcal", aliases: ["kcal", "kilocalorie", "kilocalories", "Cal"], factor: r("4184"), system: "metric", source: `${SRC.NIST}: 4184 J (also the EU food-labelling factor)` },
  cal_IT: { name: "calorie (International Table)", symbol: "cal_IT", aliases: ["calIT"], factor: r("4.1868"), system: "metric", source: `${SRC.NIST}: 4.1868 J` },
  kcal_IT: { name: "kilocalorie (International Table)", symbol: "kcal_IT", aliases: ["kcalIT"], factor: r("4186.8"), system: "metric", source: `${SRC.NIST}: 4186.8 J` },
  eV: { name: "electronvolt", symbol: "eV", aliases: ["electronvolt", "electronvolts", "electron volt", "electron volts"], factor: r("1.602176634e-19"), system: "other", source: `${SRC.SI_T8}: e × 1 V, e = 1.602176634e-19 C exactly` },
  MeV: { name: "megaelectronvolt", symbol: "MeV", aliases: ["megaelectronvolt", "megaelectronvolts"], factor: r("1.602176634e-13"), system: "other", source: SRC.SI_T8 },
  BTU: { name: "British thermal unit (International Table)", symbol: "Btu", aliases: ["Btu", "BTU_IT", "Btu_IT", "British thermal unit", "British thermal units"], factor: BTU, system: "customary", source: `${SRC.NIST}: 1055.05585262 J` },
  ft_lbf: { name: "foot-pound-force", symbol: "ft·lbf", aliases: ["ft·lbf", "ft-lbf", "ft lbf", "foot-pound", "foot-pounds"], factor: x(FT, LBF), system: "customary", source: SRC.DERIVED },
  erg: { name: "erg", symbol: "erg", aliases: ["ergs"], factor: r("1e-7"), system: "other", source: `${SRC.NIST}: 10⁻⁷ J` },
});

export const POWER = units({
  W: { name: "watt", symbol: "W", aliases: ["watt", "watts"], factor: ONE, system: "metric", source: SRC.SI },
  mW: { name: "milliwatt", symbol: "mW", aliases: ["milliwatt", "milliwatts"], factor: x("0.001"), system: "metric", source: SRC.SI },
  kW: { name: "kilowatt", symbol: "kW", aliases: ["kilowatt", "kilowatts"], factor: x(1000), system: "metric", source: SRC.SI },
  MW: { name: "megawatt", symbol: "MW", aliases: ["megawatt", "megawatts"], factor: x("1e6"), system: "metric", source: SRC.SI },
  GW: { name: "gigawatt", symbol: "GW", aliases: ["gigawatt", "gigawatts"], factor: x("1e9"), system: "metric", source: SRC.SI },
  hp: { name: "horsepower (mechanical)", symbol: "hp", aliases: ["horsepower", "hp(I)"], factor: x(550, FT, LBF), system: "customary", source: `${SRC.NIST}: 550 ft·lbf/s` },
  hp_metric: { name: "horsepower (metric)", symbol: "PS", aliases: ["PS", "metric horsepower"], factor: x(75, GN), system: "metric", source: `${SRC.NIST}: 75 kgf·m/s` },
  hp_e: { name: "horsepower (electric)", symbol: "hp(E)", aliases: ["hp(E)", "electric horsepower"], factor: x(746), system: "other", source: `${SRC.NIST}: 746 W` },
  "BTU/h": { name: "Btu per hour", symbol: "Btu/h", aliases: ["Btu/h", "BTU/hr", "Btu/hr"], factor: per(BTU, 3600), system: "customary", source: SRC.DERIVED },
});

export const DATA = units({
  bit: { name: "bit", symbol: "bit", aliases: ["bits"], factor: ONE, system: "other", source: SRC.IEC },
  kbit: { name: "kilobit", symbol: "kbit", aliases: ["kilobit", "kilobits"], factor: x(1000), system: "other", source: `${SRC.IEC}; SI prefix k = 10³` },
  Mbit: { name: "megabit", symbol: "Mbit", aliases: ["megabit", "megabits"], factor: x("1e6"), system: "other", source: SRC.IEC },
  Gbit: { name: "gigabit", symbol: "Gbit", aliases: ["gigabit", "gigabits"], factor: x("1e9"), system: "other", source: SRC.IEC },
  Tbit: { name: "terabit", symbol: "Tbit", aliases: ["terabit", "terabits"], factor: x("1e12"), system: "other", source: SRC.IEC },
  Kibit: { name: "kibibit", symbol: "Kibit", aliases: ["kibibit", "kibibits"], factor: x(1024), system: "other", source: `${SRC.IEC}; Ki = 2¹⁰` },
  Mibit: { name: "mebibit", symbol: "Mibit", aliases: ["mebibit", "mebibits"], factor: pow(x(1024), 2), system: "other", source: SRC.IEC },
  Gibit: { name: "gibibit", symbol: "Gibit", aliases: ["gibibit", "gibibits"], factor: pow(x(1024), 3), system: "other", source: SRC.IEC },
  B: { name: "byte", symbol: "B", aliases: ["byte", "bytes", "octet", "octets"], factor: x(8), system: "other", source: SRC.IEC },
  kB: { name: "kilobyte", symbol: "kB", aliases: ["kilobyte", "kilobytes"], factor: x(8, 1000), system: "other", source: SRC.IEC },
  MB: { name: "megabyte", symbol: "MB", aliases: ["megabyte", "megabytes"], factor: x(8, "1e6"), system: "other", source: SRC.IEC },
  GB: { name: "gigabyte", symbol: "GB", aliases: ["gigabyte", "gigabytes"], factor: x(8, "1e9"), system: "other", source: SRC.IEC },
  TB: { name: "terabyte", symbol: "TB", aliases: ["terabyte", "terabytes"], factor: x(8, "1e12"), system: "other", source: SRC.IEC },
  PB: { name: "petabyte", symbol: "PB", aliases: ["petabyte", "petabytes"], factor: x(8, "1e15"), system: "other", source: SRC.IEC },
  KiB: { name: "kibibyte", symbol: "KiB", aliases: ["kibibyte", "kibibytes"], factor: x(8, 1024), system: "other", source: SRC.IEC },
  MiB: { name: "mebibyte", symbol: "MiB", aliases: ["mebibyte", "mebibytes"], factor: x(8, pow(x(1024), 2)), system: "other", source: SRC.IEC },
  GiB: { name: "gibibyte", symbol: "GiB", aliases: ["gibibyte", "gibibytes"], factor: x(8, pow(x(1024), 3)), system: "other", source: SRC.IEC },
  TiB: { name: "tebibyte", symbol: "TiB", aliases: ["tebibyte", "tebibytes"], factor: x(8, pow(x(1024), 4)), system: "other", source: SRC.IEC },
});

// Angles are stored relative to the full turn, so degree, gon, arcminute,
// arcsecond and NATO mil are exact rationals; only radian-based units carry π.
export const ANGLE = units({
  turn: { name: "turn", symbol: "tr", aliases: ["turns", "rev", "revolution", "revolutions"], factor: ONE, system: "other", source: `${SRC.NIST}: 1 revolution = 2π rad = 360°` },
  rad: { name: "radian", symbol: "rad", aliases: ["radian", "radians"], factor: per(1, 2), pi: -1, system: "metric", source: `${SRC.SI}: 1 turn = 2π rad` },
  mrad: { name: "milliradian", symbol: "mrad", aliases: ["milliradian", "milliradians"], factor: per(1, 2000), pi: -1, system: "metric", source: SRC.SI },
  deg: { name: "degree", symbol: "°", aliases: ["°", "degree", "degrees"], factor: per(1, 360), system: "other", source: `${SRC.SI_T8}: 1° = (π/180) rad` },
  arcmin: { name: "arcminute", symbol: "′", aliases: ["′", "arcminute", "arcminutes"], factor: per(1, 21600), system: "other", source: `${SRC.SI_T8}: 1′ = (1/60)°` },
  arcsec: { name: "arcsecond", symbol: "″", aliases: ["″", "arcsecond", "arcseconds"], factor: per(1, 1296000), system: "other", source: `${SRC.SI_T8}: 1″ = (1/60)′` },
  grad: { name: "gon", symbol: "gon", aliases: ["gon", "gons", "gradian", "gradians"], factor: per(1, 400), system: "other", source: `${SRC.NIST}: 1 gon = 0.9°` },
  mil_nato: { name: "mil (NATO)", symbol: "mil", aliases: ["NATO mil"], factor: per(1, 6400), system: "other", source: "NATO mil: 1/6400 turn" },
});

export const FREQUENCY = units({
  Hz: { name: "hertz", symbol: "Hz", aliases: ["hertz"], factor: ONE, system: "metric", source: SRC.SI },
  kHz: { name: "kilohertz", symbol: "kHz", aliases: ["kilohertz"], factor: x(1000), system: "metric", source: SRC.SI },
  MHz: { name: "megahertz", symbol: "MHz", aliases: ["megahertz"], factor: x("1e6"), system: "metric", source: SRC.SI },
  GHz: { name: "gigahertz", symbol: "GHz", aliases: ["gigahertz"], factor: x("1e9"), system: "metric", source: SRC.SI },
  THz: { name: "terahertz", symbol: "THz", aliases: ["terahertz"], factor: x("1e12"), system: "metric", source: SRC.SI },
  rpm: { name: "revolution per minute", symbol: "rpm", aliases: ["r/min", "rev/min"], factor: per(1, 60), system: "other", source: "1 r/min = (1/60) s⁻¹ (one revolution counted as one cycle)" },
});

export const FORCE = units({
  N: { name: "newton", symbol: "N", aliases: ["newton", "newtons"], factor: ONE, system: "metric", source: SRC.SI },
  kN: { name: "kilonewton", symbol: "kN", aliases: ["kilonewton", "kilonewtons"], factor: x(1000), system: "metric", source: SRC.SI },
  dyn: { name: "dyne", symbol: "dyn", aliases: ["dyne", "dynes"], factor: r("1e-5"), system: "other", source: `${SRC.NIST}: 10⁻⁵ N` },
  kgf: { name: "kilogram-force", symbol: "kgf", aliases: ["kilogram-force", "kp"], factor: GN, system: "metric", source: SRC.GN },
  lbf: { name: "pound-force", symbol: "lbf", aliases: ["pound-force"], factor: LBF, system: "customary", source: `${SRC.NIST}: lb × gₙ` },
  ozf: { name: "ounce-force", symbol: "ozf", aliases: ["ounce-force"], factor: per(LBF, 16), system: "customary", source: `${SRC.NIST}: oz × gₙ` },
  kip: { name: "kip", symbol: "kip", aliases: ["kips", "kilopound-force"], factor: x(LBF, 1000), system: "customary", source: `${SRC.NIST}: 1000 lbf` },
  pdl: { name: "poundal", symbol: "pdl", aliases: ["poundal", "poundals"], factor: x(LB, FT), system: "customary", source: `${SRC.NIST}: lb·ft/s²` },
});

// Fuel consumption (volume per distance) and fuel economy (distance per
// volume) are reciprocal: base is L/100km, and distance-per-volume units map
// with base = factor / value.
export const FUEL_ECONOMY = units({
  "L/100km": { name: "litre per 100 kilometres", symbol: "L/100 km", aliases: ["l/100km", "L/100 km", "l/100 km"], factor: ONE, system: "metric", source: SRC.DERIVED },
  "km/L": { name: "kilometre per litre", symbol: "km/L", aliases: ["km/l", "kmpl"], factor: x(100), kind: "reciprocal", system: "metric", source: SRC.DERIVED },
  mpg_us: { name: "mile per US gallon", symbol: "mpg (US)", aliases: ["mpg (US)", "mi/gal (US)"], factor: per(x(100, GAL_US, 1000), x(MI, "0.001")), kind: "reciprocal", system: "us", source: SRC.DERIVED },
  mpg_imp: { name: "mile per imperial gallon", symbol: "mpg (imp)", aliases: ["mpg (imp)", "mi/gal (imp)"], factor: per(x(100, GAL_IMP, 1000), x(MI, "0.001")), kind: "reciprocal", system: "imperial", source: SRC.DERIVED },
});

/** The catalogue, grouped by dimension. */
export const CATALOG = {
  length: LENGTH,
  mass: MASS,
  time: TIME,
  area: AREA,
  volume: VOLUME,
  speed: SPEED,
  temperature: TEMPERATURE,
  "temperature-difference": TEMPERATURE_DIFFERENCE,
  pressure: PRESSURE,
  energy: ENERGY,
  power: POWER,
  data: DATA,
  angle: ANGLE,
  frequency: FREQUENCY,
  force: FORCE,
  "fuel-economy": FUEL_ECONOMY,
} as const;

/** Base unit of each dimension (factor 1). */
export const BASE_UNITS = {
  length: "m",
  mass: "kg",
  time: "s",
  area: "m2",
  volume: "m3",
  speed: "m/s",
  temperature: "K",
  "temperature-difference": "delta_K",
  pressure: "Pa",
  energy: "J",
  power: "W",
  data: "bit",
  angle: "turn",
  frequency: "Hz",
  force: "N",
  "fuel-economy": "L/100km",
} as const;
