import {
  DataSource,
  DataSourceRow,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import {
  buildColumnMap,
  ColumnMap,
  EventEmitter,
  metadataKeys,
  Range,
} from "@vuu-ui/vuu-utils";
import { MovingDataRowWindow } from "./DataRowMovingWindow";
import {
  defaultItemColorFunction,
  LineSeries,
  ScatterSeries,
  Series,
} from "./chart-types";
import { ChartConfig, DataExclusionOptions } from "./useChartOptions";

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
  #dataWindow = new MovingDataRowWindow(Range(0, 1000));

  #dates: string[] = [];
  #palette: string[];
  #series: Series[] = [];
  #seriesColumns: string[] = [];

  handleData: DataSourceSubscribeCallback = (message) => {
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
    dataSource.subscribe({ range: Range(0, 1000) }, this.handleData);
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
    if (this.#categoryColumn) {
      this.buildCategoriesAndSeries();
    }
  }

  get categories() {
    return this.#dates;
  }

  get series() {
    return this.#series;
  }

  private getCategoriesAndSeries(): [string[], Series[]] {
    const colorMap = this.#colorMap;
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
          if (!colorMap.has(seriesColumn)) {
            // Record palette color used for each series so we can preserve the color
            // associations even if some series are hidden by user.
            colorMap.set(seriesColumn, this.#palette[this.#colorMap.size]);
          }

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
