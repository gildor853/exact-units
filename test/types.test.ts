import { describe, expectTypeOf, it } from "vitest";
import { convert, type DimensionOf, getUnit, type Quantity, quantity, type UnitId, type UnitName } from "../src/index.js";

// Compile-time checks (run by `npm run typecheck`); the runtime part is trivial.
describe("types", () => {
  it("unit names are literal types grouped by dimension", () => {
    expectTypeOf<DimensionOf<"km">>().toEqualTypeOf<"length">();
    expectTypeOf<DimensionOf<"metre">>().toEqualTypeOf<"length">();
    expectTypeOf<DimensionOf<"°C">>().toEqualTypeOf<"temperature">();
    expectTypeOf<DimensionOf<"Δ°C">>().toEqualTypeOf<"temperature-difference">();
    expectTypeOf<"km">().toExtend<UnitId<"length">>();
    expectTypeOf<"kilometre">().toExtend<UnitName<"length">>();
    expectTypeOf<"kilometre">().not.toExtend<UnitId>();
    expectTypeOf<"kg">().not.toExtend<UnitName<"length">>();
  });

  it("convert keeps the dimension and rejects mixed dimensions", () => {
    const q = convert(1, "km", "mi");
    expectTypeOf(q).toEqualTypeOf<Quantity<"length">>();
    expectTypeOf(q.unit).toEqualTypeOf<UnitId<"length">>();
    expectTypeOf(convert("1", "°F", "K")).toEqualTypeOf<Quantity<"temperature">>();
    if (Math.random() > 2) {
      // @ts-expect-error length → mass
      convert(1, "km", "kg");
      // @ts-expect-error absolute temperature → temperature difference
      convert(1, "degC", "delta_degC");
      // @ts-expect-error unknown unit
      convert(1, "km", "parsec");
      // @ts-expect-error value must be number | string | bigint
      convert(null, "km", "m");
      // @ts-expect-error .to() is restricted to the quantity's dimension
      quantity(1, "m").to("s");
    }
    expectTypeOf(quantity(1, "kWh").to("BTU")).toEqualTypeOf<Quantity<"energy">>();
    expectTypeOf(getUnit("ft").id).toEqualTypeOf<UnitId<"length">>();
    // a quantity of one dimension is usable where any quantity is expected
    expectTypeOf<Quantity<"length">>().toExtend<Quantity>();
    expectTypeOf<Quantity>().not.toExtend<Quantity<"length">>();
  });
});
