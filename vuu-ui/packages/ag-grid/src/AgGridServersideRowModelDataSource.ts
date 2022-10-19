import { RemoteDataSource, SubscribeCallback } from "@vuu-ui/data-remote";
import {
  ColumnVO,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  LoadSuccessParams,
} from "ag-grid-community";
import { convertToAgGridDataRows } from "./AgGridDataUtils";
import { agGridFilterModelToVuuFilter } from "./AgGridFilterUtils";

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
  private filterQuery: string;

  constructor(
    private dataSource: RemoteDataSource,
    {
      filterQuery = "",
    }: AgGridServersideRowModelDataSourceOptions = DEFAULT_OPTIONS
  ) {
    this.filterQuery = filterQuery;
    this.dataSource.subscribe(
      {
        range: { from: 0, to: 0 },
      },
      this.handleMessageFromDataSource
    );
  }

  setData(params: LoadSuccessParams) {
    console.error(`setData called before initialisation`);
  }

  getRows(params: IServerSideGetRowsParams<any>): void {
    const { fail, parentNode, request, success } = params;
    console.log(
      `%cAgGrid is asking for rows`,
      "color: blue; font-size: bold;",
      {
        request,
      }
    );
    const {
      startRow = 0,
      endRow = 1000,
      filterModel,
      groupKeys,
      rowGroupCols,
    } = request;
    const hasFilter = Object.keys(filterModel).length > 0;

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
    this.setData = success;
  }

  handleMessageFromDataSource: SubscribeCallback = (message) => {
    if (message.type === "subscribed") {
    } else if (message.type === "viewport-update") {
      if (message.size !== undefined) {
        if (message.size !== this.rowCount) {
          this.rowCount = message.size;
          console.log(`rowCount = ${this.rowCount}`);
          //   this.setRowCount(message.size);
        }
      }
      if (message.rows) {
        const rows = convertToAgGridDataRows(message.rows);
        // console.log(`setData with ${rows.length} of ${this.rowCount} rows`);
        this.setData({
          rowData: rows,
          rowCount: this.rowCount,
        });
      } else if (message.size !== undefined) {
        // console.log("got a size message");
      }
    }
  };
}
