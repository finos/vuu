import { describe, expect, it } from "vitest";
import { humanise, splitWords } from "../scripts/humanise";

describe("humanise", () => {
  it("splits camel case into sentence case", () => {
    expect(humanise("PinnedColumns")).toEqual("Pinned columns");
    expect(humanise("DefaultTable")).toEqual("Default table");
  });
  it("removes a numeric ordering prefix", () => {
    expect(humanise("1.ApplicationFeatures")).toEqual("Application features");
    expect(humanise("02-Columns")).toEqual("Columns");
  });
  it("keeps proper nouns and acronyms", () => {
    expect(humanise("VuuDataRemote")).toEqual("Vuu data remote");
    expect(humanise("GridLayoutFromJSON")).toEqual("Grid layout from JSON");
    expect(humanise("TableScrollingAPI")).toEqual("Table scrolling API");
    expect(humanise("JsonTable")).toEqual("JSON table");
    expect(humanise("UiControls")).toEqual("UI controls");
    expect(humanise("html")).toEqual("HTML");
  });
  it("leaves upper case names unchanged", () => {
    expect(humanise("SIMUL")).toEqual("SIMUL");
  });
  it("separates numbers and single letters", () => {
    expect(humanise("BackgroundCell4Decimals")).toEqual(
      "Background cell 4 decimals",
    );
    expect(humanise("scratchpadA")).toEqual("Scratchpad A");
  });
  it("splitWords handles acronyms followed by words", () => {
    expect(splitWords("HTMLElementsList")).toEqual([
      "HTML",
      "Elements",
      "List",
    ]);
  });
});
