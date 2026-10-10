import { div, mul, ONE, pow, r, type Ratio } from "../src/rational.js";
import { piFraction } from "../src/units/index.js";

/**
 * Evaluates a definition written as a product/quotient chain, left to right,
 * with `^` for integer powers and `pi` for π: "0.45359237*9.80665/0.0254^2".
 * Returns the exact fraction in the same notation as UnitInfo.factor.
 */
export function definition(expr: string): string {
  let q: Ratio = ONE;
  let k = 0;
  for (const m of expr.matchAll(/([*/]?)([^*/]+)/g)) {
    const [, op, term] = m as unknown as [string, string, string];
    const [base, exp = "1"] = term.split("^") as [string, string?];
    const e = Number(exp);
    let tq: Ratio = ONE;
    let tk = 0;
    if (base === "pi") tk = e;
    else tq = pow(r(base), e);
    if (op === "/") {
      q = div(q, tq);
      k -= tk;
    } else {
      q = mul(q, tq);
      k += tk;
    }
  }
  return piFraction(q, k);
}
