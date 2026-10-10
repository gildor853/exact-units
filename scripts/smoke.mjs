// Runtime smoke test of the built package (ESM entry), run by CI on Node
// versions the test runner no longer supports. No dependencies, no network.
// The bare specifier resolves to ./dist through the package's "exports" map.
import assert from "node:assert/strict";
import { bestUnit, convert, format, getUnit, listUnits, parseQuantity, quantity } from "exact-units";

assert.equal(convert("1", "in", "cm").toString(), "2.54");
assert.equal(convert(1, "mi", "ft").to("in").to("m").toString(), "1609.344");
assert.equal(convert(100, "degC", "degF").toString(), "212");
assert.equal(convert(10, "delta_degC", "delta_degF").toString(), "18");
assert.equal(convert(90, "deg", "rad").toFraction(), "π/2");
assert.equal(convert(90, "deg", "rad").toNumber(), Math.PI / 2);
assert.equal(convert(30, "mpg_us", "L/100km").toDecimal({ decimals: 2 }), "7.84");
assert.equal(convert(1, "psi", "kPa").toDecimal({ decimals: 6 }), "6.894757");
assert.equal(quantity("1/3", "m").toDecimal({ decimals: 4, rounding: "half-up" }), "0.3333");
assert.equal(bestUnit(1500, "m").unit, "km");
assert.equal(format("1234.5", "km", { locale: "en-US" }), "1,234.5 km");
assert.equal(parseQuantity("3/4 cup").to("tbsp_us").toString(), "12");
assert.equal(getUnit("metre").id, "m");
assert.equal(listUnits().length, 173);

console.log(`ESM smoke test passed on Node ${process.version}`);
