import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain JS helper without type declarations
import { unitsTable } from "../scripts/units-table.mjs";
import * as api from "../src/index.js";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

describe("README", () => {
  it("contains the generated units table", () => {
    const block = /<!-- units:start -->\n([\s\S]*?)\n<!-- units:end -->/.exec(readme)?.[1];
    expect(block).toBe(unitsTable(api));
  });

  it("states the current unit and dimension counts", () => {
    const units = api.listUnits().length;
    const dims = api.DIMENSIONS.length;
    expect(readme.match(/(\d+) units in (\d+) dimensions/g)).toEqual([`${units} units in ${dims} dimensions`, `${units} units in ${dims} dimensions`]);
  });

  it("install snippet references a tag", () => {
    expect(readme).toContain("npm install github:gildor853/exact-units#v1.0.0");
  });
});
