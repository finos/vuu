import {
  ClientToServerCreateLink,
  ClientToServerCreateViewPort,
  ClientToServerDisable,
  ClientToServerEnable,
  ClientToServerRemoveLink,
  ClientToServerSelection,
  ClientToServerViewPortRange,
  LinkDescriptorWithLabel,
  ServerToClientCreateViewPortSuccess,
  VuuAggregation,
  VuuColumnDataType,
  VuuGroupBy,
  VuuMenu,
  VuuRange,
  VuuRow,
  VuuSort,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { getFullRange } from "@finos/vuu-utils";
import { ServerProxySubscribeMessage } from "../vuuUIMessageTypes";
import { ArrayBackedMovingWindow } from "./array-backed-moving-window";
import { bufferBreakout } from "./buffer-range";
import { KeySet } from "./keyset";
import * as Message from "./messages";

import {
  DataSourceFilter,
  DataSourceRow,
  DataSourceRowPredicate,
  DataSourceSubscribedMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinkRemovedMessage,
  DataSourceVisualLinksMessage,
} from "../data-source";

const EMPTY_GROUPBY: VuuGroupBy = [];

interface Disable {
  type: "disable";
}
interface Enable {
  type: "enable";
}
interface ChangeViewportRange {
  type: "CHANGE_VP_RANGE";
}
interface ViewportFilter {
  data: DataSourceFilter;
  type: "filter";
}
interface Aggregate {
  data: VuuAggregation[];
  type: "aggregate";
}
interface Columns {
  data: string[];
  type: "columns";
}
interface Selection {
  data: number[];
  type: "selection";
}
interface Sort {
  data: VuuSort;
  type: "sort";
}
interface GroupBy {
  data: VuuGroupBy;
  type: "groupBy";
}
interface GroupByClear {
  data: VuuGroupBy;
  type: "groupByClear";
}

type AsyncOperation =
  | Aggregate
  | ChangeViewportRange
  | Columns
  | ClientToServerCreateLink
  | ClientToServerRemoveLink
  | Disable
  | Enable
  | ViewportFilter
  | GroupBy
  | GroupByClear
  | Selection
  | Sort;
type RangeRequestTuple = [ClientToServerViewPortRange | null, DataSourceRow[]?];
type RowSortPredicate = (row1: DataSourceRow, row2: DataSourceRow) => number;

type LinkedParent = {
  colName: string;
  parentViewportId: string;
  parentColName: string;
};

const byRowIndex: RowSortPredicate = ([index1], [index2]) => index1 - index2;
export class Viewport {
  private aggregations: VuuAggregation[];
  private bufferSize: number;
  /**
   * clientRange is always the range requested by the client. We should assume
   * these are the rows visible to the user
   */
  private clientRange: VuuRange;
  private columns: string[];
  // TODO create this in constructor so we don't have to mark is as optional
  private dataWindow?: ArrayBackedMovingWindow = undefined;
  private filter: DataSourceFilter;
  private groupBy: string[];
  private sort: VuuSort;
  private hasUpdates = false;
  private holdingPen: DataSourceRow[] = [];
  private keys: KeySet;
  private pendingLinkedParent?: DataSourceVisualLinkCreatedMessage;
  private pendingOperations: any = new Map<string, AsyncOperation>();
  private pendingRangeRequest: any = null;
  private rowCountChanged = false;
  private serverTableMeta: {
    columns: string[];
    dataTypes: VuuColumnDataType[];
  } | null = null;

  public clientViewportId: string;
  public disabled = false;
  public isTree = false;
  public linkedParent?: LinkedParent;
  public serverViewportId?: string;
  public status: "" | "subscribed" = "";
  public suspended = false;
  public table: VuuTable;
  public title: string | undefined;

  constructor({
    aggregations,
    bufferSize = 50,
    columns,
    filter,
    groupBy = [],
    table,
    range,
    sort,
    title,
    viewport,
    visualLink,
  }: ServerProxySubscribeMessage) {
    this.aggregations = aggregations;
    this.bufferSize = bufferSize;
    this.clientRange = range;
    this.clientViewportId = viewport;
    this.columns = columns;
    this.filter = filter;
    this.groupBy = groupBy;
    this.keys = new KeySet(range);
    this.pendingLinkedParent = visualLink;
    this.table = table;
    this.sort = sort;
    this.title = title;
  }

  get hasUpdatesToProcess() {
    if (this.suspended) {
      return false;
    }
    return this.rowCountChanged || this.hasUpdates;
  }

  subscribe() {
    // console.log(`ViewPort subscribe ${this.table.table}
    // bufferSize ${this.bufferSize}
    // clientRange : ${this.clientRange.from} - ${this.clientRange.to}
    // range subscribed ${JSON.stringify(
    //   getFullRange(this.clientRange, this.bufferSize)
    // )}
    // `);
    const { filter } = this.filter;
    return {
      type: Message.CREATE_VP,
      table: this.table,
      range: getFullRange(this.clientRange, this.bufferSize),
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: { filter },
    } as ClientToServerCreateViewPort;
  }

  handleSubscribed({
    viewPortId,
    aggregations,
    columns,
    filterSpec: filter,
    range,
    sort,
    groupBy,
  }: ServerToClientCreateViewPortSuccess) {
    this.serverViewportId = viewPortId;
    this.status = "subscribed";
    this.aggregations = aggregations;
    this.columns = columns;
    this.groupBy = groupBy;
    this.isTree = groupBy && groupBy.length > 0;
    this.dataWindow = new ArrayBackedMovingWindow(
      this.clientRange,
      range,
      this.bufferSize
    );

    // console.log(
    //   `%cViewport subscribed
    //     clientVpId: ${this.clientViewportId}
    //     serverVpId: ${this.serverViewportId}
    //     table: ${this.table}
    //     aggregations: ${JSON.stringify(aggregations)}
    //     columns: ${columns.join(",")}
    //     range: ${JSON.stringify(range)}
    //     sort: ${JSON.stringify(sort)}
    //     groupBy: ${JSON.stringify(groupBy)}
    //     filterSpec: ${JSON.stringify(filterSpec)}
    //     bufferSize: ${this.bufferSize}
    //   `,
    //   "color: blue"
    // );
    // TODO retrieve the filterStruct
    return {
      aggregations,
      type: "subscribed",
      clientViewportId: this.clientViewportId,
      columns,
      filter,
      groupBy,
      range,
      sort,
      tableMeta: this.serverTableMeta,
    } as DataSourceSubscribedMessage;
  }

  awaitOperation(requestId: string, msg: AsyncOperation) {
    //TODO set uip a timeout mechanism here
    this.pendingOperations.set(requestId, msg);
  }

  // Return a message if we need to communicate this to client UI
  completeOperation(requestId: string, ...params: unknown[]) {
    const { clientViewportId, pendingOperations } = this;
    const { type, data } = pendingOperations.get(requestId);
    pendingOperations.delete(requestId);
    if (type === Message.CHANGE_VP_RANGE) {
      const [from, to] = params as [number, number];
      this.dataWindow?.setRange(from, to);
      //this.hasUpdates = true; // is this right ??????????
      this.pendingRangeRequest = null;
    } else if (type === "groupBy") {
      this.isTree = data.length > 0;
      this.groupBy = data;
      return { clientViewportId, type, groupBy: data };
    } else if (type === "columns") {
      console.log("columns changed");
      this.columns = data;
      return { clientViewportId, type, ...data };
    } else if (type === "filter") {
      this.filter = data as DataSourceFilter;
      return { clientViewportId, type, filter: data };
    } else if (type === "aggregate") {
      this.aggregations = data as VuuAggregation[];
      return {
        clientViewportId,
        type: "aggregate",
        aggregations: this.aggregations,
      };
    } else if (type === "sort") {
      this.sort = data;
      return { clientViewportId, type, sort: this.sort };
    } else if (type === "selection") {
      // should we do this here ?
      // this.selection = data;
    } else if (type === "disable") {
      this.disabled = true; // assuming its _SUCCESS, of course
      return {
        type: "disabled",
        clientViewportId,
      };
    } else if (type === "enable") {
      this.disabled = false;
      return {
        type: "enabled",
        clientViewportId,
      };
    } else if (type === "CREATE_VISUAL_LINK") {
      const [colName, parentViewportId, parentColName] = params;
      this.linkedParent = {
        colName,
        parentViewportId,
        parentColName,
      } as LinkedParent;
      this.pendingLinkedParent = undefined;
      return {
        type: "CREATE_VISUAL_LINK_SUCCESS",
        clientViewportId,
        colName,
        parentViewportId,
        parentColName,
      } as DataSourceVisualLinkCreatedMessage;
    } else if (type === "REMOVE_VISUAL_LINK") {
      this.linkedParent = undefined;
      return {
        type: "REMOVE_VISUAL_LINK_SUCCESS",
        clientViewportId,
      } as DataSourceVisualLinkRemovedMessage;
    }
  }

  rangeRequest(requestId: string, range: VuuRange): RangeRequestTuple {
    // If we can satisfy the range request from the buffer, we will.
    // May or may not need to make a server request, depending on status of buffer
    const type = Message.CHANGE_VP_RANGE;
    // If dataWindow has all data for the new range, it will return the
    // delta of rows which are in the new range but were not in the
    // previous range.
    // Note: what if it doesn't have the entire range but DOES have all
    // rows that constitute the delta ? Is this even possible ?

    if (this.dataWindow) {
      const [serverDataRequired, clientRows, holdingRows] =
        this.dataWindow.setClientRange(range.from, range.to);
      const serverRequest =
        serverDataRequired &&
        bufferBreakout(
          this.pendingRangeRequest,
          range.from,
          range.to,
          this.bufferSize
        )
          ? ({
              type,
              viewPortId: this.serverViewportId,
              ...getFullRange(range, this.bufferSize, this.dataWindow.rowCount),
              // ...getFullRange(range, this.bufferSize),
            } as ClientToServerViewPortRange)
          : null;
      if (serverRequest) {
        // TODO check that there os not already a pending server request for more data
        this.awaitOperation(requestId, { type });
        this.pendingRangeRequest = serverRequest;
      }

      // always reset the keys here, even if we're not going to return rows immediately.
      this.keys.reset(this.dataWindow.clientRange);

      const rowWithinRange: DataSourceRowPredicate = ([index]) =>
        index < range.from || index >= range.to;
      if (this.holdingPen.some(rowWithinRange)) {
        this.holdingPen = this.holdingPen.filter(
          ([index]) => index >= range.from && index < range.to
        );
      }

      const toClient = this.isTree ? toClientRowTree : toClientRow;

      if (holdingRows.length) {
        holdingRows.forEach((row) => {
          this.holdingPen.push(toClient(row, this.keys));
        });
      }

      if (clientRows.length) {
        return [
          serverRequest,
          clientRows.map((row) => {
            return toClient(row, this.keys);
          }),
        ];
      } else {
        return [serverRequest];
      }
    } else {
      return [null];
    }
  }

  setLinks(links: LinkDescriptorWithLabel[]) {
    return [
      {
        type: "VP_VISUAL_LINKS_RESP",
        links,
        clientViewportId: this.clientViewportId,
      },
      this.pendingLinkedParent,
    ] as [
      DataSourceVisualLinksMessage,
      DataSourceVisualLinkCreatedMessage | undefined
    ];
  }

  setMenu(menu: VuuMenu) {
    return {
      type: "VIEW_PORT_MENUS_RESP" as const,
      menu,
      clientViewportId: this.clientViewportId,
    };
  }

  setTableMeta(columns: string[], dataTypes: VuuColumnDataType[]) {
    this.serverTableMeta = { columns, dataTypes };
  }

  createLink(
    requestId: string,
    colName: string,
    parentVpId: string,
    parentColumnName: string
  ) {
    const message = {
      type: "CREATE_VISUAL_LINK",
      parentVpId,
      childVpId: this.serverViewportId,
      parentColumnName,
      childColumnName: colName,
    } as ClientToServerCreateLink;
    this.awaitOperation(requestId, message);
    return message as ClientToServerCreateLink;
  }

  removeLink(requestId: string) {
    const message = {
      type: "REMOVE_VISUAL_LINK",
      childVpId: this.serverViewportId,
    } as ClientToServerRemoveLink;
    this.awaitOperation(requestId, message);
    return message as ClientToServerRemoveLink;
  }

  suspend() {
    this.suspended = true;
  }

  resume() {
    this.suspended = false;
    return this.currentData();
  }

  currentData() {
    const out = [];
    if (this.dataWindow) {
      const records = this.dataWindow.getData();
      const { keys } = this;
      const toClient = this.isTree ? toClientRowTree : toClientRow;
      for (const row of records) {
        if (row) {
          out.push(toClient(row, keys));
        }
      }
    }
    return out;
  }

  enable(requestId: string) {
    this.awaitOperation(requestId, { type: "enable" });
    return {
      type: Message.ENABLE_VP,
      viewPortId: this.serverViewportId,
    } as ClientToServerEnable;
  }

  disable(requestId: string) {
    this.awaitOperation(requestId, { type: "disable" });
    return {
      type: Message.DISABLE_VP,
      viewPortId: this.serverViewportId,
    } as ClientToServerDisable;
  }

  columnRequest(requestId: string, columns: string[]) {
    this.awaitOperation(requestId, {
      type: "columns",
      data: columns,
    });
    return this.createRequest({ columns });
  }

  filterRequest(requestId: string, dataSourceFilter: DataSourceFilter) {
    this.awaitOperation(requestId, {
      type: "filter",
      data: dataSourceFilter,
    });
    const { filter } = dataSourceFilter;
    return this.createRequest({ filterSpec: { filter } });
  }

  aggregateRequest(requestId: string, aggregations: VuuAggregation[]) {
    this.awaitOperation(requestId, { type: "aggregate", data: aggregations });
    return this.createRequest({ aggregations });
  }

  sortRequest(requestId: string, sort: VuuSort) {
    this.awaitOperation(requestId, { type: "sort", data: sort });
    return this.createRequest({ sort });
  }

  groupByRequest(requestId: string, groupBy: VuuGroupBy = EMPTY_GROUPBY) {
    this.awaitOperation(requestId, { type: "groupBy", data: groupBy });
    return this.createRequest({ groupBy });
  }

  selectRequest(requestId: string, selection: number[]) {
    // TODO we need to do this in the client if we are to raise selection events
    // TODO is it right to set this here or should we wait for ACK from server ?
    this.awaitOperation(requestId, { type: "selection", data: selection });
    return {
      type: Message.SET_SELECTION,
      vpId: this.serverViewportId,
      selection,
    } as ClientToServerSelection;
  }

  handleUpdate(updateType: string, rowIndex: number, row: VuuRow) {
    if (this.dataWindow) {
      if (this.dataWindow.rowCount !== row.vpSize) {
        this.dataWindow.setRowCount(row.vpSize);
        this.rowCountChanged = true;
      }
      if (updateType === "U") {
        // Update will return true if row was within client range
        if (this.dataWindow.setAtIndex(rowIndex, row)) {
          this.hasUpdates = true;
        }
      }
    }
  }

  getNewRowCount = () => {
    if (this.rowCountChanged && this.dataWindow) {
      this.rowCountChanged = false;
      return this.dataWindow.rowCount;
    }
  };

  // This is called only after new data has been received from server - data
  // returned direcly from buffer does not use this.
  // If we have updates, but we don't yet have data for the full client range
  // in our buffer, store them in the holding pen. We know the remaining rows
  // have been requested and will arrive imminently. Soon as we receive data,
  // contents of holding pen plus additional rows received that fill the range
  // will be dispatched to client.
  // If we have any rows in the holding pen, and we now have a full set of
  // client data, make sure we empty the pen and send those rows to client,
  // along qith the new data.
  // TODO what if we're going backwards
  getClientRows(timeStamp: number) {
    if (this.hasUpdates && this.dataWindow) {
      const records = this.dataWindow.getData();
      const { keys } = this;
      const toClient = this.isTree ? toClientRowTree : toClientRow;

      // NOte this should probably just check that we have all client rows within range ?
      const clientRows = this.dataWindow.hasAllRowsWithinRange
        ? this.holdingPen.splice(0)
        : undefined;

      const out = clientRows || this.holdingPen;

      for (let row of records) {
        if (row && row.ts >= timeStamp) {
          out.push(toClient(row, keys));
        }
      }
      this.hasUpdates = false;

      // this only matters where we scroll backwards and have holdingPen data
      // should we test for that explicitly ?
      return clientRows && clientRows.sort(byRowIndex);
    }
  }

  createRequest(params: any) {
    return {
      type: Message.CHANGE_VP,
      viewPortId: this.serverViewportId,
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: {
        filter: this.filter.filter,
      },
      ...params,
    };
  }
}

const toClientRow = (
  { rowIndex, rowKey, sel: isSelected, data }: VuuRow,
  keys: KeySet
) =>
  [
    rowIndex,
    keys.keyFor(rowIndex),
    true,
    null,
    null,
    1,
    rowKey,
    isSelected,
  ].concat(data) as DataSourceRow;

const toClientRowTree = (
  { rowIndex, rowKey, sel: isSelected, data }: VuuRow,
  keys: KeySet
) => {
  const [depth, isExpanded /* path */, , isLeaf /* label */, , count, ...rest] =
    data;

  const record = [
    rowIndex,
    keys.keyFor(rowIndex),
    isLeaf,
    isExpanded,
    depth,
    count,
    rowKey,
    isSelected,
  ].concat(rest);

  return record as DataSourceRow;
};
