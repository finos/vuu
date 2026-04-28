import {
  DataSource,
  DataSourceRow,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import {
  buildColumnMap,
  ColumnMap,
  EventEmitter,
  Range,
  metadataKeys,
} from "@vuu-ui/vuu-utils";

type Series = {
  id: string;
  name: string;
  label: string;
  data: DataSourceValue<number>[];
  type: "line";
};

const { KEY } = metadataKeys;

export type DataSourceValue<T extends VuuRowDataItemType = number> = {
  key: string;
  readonly row: DataSourceRow;
  value: T;
};

function DataSourceValue<T extends VuuRowDataItemType = number>(
  key: string,
  row: DataSourceRow,
  value: T,
): DataSourceValue<T> {
  return { key, row, value };
}

function getCategoriesAndSeries(
  columnMap: ColumnMap,
  data: DataSourceRow[],
  categoryColumn: string,
  seriesColumns: string[],
): [string[], Series[]] {
  const categoryValues: string[] = [];
  const seriesMap = new Map<string, Series>();

  data.forEach((row) => {
    const categoryValue = row[columnMap[categoryColumn]] as string;
    categoryValues.push(categoryValue);

    for (const seriesColumn of seriesColumns) {
      let series = seriesMap.get(seriesColumn);
      if (!series) {
        series = {
          //any reason we can't simply use col name here ?
          id: seriesColumn,
          name: seriesColumn,
          label: seriesColumn,
          data: [],
          type: "line",
        };
        seriesMap.set(seriesColumn, series);
      }

      const key = row[KEY] as string;
      const value = row[columnMap[seriesColumn]] as number;
      series.data.push(DataSourceValue(key, row, value));
    }
  });

  return [categoryValues, Array.from(seriesMap.values())];
}

export type ChartEvents = {
  update: () => void;
};
export interface ChartSeriesConstructorProps {
  dataSource: DataSource;
  /**
   * The column name of the column that defines our category axis.
   * By default, these are the x axis values.
   */
  category: string;
  /**
   * The column names of the columns that define our data.
   * By default, these are the y axis values.
   */
  series: string[];
}

export class ChartSeries extends EventEmitter<ChartEvents> {
  #categoryColumn: string;
  #columnMap: ColumnMap = {};
  #dataSource: DataSource;
  #categoryCount = 0;

  #dates: string[] = [];
  #series: Series[] = [];
  #seriesColumns: string[];

  handleData: DataSourceSubscribeCallback = (message) => {
    if (message.type === "subscribed") {
      this.#columnMap = buildColumnMap(message.tableSchema.columns);
    } else if (message.type === "viewport-update") {
      if (message.mode === "size-only") {
        this.#categoryCount = message.size ?? 0;
      } else if (message.rows) {
        const [dates, series] = getCategoriesAndSeries(
          this.#columnMap,
          message.rows,
          this.#categoryColumn,
          this.#seriesColumns,
        );
        this.#dates = dates;
        this.#series = series;
      }
    } else {
      console.warn(JSON.stringify(message));
    }
  };

  constructor({ category, dataSource, series }: ChartSeriesConstructorProps) {
    super();
    this.#categoryColumn = category;
    this.#dataSource = dataSource;
    this.#seriesColumns = series;

    dataSource.subscribe({ range: Range(0, 1000) }, this.handleData);
  }

  get categories() {
    return this.#dates;
  }

  get series() {
    return this.#series;
  }
}
