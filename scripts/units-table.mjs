// Prints the README units table from the built package (run `npm run build`
// first): `node scripts/units-table.mjs`. test/readme.test.ts checks with the
// sources that README.md contains exactly this table.

/** @param {typeof import("../src/index.js")} api */
export function unitsTable({ convert, DIMENSIONS, listUnits }) {
  const lines = [];
  for (const d of DIMENSIONS) {
    const units = listUnits(d);
    lines.push(`**${d}** (base \`${units[0].base}\`)`, "", "| id | name | 1 unit in base | aliases |", "| --- | --- | --- | --- |");
    for (const u of units) {
      // terminating fractions as decimals, everything else as the exact fraction
      const exact = (f) => {
        const m = /^-?\d+(?:\/(\d+))?$/.exec(f);
        if (!m) return f;
        let d = BigInt(m[1] ?? "1");
        while (d % 2n === 0n) d /= 2n;
        while (d % 5n === 0n) d /= 5n;
        return d === 1n ? convert(f, u.base, u.base).toString() : f;
      };
      const factor =
        u.kind === "affine" ? `value × ${u.factor} + ${exact(u.offset)}` : u.kind === "reciprocal" ? `${exact(u.factor)} ÷ value` : exact(u.factor);
      const aliases = u.aliases.map((a) => `\`${a}\``).join(", ");
      lines.push(`| \`${u.id}\` | ${u.name} | ${factor} | ${aliases} |`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(unitsTable(await import("../dist/index.js")));
