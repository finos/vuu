import {
  DataSourceProps,
  RemoteDataSource,
  SubscribeCallback,
} from "@vuu-ui/vuu-data";
import {
  metadataKeys,
  DataRow,
  DataWindow,
  getFullRange,
} from "@vuu-ui/vuu-utils";
import {
  ColumnRowGroupChangedEvent,
  FilterChangedEvent,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
  LoadSuccessParams,
  RowGroupOpenedEvent,
  SortChangedEvent,
} from "ag-grid-community";
import {
  buildVuuTreeNodeKey,
  bySortIndex,
  convertToAgGridDataRows,
  isSortedColumn,
  toSortDef,
  whatHasChangedinAgGridRequest,
} from "./AgGridDataUtils";
import { agGridFilterModelToVuuFilter } from "./AgGridFilterUtils";
import { AgGridRequestQueue } from "./AgGridRequestQueue";

// const log = (message: string, ...rest: any[]) =>
//   console.log(
//     `%c[AGSSRMDataSource] ${message}`,
//     "color: blue;font-weight: bold;",
//     ...rest
//   );

export type AgGridServersideRowModelDataSourceOptions = {
  filterQuery?: string;
};
export interface QueuedRequest {
  from: number;
  to: number;
}

const { COUNT, IDX } = metadataKeys;

