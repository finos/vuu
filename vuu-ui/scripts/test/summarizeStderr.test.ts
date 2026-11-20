import { describe, expect, it } from "vitest";
import { summarizeStderr } from "../utils.ts";

describe("summarizeStderr", () => {
  it("reports npm's error lines rather than the notices before them", () => {
    const stderr = [
      "npm notice",
      "npm notice package: @vuu-ui/vuu-utils@5.0.0-alpha.11",
      "npm notice Tarball Contents",
      "npm notice 70B src/errors.js",
      "npm notice Publishing to https://registry.npmjs.org with tag alpha and public access",
      "npm error code E404",
      "npm error 404 Not Found - PUT https://registry.npmjs.org/@vuu-ui%2fvuu-utils - Not found",
      "npm error 404",
      "npm error 404  '@vuu-ui/vuu-utils@5.0.0-alpha.11' is not in this registry.",
      "npm error A complete log of this run can be found in: /tmp/debug-0.log",
    ].join("\n");

    expect(summarizeStderr(stderr)).toBe(
      [
        "code E404",
        "404 Not Found - PUT https://registry.npmjs.org/@vuu-ui%2fvuu-utils - Not found",
        "404 '@vuu-ui/vuu-utils@5.0.0-alpha.11' is not in this registry.",
      ].join(" | "),
    );
  });

  it("skips npm notices and warnings when there are no npm error lines", () => {
    const stderr = [
      "npm warn config something deprecated",
      "",
      "tsc: error TS2307: Cannot find module",
    ].join("\n");
    expect(summarizeStderr(stderr)).toBe(
      "tsc: error TS2307: Cannot find module",
    );
  });

  it("falls back to the first lines when they are all notices", () => {
    expect(summarizeStderr("npm notice one\nnpm notice two")).toBe(
      "npm notice one | npm notice two",
    );
  });

  it("returns an empty string for empty stderr", () => {
    expect(summarizeStderr("  \n")).toBe("");
  });
});
