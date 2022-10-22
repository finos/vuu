import { RemoteDataSource, SubscribeCallback } from "@vuu-ui/data-remote";
import { DataWindow, getFullRange } from "@vuu-ui/utils";
import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
  LoadSuccessParams,
} from "ag-grid-community";
import { convertToAgGridDataRows } from "./AgGridDataUtils";
import {
  agGridFilterModelToVuuFilter,
  agSortModelToVuuSort,
} from "./AgGridFilterUtils";

export type AgGridServersideRowModelDataSourceOptions = {
  filterQuery?: string;
};

const DEFAULT_OPTIONS: AgGridServersideRowModelDataSourceOptions = {
  filterQuery: "",
};

export class AgGridServersideRowModelDataSource
  implements IServerSideDatasource
{
  private rowCount: number = -1;
  private dataWindow = new DataWindow({ from: 0, to: 100 });
  private filterQuery: string;
  private dataSource: RemoteDataSource;

  constructor(
    dataSourceConfig: any,
    {
      filterQuery = "",
    }: AgGridServersideRowModelDataSourceOptions = DEFAULT_OPTIONS
  ) {
    this.filterQuery = filterQuery;
    this.dataSource = new RemoteDataSource(dataSourceConfig);
    console.log(
      `%c[AgGridServersideRowModelDataSource] subscribe`,
      "color: blue;font-weight: bold;"
    );
    this.dataSource.subscribe(
      {
        range: { from: 0, to: 100 },
      },
      this.handleMessageFromDataSource
    );
  }

  pushDataToAgGrid(params: LoadSuccessParams) {
    console.error(`setData called before initialisation`);
  }

  getRows(params: IServerSideGetRowsParams<any>): void {
    const { fail, parentNode, request, success } = params;
    console.log(
      `%cAgGrid is asking for rows ${request.startRow} - ${request.endRow}`,
      "color: brown; font-weight: bold;"
    );
    const {
      startRow = 0,
      endRow = 1000,
      filterModel,
      sortModel,
      groupKeys,
      rowGroupCols,
    } = request;
    const hasFilter = Object.keys(filterModel).length > 0;

    console.log({ request });

    if (sortModel.length) {
      const vuuSortCols = agSortModelToVuuSort(sortModel);
      this.dataSource.sort(vuuSortCols);
    }

    if (groupKeys.length) {
      const [key] = groupKeys;
      this.dataSource.openTreeNode(`$root|${key}`);
    } else if (rowGroupCols.length > 0) {
      const vuuGroupColumns = rowGroupCols.map((col) => col.id);
      this.dataSource.group(vuuGroupColumns);
    }

    if (hasFilter) {
      const [filterQuery, vuuFilter] =
        agGridFilterModelToVuuFilter(filterModel);
      if (filterQuery !== this.filterQuery) {
        this.filterQuery = filterQuery;
        this.dataSource.filter(vuuFilter, filterQuery);
      }

      // console.log(`
      // AG Grid filterModel
      // ${JSON.stringify(filterModel, null, 2)}
      // Vuu Query '${filterQuery}'
      // Vuu Filter ${JSON.stringify(vuuFilter)}
      // `);
    } else if (this.filterQuery) {
      this.dataSource.filter(undefined, "");
      this.filterQuery = "";
    }

    this.dataSource.setRange(startRow, endRow);

    this.pushDataToAgGrid = success;
  }

  handleMessageFromDataSource: SubscribeCallback = (message) => {
    if (message.type === "subscribed") {
    } else if (message.type === "viewport-update") {
      if (message.size !== undefined) {
        if (message.size !== this.dataWindow.rowCount) {
          this.rowCount = message.size;
          this.dataWindow.setRowCount(message.size);

          console.log(`rowCount = ${this.rowCount}`);
          //   this.setRowCount(message.size);
        }
      }
      if (message.rows) {
        console.log(
          `%c[AgGridServersideRowModelDataSource] ${message.rows.length} rows from server`,
          "color: blue; font-weight: bold"
        );
        // console.log(`setData with ${rows.length} of ${this.rowCount} rows`);
        for (const row of message.rows) {
          this.dataWindow.add(row);
        }
        // console.table(this.dataWindow.data);
        // const rows = convertToAgGridDataRows(message.rows);
        // this.pushDataToAgGrid({
        //   rowData: rows,
        //   rowCount: this.rowCount,
        // });
      } else if (message.size !== undefined) {
        // console.log("got a size message");
      }
    }
  };
}
