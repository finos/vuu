import {
  DataSourceProps,
  RemoteDataSource,
  SubscribeCallback,
} from "@finos/vuu-data";
import {
  IViewportDatasource,
  IViewportDatasourceParams,
} from "ag-grid-community";
import { buildColumnMap, ColumnMap } from "@finos/vuu-utils";
import { convertToAgViewportRows } from "./AgGridDataUtils";
import { VuuGroupBy, VuuSortCol } from "@finos/vuu-protocol-types";
import { Filter } from "@finos/vuu-filters";
import { AgDataWindow } from "./AgDataWindow";

const reverseColumnMap = (columnMap: ColumnMap): Map<number, string> =>
  new Map<number, string>(
    Object.entries(columnMap).map(
      (entry) => entry.reverse() as [number, string]
    )
  );

// const log = (message: string, ...rest: unknown[]) =>
//   console.log(
//     `%c[ViewportDataSource] ${message}`,
//     "color: blue;font-weight: bold;",
//     ...rest
//   );

export class ViewportRowModelDataSource implements IViewportDatasource {
  private columnMap: ColumnMap;
  private reverseColumnMap: Map<number, string>;

  private dataSource: RemoteDataSource;
  private dataWindow: AgDataWindow = new AgDataWindow({ from: 0, to: 0 });

  constructor(dataSourceConfig: DataSourceProps) {
    console.log(
      `ViewportRowModelDataSource create RemoteDataSource with bufferSize ${dataSourceConfig.bufferSize}`
    );
    this.dataSource = new RemoteDataSource(dataSourceConfig);

    this.dataSource.subscribe({}, this.handleMessageFromDataSource);
    this.columnMap = buildColumnMap(dataSourceConfig.columns);
    this.reverseColumnMap = reverseColumnMap(this.columnMap);
  }

  setAgRowCount: IViewportDatasourceParams["setRowCount"] = () => {
    throw Error("setRowCount called before init");
  };

  getAgRow: IViewportDatasourceParams["getRow"] = (rowIndex: number) => {
    throw Error(`getRow [${rowIndex}] called before init`);
  };
  setAgRowData: IViewportDatasourceParams["setRowData"] = () => {
    throw Error("setRowData called before init");
  };

  init({ setRowData, setRowCount, getRow }: IViewportDatasourceParams): void {
    this.setAgRowCount = setRowCount;
    this.getAgRow = getRow;
    this.setAgRowData = setRowData;
  }

  setViewportRange(firstRow: number, lastRow: number): void {
    // console.log(`setViewport Range called by Ag Grid ${firstRow} - ${lastRow}`);
    this.dataWindow.setRange(firstRow, lastRow + 1);
    this.dataSource.setRange(firstRow, lastRow + 1);
  }

  setRowGroups(groupBy: VuuGroupBy) {
    // console.log(`roupBy ${groupBy.join(",")}`);
    this.dataSource.group(groupBy);
  }

  setExpanded(key: string, expanded: boolean) {
    if (expanded) {
      this.dataSource.closeTreeNode(key);
    } else {
      this.dataSource.openTreeNode(key);
    }
  }

  filter(filter: Filter, filterQuery: string) {
    this.dataSource.filter(filter, filterQuery);
  }

  sort(sortDefs: VuuSortCol[]) {
    this.dataSource.sort({
      sortDefs,
    });
  }

  handleMessageFromDataSource: SubscribeCallback = (message) => {
    if (message.type === "viewport-update") {
      if (message.size !== undefined) {
        if (message.size !== this.dataWindow.rowCount) {
          this.dataWindow.setRowCount(message.size);
          this.setAgRowCount(message.size);
        }
      }
      if (message.rows) {
        const { columnMap, reverseColumnMap } = this;

        if (message.rows.some(this.dataWindow.hasRow, this.dataWindow)) {
          for (const dataRow of message.rows) {
            const [rowIndex] = dataRow;
            const updates = this.dataWindow.update(dataRow, reverseColumnMap);
            if (updates) {
              const agRowNode = this.getAgRow(rowIndex);
              for (let i = 0; i < updates.length; i += 2) {
                agRowNode.setDataValue(updates[i] as string, updates[i + 1]);
              }
            }
          }
        } else {
          const agRowData = convertToAgViewportRows(message.rows, columnMap);
          for (const dataRow of message.rows) {
            this.dataWindow.add(dataRow);
          }
          this.setAgRowData(agRowData);
        }
      }
    }
  };
}
