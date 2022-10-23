import { ThumbsUpSolidIcon } from "@heswell/uitk-icons";
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

interface QueuedRequest {
  from: number;
  to: number;
}

interface QueuedAgGridRequest extends QueuedRequest {
  success: (params: LoadSuccessParams) => void;
}

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
  private queuedVuuRequests: QueuedRequest[] = [];
  private pendingAgGridRequest: QueuedAgGridRequest | null = null;

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
    this.queuedVuuRequests.push({ from: 0, to: 100 });
  }

  dataRequested(startRow: number, endRow: number) {
    // TODO fill this code out
    for (const { from, to } of this.queuedVuuRequests) {
      if (from <= startRow && to >= endRow) {
        return true;
      }
    }

    return false;
  }

  pushDataToAgGrid(params: LoadSuccessParams) {
    console.error(`setData called before initialisation`);
  }

  getRows(params: IServerSideGetRowsParams<any>): void {
    const { fail, parentNode, request, success } = params;
    const {
      startRow = 0,
      endRow = 100,
      filterModel,
      sortModel,
      groupKeys,
      rowGroupCols,
    } = request;

    console.log(
      `%cAgGrid is asking for rows ${startRow} - ${endRow}`,
      "color: brown; font-weight: bold;"
    );

    // const hasFilter = Object.keys(filterModel).length > 0;
    // console.log({ request });

    // if (sortModel.length) {
    //   const vuuSortCols = agSortModelToVuuSort(sortModel);
    //   this.dataSource.sort(vuuSortCols);
    // }

    // if (groupKeys.length) {
    //   const [key] = groupKeys;
    //   this.dataSource.openTreeNode(`$root|${key}`);
    // } else if (rowGroupCols.length > 0) {
    //   const vuuGroupColumns = rowGroupCols.map((col) => col.id);
    //   this.dataSource.group(vuuGroupColumns);
    // }

    // if (hasFilter) {
    //   const [filterQuery, vuuFilter] =
    //     agGridFilterModelToVuuFilter(filterModel);
    //   if (filterQuery !== this.filterQuery) {
    //     this.filterQuery = filterQuery;
    //     this.dataSource.filter(vuuFilter, filterQuery);
    //   }

    //   // console.log(`
    //   // AG Grid filterModel
    //   // ${JSON.stringify(filterModel, null, 2)}
    //   // Vuu Query '${filterQuery}'
    //   // Vuu Filter ${JSON.stringify(vuuFilter)}
    //   // `);
    // } else if (this.filterQuery) {
    //   this.dataSource.filter(undefined, "");
    //   this.filterQuery = "";
    // }

    if (this.dataWindow.hasData(startRow, endRow)) {
      console.log(`the dataWindow already has this data`);
    } else {
      if (this.dataRequested(startRow, endRow)) {
        console.log("data already requested, we wait ...");
        if (this.pendingAgGridRequest === null) {
          this.pendingAgGridRequest = { from: startRow, to: endRow, success };
        }
      } else {
        this.pendingAgGridRequest = { from: startRow, to: endRow, success };
        this.dataWindow.setRange(startRow, endRow);
        this.dataSource.setRange(startRow, endRow);
      }
    }
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
        // console.log(`setData with ${rows.length} of ${this.rowCount} rows`);
        for (const row of message.rows) {
          this.dataWindow.add(row);
        }

        if (this.pendingAgGridRequest) {
          const { success, from, to } = this.pendingAgGridRequest;
          if (this.dataWindow.hasData(from, to)) {
            const data = this.dataWindow.getData(from, to);
            success({
              rowData: convertToAgGridDataRows(data),
              rowCount: this.dataWindow.rowCount,
            });
            this.pendingAgGridRequest = null;
          }
        }
      } else if (message.size !== undefined) {
        // console.log("got a size message");
      }
    }
  };
}
