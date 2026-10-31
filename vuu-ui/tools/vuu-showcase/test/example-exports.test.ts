import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { parseExampleExports } from "../scripts/example-exports";

const fileName = "Basics.examples.tsx";
const source = fs.readFileSync(
  path.join(__dirname, "fixtures/examples/01-GettingStarted", fileName),
  "utf-8",
);

describe("parseExampleExports", () => {
  const examples = parseExampleExports(fileName, source);

  it("finds exported consts with upper case names only", () => {
    expect(examples.map(({ componentName }) => componentName)).toEqual([
      "LiveTable",
      "PinnedColumns",
      "GridLayoutFromJSON",
      "BackgroundCell4Decimals",
    ]);
  });
  it("supports the legacy tags comment", () => {
    expect(examples[0].tags).toEqual(["data-consumer"]);
    expect(examples[0].description).toBeUndefined();
  });
  it("reads a JSDoc description, joining lines", () => {
    expect(examples[1].description).toEqual("A table with pinned columns.");
    expect(examples[1].tags).toBeUndefined();
  });
  it("reads @title and @tags", () => {
    expect(examples[2]).toMatchObject({
      description: "Explicit title and tags",
      tags: ["data-consumer", "experimental"],
      title: "Grid from JSON",
    });
  });
  it("records the source range, including the doc comment", () => {
    expect(examples[0].sourceRange).toEqual([1, 2]);
    expect(examples[1].sourceRange).toEqual([4, 8]);
    expect(examples[3].sourceRange).toEqual([17, 17]);
  });
});
