import { describe, expect, it } from "vitest";
import { createTypeDefExports } from "../../../scripts/type-defs-exports.mjs";

describe("type definition package exports", () => {
  it("includes declarations for the portal subpath", () => {
    expect(
      createTypeDefExports({
        ".": "./src/index.ts",
        "./portal": "./src/portal.ts",
      }),
    ).toEqual({
      ".": {
        default: "./src/index.js",
        types: "./types/index.d.ts",
      },
      "./portal": {
        default: "./src/portal.js",
        types: "./types/portal.d.ts",
      },
    });
  });
});
