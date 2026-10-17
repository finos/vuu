import { describe, expect, it } from "vitest";
import {
  changeCompareAxis,
  compareCells,
  compareScale,
  compareViewportWidth,
  readCompareLayout,
  writeCompareLayout,
} from "../src/showcase-main/example/compare-model";
import { DEFAULT_PREVIEW_STATE } from "../src/showcase-main/example/preview-state";

const preview = { ...DEFAULT_PREVIEW_STATE, ds: "remote" as const };

describe("compare layout", () => {
  it("defaults to density × mode", () => {
    expect(readCompareLayout(new URLSearchParams())).toEqual({
      cols: "density",
      rows: "mode",
      size: "actual",
    });
  });

  it("reads and writes url params", () => {
    const params = writeCompareLayout(new URLSearchParams("tab=compare"), {
      cols: "theme",
      rows: "none",
      size: "viewport",
    });
    expect(params.get("tab")).toBe("compare");
    expect(readCompareLayout(params)).toEqual({
      cols: "theme",
      rows: "none",
      size: "viewport",
    });
  });

  it("never uses the same axis twice, or an invalid axis", () => {
    expect(
      readCompareLayout(new URLSearchParams("cols=mode&rows=mode")),
    ).toMatchObject({ cols: "mode", rows: "density" });
    expect(
      readCompareLayout(new URLSearchParams("cols=x&rows=y&size=z")),
    ).toEqual({ cols: "density", rows: "mode", size: "actual" });
  });

  it("swaps axes when one takes the value of the other", () => {
    const layout = { cols: "density", rows: "mode", size: "actual" } as const;
    expect(changeCompareAxis(layout, "cols", "mode")).toMatchObject({
      cols: "mode",
      rows: "density",
    });
    expect(changeCompareAxis(layout, "rows", "density")).toMatchObject({
      cols: "mode",
      rows: "density",
    });
    expect(changeCompareAxis(layout, "rows", "theme")).toMatchObject({
      cols: "density",
      rows: "theme",
    });
    expect(changeCompareAxis(layout, "rows", "none")).toMatchObject({
      cols: "density",
      rows: "none",
    });
  });
});

describe("compareCells", () => {
  it("builds the matrix in reading order, forcing the local data source", () => {
    const cells = compareCells(preview, {
      cols: "density",
      rows: "mode",
      size: "actual",
    });
    expect(cells).toHaveLength(8);
    expect(cells.map(({ key }) => key)).toEqual([
      "light:high",
      "light:medium",
      "light:low",
      "light:touch",
      "dark:high",
      "dark:medium",
      "dark:low",
      "dark:touch",
    ]);
    expect(cells[5].state).toEqual({
      ...preview,
      density: "medium",
      ds: "local",
      mode: "dark",
    });
  });

  it("has a single row when rows is none", () => {
    const cells = compareCells(preview, {
      cols: "theme",
      rows: "none",
      size: "actual",
    });
    expect(cells.map(({ state }) => state.theme)).toEqual([
      "vuu-theme",
      "salt-theme-next",
      "no-theme",
    ]);
    expect(cells.every(({ row }) => row === undefined)).toBe(true);
  });
});

describe("compare scaling", () => {
  it("uses the viewport preset, or a default width when filling", () => {
    expect(compareViewportWidth("fill")).toBe(1024);
    expect(compareViewportWidth("768")).toBe(768);
  });

  it("scales down to fit, never up", () => {
    expect(compareScale(512, 1024)).toBe(0.5);
    expect(compareScale(2000, 1024)).toBe(1);
    expect(compareScale(0, 1024)).toBe(0);
  });
});
