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
});
