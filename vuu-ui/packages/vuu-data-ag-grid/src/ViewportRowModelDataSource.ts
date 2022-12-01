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
import { AgGridDataSet, convertToAgViewportRows } from "./AgGridDataUtils";
import { VuuGroupBy, VuuSortCol } from "@finos/vuu-protocol-types";

const log = (message: string, ...rest: any[]) =>
  console.log(
    `%c[ViewportDataSource] ${message}`,
    "color: blue;font-weight: bold;",
    ...rest
  );

export class ViewportRowModelDataSource implements IViewportDatasource {
  private columnMap: ColumnMap;
  private rowCount = 0;

  private dataSource: RemoteDataSource;

  constructor(dataSourceConfig: DataSourceProps) {
    console.log(
      `ViewportRowModelDataSource create RemoteDataSource with bufferSize ${dataSourceConfig.bufferSize}`
    );
    this.dataSource = new RemoteDataSource(dataSourceConfig);

    this.dataSource.subscribe({}, this.handleMessageFromDataSource);
    this.columnMap = buildColumnMap(dataSourceConfig.columns);
  }

  setAgRowCount(count: number) {
    console.error("setRowCount called before init");
  }
  getAgRow(rowIndex: number) {
    console.error(`getRow [${rowIndex}] called before init`);
  }
  setAgRowData(rows: AgGridDataSet) {
    console.error("setRowData called before init");
  }

  init({ setRowData, setRowCount, getRow }: IViewportDatasourceParams): void {
    this.setAgRowCount = setRowCount;
    this.getAgRow = getRow;
    this.setAgRowData = setRowData;
  }

  setViewportRange(firstRow: number, lastRow: number): void {
    // console.log(`setViewport Range called by Ag Grid ${firstRow} - ${lastRow}`);
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
  sort(sortDefs: VuuSortCol[]) {
    this.dataSource.sort({
      sortDefs,
    });
  }

  handleMessageFromDataSource: SubscribeCallback = (message) => {
    if (message.type === "viewport-update") {
      if (message.size !== undefined) {
        if (message.size !== this.rowCount) {
          this.rowCount = message.size;
          this.setAgRowCount(message.size);
        }
      }
      if (message.rows) {
        // log(
        //   `>>> viewport-update
        //   ${message.rows.length} data rows from server [${
        //     message.rows[0][0]
        //   }] - [${message.rows[message.rows.length - 1][0]}]
        // `
        // );

        const agRowData = convertToAgViewportRows(message.rows, this.columnMap);
        this.setAgRowData(agRowData);
      }
    }
  };
}
