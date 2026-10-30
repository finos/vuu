import { describe, expect, it } from "vitest";
import { createCandlestickModel } from "../src/charts/candlestick-model";
import { createCartesianModel, seriesIds } from "../src/charts/cartesian-model";
import { createDepthModel, cumulativeDepth } from "../src/charts/depth-model";
import { createHeatmapModel } from "../src/charts/heatmap-model";
import { createHierarchyModel } from "../src/charts/hierarchy-model";
import { GROUP_KEY_SEPARATOR } from "../src/engine/ChartModel";
import {
  type AnyOption,
  fakeDataSource,
  lookup,
  rowData,
  theme,
} from "./fixtures";

const seriesById = (option: AnyOption, id: string) =>
  option.series.find((s: { id: string }) => s.id === id);

describe("CartesianChart model", () => {
  const ds = fakeDataSource("prices");
  const prices = rowData(
    ["date", "price", "volume"],
    [
      ["2024-01-02", 101, 20],
      ["2024-01-01", 100, 10],
      ["2024-01-03", 102, 30],
    ],
  );

  it("generates unique series ids", () => {
    expect(
      seriesIds([
        { type: "line", columnName: "a" },
        { type: "bar", columnName: "a" },
        { type: "bar", columnName: "b", id: "x" },
      ]),
    ).toEqual(["a", "a-1", "x"]);
  });

  it("builds category axis in DataSource order, x as category index", () => {
    const model = createCartesianModel({
      dataSource: ds,
      series: [{ type: "line", columnName: "price" }],
      xAxis: { columnName: "date" },
    });
    const base: AnyOption = model.buildBaseOption(theme);
    expect(base.xAxis[0]).toMatchObject({ id: "x", type: "category" });
    expect(base.series[0]).toMatchObject({ id: "price", type: "line" });
    const { option, rowLookup } = model.buildDataOption(
      lookup([[ds, prices]]),
      theme,
    );
    const opt = option as AnyOption;
    expect(opt.xAxis[0].data).toEqual([
      "2024-01-02",
      "2024-01-01",
      "2024-01-03",
    ]);
    expect(opt.series[0].data).toEqual([
      [0, 101],
      [1, 100],
      [2, 102],
    ]);
    expect(rowLookup?.price.rows[1]).toBe(prices.rows[1]);
  });

  it("sorts by x on time axis", () => {
    const timed = rowData(
      ["t", "v"],
      [
        [3000, 3],
        [1000, 1],
        [2000, 2],
      ],
    );
    const model = createCartesianModel({
      dataSource: ds,
      series: [{ type: "area", columnName: "v" }],
      xAxis: { columnName: "t", type: "time" },
    });
    const base: AnyOption = model.buildBaseOption(theme);
    expect(base.series[0].type).toBe("line");
    expect(base.series[0].areaStyle).toBeDefined();
    const opt = model.buildDataOption(lookup([[ds, timed]]), theme)
      .option as AnyOption;
    expect(opt.xAxis).toBeUndefined();
    expect(opt.series[0].data).toEqual([
      [1000, 1],
      [2000, 2],
      [3000, 3],
    ]);
  });

  it("aggregates by category, swaps axes when horizontal", () => {
    const positions = rowData(
      ["sector", "account", "pnl"],
      [
        ["Tech", "A", 10],
        ["Energy", "A", 5],
        ["Tech", "B", 7],
        ["Tech", "A", 3],
      ],
    );
    const model = createCartesianModel({
      aggregation: "sum",
      dataSource: ds,
      orientation: "horizontal",
      series: [
        { type: "bar", columnName: "pnl", stack: "s", where: { account: "A" } },
        { type: "bar", columnName: "pnl", stack: "s", where: { account: "B" } },
      ],
      xAxis: { columnName: "sector" },
    });
    const base: AnyOption = model.buildBaseOption(theme);
    expect(base.yAxis[0]).toMatchObject({ id: "x", type: "category" });
    expect(base.xAxis[0]).toMatchObject({ id: "y0", type: "value" });
    expect(base.series[0].encode).toEqual({ x: 1, y: 0 });
    expect(base.legend.show).toBe(true);
    const opt = model.buildDataOption(lookup([[ds, positions]]), theme)
      .option as AnyOption;
    expect(opt.yAxis[0].data).toEqual(["Tech", "Energy"]);
    expect(opt.series[0].data).toEqual([
      [0, 13],
      [1, 5],
    ]);
    expect(opt.series[1].data).toEqual([[0, 7]]);
  });

  it("reads series from a second DataSource, with colorBy and markLines", () => {
    const fillsDs = fakeDataSource("fills");
    const fills = rowData(
      ["time", "price", "side", "qty"],
      [
        [1000, 10, "BUY", 100],
        [2000, 20, "SELL", 300],
      ],
    );
    const model = createCartesianModel({
      dataSource: ds,
      series: [
        {
          type: "scatter",
          columnName: "price",
          dataSource: fillsDs,
          xColumnName: "time",
          colorBy: { columnName: "side", colors: { BUY: "up", SELL: "down" } },
          markLines: [
            { value: { weightedAverage: "qty" } },
            { value: "last", color: "red" },
          ],
        },
      ],
      xAxis: { columnName: "t", type: "time" },
    });
    expect(model.dataSources).toEqual([ds, fillsDs]);
    const opt = model.buildDataOption(
      lookup([
        [ds, rowData(["t"], [])],
        [fillsDs, fills],
      ]),
      theme,
    ).option as AnyOption;
    const [series] = opt.series;
    expect(series.data[0]).toEqual({
      value: [1000, 10],
      itemStyle: { color: theme.upColor },
    });
    expect(series.data[1].itemStyle.color).toBe(theme.downColor);
    expect(series.markLine.data.map((d: AnyOption) => d.yAxis)).toEqual([
      17.5, 20,
    ]);
    expect(series.markLine.data[1].lineStyle.color).toBe("red");
  });
});

