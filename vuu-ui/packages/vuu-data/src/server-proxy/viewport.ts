import { DataSourceFilter } from "@finos/vuu-data-types";
import { Selection } from "@finos/vuu-datagrid-types";
import {
  ClientToServerChangeViewPort,
  ClientToServerCloseTreeNode,
  ClientToServerCreateLink,
  ClientToServerCreateViewPort,
  ClientToServerDisable,
  ClientToServerEnable,
  ClientToServerOpenTreeNode,
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
import { expandSelection, getFullRange } from "@finos/vuu-utils";
import {
  ServerProxySubscribeMessage,
  VuuUIMessageOutCloseTreeNode,
  VuuUIMessageOutOpenTreeNode,
} from "../vuuUIMessageTypes";
import { ArrayBackedMovingWindow } from "./array-backed-moving-window";
import { bufferBreakout } from "./buffer-range";
import { KeySet } from "./keyset";
import * as Message from "./messages";
import {
  DataSourceAggregateMessage,
  DataSourceColumnsMessage,
  DataSourceDisabledMessage,
  DataSourceEnabledMessage,
  DataSourceFilterMessage,
  DataSourceGroupByMessage,
  DataSourceMenusMessage,
  DataSourceRow,
  DataSourceSortMessage,
  DataSourceSubscribedMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinkRemovedMessage,
  DataSourceVisualLinksMessage,
  DataUpdateMode,
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
interface SelectionOperation {
  data: Selection;
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
  | SelectionOperation
  | Sort;
type RangeRequestTuple = [ClientToServerViewPortRange | null, DataSourceRow[]?];

type LinkedParent = {
  colName: string;
  parentViewportId: string;
  parentColName: string;
};

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
  private pendingUpdates: VuuRow[] = [];
  private keys: KeySet;
  private pendingLinkedParent?: LinkDescriptorWithLabel;
  private pendingOperations = new Map<string, AsyncOperation>();
  private pendingRangeRequest: ClientToServerViewPortRange | null = null;
  private rowCountChanged = false;
  private serverTableMeta: {
    columns: string[];
    dataTypes: VuuColumnDataType[];
  } | null = null;
  private batchMode = true;

  public clientViewportId: string;
  public disabled = false;
  public isTree = false;
  public links?: LinkDescriptorWithLabel[];
  public linkedParent?: LinkedParent;
  public serverViewportId?: string;
  public status: "" | "subscribing" | "resubscribing" | "subscribed" = "";
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

  get size() {
    return this.dataWindow?.rowCount ?? 0;
  }

  subscribe() {
    const { filter } = this.filter;
    this.status =
      this.status === "subscribed" ? "resubscribing" : "subscribing";
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
    const pendingOperation = pendingOperations.get(requestId);
    if (!pendingOperation) {
      console.warn(`Viewport no matching operation found to complete`);
      return;
    }
    const { type, data } = pendingOperation;
    pendingOperations.delete(requestId);
    if (type === Message.CHANGE_VP_RANGE) {
      const [from, to] = params as [number, number];
      this.dataWindow?.setRange(from, to);
      this.pendingRangeRequest = null;
    } else if (type === "groupBy") {
      this.isTree = data.length > 0;
      this.groupBy = data;
      return {
        clientViewportId,
        type,
        groupBy: data,
      } as DataSourceGroupByMessage;
    } else if (type === "columns") {
      this.columns = data;
      return {
        clientViewportId,
        type,
        columns: data,
      } as DataSourceColumnsMessage;
    } else if (type === "filter") {
      this.filter = data as DataSourceFilter;
      return {
        clientViewportId,
        type,
        filter: data,
      } as DataSourceFilterMessage;
    } else if (type === "aggregate") {
      this.aggregations = data as VuuAggregation[];
      return {
        clientViewportId,
        type: "aggregate",
        aggregations: this.aggregations,
      } as DataSourceAggregateMessage;
    } else if (type === "sort") {
      this.sort = data;
      return {
        clientViewportId,
        type,
        sort: this.sort,
      } as DataSourceSortMessage;
    } else if (type === "selection") {
      // should we do this here ?
      // this.selection = data;
    } else if (type === "disable") {
      this.disabled = true; // assuming its _SUCCESS, of course
      return {
        type: "disabled",
        clientViewportId,
      } as DataSourceDisabledMessage;
    } else if (type === "enable") {
      this.disabled = false;
      return {
        type: "enabled",
        clientViewportId,
      } as DataSourceEnabledMessage;
    } else if (type === "CREATE_VISUAL_LINK") {
      const [colName, parentViewportId, parentColName] = params;
      this.linkedParent = {
        colName,
        parentViewportId,
        parentColName,
      } as LinkedParent;
      this.pendingLinkedParent = undefined;
      return {
        type: "vuu-link-created",
        clientViewportId,
        colName,
        parentViewportId,
        parentColName,
      } as DataSourceVisualLinkCreatedMessage;
    } else if (type === "REMOVE_VISUAL_LINK") {
      this.linkedParent = undefined;
      return {
        type: "vuu-link-removed",
        clientViewportId,
      } as DataSourceVisualLinkRemovedMessage;
    }
  }

  // TODO when a range request arrives, consider the viewport to be scrolling
  // until data arrives and we have the full range.
  // When not scrolling, any server data is an update
  // Wehn scrolling, we are in batch mode
  rangeRequest(requestId: string, range: VuuRange): RangeRequestTuple {
    // If we can satisfy the range request from the buffer, we will.
    // May or may not need to make a server request, depending on status of buffer
    const type = "CHANGE_VP_RANGE";
    // If dataWindow has all data for the new range, it will return the
    // delta of rows which are in the new range but were not in the
    // previous range.
    // Note: what if it doesn't have the entire range but DOES have all
    // rows that constitute the delta ? Is this even possible ?

    if (this.dataWindow) {
      const [serverDataRequired, clientRows] = this.dataWindow.setClientRange(
        range.from,
        range.to
      );

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
            } as ClientToServerViewPortRange)
          : null;
      if (serverRequest) {
        // TODO check that there os not already a pending server request for more data
        this.awaitOperation(requestId, { type });
        this.pendingRangeRequest = serverRequest;

        this.batchMode = true;
      } else if (clientRows.length > 0) {
        this.batchMode = false;
      }

      // always reset the keys here, even if we're not going to return rows immediately.
      this.keys.reset(this.dataWindow.clientRange);

      const toClient = this.isTree ? toClientRowTree : toClientRow;

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
    this.links = links;
    return [
      {
        type: "vuu-links",
        links,
        clientViewportId: this.clientViewportId,
      },
      this.pendingLinkedParent,
    ] as [DataSourceVisualLinksMessage, LinkDescriptorWithLabel | undefined];
  }

  setMenu(menu: VuuMenu): DataSourceMenusMessage {
    return {
      type: "vuu-menu",
      menu,
      clientViewportId: this.clientViewportId,
    };
  }

  setTableMeta(columns: string[], dataTypes: VuuColumnDataType[]) {
    this.serverTableMeta = { columns, dataTypes };
  }

  openTreeNode(requestId: string, message: VuuUIMessageOutOpenTreeNode) {
    this.batchMode = true;
    return {
      type: Message.OPEN_TREE_NODE,
      vpId: this.serverViewportId,
      treeKey: message.key,
    } as ClientToServerOpenTreeNode;
  }

  closeTreeNode(requestId: string, message: VuuUIMessageOutCloseTreeNode) {
    this.batchMode = true;
    return {
      type: Message.CLOSE_TREE_NODE,
      vpId: this.serverViewportId,
      treeKey: message.key,
    } as ClientToServerCloseTreeNode;
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
    this.batchMode = true;
    return this.createRequest({ groupBy });
  }

  selectRequest(requestId: string, selected: Selection) {
    // TODO we need to do this in the client if we are to raise selection events
    // TODO is it right to set this here or should we wait for ACK from server ?
    this.awaitOperation(requestId, { type: "selection", data: selected });
    return {
      type: "SET_SELECTION",
      vpId: this.serverViewportId,
      selection: expandSelection(selected),
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
          if (!this.batchMode) {
            this.pendingUpdates.push(row);
          }
        }
      }
    }
  }

  // This is called only after new data has been received from server - data
  // returned direcly from buffer does not use this.
  getClientRows(): [undefined | DataSourceRow[], DataUpdateMode] {
    let out: DataSourceRow[] | undefined = undefined;
    let mode: DataUpdateMode = "size-only";

    if (this.hasUpdates && this.dataWindow) {
      const { keys } = this;
      const toClient = this.isTree ? toClientRowTree : toClientRow;

      if (this.pendingUpdates.length > 0) {
        out = [];
        mode = "update";
        for (const row of this.pendingUpdates) {
          out.push(toClient(row, keys));
        }
        this.pendingUpdates.length = 0;
      } else {
        const records = this.dataWindow.getData();
        // if scrolling and hasAllRowsWithinRange, turn scrolling off
        // if not scrolling, return just the updates
        if (this.dataWindow.hasAllRowsWithinRange) {
          out = [];
          mode = "batch";
          for (const row of records) {
            out.push(toClient(row, keys));
          }
          this.batchMode = false;
        }
      }
      this.hasUpdates = false;
    }
    return [out, mode];
  }

  getNewRowCount = () => {
    if (this.rowCountChanged && this.dataWindow) {
      this.rowCountChanged = false;
      return this.dataWindow.rowCount;
    }
  };

  createRequest(
    params: Partial<Omit<ClientToServerChangeViewPort, "type" | "viewPortId">>
  ) {
    return {
      type: "CHANGE_VP",
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
) => {
  return [
    rowIndex,
    keys.keyFor(rowIndex),
    true,
    null,
    null,
    1,
    rowKey,
    isSelected,
  ].concat(data) as DataSourceRow;
};

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
