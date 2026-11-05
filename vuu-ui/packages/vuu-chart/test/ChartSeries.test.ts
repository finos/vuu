import { describe, expect, it } from "vitest";
import { ChartSeries } from "../src/ChartSeries";
import { testModule } from "../../vuu-data-test/src/test/TestModule";

describe("ChartSeries", () => {
  it("Single Series defaults are as expected", () => {
    const dataSource = testModule.createDataSource("ChartTable");

    const cs = new ChartSeries({
      config: {},
      dataSource,
      palette: ["red", "white", "blue"],
    });

    cs.categoryColumn = "date";
    cs.seriesColumnNames = ["price"];

    expect(cs.series).toHaveLength(1);

    const [{ data, id, name, label, type, symbol, symbolSize }] = cs.series;

    expect(id).toEqual("price");
    expect(name).toEqual("price");
    expect(label).toEqual("price");
    expect(symbol).toEqual("circle");
    expect(symbolSize).toEqual(6);
    expect(type).toEqual("line");
    expect(data).toHaveLength(25);
  });

  describe("series colours", () => {
    const createChartSeries = (palette: string[]) => {
      const cs = new ChartSeries({
        config: {},
        dataSource: testModule.createDataSource("ChartVariantTable"),
        palette,
      });
      cs.categoryColumn = "date";
      return cs;
    };
    const palette = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];
    const setA = ["series_01_set_a", "series_02_set_a", "series_03_set_a"];
    const setB = ["series_01_set_b", "series_02_set_b", "series_03_set_b"];
    const setC = ["series_01_set_c", "series_02_set_c", "series_03_set_c"];

    it("assigns palette colours in column order", () => {
      const cs = createChartSeries(palette);
      cs.seriesColumnNames = setA;
      expect(cs.palette).toEqual(["c1", "c2", "c3"]);
    });

    it("gives the nth column of an equal sized selection the same colour", () => {
      const cs = createChartSeries(palette);
      cs.seriesColumnNames = setA;
      cs.seriesColumnNames = setB;
      expect(cs.palette).toEqual(["c1", "c2", "c3"]);
    });

    it("keeps colours when switching back to a previous selection", () => {
      const cs = createChartSeries(palette);
      cs.seriesColumnNames = setA;
      cs.seriesColumnNames = setB;
      cs.seriesColumnNames = setA;
      expect(cs.palette).toEqual(["c1", "c2", "c3"]);
    });

    it("matches colours by position when the number of series changes", () => {
      const cs = createChartSeries(palette);
      cs.seriesColumnNames = setA;
      cs.seriesColumnNames = setC.slice(0, 2);
      expect(cs.palette).toEqual(["c1", "c2"]);
      cs.seriesColumnNames = [...setB, "series_04_set_b"];
      expect(cs.palette).toEqual(["c1", "c2", "c3", "c4"]);
    });

    it("repeats colours when there are more columns than palette colours", () => {
      const cs = createChartSeries(["c1", "c2"]);
      cs.seriesColumnNames = setA;
      expect(cs.palette).toEqual(["c1", "c2", "c1"]);
    });

    it("avoids a colour already used by a charted series", () => {
      const cs = createChartSeries(palette);
      cs.seriesColumnNames = setA;
      cs.seriesColumnNames = [
        "series_02_set_a",
        "series_01_set_b",
        "series_02_set_b",
      ];
      // series_02_set_a keeps c2, the new columns take the free slots
      expect(cs.palette).toEqual(["c2", "c3", "c1"]);
    });

    it("assigns a colour to every series line", () => {
      const cs = createChartSeries(palette);
      cs.seriesColumnNames = [...setA, ...setB];
      expect(cs.palette.every((color) => color !== undefined)).toBe(true);
    });
  });
});