describe("CandlestickChart model", () => {
  const barsDs = fakeDataSource("bars");
  const fillsDs = fakeDataSource("fills");
  const bars = rowData(
    ["start", "open", "high", "low", "close", "volume", "vwap"],
    [
      [2000, 11, 13, 10, 12, 200, 11.5],
      [1000, 10, 12, 9, 11, 100, 10.5],
      [3000, 12, 12.5, 9.5, 10, 300, 11],
    ],
  );
  const fills = rowData(
    ["time", "price", "side"],
    [
      [500, 9, "BUY"],
      [1500, 11, "BUY"],
      [3500, 10, "SELL"],
    ],
  );

  it("builds candles sorted by time, with volume and overlays", () => {
    const model = createCandlestickModel({
      dataSource: barsDs,
      markLines: [{ value: "last" }],
      overlays: [
        { type: "line", columnName: "vwap" },
        {
          type: "scatter",
          columnName: "price",
          dataSource: fillsDs,
          timeColumnName: "time",
          colorBy: { columnName: "side", colors: { BUY: "up", SELL: "down" } },
        },
      ],
      volumeColumnName: "volume",
    });
    const base: AnyOption = model.buildBaseOption(theme);
    expect(base.grid).toHaveLength(2);
    expect(base.xAxis.map((a: AnyOption) => a.id)).toEqual(["x", "x-volume"]);
    expect(base.dataZoom.map((z: AnyOption) => z.id)).toEqual([
      "zoom-inside",
      "zoom-slider",
    ]);
    expect(base.series.map((s: AnyOption) => s.id)).toEqual([
      "candles",
      "volume",
      "overlay-0-vwap",
      "overlay-1-price",
    ]);

    const { option, rowLookup } = model.buildDataOption(
      lookup([
        [barsDs, bars],
        [fillsDs, fills],
      ]),
      theme,
    );
    const opt = option as AnyOption;
    expect(opt.xAxis[0].data).toEqual(["1000", "2000", "3000"]);
    expect(opt.xAxis[1].data).toEqual(["1000", "2000", "3000"]);
    const candles = seriesById(opt, "candles");
    // [x, open, close, low, high]
    expect(candles.data).toEqual([
      [0, 10, 11, 9, 12],
      [1, 11, 12, 10, 13],
      [2, 12, 10, 9.5, 12.5],
    ]);
    expect(candles.markLine.data[0].yAxis).toBe(10);
    // last candle is down
    expect(candles.markLine.data[0].lineStyle.color).toBe(theme.downColor);
    const volume = seriesById(opt, "volume");
    expect(volume.data.map((d: AnyOption) => d.itemStyle.color)).toEqual([
      theme.upColor,
      theme.upColor,
      theme.downColor,
    ]);
    expect(seriesById(opt, "overlay-0-vwap").data).toEqual([
      [0, 10.5],
      [1, 11.5],
      [2, 11],
    ]);
    // fill before first bar is dropped, others snap to bar containing them
    const fillSeries = seriesById(opt, "overlay-1-price");
    expect(fillSeries.data.map((d: AnyOption) => d.value)).toEqual([
      [0, 11],
      [2, 10],
    ]);
    expect(rowLookup?.["overlay-1-price"].rows).toEqual([
      fills.rows[1],
      fills.rows[2],
    ]);
    expect(rowLookup?.candles.rows[0]).toBe(bars.rows[1]);
  });

  it("uses time values on a time axis", () => {
    const model = createCandlestickModel({
      dataSource: barsDs,
      dataZoom: false,
      xAxisType: "time",
    });
    const base: AnyOption = model.buildBaseOption(theme);
    expect(base.xAxis[0].type).toBe("time");
    expect(base.dataZoom).toEqual([]);
    const opt = model.buildDataOption(lookup([[barsDs, bars]]), theme)
      .option as AnyOption;
    expect(opt.xAxis).toBeUndefined();
    expect(opt.series[0].data[0][0]).toBe(1000);
  });
});

