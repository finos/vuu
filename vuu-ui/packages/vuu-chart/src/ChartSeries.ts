import type {
  DataSource,
  DataSourceRow,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import {
  buildColumnMap,
  type ColumnMap,
  EventEmitter,
  metadataKeys,
  Range,
} from "@vuu-ui/vuu-utils";
import { MovingDataRowWindow } from "./DataRowMovingWindow";
import {
  defaultItemColorFunction,
  type LineSeries,
  type ScatterSeries,
  type Series,
} from "./chart-types";
import type { ChartConfig, DataExclusionOptions } from "./useChartOptions";

const { KEY } = metadataKeys;

export type DataSourceValue = {
  key: string;
  readonly row: DataSourceRow;
  value: number | null;
};

function DataSourceValue(
  key: string,
  row: DataSourceRow,
  value: number | null,
): DataSourceValue {
  return { key, row, value };
}

export type ChartEvents = {
  update: () => void;
};
export interface ChartSeriesConstructorProps {
  dataExclusions?: DataExclusionOptions;
  dataSource: DataSource;
  config: ChartConfig;
  palette: string[];
}

export class ChartSeries extends EventEmitter<ChartEvents> {
  #categoryColumn = "";
  #colorMap = new Map<string, string>();
  #columnMap: ColumnMap = {};
  #config: ChartConfig;
  #dataExclusions: DataExclusionOptions | undefined;
  #dataSource: DataSource;
  #subscribed = false;
  #dataWindow = new MovingDataRowWindow(Range(0, 1000));

  #dates: string[] = [];
  #palette: string[];
  #series: Series[] = [];
  #seriesColumns: string[] = [];

  handleData: DataSourceSubscribeCallback = (message) => {
    if (!this.#subscribed) {
      return;
    }
    if (message.type === "subscribed") {
      this.#columnMap = buildColumnMap(message.tableSchema.columns);
    } else if (message.type === "viewport-update") {
      if (message.mode === "size-only") {
        // ???
      } else if (message.rows) {
        for (const row of message.rows) {
          this.#dataWindow.add(row);
        }
        this.buildCategoriesAndSeries();
      }
    } else {
      console.warn(JSON.stringify(message));
    }
  };

  buildCategoriesAndSeries() {
    if (this.#categoryColumn && this.#seriesColumns.length > 0) {
      const [dates, series] = this.getCategoriesAndSeries();
      this.#dates = dates;
      this.#series = series;

      this.emit("update");
    }
  }

  constructor({
    config,
    dataExclusions,
    dataSource,
    palette,
  }: ChartSeriesConstructorProps) {
    super();
    this.#config = config;
    this.#dataExclusions = dataExclusions;
    this.#palette = palette;
    this.#dataSource = dataSource;
    this.subscribe();
  }

  /**
   * Subscribes to the DataSource. Invoked by the constructor, only needs to
   * be invoked again after dispose.
   */
  subscribe() {
    if (!this.#subscribed) {
      this.#subscribed = true;
      this.#dataSource.subscribe({ range: Range(0, 1000) }, this.handleData);
    }
  }

  /**
   * Stops processing data from the DataSource, without unsubscribing it.
   * Used when the DataSource is replaced, the caller may still be using
   * the previous DataSource (e.g. as the source of an edit session).
   */
  detach() {
    this.#subscribed = false;
  }

  /**
   * Stops processing data and unsubscribes from the DataSource.
   */
  dispose() {
    this.#subscribed = false;
    this.#dataSource.unsubscribe();
  }

  get palette() {
    return this.#seriesColumns.map((col) => this.#colorMap.get(col));
  }

  get categoryColumn() {
    return this.#categoryColumn;
  }

  set categoryColumn(categoryColumn: string) {
    this.#categoryColumn = categoryColumn;
    if (this.#seriesColumns.length > 0) {
      this.buildCategoriesAndSeries();
    }
  }

  get seriesColumnNames() {
    return this.#seriesColumns;
  }

  set seriesColumnNames(seriesColumnNames: string[]) {
    this.#seriesColumns = seriesColumnNames;
    this.assignColors();
    if (this.#categoryColumn) {
      this.buildCategoriesAndSeries();
    }
  }

  /**
   * Assigns a colour to each series column that does not yet have one.
   * Colours are taken from a runtime palette with one slot per charted
   * column, filled from the palette (repeating if there are more columns
   * than palette colours). A new column takes the slot matching its
   * position in the charted columns. When the user switches between sets
   * of columns, e.g. alpha_set_a, beta_set_a and alpha_set_b, beta_set_b,
   * the nth column of each set gets the same colour, whatever the number
   * of columns. Colour assignments are retained, so a column keeps its
   * colour when it is charted again. If that colour is already used by
   * another charted series, the next unused slot is taken.
   */
  private assignColors() {
    const colorMap = this.#colorMap;
    const seriesColumns = this.#seriesColumns;
    const count = seriesColumns.length;
    if (count === 0 || this.#palette.length === 0) {
      return;
    }
    const runtimePalette = Array.from(
      { length: count },
      (_, i) => this.#palette[i % this.#palette.length],
    );
    const usedColors = new Set<string>();
    for (const column of seriesColumns) {
      const color = colorMap.get(column);
      if (color !== undefined) {
        usedColors.add(color);
      }
    }
    seriesColumns.forEach((column, preferredSlot) => {
      if (!colorMap.has(column)) {
        let slot = preferredSlot;
        for (let i = 0; i < count; i++) {
          const candidate = (preferredSlot + i) % count;
          if (!usedColors.has(runtimePalette[candidate])) {
            slot = candidate;
            break;
          }
        }
        const color = runtimePalette[slot];
        usedColors.add(color);
        colorMap.set(column, color);
      }
    });
  }

  get categories() {
    return this.#dates;
  }

  get series() {
    return this.#series;
  }

  private getCategoriesAndSeries(): [string[], Series[]] {
    const columnMap = this.#columnMap;
    const data = this.#dataWindow.data;
    const categoryColumn = this.#categoryColumn;
    const seriesColumns = this.#seriesColumns;
    const config = this.#config;

    const categoryValues: string[] = [];
    const seriesMap = new Map<
      string,
      [LineSeries, ScatterSeries] | [LineSeries]
    >();
    const { itemColorFunction = defaultItemColorFunction, symbolSize = 6 } =
      config;

    data.forEach((row) => {
      const categoryValue = row[columnMap[categoryColumn]] as string;
      categoryValues.push(categoryValue);

      for (const seriesColumn of seriesColumns) {
        let lineSeries: LineSeries;
        let scatterSeries: ScatterSeries | undefined = undefined;

        const seriesTuple = seriesMap.get(seriesColumn);
        if (seriesTuple) {
          [lineSeries, scatterSeries] = seriesTuple;
        } else {
          lineSeries = {
            //any reason we can't simply use col name here ?
            id: seriesColumn,
            name: seriesColumn,
            label: seriesColumn,
            connectNulls: true,
            data: [],
            type: "line",
            itemStyle: {
              color: itemColorFunction,
            },
            lineStyle: {
              width: 1.5,
            },
            symbol: "circle",
            symbolSize,
          };

          if (this.#dataExclusions) {
            const { symbol } = this.#dataExclusions;
            scatterSeries = {
              id: `${seriesColumn}-excluded`,
              data: [],
              itemStyle: {
                borderColor: "#FDC82F",
                color: "#101820",
                borderWidth: 2,
              },
              label: "",
              name: seriesColumn,
              symbol,
              symbolSize: 20,
              type: "scatter",
              // render excluded data items above the line, which still passes
              // through them, so they can be clicked (e.g. to include them again)
              z: 3,
            };
          }

          if (scatterSeries) {
            seriesMap.set(seriesColumn, [lineSeries, scatterSeries]);
          } else {
            seriesMap.set(seriesColumn, [lineSeries]);
          }
        }

        const key = row[KEY] as string;
        const value = row[columnMap[seriesColumn]] as number;

        if (
          this.#dataExclusions?.isExcludedData(row, columnMap, seriesColumn)
        ) {
          lineSeries.data.push(DataSourceValue(key, row, null));
          scatterSeries?.data.push(DataSourceValue(key, row, value));
        } else {
          lineSeries.data.push(DataSourceValue(key, row, value));
          scatterSeries?.data.push(DataSourceValue(key, row, null));
        }
      }
    });

    return [categoryValues, Array.from(seriesMap.values()).flat()];
  }
}
