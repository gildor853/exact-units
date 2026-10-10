# exact-units

[![CI](https://github.com/gildor853/exact-units/actions/workflows/ci.yml/badge.svg)](https://github.com/gildor853/exact-units/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg)

Provided as is, without warranty — see [DISCLAIMER.md](./DISCLAIMER.md).

Zero-dependency, type-safe **unit conversion** for TypeScript with **exact
rational arithmetic**. Every conversion factor is stored as a bigint fraction
taken from its legal or standard definition (SI Brochure, NIST, the 1959
yard and pound agreement, the UK Weights and Measures Act), so
`1 in → cm` is exactly `2.54` and long conversion chains add no rounding error.

## Why

- **Exact**: values and factors are fractions of bigints. `0.1 m → cm` is
  `10`, not `10.000000000000002`; mi → ft → in → m gives exactly `1609.344`.
  You decide how to round the output (decimals or significant digits, five
  rounding modes) or take the exact fraction.
- **Type-safe**: unit ids are string literal types grouped by dimension.
  `convert(1, "km", "kg")` does not compile. Untrusted strings go through
  `tryConvert` / `isUnit` / `parseUnit` / `parseQuantity` instead.
- **Correct special cases**: affine temperature scales (°C, °F, K, °R) with
  separate *temperature difference* units; reciprocal fuel economy
  (L/100 km ↔ mpg); π kept symbolic for radians, so degrees ↔ radians round
  trips exactly and decimals are correctly rounded to any precision.
- **Sourced**: every unit cites its definition, and the tests check every
  unit against it (see [Sources](#sources)).
- **Small and safe**: 173 units in 16 dimensions, no runtime dependencies, bounded input sizes,
  ESM + CJS, tree-shakeable.

## Install

Not published to npm yet. Install a tagged release from GitHub (npm builds
the package during installation):

```sh
npm install github:gildor853/exact-units#v1.0.0
```

Requires Node.js 18+, or any modern browser / edge runtime (the code uses no
Node.js APIs; `bigint` support is required).

The published package has no runtime dependencies and is verified on
Node.js 18 and 20 by a runtime smoke test in CI. Development (tests) needs
Node.js 22.12+, as required by vitest 5.

## Quick start

```ts
import { convert, quantity, bestUnit, format } from "exact-units";

convert("1", "in", "cm").toString();                 // "2.54"
convert(1, "mi", "ft").to("in").to("m").toString();  // "1609.344"
convert(0.1, "m", "cm").toString();                  // "10"
convert(1, "gal_us", "L").toString();                // "3.785411784"
convert(1, "psi", "kPa").toFraction();               // "8896443230521/1290320000000"
convert(1, "psi", "kPa").toDecimal({ decimals: 3 }); // "6.895"
convert(1, "psi", "kPa").toNumber();                 // 6.894757293168361

convert(100, "degC", "degF").toString();             // "212"
convert(10, "delta_degC", "delta_degF").toString();  // "18"
convert(30, "mpg_us", "L/100km").toDecimal({ decimals: 2 }); // "7.84"

convert(90, "deg", "rad").toFraction();              // "π/2"
convert(90, "deg", "rad").toString();                // "1.5707963267948966192"

bestUnit(1500, "m").toString();                      // "1.5"
bestUnit(1500, "m").unit;                            // "km"
format(quantity("1234.5", "km"), { locale: "de-DE" }); // "1.234,5 km"
```

`convert(1, "km", "kg")` is a type error:

<!-- readme-check: skip (does not compile on purpose) -->
```ts
convert(1, "km", "kg");
//                ~~~~ Argument of type '"kg"' is not assignable to parameter of type 'UnitName<"length">'.
```

## API reference

Convention: `x()` throws `ExactUnitsError`; `tryX()` returns
`{ ok: true, value } | { ok: false, error }` and never throws; `isX()` returns
a boolean and never throws.

### Values

A value is a `number`, a `string` or a `bigint`:

- strings: decimals (`"2.54"`, `"-1.5e-3"`, `".5"`) or integer fractions
  (`"1/3"`); surrounding whitespace is ignored;
- numbers: finite only, read through their shortest decimal form (what
  `String(x)` prints), so `0.1` means exactly 1/10;
- bigints: integers up to 10^1000 in magnitude.

Limits for untrusted input: at most 1000 characters, decimal exponents up to
±1000 (`MAX_INPUT_LENGTH`, `MAX_EXPONENT`). Anything else is rejected with
`InvalidValue`.

### `convert(value, from, to)` / `tryConvert(value, from, to)`

Converts between two units of the same dimension and returns a `Quantity`.
`from` and `to` accept canonical ids and aliases (`"m"`, `"metre"`, `"meter"`).
`tryConvert` accepts `unknown` arguments, for input from users or files.

```ts
import { convert, tryConvert } from "exact-units";

convert(1, "ft", "m").toString();  // "0.3048"
convert(1, "GB", "GiB").toFraction(); // "1953125/2097152"

const r = tryConvert("12", "km", "kg");
r.ok ? r.value.toString() : r.error.code; // "IncompatibleUnits"
```

### `quantity(value, unit)` and `Quantity`

`quantity()` creates an exact value in a unit; `convert()` returns the same
type. A `Quantity` is immutable:

| Member | |
| --- | --- |
| `unit`, `dimension` | canonical unit id and its dimension |
| `numerator`, `denominator`, `piPower` | exact value `numerator / denominator × π^piPower` (lowest terms) |
| `rational` | `true` when `piPower` is 0 |
| `to(unit)` | converts (same dimension only, checked at compile time) |
| `toDecimal(options?)` | decimal string, see below |
| `toFraction()` | `"127/50"`, `"-3"`, `"π/2"`, `"180/π"` |
| `toNumber()` | nearest `number` (correctly rounded, also for values with π) |
| `toString()` | `toDecimal()` |
| `toJSON()` | `{ value: toDecimal(), unit }` |

`toDecimal()` without options is exact when the value has a finite decimal
expansion; otherwise it is rounded half-even to 20 significant digits
(`DEFAULT_SIGNIFICANT`). Options:

| Option | |
| --- | --- |
| `decimals` | digits after the decimal point, 0–1000 |
| `significant` | significant digits, 1–1000 (not together with `decimals`) |
| `rounding` | `"half-even"` (default), `"half-up"` (ties away from zero), `"trunc"`, `"floor"`, `"ceil"` |
| `fixed` | keep trailing zeros (`"2.50"`), default `false` |

```ts
import { quantity } from "exact-units";

const third = quantity("1/3", "m");
third.toString();                                        // "0.33333333333333333333"
third.toDecimal({ decimals: 2 });                        // "0.33"
third.toDecimal({ decimals: 2, rounding: "ceil" });      // "0.34"
quantity("2.5", "m").toDecimal({ decimals: 0 });         // "2"
quantity("2.5", "m").toDecimal({ decimals: 0, rounding: "half-up" }); // "3"
quantity("123456", "m").toDecimal({ significant: 2 });   // "120000"
quantity("2.5", "m").toDecimal({ decimals: 2, fixed: true }); // "2.50"
quantity(5, "km").to("mi").toFraction();                 // "78125/25146"
```

### Units: `isUnit`, `getUnit`, `parseUnit` / `tryParseUnit`, `listUnits`, `DIMENSIONS`, `isConvertible`

```ts
import { getUnit, isConvertible, isUnit, listUnits, parseUnit } from "exact-units";

isUnit("km");                  // true
isUnit("KM");                  // false  (names are case-sensitive: mB is not MB)
getUnit("metre").id;           // "m"
getUnit("°F").offset;          // "45967/180"
parseUnit("mph").id;           // "mi/h"
isConvertible("km", "mi");     // true
isConvertible("degC", "delta_degC"); // false
listUnits("temperature").map((u) => u.id); // ["K", "degC", "degF", "degR"]
```

A `UnitInfo` has `id`, `dimension`, `name`, `symbol`, `aliases`, `system`
(`"metric"`, `"customary"`, `"us"`, `"imperial"` or `"other"`), `kind`
(`"linear"`, `"affine"` or `"reciprocal"`), `base` (the dimension's base
unit), the exact `factor` (and `offset` for affine units) as a fraction
string, `rational` and `source` (the cited definition).

Types: `Dimension`, `UnitId<D>` (canonical ids of a dimension), `UnitName<D>`
(ids and aliases), `DimensionOf<U>`, `UnitInfo<D>`, `Quantity<D>`.

### `parseQuantity(text)` / `tryParseQuantity(text)`

Parses a number followed by a unit name, with or without a space.

```ts
import { parseQuantity, tryParseQuantity } from "exact-units";

parseQuantity("12.5 km").to("m").toString();  // "12500"
parseQuantity("3/4 cup").to("tbsp_us").toString(); // "12"
parseQuantity("-40 °F").to("degC").toString(); // "-40"
tryParseQuantity("12 parsecs").ok;            // false
```

### `bestUnit(value, unit, options?)`

Re-expresses a value in the largest unit of a system in which its absolute
value is at least 1. `system` is `"metric"`, `"imperial"` or `"us"` (default:
the input unit's system; customary units such as `ft` count as `imperial`;
for volume and fuel economy `imperial` means UK units). For data units the
decimal/binary family of the input is kept unless `binary` is given.
Temperatures become °C (metric) or °F; angles are returned unchanged.

```ts
import { bestUnit } from "exact-units";

const b = bestUnit(0.0004, "km");
b.toString();                                          // "40"
b.unit;                                                // "cm"
bestUnit(5280, "ft").unit;                             // "mi"
bestUnit(1, "mi", { system: "metric" }).toString();    // "1.609344"
bestUnit(3e9, "B").unit;                               // "GB"
bestUnit(3 * 2 ** 30, "B", { binary: true }).unit;     // "GiB"
```

### `format(quantity, options?)` / `format(value, unit, options?)`

Formats for display with the locale's decimal and grouping separators and
digits (taken from `Intl.NumberFormat`), followed by the unit symbol. The
digits are computed exactly by this library. Accepts the `toDecimal`
options; the default is at most 3 decimals rounded half-up. Also: `locale`,
`grouping` (default `true`) and `display: "none"` to omit the symbol.

```ts
import { convert, format } from "exact-units";

format("1234567.891", "m", { locale: "en-US" });             // "1,234,567.891 m"
format("1234567.891", "m", { locale: "de-DE" });             // "1.234.567,891 m"
format(convert(1, "rad", "deg"), { locale: "en-US", decimals: 2 }); // "57.3°"
format(-5, "degC", { locale: "en-US" });                     // "-5 °C"
format("2.5", "m", { locale: "en-US", decimals: 2, fixed: true, display: "none" }); // "2.50"
```

## Exactness and π

All factors are exact rationals except for radians. Angles are stored
relative to the full turn, so degree, gon, arcminute, arcsecond and NATO mil
conversions are exact fractions too. A radian is 1/(2π) turn, which is
irrational; instead of approximating π, a `Quantity` keeps it as a symbolic
factor `π^piPower`:

- `convert(90, "deg", "rad")` is exactly `π/2` (`piPower: 1`,
  `rational: false`), and converting back gives exactly `90`;
- `toDecimal()` and `toNumber()` evaluate π with rigorous error bounds
  (Machin's formula in bigint arithmetic) and refine until the requested
  rounding is certain, so every printed digit is correct (up to 1000
  decimals);
- `toFraction()` shows the symbolic form (`"π/2"`, `"180/π"`).

```ts
import { convert } from "exact-units";

const right = convert(90, "deg", "rad");
right.rational;                                  // false
right.toDecimal({ decimals: 30 });               // "1.57079632679489661923132169164"
right.toNumber() === Math.PI / 2;                // true
right.to("deg").toString();                      // "90"
convert(1, "rad", "deg").toFraction();           // "180/π"
```

`rpm` is treated as 1/60 Hz (one revolution counted as one cycle).

## Temperatures: absolute values and differences

°C and °F are affine scales: `T/K = t/°C + 273.15` and
`T/K = (t/°F + 459.67) × 5/9`. A *temperature difference* is not converted
the same way (a change of 10 °C is a change of 18 °F, while 10 °C is 50 °F),
so differences have their own dimension, `temperature-difference`, with the
units `delta_K`, `delta_degC`, `delta_degF` and `delta_degR`. The two cannot
be mixed, and absolute temperatures below 0 K are rejected (`OutOfRange`).

```ts
import { convert } from "exact-units";

convert(10, "degC", "degF").toString();              // "50"
convert(10, "delta_degC", "delta_degF").toString();  // "18"
convert(-40, "°F", "°C").toString();                 // "-40"
convert(0, "K", "degF").toString();                  // "-459.67"
```

## Fuel economy

Fuel consumption (L/100 km) and fuel economy (km/L, mpg) are reciprocal:
`L/100km = 235.2145833… / mpg (US)`. The `km/L`, `mpg_us` and `mpg_imp`
units are converted with `base = factor / value`; zero has no reciprocal and
negative values are rejected (`OutOfRange`).

```ts
import { convert } from "exact-units";

convert(5, "L/100km", "km/L").toString();                  // "20"
convert(30, "mpg_us", "L/100km").toFraction();              // "112903/14400"
convert(40, "mpg_imp", "L/100km").toDecimal({ decimals: 3 }); // "7.062"
```

## Error handling

All throwing functions throw `ExactUnitsError` with a `code`:

| Code | Meaning |
| --- | --- |
| `InvalidValue` | Not a finite number, decimal/fraction string or bigint, or beyond the input limits. |
| `UnknownUnit` | Unit name not in the catalogue (names are case-sensitive). |
| `IncompatibleUnits` | Units of different dimensions. |
| `OutOfRange` | Below absolute zero, negative fuel economy, or zero fuel economy converted to a reciprocal unit. |
| `InvalidOption` | Wrong option type or range (`decimals`, `rounding`, `locale`, `system`, …). |

```ts
import { convert, isExactUnitsError, tryConvert } from "exact-units";

try {
  convert(-300, "degC", "K");
} catch (err) {
  if (isExactUnitsError(err)) console.log(err.code); // "OutOfRange"
}

const r = tryConvert("1", "m", "MM");
r.ok ? r.value.toString() : r.error.code; // "UnknownUnit"
```

## Units

173 units in 16 dimensions. Ids are ASCII; aliases add common spellings and
symbols (`µm`, `°C`, `m²`, `km/h`, …). Symbols that differ between systems
have explicit ids (`gal_us` / `gal_imp`, `pt_us` / `pt_imp`, `ton_us` /
`ton_uk`, `mpg_us` / `mpg_imp`), symbols that say which one they are
(`US gal`, `imp pt`, `mpg (US)`) and no ambiguous alias such as `gal`.
`cal`, `kcal` and `Cal` mean the thermochemical calorie (4.184 J, also the
food-labelling value); the International Table calorie is `cal_IT`. `hp` is
mechanical horsepower (550 ft·lbf/s); `hp_metric` (PS) and `hp_e` are separate.

<details>
<summary>Full list with exact factors</summary>

<!-- units:start -->
**length** (base `m`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `m` | metre | 1 | `meter`, `meters`, `metre`, `metres` |
| `km` | kilometre | 1000 | `kilometer`, `kilometers`, `kilometre`, `kilometres` |
| `dm` | decimetre | 0.1 | `decimeter`, `decimeters`, `decimetre`, `decimetres` |
| `cm` | centimetre | 0.01 | `centimeter`, `centimeters`, `centimetre`, `centimetres` |
| `mm` | millimetre | 0.001 | `millimeter`, `millimeters`, `millimetre`, `millimetres` |
| `um` | micrometre | 0.000001 | `µm`, `μm`, `micrometer`, `micrometers`, `micrometre`, `micrometres`, `micron`, `microns` |
| `nm` | nanometre | 0.000000001 | `nanometer`, `nanometers`, `nanometre`, `nanometres` |
| `angstrom` | ångström | 0.0000000001 | `Å`, `Å`, `ångström`, `angstroms` |
| `in` | inch | 0.0254 | `inch`, `inches` |
| `ft` | foot | 0.3048 | `foot`, `feet` |
| `yd` | yard | 0.9144 | `yard`, `yards` |
| `mi` | mile | 1609.344 | `mile`, `miles` |
| `nmi` | nautical mile | 1852 | `nautical mile`, `nautical miles` |
| `mil` | mil (thou) | 0.0000254 | `thou`, `mils` |
| `fathom` | fathom | 1.8288 | `fathoms`, `ftm` |
| `furlong` | furlong | 201.168 | `furlongs`, `fur` |
| `point` | point (typographic) | 127/360000 | `points` |
| `au` | astronomical unit | 149597870700 | `astronomical unit`, `astronomical units` |
| `ly` | light-year | 9460730472580800 | `light-year`, `light-years`, `light year`, `light years` |

**mass** (base `kg`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `kg` | kilogram | 1 | `kilogram`, `kilograms` |
| `g` | gram | 0.001 | `gram`, `grams` |
| `mg` | milligram | 0.000001 | `milligram`, `milligrams` |
| `ug` | microgram | 0.000000001 | `µg`, `μg`, `mcg`, `microgram`, `micrograms` |
| `t` | tonne | 1000 | `tonne`, `tonnes`, `metric ton`, `metric tons` |
| `lb` | pound | 0.45359237 | `pound`, `pounds`, `lbs` |
| `oz` | ounce | 0.028349523125 | `ounce`, `ounces` |
| `st` | stone | 6.35029318 | `stone`, `stones` |
| `gr` | grain | 0.00006479891 | `grain`, `grains` |
| `ton_us` | short ton | 907.18474 | `short ton`, `short tons` |
| `ton_uk` | long ton | 1016.0469088 | `long ton`, `long tons` |
| `oz_t` | troy ounce | 0.0311034768 | `troy ounce`, `troy ounces`, `ozt` |
| `dwt` | pennyweight | 0.00155517384 | `pennyweight`, `pennyweights` |
| `ct` | carat (metric) | 0.0002 | `carat`, `carats` |
| `slug` | slug | 8896443230521/609600000000 | `slugs` |

**time** (base `s`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `s` | second | 1 | `second`, `seconds`, `sec`, `secs` |
| `ms` | millisecond | 0.001 | `millisecond`, `milliseconds` |
| `us` | microsecond | 0.000001 | `µs`, `μs`, `microsecond`, `microseconds` |
| `ns` | nanosecond | 0.000000001 | `nanosecond`, `nanoseconds` |
| `min` | minute | 60 | `minute`, `minutes`, `mins` |
| `h` | hour | 3600 | `hour`, `hours`, `hr`, `hrs` |
| `d` | day | 86400 | `day`, `days` |
| `wk` | week | 604800 | `week`, `weeks` |
| `yr` | Julian year | 31557600 | `year`, `years`, `julian year` |

**area** (base `m2`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `m2` | square metre | 1 | `m²`, `m^2`, `square meter`, `square meters`, `square metre`, `square metres` |
| `km2` | square kilometre | 1000000 | `km²`, `km^2`, `square kilometer`, `square kilometers`, `square kilometre`, `square kilometres` |
| `cm2` | square centimetre | 0.0001 | `cm²`, `cm^2` |
| `mm2` | square millimetre | 0.000001 | `mm²`, `mm^2` |
| `ha` | hectare | 10000 | `hectare`, `hectares` |
| `are` | are | 100 | `ares` |
| `in2` | square inch | 0.00064516 | `in²`, `in^2`, `sq in`, `square inch`, `square inches` |
| `ft2` | square foot | 0.09290304 | `ft²`, `ft^2`, `sq ft`, `square foot`, `square feet` |
| `yd2` | square yard | 0.83612736 | `yd²`, `yd^2`, `sq yd`, `square yard`, `square yards` |
| `mi2` | square mile | 2589988.110336 | `mi²`, `mi^2`, `sq mi`, `square mile`, `square miles` |
| `ac` | acre | 4046.8564224 | `acre`, `acres` |

**volume** (base `m3`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `m3` | cubic metre | 1 | `m³`, `m^3`, `cubic meter`, `cubic meters`, `cubic metre`, `cubic metres` |
| `cm3` | cubic centimetre | 0.000001 | `cm³`, `cm^3`, `cc` |
| `L` | litre | 0.001 | `l`, `ℓ`, `liter`, `liters`, `litre`, `litres`, `dm3`, `dm³`, `dm^3` |
| `hL` | hectolitre | 0.1 | `hl`, `hectoliter`, `hectoliters`, `hectolitre`, `hectolitres` |
| `dL` | decilitre | 0.0001 | `dl`, `deciliter`, `deciliters`, `decilitre`, `decilitres` |
| `cL` | centilitre | 0.00001 | `cl`, `centiliter`, `centiliters`, `centilitre`, `centilitres` |
| `mL` | millilitre | 0.000001 | `ml`, `milliliter`, `milliliters`, `millilitre`, `millilitres` |
| `uL` | microlitre | 0.000000001 | `µL`, `μL`, `µl`, `μl`, `ul`, `microliter`, `microliters`, `microlitre`, `microlitres` |
| `in3` | cubic inch | 0.000016387064 | `in³`, `in^3`, `cu in`, `cubic inch`, `cubic inches` |
| `ft3` | cubic foot | 0.028316846592 | `ft³`, `ft^3`, `cu ft`, `cubic foot`, `cubic feet` |
| `yd3` | cubic yard | 0.764554857984 | `yd³`, `yd^3`, `cu yd`, `cubic yard`, `cubic yards` |
| `gal_us` | US gallon | 0.003785411784 | `US gal`, `US gallon`, `US gallons`, `gal (US)` |
| `qt_us` | US quart | 0.000946352946 | `US qt`, `US quart`, `US quarts`, `qt (US)` |
| `pt_us` | US pint | 0.000473176473 | `US pt`, `US pint`, `US pints`, `pt (US)` |
| `cup_us` | US cup | 0.0002365882365 | `cup`, `cups`, `US cup`, `US cups` |
| `floz_us` | US fluid ounce | 0.0000295735295625 | `US fl oz`, `US fluid ounce`, `US fluid ounces`, `fl oz (US)` |
| `tbsp_us` | US tablespoon | 0.00001478676478125 | `tbsp`, `tablespoon`, `tablespoons` |
| `tsp_us` | US teaspoon | 0.00000492892159375 | `tsp`, `teaspoon`, `teaspoons` |
| `gal_imp` | imperial gallon | 0.00454609 | `imp gal`, `imperial gallon`, `imperial gallons`, `UK gallon`, `UK gallons`, `gal (imp)` |
| `qt_imp` | imperial quart | 0.0011365225 | `imp qt`, `imperial quart`, `imperial quarts`, `qt (imp)` |
| `pt_imp` | imperial pint | 0.00056826125 | `imp pt`, `imperial pint`, `imperial pints`, `UK pint`, `UK pints`, `pt (imp)` |
| `floz_imp` | imperial fluid ounce | 0.0000284130625 | `imp fl oz`, `imperial fluid ounce`, `imperial fluid ounces`, `fl oz (imp)` |
| `bbl` | oil barrel | 0.158987294928 | `oil barrel`, `oil barrels`, `barrel (oil)` |

**speed** (base `m/s`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `m/s` | metre per second | 1 | `m s-1`, `m·s⁻¹`, `meters per second`, `metres per second` |
| `km/h` | kilometre per hour | 5/18 | `kph`, `kmh`, `km/hr`, `kilometers per hour`, `kilometres per hour` |
| `km/s` | kilometre per second | 1000 | `kilometers per second`, `kilometres per second` |
| `mi/h` | mile per hour | 0.44704 | `mph`, `miles per hour` |
| `ft/s` | foot per second | 0.3048 | `fps`, `feet per second` |
| `kn` | knot | 463/900 | `knot`, `knots`, `kt` |

**temperature** (base `K`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `K` | kelvin | 1 | `kelvin`, `kelvins` |
| `degC` | degree Celsius | value × 1 + 273.15 | `°C`, `℃`, `celsius`, `degree Celsius`, `degrees Celsius` |
| `degF` | degree Fahrenheit | value × 5/9 + 45967/180 | `°F`, `℉`, `fahrenheit`, `degree Fahrenheit`, `degrees Fahrenheit` |
| `degR` | degree Rankine | 5/9 | `°R`, `rankine`, `degree Rankine`, `degrees Rankine` |

**temperature-difference** (base `delta_K`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `delta_K` | kelvin (difference) | 1 | `ΔK` |
| `delta_degC` | degree Celsius (difference) | 1 | `Δ°C`, `Δ℃` |
| `delta_degF` | degree Fahrenheit (difference) | 5/9 | `Δ°F`, `Δ℉` |
| `delta_degR` | degree Rankine (difference) | 5/9 | `Δ°R` |

**pressure** (base `Pa`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `Pa` | pascal | 1 | `pascal`, `pascals` |
| `hPa` | hectopascal | 100 | `hectopascal`, `hectopascals` |
| `kPa` | kilopascal | 1000 | `kilopascal`, `kilopascals` |
| `MPa` | megapascal | 1000000 | `megapascal`, `megapascals` |
| `bar` | bar | 100000 | `bars` |
| `mbar` | millibar | 100 | `millibar`, `millibars` |
| `atm` | standard atmosphere | 101325 | `atmosphere`, `atmospheres`, `standard atmosphere` |
| `at` | technical atmosphere | 98066.5 | `technical atmosphere`, `kgf/cm2`, `kgf/cm²` |
| `torr` | torr | 20265/152 | `Torr` |
| `mmHg` | millimetre of mercury (conventional) | 133.322387415 | `mm Hg`, `millimeter of mercury`, `millimetre of mercury` |
| `inHg` | inch of mercury (conventional) | 3386.388640341 | `in Hg`, `inch of mercury` |
| `psi` | pound-force per square inch | 8896443230521/1290320000 | `lbf/in2`, `lbf/in²`, `pound per square inch` |
| `ksi` | kilopound-force per square inch | 8896443230521/1290320 | `kip/in2`, `kip/in²` |

**energy** (base `J`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `J` | joule | 1 | `joule`, `joules` |
| `kJ` | kilojoule | 1000 | `kilojoule`, `kilojoules` |
| `MJ` | megajoule | 1000000 | `megajoule`, `megajoules` |
| `GJ` | gigajoule | 1000000000 | `gigajoule`, `gigajoules` |
| `Wh` | watt hour | 3600 | `watt hour`, `watt hours` |
| `kWh` | kilowatt hour | 3600000 | `kilowatt hour`, `kilowatt hours` |
| `MWh` | megawatt hour | 3600000000 | `megawatt hour`, `megawatt hours` |
| `cal_th` | calorie (thermochemical) | 4.184 | `cal`, `calorie`, `calories` |
| `kcal_th` | kilocalorie (thermochemical) | 4184 | `kcal`, `kilocalorie`, `kilocalories`, `Cal` |
| `cal_IT` | calorie (International Table) | 4.1868 | `calIT` |
| `kcal_IT` | kilocalorie (International Table) | 4186.8 | `kcalIT` |
| `eV` | electronvolt | 0.0000000000000000001602176634 | `electronvolt`, `electronvolts`, `electron volt`, `electron volts` |
| `MeV` | megaelectronvolt | 0.0000000000001602176634 | `megaelectronvolt`, `megaelectronvolts` |
| `BTU` | British thermal unit (International Table) | 1055.05585262 | `Btu`, `BTU_IT`, `Btu_IT`, `British thermal unit`, `British thermal units` |
| `ft_lbf` | foot-pound-force | 1.3558179483314004 | `ft·lbf`, `ft-lbf`, `ft lbf`, `foot-pound`, `foot-pounds` |
| `erg` | erg | 0.0000001 | `ergs` |

**power** (base `W`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `W` | watt | 1 | `watt`, `watts` |
| `mW` | milliwatt | 0.001 | `milliwatt`, `milliwatts` |
| `kW` | kilowatt | 1000 | `kilowatt`, `kilowatts` |
| `MW` | megawatt | 1000000 | `megawatt`, `megawatts` |
| `GW` | gigawatt | 1000000000 | `gigawatt`, `gigawatts` |
| `hp` | horsepower (mechanical) | 745.69987158227022 | `horsepower`, `hp(I)` |
| `hp_metric` | horsepower (metric) | 735.49875 | `PS`, `metric horsepower` |
| `hp_e` | horsepower (electric) | 746 | `hp(E)`, `electric horsepower` |
| `BTU/h` | Btu per hour | 52752792631/180000000000 | `Btu/h`, `BTU/hr`, `Btu/hr` |

**data** (base `bit`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `bit` | bit | 1 | `bits` |
| `kbit` | kilobit | 1000 | `kilobit`, `kilobits` |
| `Mbit` | megabit | 1000000 | `megabit`, `megabits` |
| `Gbit` | gigabit | 1000000000 | `gigabit`, `gigabits` |
| `Tbit` | terabit | 1000000000000 | `terabit`, `terabits` |
| `Kibit` | kibibit | 1024 | `kibibit`, `kibibits` |
| `Mibit` | mebibit | 1048576 | `mebibit`, `mebibits` |
| `Gibit` | gibibit | 1073741824 | `gibibit`, `gibibits` |
| `B` | byte | 8 | `byte`, `bytes`, `octet`, `octets` |
| `kB` | kilobyte | 8000 | `kilobyte`, `kilobytes` |
| `MB` | megabyte | 8000000 | `megabyte`, `megabytes` |
| `GB` | gigabyte | 8000000000 | `gigabyte`, `gigabytes` |
| `TB` | terabyte | 8000000000000 | `terabyte`, `terabytes` |
| `PB` | petabyte | 8000000000000000 | `petabyte`, `petabytes` |
| `KiB` | kibibyte | 8192 | `kibibyte`, `kibibytes` |
| `MiB` | mebibyte | 8388608 | `mebibyte`, `mebibytes` |
| `GiB` | gibibyte | 8589934592 | `gibibyte`, `gibibytes` |
| `TiB` | tebibyte | 8796093022208 | `tebibyte`, `tebibytes` |

**angle** (base `turn`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `turn` | turn | 1 | `turns`, `rev`, `revolution`, `revolutions` |
| `rad` | radian | 1/(2π) | `radian`, `radians` |
| `mrad` | milliradian | 1/(2000π) | `milliradian`, `milliradians` |
| `deg` | degree | 1/360 | `°`, `degree`, `degrees` |
| `arcmin` | arcminute | 1/21600 | `′`, `arcminute`, `arcminutes` |
| `arcsec` | arcsecond | 1/1296000 | `″`, `arcsecond`, `arcseconds` |
| `grad` | gon | 0.0025 | `gon`, `gons`, `gradian`, `gradians` |
| `mil_nato` | mil (NATO) | 0.00015625 | `NATO mil` |

**frequency** (base `Hz`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `Hz` | hertz | 1 | `hertz` |
| `kHz` | kilohertz | 1000 | `kilohertz` |
| `MHz` | megahertz | 1000000 | `megahertz` |
| `GHz` | gigahertz | 1000000000 | `gigahertz` |
| `THz` | terahertz | 1000000000000 | `terahertz` |
| `rpm` | revolution per minute | 1/60 | `r/min`, `rev/min` |

**force** (base `N`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `N` | newton | 1 | `newton`, `newtons` |
| `kN` | kilonewton | 1000 | `kilonewton`, `kilonewtons` |
| `dyn` | dyne | 0.00001 | `dyne`, `dynes` |
| `kgf` | kilogram-force | 9.80665 | `kilogram-force`, `kp` |
| `lbf` | pound-force | 4.4482216152605 | `pound-force` |
| `ozf` | ounce-force | 0.27801385095378125 | `ounce-force` |
| `kip` | kip | 4448.2216152605 | `kips`, `kilopound-force` |
| `pdl` | poundal | 0.138254954376 | `poundal`, `poundals` |

**fuel-economy** (base `L/100km`)

| id | name | 1 unit in base | aliases |
| --- | --- | --- | --- |
| `L/100km` | litre per 100 kilometres | 1 | `l/100km`, `L/100 km`, `l/100 km` |
| `km/L` | kilometre per litre | 100 ÷ value | `km/l`, `kmpl` |
| `mpg_us` | mile per US gallon | 112903/480 ÷ value | `mpg (US)`, `mi/gal (US)` |
| `mpg_imp` | mile per imperial gallon | 56826125/201168 ÷ value | `mpg (imp)`, `mi/gal (imp)` |
<!-- units:end -->

</details>

## Sources

| Units | Definition | Source |
| --- | --- | --- |
| SI units and prefixes; minute, hour, day, litre, tonne, hectare, degree, arcminute, arcsecond, astronomical unit, electronvolt | SI and non-SI units accepted for use with the SI (Table 8) | [BIPM, The International System of Units (SI Brochure), 9th edition, 2019](https://www.bipm.org/en/publications/si-brochure) |
| inch, foot, yard, mile, pound and everything derived from them (in², ft³, ounce, grain, psi, …) | 1 yd = 0.9144 m and 1 lb = 0.45359237 kg exactly | International yard and pound agreement (1959); [NIST SP 811 (2008), Appendix B.8](https://www.nist.gov/pml/special-publication-811) |
| US gallon and its parts, cup, tablespoon, teaspoon, troy ounce, pennyweight, short and long ton, acre, fathom, furlong | US gallon = 231 in³, cup = 8 fl oz, … | [NIST Handbook 44 (2024), Appendix C](https://www.nist.gov/pml/owm/publications/nist-handbooks/handbook-44) |
| imperial gallon, quart, pint, fluid ounce; stone | 1 gal = 4.54609 dm³; 1 st = 14 lb | [UK Weights and Measures Act 1985, Schedule 1](https://www.legislation.gov.uk/ukpga/1985/72/schedule/1) |
| °F, °R, calories (4.184 J and 4.1868 J), Btu (1055.05585262 J), standard atmosphere (101325 Pa), torr, conventional mmHg/inHg, bar, horsepower, lbf, kgf, poundal, slug, knot, nautical mile, barrel, carat, ångström, dyne, erg | as listed in Appendix B.8 | [NIST SP 811 (2008), Appendix B.8](https://www.nist.gov/pml/special-publication-811) |
| kgf, psi, at, PS | standard acceleration of gravity gₙ = 9.80665 m/s² exactly | 3rd CGPM (1901); NIST SP 811 |
| Julian year, light-year | 365.25 d; c × Julian year | IAU; c = 299792458 m/s (SI) |
| astronomical unit | 149597870700 m | IAU 2012 Resolution B2 |
| bit, byte, binary prefixes Ki/Mi/Gi/Ti | byte = 8 bit; Ki = 2¹⁰ | IEC 80000-13:2008 |
| typographic point | 1/72 in | [W3C CSS Values and Units Level 3](https://www.w3.org/TR/css-values-3/#absolute-lengths) |

Each unit's `source` field (and the comment next to it in
[`src/units/catalog.ts`](./src/units/catalog.ts)) names its definition.
[`test/definitions.test.ts`](./test/definitions.test.ts) checks every unit
against it, written independently as a published exact decimal or a defining
expression, and spot-checks the printed factors from NIST SP 811.

The US survey foot (deprecated by NIST since 2023) is not included; all
customary units use the international foot.

## Limitations

- Only conversion: no arithmetic between quantities, no compound units
  beyond the listed ones (km/h, L/100 km, …), no unit parsing of expressions
  such as `kg*m/s^2`.
- Unit names are matched exactly (case-sensitive, no Unicode normalisation).
- `toNumber()` is limited by `number` precision; use `toDecimal()` or
  `toFraction()` when exactness matters.
- `format()` relies on the runtime's `Intl` locale data for separators and
  digits; the number itself is never rounded through a `number`.

## Disclaimer

**Use at your own risk.** This software is provided as is, without warranty of any kind. It is not suitable as the sole basis for legal metrology, medical dosing or safety-critical calculations. See the full legal text in [DISCLAIMER.md](./DISCLAIMER.md).

## Contributing

This repository is maintained by a single author and does not accept external
contributions; issues and pull requests are limited to collaborators.

Security problems can be reported privately, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © 2026 Gildor