export class AgGridServersideRowModelDataSource
  implements IServerSideDatasource
{
  private rowGroupCols: string[] = [];
  private bufferSize = 150;
  private rowCount = -1;
  private dataWindow = new DataWindow(
    getFullRange({ from: 0, to: 0 }, this.bufferSize)
  );
  private dataSource: RemoteDataSource;
  private openNodes: Map<string, DataRow> = new Map();
  private queuedVuuRequests: QueuedRequest[] = [];
  private queuedAgGridRequests = new AgGridRequestQueue();
  private agGridRequest: IServerSideGetRowsRequest | undefined;

  constructor(dataSourceConfig: DataSourceProps) {
    // console.log(
    //   `AgGridServersideRowModelDataSource constructor,
    //     bufferSize = ${this.bufferSize} (150 is default)
    //     dataSourceConfig: ${JSON.stringify(dataSourceConfig, null, 2)}
    //     `
    // );
    this.dataSource = new RemoteDataSource(dataSourceConfig);
    // log(
    //   `subscribe
    //   range subscribed ({0,0} plus own bufferSize ${
    //     this.bufferSize
    //   }) ${JSON.stringify(getFullRange({ from: 0, to: 0 }, this.bufferSize))}
    //   `
    // );
    this.dataSource.subscribe(
      {
        range: getFullRange({ from: 0, to: 0 }, this.bufferSize),
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

  public filterChanged(evt: FilterChangedEvent) {
    const filterModel = evt.api.getFilterModel();
    const [filterQuery, vuuFilter] = agGridFilterModelToVuuFilter(filterModel);
    this.dataSource.filter(vuuFilter, filterQuery);
  }

  public sortChanged(evt: SortChangedEvent) {
    const columnState = evt.columnApi.getColumnState();
    const sortDefs = columnState
      .filter(isSortedColumn)
      .sort(bySortIndex)
      .map(toSortDef);
    this.dataSource.sort(sortDefs);
  }

  public columRowGroupChanged(evt: ColumnRowGroupChangedEvent) {
    const { columns } = evt;
    if (columns) {
      const vuuGroupBy = columns.map((col) => col.getColId());
      this.rowGroupCols = vuuGroupBy;
      this.dataSource.group(vuuGroupBy);
    } else {
      this.dataSource.group(undefined);
    }
  }

  public toggleGroupNode(evt: RowGroupOpenedEvent) {
    const { data, expanded } = evt;
    const key = buildVuuTreeNodeKey(this.rowGroupCols, data);
    if (expanded) {
      // If expanded, the row must be in our cache, as the user just clicked it
      const row = this.dataWindow.getByKey(key);
      if (row) {
        this.dataSource.openTreeNode(key);
        this.openNodes.set(key, row);
      } else {
        throw Error(
          "AgGridServersideRowModelDataSource toggleGroupNode row to expand not in cache"
        );
      }
    } else {
      const row = this.dataWindow.getByKey(key);
      if (this.agGridRequest) {
        // because AgGrid doesn't make any row request when a node is closed. If it immediately
        // reopened - we see the same groupKeys in the request as previous request and can not
        // infer that a node has been opened. So we clear the groupKeys stored from the previous
        // request. Note - need to enhance this once we get to multiple key grouping
        this.agGridRequest.groupKeys.length = 0;
      }
      if (row) {
        this.dataSource.closeTreeNode(key);
        this.openNodes.delete(key);
      } else {
        throw Error(
          "AgGridServersideRowModelDataSource toggleGroupNode row to collapse not in cache"
        );
      }
    }
  }

  private getParentRow = (groupKeys: string[]): DataRow | undefined => {
    const parentKey = `$root|${groupKeys.join("|")}`;
    return this.openNodes.get(parentKey);
  };

  private getIndexOfParentRow = (groupKeys: string[]): number => {
    const parentRow = this.getParentRow(groupKeys);
    return parentRow?.[IDX] ?? -1;
  };

  // API callback invoked by Ag Grid when it wants data
  getRows(params: IServerSideGetRowsParams<any>): void {
    const { request, success } = params;
    const {
      startRow = 0,
      endRow = 100,
      filterModel,
      groupKeys: expandedTreeNodeKeys,
      rowGroupCols,
      sortModel,
    } = request;

    const changed = whatHasChangedinAgGridRequest(request, this.agGridRequest);
    this.agGridRequest = request;

    // console.log(
    //   `%cAgGrid is asking for rows ${startRow} - ${endRow} ${
    //     rowGroupCols?.length > 0
    //       ? `\nGroupBy [${rowGroupCols.map((c) => c.id).join(",")}]`
    //       : ""
    //   }${
    //     expandedTreeNodeKeys?.length > 0
    //       ? `\ngroupKeys [${expandedTreeNodeKeys.join(",")}]`
    //       : ""
    //   }
    //   %crange changed ${changed.range}
    //   %cfilter changed ${changed.filterModel}
    //   %cgroup changed ${changed.groupKeys}
    //   %ccolumn groups changed ${changed.rowGroupCols}
    //   %csort changed ${changed.sortModel}
    //   `,
    //   "color: red; font-weight: bold;",
    //   changed.range ? "color: green; font-weight: bold;" : "",
    //   changed.filterModel ? "color: green; font-weight: bold;" : "",
    //   changed.groupKeys ? "color: green; font-weight: bold;" : "",
    //   changed.rowGroupCols ? "color: green; font-weight: bold;" : "",
    //   changed.sortModel ? "color: green; font-weight: bold;" : ""
    // );

    if (expandedTreeNodeKeys?.length) {
      const parentIndex = this.getIndexOfParentRow(expandedTreeNodeKeys);
      if (parentIndex !== -1) {
        const from = startRow + parentIndex;
        const to = endRow + parentIndex;

        if (changed.groupKeys) {
          this.queuedAgGridRequests.push({
            from: startRow,
            to: endRow,
            success,
            groupKeys: expandedTreeNodeKeys,
            parentIndex,
            rowGroupCols,
          });
        } else if (this.dataWindow.hasData(from, to)) {
          const data = this.dataWindow.getData(from, to);
          success({
            rowData: convertToAgGridDataRows(data),
            rowCount: this.dataWindow.rowCount,
          });
        } else {
          // Scrolling through expanded child nodes, need more data
          this.queuedAgGridRequests.push({
            from: startRow,
            to: endRow,
            success,
            groupKeys: expandedTreeNodeKeys,
            parentIndex,
            rowGroupCols,
          });

          const fullRange = getFullRange(
            { from: startRow + parentIndex, to: endRow + parentIndex },
            this.bufferSize
          );

          this.dataWindow.setRange(fullRange.from, fullRange.to);
          this.dataSource.setRange(fullRange.from, fullRange.to);
        }
      } else {
        throw Error(
          `AgGridServersideRowModelDataSource unable to identify parent row, keys [${expandedTreeNodeKeys.join(
            ","
          )}]`
        );
      }
    } else if (
      changed.sortModel ||
      changed.filterModel ||
      changed.rowGroupCols
      // changed.groupKeys
    ) {
      this.queuedAgGridRequests.push({
        from: startRow,
        to: endRow,
        success,
        filterModel,
        groupKeys: expandedTreeNodeKeys,
        rowGroupCols,
        sortModel,
      });
    } else if (this.dataRequested(startRow, endRow)) {
      if (this.queuedAgGridRequests.length === 0) {
        this.queuedAgGridRequests.push({
          from: startRow,
          to: endRow,
          success,
        });
      }
    } else if (this.dataWindow.hasData(startRow, endRow)) {
      console.log(`the dataWindow already has this data`);
    } else {
      const lastRow = Math.min(this.dataWindow.rowCount - 1, endRow);
      this.queuedAgGridRequests.push({
        filterModel,
        from: startRow,
        to: lastRow + 1,
        success,
      });
      this.dataWindow.setRange(startRow, lastRow + 1);
      this.dataSource.setRange(startRow, lastRow + 1);
    }
  }

  handleMessageFromDataSource: SubscribeCallback = (message) => {
    if (message.type === "viewport-update") {
      if (message.size !== undefined) {
        if (message.size !== this.dataWindow.rowCount) {
          this.rowCount = message.size;
          this.dataWindow.setRowCount(message.size);
        }
      }
      // TODO is it only for initial subscribe request that we need this ?
      if (this.queuedVuuRequests.length > 0) {
        this.queuedVuuRequests.length = 0;
      }
      if (message.rows) {
        // log(
        //   `>>> viewport-update
        //   ${message.rows.length} data rows from server [${
        //     message.rows[0][0]
        //   }] - [${message.rows[message.rows.length - 1][0]}]
        //   (${this.queuedAgGridRequests.length} queued requests from AG Grid)
        //     ${this.queuedAgGridRequests.toString()}`
        // );

        for (const row of message.rows) {
          this.dataWindow.add(row);
        }

        const queue = this.queuedAgGridRequests;
        while (queue.length > 0) {
          const {
            success,
            from: agRequestFrom,
            to: agRequestTo,
            groupKeys,
          } = queue.get(0);
          if (groupKeys && groupKeys.length > 0) {
            const parentRow = this.getParentRow(groupKeys);
            if (!parentRow) {
              throw Error(
                `AgGridServersideRowModelDataSource asked to provide data for child rows, when parent Node has not been opened`
              );
            }
            const { [IDX]: parentIndex, [COUNT]: count } = parentRow;
            const from = agRequestFrom + parentIndex + 1;
            const to = agRequestTo + parentIndex + 1;

            if (this.pushDataToAgGrid(from, to, success, count)) {
              queue.shift();
            } else {
              console.log(`but we don't have all the children`);
              break;
            }
          } else if (
            this.pushDataToAgGrid(agRequestFrom, agRequestTo, success)
          ) {
            queue.shift();
          } else {
            break;
          }
        }
      }
    }
  };

  pushDataToAgGrid = (
    from: number,
    to: number,
    success: (params: LoadSuccessParams) => void,
    rowCount = this.dataWindow.rowCount
  ): boolean => {
    if (this.dataWindow.hasData(from, to)) {
      const data = this.dataWindow.getData(from, to);
      success({
        rowData: convertToAgGridDataRows(data),
        rowCount,
      });
      return true;
    } else {
      return false;
    }
  };
}