describe("DepthChart model", () => {
  it("computes cumulative depth from best price outwards", () => {
    const levels = [
      { price: 99, size: 10, row: [] },
      { price: 98, size: 20, row: [] },
    ];
    expect(
      cumulativeDepth(levels, "bid").map(({ price, cumSize }) => [
        price,
        cumSize,
      ]),
    ).toEqual([
      [99, 10],
      [98, 30],
    ]);
  });

  it("builds bid and ask curves with mid price", () => {
    const ds = fakeDataSource("depth");
    const depth = rowData(
      ["side", "price", "size"],
      [
        ["BUY", 99, 10],
        ["SELL", 101, 5],
        ["BUY", 98, 20],
        ["SELL", 102, 15],
      ],
    );
    const model = createDepthModel({ dataSource: ds });
    const base: AnyOption = model.buildBaseOption(theme);
    expect(base.series.map((s: AnyOption) => s.step)).toEqual(["start", "end"]);
    const opt = model.buildDataOption(lookup([[ds, depth]]), theme)
      .option as AnyOption;
    expect(opt.series[0].data).toEqual([
      [98, 30],
      [99, 10],
    ]);
    expect(opt.series[1].data).toEqual([
      [101, 5],
      [102, 20],
    ]);
    expect(opt.series[0].markLine.data[0].xAxis).toBe(100);
  });

  it("uses cumulative size column when provided", () => {
    const ds = fakeDataSource("depth");
    const depth = rowData(
      ["side", "price", "size", "cumSize"],
      [
        ["BUY", 99, 10, 11],
        ["BUY", 98, 20, 33],
      ],
    );
    const model = createDepthModel({
      cumulativeSizeColumnName: "cumSize",
      dataSource: ds,
    });
    const opt = model.buildDataOption(lookup([[ds, depth]]), theme)
      .option as AnyOption;
    expect(opt.series[0].data).toEqual([
      [98, 33],
      [99, 11],
    ]);
  });
});

