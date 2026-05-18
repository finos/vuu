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
import { MovingDataRowWindow } from "./DataRowMovingWindow";

type Series = {
  id: string;
  name: string;
  label: string;
  data: DataSourceValue<number>[];
  lineStyle: {
    width: number;
  };
  itemStyle: {
    color: string | ItemColorFunction;
  };
  symbol: "emptyCircle" | "circle";
  type: "line";
};

export type ItemColorFunction = (params: {
  color: string;
  data: DataSourceValue;
  dataIndex: number;
  name: string;
  seriesName: string;
}) => string;

const defaultItemColorFunction: ItemColorFunction = ({ color }) => color;

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
  itemColorFunction = defaultItemColorFunction,
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
          itemStyle: {
            color: itemColorFunction,
          },
          lineStyle: {
            width: 1.5,
          },
          symbol: "circle",
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
  itemColorFunction?: ItemColorFunction;
}

export class ChartSeries extends EventEmitter<ChartEvents> {
  #categoryColumn = "";
  #columnMap: ColumnMap = {};
  #itemColorFunction: ItemColorFunction | undefined;
  #dataWindow = new MovingDataRowWindow(Range(0, 1000));

  #dates: string[] = [];
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
      const [dates, series] = getCategoriesAndSeries(
        this.#columnMap,
        this.#dataWindow.data,
        this.#categoryColumn,
        this.#seriesColumns,
        this.#itemColorFunction,
      );
      this.#dates = dates;
      this.#series = series;

      this.emit("update");
    }
  }

  constructor({ dataSource, itemColorFunction }: ChartSeriesConstructorProps) {
    super();
    this.#itemColorFunction = itemColorFunction;
    dataSource.subscribe({ range: Range(0, 1000) }, this.handleData);
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
}
