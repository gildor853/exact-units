// Runtime smoke test of the built package (CJS entry). See smoke.mjs.
"use strict";
const assert = require("node:assert/strict");
const { convert, tryConvert, ExactUnitsError, isUnit } = require("exact-units");

assert.equal(convert(1, "gal_us", "L").toString(), "3.785411784");
assert.equal(convert(1, "GiB", "MB").toString(), "1073.741824");
const bad = tryConvert(1, "km", "kg");
assert.equal(bad.ok, false);
assert.ok(bad.error instanceof ExactUnitsError);
assert.equal(bad.error.code, "IncompatibleUnits");
assert.equal(tryConvert(-300, "degC", "K").error.code, "OutOfRange");
assert.equal(isUnit("__proto__"), false);
assert.equal(JSON.stringify(convert(1, "ft", "cm")), '{"value":"30.48","unit":"cm"}');

console.log(`CJS smoke test passed on Node ${process.version}`);