describe("HeatmapChart model", () => {
  it("buckets, sorts and aggregates cells", () => {
    const ds = fakeDataSource("trades");
    const trades = rowData(
      ["time", "price", "qty"],
      [
        [1500, 10.12, 100],
        [500, 10.04, 50],
        [1800, 10.1, 5],
        [1200, 10.13, 25],
      ],
    );
    const model = createHeatmapModel({
      dataSource: ds,
      valueColumnName: "qty",
      xAxis: { columnName: "time", type: "time", bucketSize: 1000 },
      yAxis: { columnName: "price", type: "value", bucketSize: 0.1 },
    });
    const base: AnyOption = model.buildBaseOption(theme);
    expect(base.xAxis[0].type).toBe("category");
    expect(base.yAxis[0].type).toBe("category");
    const opt = model.buildDataOption(lookup([[ds, trades]]), theme)
      .option as AnyOption;
    expect(opt.xAxis[0].data).toEqual(["0", "1000"]);
    expect(opt.yAxis[0].data).toEqual(["10", "10.1"]);
    expect(opt.series[0].data).toEqual([
      [1, 1, 130],
      [0, 0, 50],
    ]);
    expect(opt.visualMap[0]).toMatchObject({ id: "vm", min: 0, max: 130 });
  });
});

describe("HierarchyChart model", () => {
  const ds = fakeDataSource("positions");
  const positions = rowData(
    ["sector", "ric", "pnl"],
    [
      ["Tech", "AAPL", 10],
      ["Tech", "MSFT", -30],
      ["Energy", "BP", 5],
      ["Tech", "AAPL", 5],
    ],
  );

  it("groups rows into a tree, colouring by sign", () => {
    const model = createHierarchyModel({
      colorMode: "sign",
      dataSource: ds,
      groupByColumnNames: ["sector", "ric"],
      type: "treemap",
      valueColumnName: "pnl",
    });
    const base: AnyOption = model.buildBaseOption(theme);
    expect(base.series[0]).toMatchObject({ id: "treemap", type: "treemap" });
    const { option, rowLookup } = model.buildDataOption(
      lookup([[ds, positions]]),
      theme,
    );
    const [tech, energy] = (option as AnyOption).series[0].data;
    expect(tech).toMatchObject({
      name: "Tech",
      // gross (sum of child sizes), signedValue is net
      value: 45,
      signedValue: -15,
      itemStyle: { color: theme.downColor },
    });
    expect(tech.children.map((c: AnyOption) => [c.name, c.value])).toEqual([
      ["AAPL", 15],
      ["MSFT", 30],
    ]);
    expect(energy.name).toBe("Energy");
    const groups = rowLookup?.treemap.groups;
    expect(groups?.get(`Tech${GROUP_KEY_SEPARATOR}AAPL`)).toEqual([
      positions.rows[0],
      positions.rows[3],
    ]);
  });

  it("pie uses first group column only", () => {
    const model = createHierarchyModel({
      dataSource: ds,
      groupByColumnNames: ["sector", "ric"],
      type: "pie",
      valueColumnName: "pnl",
      aggregation: "count",
    });
    const opt = model.buildDataOption(lookup([[ds, positions]]), theme)
      .option as AnyOption;
    expect(
      opt.series[0].data.map((n: AnyOption) => [n.name, n.value, n.children]),
    ).toEqual([
      ["Tech", 3, undefined],
      ["Energy", 1, undefined],
    ]);
  });
});

describe("HeatmapChart diverging colour scale", () => {
  it("is symmetric around zero, down to up colours", () => {
    const ds = fakeDataSource("positions");
    const positions = rowData(
      ["sector", "account", "pnl"],
      [
        ["Tech", "A", 50],
        ["Energy", "B", -200],
      ],
    );
    const model = createHeatmapModel({
      colorScale: "diverging",
      dataSource: ds,
      valueColumnName: "pnl",
      xAxis: { columnName: "sector" },
      yAxis: { columnName: "account" },
    });
    const base: AnyOption = model.buildBaseOption(theme);
    expect(base.visualMap[0].inRange.color).toEqual([
      theme.downColor,
      theme.splitLineColor,
      theme.upColor,
    ]);
    const opt = model.buildDataOption(lookup([[ds, positions]]), theme)
      .option as AnyOption;
    expect(opt.visualMap[0]).toMatchObject({ min: -200, max: 200 });
  });
});
