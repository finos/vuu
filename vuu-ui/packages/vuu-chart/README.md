# @vuu-ui/vuu-chart

React chart components driven by Vuu `DataSource`s, rendered with
[Apache ECharts](https://echarts.apache.org).

Every chart is declarative and configured by **column mapping**. You tell
the chart which columns hold the x values, the series values, the OHLC values
and so on. The chart subscribes to the DataSource and keeps itself up to date
as rows are inserted, updated or removed.

| Component                                   | Use for                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `CartesianChart`                            | line, area (incl. stepped), bar (vertical/horizontal/stacked), scatter |
| `CandlestickChart`                          | OHLC bars, optional volume pane and line/scatter overlays              |
| `DepthChart`                                | market depth (cumulative bid/ask stepped areas)                        |
| `HeatmapChart`                              | value by two dimensions, e.g. price level x time                       |
| `TreemapChart`, `SunburstChart`, `PieChart` | breakdowns grouped hierarchically by columns                           |
| `Chart`                                     | the original line/scatter chart (unchanged API)                        |

Showcase examples for every chart type are in `showcase/src/examples/Chart`.

## Common props

All of the new chart components accept these props (`VuuChartBaseProps`),
plus the standard `className`, `style`, `id` etc.

| Prop                | Type                                                    | Notes                                                                                                   |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `echartsOptions`    | `EChartsCoreOption \| (generated) => EChartsCoreOption` | Escape hatch: raw ECharts options, deep merged over the generated options (see below)                   |
| `maxRows`           | `number`                                                | Maximum rows read from each DataSource. Default `1000`                                                  |
| `renderer`          | `"canvas" \| "svg"`                                     | Default `"canvas"`, which is best for streaming data                                                    |
| `showTooltip`       | `boolean`                                               | Default `true`                                                                                          |
| `theme`             | `Partial<ChartTheme>`                                   | Override colours resolved from css tokens                                                               |
| `onChartReady`      | `(chart: ECharts) => void`                              | Access to the ECharts instance                                                                          |
| `onItemClick`       | `(evt: ChartItemEvent) => void`                         | `evt.row` is the `DataSourceRow` behind the item. For aggregated items, `evt.rows` and `evt.groupPath` are also set |
| `onItemContextMenu` | `(evt: ChartItemEvent) => void`                         | As above                                                                                                |

Cartesian, candlestick and heatmap charts also accept
`dataZoom?: boolean | "inside" | "slider" | "both"`. `true` is the same as
`"inside"`. Most charts accept `legend?: "top" | "bottom" | "none"`.

Mark lines (`markLines?: MarkLineDef[]`) can be added to series and to the
candlestick price axis:

```ts
interface MarkLineDef {
  value: number | "last" | "min" | "max" | "average" | { weightedAverage: string };
  label?: string;
  color?: string; // css colour, or "up" | "down" | "palette-1".."palette-8"
  lineType?: "solid" | "dashed" | "dotted";
  labelPosition?: MarkLineLabelPosition; // default "insideEndTop"
}
```

Rows used by a series can be restricted with `where`, either as
`{ side: "BUY" }` (all entries must match) or as a predicate
`(row, columnMap) => boolean`. Points can be coloured by the value in a column
with `colorBy: { columnName: "side", colors: { BUY: "up", SELL: "down" } }`.

## CartesianChart

```tsx
<CartesianChart
  dataSource={tradesDataSource}
  xAxis={{ columnName: "time", type: "time" }}
  yAxes={[{ scale: true }, { position: "right", name: "Qty" }]}
  series={[
    { type: "line", columnName: "price", markLines: [{ value: "last" }] },
    { type: "bar", columnName: "quantity", yAxisIndex: 1 },
    {
      type: "scatter",
      columnName: "price",
      id: "fills",
      dataSource: fillsDataSource, // overlay from a second DataSource
      colorBy: { columnName: "side", colors: { BUY: "up", SELL: "down" } },
    },
  ]}
  dataZoom="both"
/>
```

- `xAxis: { columnName, type?: "time" | "category" | "value", name? }`.
  `"time"` expects epoch millisecond timestamps. The default, `"category"`,
  uses distinct values in DataSource order.
- `series: CartesianSeriesDef[]`. Each has a `type` of
  `"line" | "area" | "bar" | "scatter"`, a `columnName`, and optionally:
  - `dataSource` and `xColumnName`, to read from a different DataSource
  - `where`, `yAxisIndex`, `stack`
  - `step: "start" | "middle" | "end"` and `smooth`
  - `color`, `colorBy` and `areaOpacity`
  - `showSymbol`, `symbolSize` and `markLines`
- `yAxes: CartesianYAxisDef[]`. Each takes `name`, `position`, `scale`,
  `type: "value" | "log"`, `min` and `max`.
- `orientation: "horizontal"` gives horizontal bars.
- `aggregation: "sum" | "avg" | "min" | "max" | "count" | "last"` combines
  rows that share the same category, e.g. notional summed by sector.

## CandlestickChart

```tsx
<CandlestickChart
  dataSource={barsDataSource} // bars for one ric and interval
  volumeColumnName="volume"
  markLines={[{ value: "last", label: "Last" }]}
  overlays={[
    { type: "line", columnName: "vwap", name: "VWAP" },
    {
      type: "scatter",
      columnName: "price",
      dataSource: fillsDataSource,
      timeColumnName: "time",
      colorBy: { columnName: "side", colors: { BUY: "up", SELL: "down" } },
      markLines: [{ value: { weightedAverage: "quantity" }, label: "Avg fill" }],
    },
  ]}
/>
```

- `timeColumnName` defaults to `"start"`.
- `ohlcColumnNames` defaults to `open`, `high`, `low` and `close`.
- `volumeColumnName` adds a volume pane, sized by `volumePaneHeight` (% of the
  chart, default 20). The volume bars are coloured up/down.
- `xAxisType`: the default, `"category"`, spaces bars evenly with no gaps.
  `"time"` uses a continuous time axis.
- `overlays` take `type: "line" | "scatter"`, `columnName`, and optionally
  `dataSource`, `timeColumnName`, `where`, `color`, `colorBy`, `symbol`,
  `symbolSize` and `markLines`. On a category axis, overlay points from
  another DataSource are placed on the bar whose interval contains their
  timestamp. Points earlier than the first bar are dropped.
- `dataZoom` defaults to `"both"`, and the zoom is shared by the price and
  volume panes.
- `formatTime` formats axis labels.

## DepthChart

```tsx
<DepthChart dataSource={depthDataSource} cumulativeSizeColumnName="cumSize" />
```

Renders cumulative bids (stepped area, `step: "start"`) and asks
(`step: "end"`) over a value price axis, with a mid price mark line.

Columns default to `priceColumnName="price"`, `sideColumnName="side"` and
`sizeColumnName="size"`. The side values default to `bidValue="BUY"` and
`askValue="SELL"`. If `cumulativeSizeColumnName` is not given, cumulative size
is computed from `sizeColumnName`. Set `showMidPrice={false}` to hide the mid
price line.

## HeatmapChart

```tsx
<HeatmapChart
  dataSource={tradesDataSource}
  xAxis={{ columnName: "time", type: "time", bucketSize: 60_000 }}
  yAxis={{ columnName: "price", type: "value", bucketSize: 0.05 }}
  valueColumnName="quantity"
  aggregation="sum"
/>
```

- Both axes are category axes built from the distinct (bucketed) values.
  `bucketSize` rounds numeric values down to a multiple of the bucket size.
- `aggregation` defaults to `"sum"`.
- `colorScale`: `"sequential"` (the default) uses the theme heatmap colours.
  `"diverging"` maps negative values to down and positive values to up,
  symmetric around zero, e.g. for pnl.
- `min` and `max` fix the colour range. By default the range is recomputed
  from the data on each update.
- `showVisualMap` controls the colour scale legend (default `true`).
- Also accepts `where` and `formatTime`.

## TreemapChart, SunburstChart, PieChart

```tsx
<TreemapChart
  dataSource={positionsDataSource}
  groupByColumnNames={["sector", "ric"]}
  valueColumnName="pnl"
  colorMode="sign"
  onItemClick={({ groupPath, rows }) => console.log(groupPath, rows?.length)}
/>

<PieChart
  dataSource={positionsDataSource}
  groupByColumnNames={["currency"]}
  valueColumnName="notional"
  donut
  legend="bottom"
/>
```

- `groupByColumnNames` lists the grouping columns, outermost first. Pie charts
  use only the first column.
- `aggregation` defaults to `"sum"`.
- `colorMode`:
  - `"palette"` (the default) gives each top level group its own colour.
  - `"sign"` sizes nodes by absolute value and colours them up or down by
    sign. A parent is sized as the sum of its children, while labels and
    tooltips show the net value.
- Also accepts `formatValue`, `where` and `donut` (pie only).
- `HierarchyChart` with a `type` prop is the underlying component.

## Streaming model

Each chart separates **structure** from **data**:

- The **base option** holds axes, grids, series definitions, theme, legends,
  dataZoom and `echartsOptions`. It is rebuilt with
  `setOption(..., { notMerge: true })` only when props (compared
  structurally), theme mode or the set of DataSources change.
- **Data** is held per DataSource in a `ChartDataStore`. The store subscribes
  to a viewport of `maxRows` rows and applies snapshots, inserts, updates and
  deletes by row key. Updates set a dirty flag. At most once per animation
  frame, the chart builds a data-only partial option (series `data`, category
  axis `data`, visualMap range, mark line values). That option is merged by
  component id, so axes, zoom state and legend selection are preserved.

A bar that ticks in place, or a depth level that updates, therefore costs one
partial `setOption` per frame, however many updates arrive. `appendData` is not
used because Vuu rows also update and delete in place, which `appendData`
cannot express.

The original `Chart` component is also throttled to animation frames.

## DataSource ownership and teardown

The new charts own the DataSource subscriptions they create:

- On unmount, and when a `dataSource` prop is replaced, the chart unsubscribes
  from the DataSource.
- On unmount, the ECharts instance is disposed and any pending animation frame
  is cancelled.

So give each chart its own DataSource instance rather than sharing one with
another component, such as a table. Filters, sorts and link groups apply as
normal.

## Theming

Colours are read from css custom properties on the chart element. Defaults
map to Salt tokens, so light and dark modes work automatically. The theme is
re-read when the Vuu `ThemeContext` mode changes.

```css
.my-charts {
  --vuuChart-upColor: #26a69a;
  --vuuChart-downColor: #ef5350;
}
```

The tokens are:

- `--vuuChart-foreground` and `--vuuChart-secondaryForeground`
- `--vuuChart-background`
- `--vuuChart-axisLineColor` and `--vuuChart-splitLineColor`
- `--vuuChart-crosshairColor`
- `--vuuChart-fontFamily`
- `--vuuChart-tooltip-background` and `--vuuChart-tooltip-borderColor`
- `--vuuChart-upColor` and `--vuuChart-downColor`
- `--vuuChart-heatmap-lowColor` and `--vuuChart-heatmap-highColor`
- `--vuuChart-color-1` … `--vuuChart-color-8`, the series palette

The `theme` prop overrides any resolved value, e.g.
`theme={{ upColor: "#26a69a" }}`.

## Escape hatch: `echartsOptions`

Anything not modelled can be passed as raw ECharts options. They are deep
merged over the generated option:

- Objects merge recursively.
- Arrays of components (series, xAxis, yAxis, grid, dataZoom …) merge item
  by item, matched by `id`, or by index where there is no id.
- An object given for an array component merges into the first item.
- Arrays of primitives are replaced.

A function receives the generated option and returns the option to use.
Overrides are applied when the structure is built, not on each data update.
`mergeEChartsOptions` is exported if you need the same merge elsewhere.

```tsx
<CandlestickChart
  dataSource={barsDataSource}
  echartsOptions={{
    title: { text: "VOD.L 5s" },
    series: [{ id: "candles", itemStyle: { color: "#26a69a", color0: "#ef5350" } }],
  }}
/>
```

Generated component ids:

| Chart       | Ids                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Cartesian   | grid `main`; xAxis `x`; yAxes `y0`, `y1` …; series `id ?? columnName`                                                                     |
| Candlestick | grids `price`, `volume`; xAxes `x`, `x-volume`; yAxes `price`, `volume`; series `candles`, `volume`, `overlay-{index}-{id ?? columnName}` |
| Depth       | grid `main`; xAxis `x`; series `bids`, `asks`                                                                                             |
| Heatmap     | grid `main`; xAxis `x`; series `heatmap`; visualMap `vm`                                                                                  |
| Hierarchy   | series `treemap` / `sunburst` / `pie`                                                                                                     |
| dataZoom    | `zoom-inside`, `zoom-slider`                                                                                                              |

## Bundle size

ECharts is imported via `echarts/core`, registering only the chart types and
components used (see `src/echarts.ts`). Measured with esbuild, minified:

| Import                                          | min      | gzip   |
| ----------------------------------------------- | -------- | ------ |
| `import * as echarts from "echarts"` (previous) | 1,142 KB | 383 KB |
| vuu-chart registered set (all chart types)      | 733 KB   | 248 KB |
| line + scatter + grid/tooltip/legend only       | 548 KB   | 187 KB |

So the package now adds about 135 KB less (gzipped) to an application than
before, even with the new chart types.

## Limitations

- At most `maxRows` (default 1000) rows are read from each DataSource. Use
  DataSource filters, or the bars interval, to keep data within range.
- On a data update, a treemap or sunburst may reset to the root after the
  user has drilled down.
- Heatmap axes are category axes (bucketed values), not continuous axes.
- `echartsOptions` given as a function are applied on structural rebuilds
  only.
