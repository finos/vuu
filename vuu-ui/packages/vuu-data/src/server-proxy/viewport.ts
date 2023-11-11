import { DataSourceFilter, DataSourceRow } from "@finos/vuu-data-types";
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
  VuuGroupBy,
  VuuMenu,
  VuuRange,
  VuuRow,
  VuuSort,
  VuuTable,
} from "@finos/vuu-protocol-types";
import {
  expandSelection,
  getFullRange,
  getSelectionStatus,
  KeySet,
  logger,
  RangeMonitor,
} from "@finos/vuu-utils";
import {
  DataSourceAggregateMessage,
  DataSourceCallbackMessage,
  DataSourceColumnsMessage,
  DataSourceDebounceRequest,
  DataSourceDisabledMessage,
  DataSourceEnabledMessage,
  DataSourceFilterMessage,
  DataSourceGroupByMessage,
  DataSourceMenusMessage,
  DataSourceSetConfigMessage,
  DataSourceSortMessage,
  DataSourceSubscribedMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinkRemovedMessage,
  DataSourceVisualLinksMessage,
  DataUpdateMode,
  WithFullConfig,
} from "../data-source";
import { getFirstAndLastRows, TableSchema } from "../message-utils";
import {
  ServerProxySubscribeMessage,
  VuuUIMessageOutCloseTreeNode,
  VuuUIMessageOutOpenTreeNode,
} from "../vuuUIMessageTypes";
import { ArrayBackedMovingWindow } from "./array-backed-moving-window";
import * as Message from "./messages";

const EMPTY_GROUPBY: VuuGroupBy = [];

const { debug, debugEnabled, error, info, infoEnabled, warn } =
  logger("viewport");

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
interface ConfigOperation {
  data: WithFullConfig;
  type: "config";
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

type AsyncOperationWithData =
  | Aggregate
  | Columns
  | ConfigOperation
  | ViewportFilter
  | GroupBy
  | GroupByClear
  | SelectionOperation
  | Sort;

type AsyncOperation =
  | AsyncOperationWithData
  | ChangeViewportRange
  | Disable
  | Enable
  | ClientToServerCreateLink
  | ClientToServerRemoveLink;

type RangeRequestTuple = [
  ClientToServerViewPortRange | null,
  DataSourceRow[]?,
  DataSourceDebounceRequest?
];

type LinkedParent = {
  colName: string;
  parentViewportId: string;
  parentColName: string;
};

type LastUpdateStatus = {
  count: number;
  mode?: DataUpdateMode;
  size: number;
  ts: number;
};

const isLeafUpdate = ({ rowKey, updateType }: VuuRow) =>
  updateType === "U" && !rowKey.startsWith("$root");

export const NO_DATA_UPDATE: Readonly<[undefined, undefined]> = [
  undefined,
  undefined,
];
const NO_UPDATE_STATUS: LastUpdateStatus = {
  count: 0,
  mode: undefined,
  size: 0,
  ts: 0,
};

export class Viewport {
  private aggregations: VuuAggregation[];
  /** batchMode is irrelevant for Vuu Table, it was introduced to try and improve rendering performance of AgGrid */
  private batchMode = true;
  private bufferSize: number;
  /**
   * clientRange is always the range requested by the client. We should assume
   * these are the rows visible to the user
   */
  private clientRange: VuuRange;
  private columns: string[];
  private dataWindow: ArrayBackedMovingWindow;
  private filter: DataSourceFilter;
  private groupBy: string[];
  private sort: VuuSort;
  private hasUpdates = false;
  private pendingUpdates: VuuRow[] = [];
  private keys: KeySet;
  private pendingLinkedParent?: LinkDescriptorWithLabel;
  private pendingOperations = new Map<string, AsyncOperation>();
  private pendingRangeRequests: (ClientToServerViewPortRange & {
    acked?: boolean;
    requestId: string;
  })[] = [];
  private postMessageToClient: (message: DataSourceCallbackMessage) => void;
  private rowCountChanged = false;
  private selectedRows: Selection = [];
  private useBatchMode = true;
  private lastUpdateStatus: LastUpdateStatus = NO_UPDATE_STATUS;
  private updateThrottleTimer: number | undefined = undefined;

  private rangeMonitor = new RangeMonitor("ViewPort");

  public clientViewportId: string;
  public disabled = false;
  public isTree = false;
  public links?: LinkDescriptorWithLabel[];
  public linkedParent?: LinkedParent;
  public serverViewportId?: string;
  // TODO roll disabled/suspended into status
  public status: "" | "subscribing" | "resubscribing" | "subscribed" = "";
  public suspended = false;
  public suspendTimer: number | null = null;
  public table: VuuTable;
  public title: string | undefined;

  constructor(
    {
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
    }: ServerProxySubscribeMessage,
    /**
     * Viewport is given access to postMessageToClient in the event that it needs
     * to send 'out of band' messageg, e.g cached SIZE messages when a timer
     * expires
     */
    postMessageToClient: (message: DataSourceCallbackMessage) => void
  ) {
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
    infoEnabled &&
      info?.(
        `constructor #${viewport} ${table.table} bufferSize=${bufferSize}`
      );
    this.dataWindow = new ArrayBackedMovingWindow(
      this.clientRange,
      range,
      this.bufferSize
    );

    this.postMessageToClient = postMessageToClient;
  }

  // Records SIZE only updates
  private setLastSizeOnlyUpdateSize = (size: number) => {
    this.lastUpdateStatus.size = size;
  };
  private setLastUpdate = (mode: DataUpdateMode) => {
    const { ts: lastTS, mode: lastMode } = this.lastUpdateStatus;
    let elapsedTime = 0;

    if (lastMode === mode) {
      const ts = Date.now();
      this.lastUpdateStatus.count += 1;
      this.lastUpdateStatus.ts = ts;
      elapsedTime = lastTS === 0 ? 0 : ts - lastTS;
    } else {
      this.lastUpdateStatus.count = 1;
      this.lastUpdateStatus.ts = 0;
      elapsedTime = 0;
    }

    this.lastUpdateStatus.mode = mode;

    return elapsedTime;
  };

  get hasUpdatesToProcess() {
    if (this.suspended) {
      return false;
    }
    return this.rowCountChanged || this.hasUpdates;
  }

  get size() {
    return this.dataWindow.rowCount ?? 0;
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

  handleSubscribed(
    {
      viewPortId,
      aggregations,
      columns,
      filterSpec: filter,
      range,
      sort,
      groupBy,
    }: ServerToClientCreateViewPortSuccess,
    tableSchema?: TableSchema
  ) {
    this.serverViewportId = viewPortId;
    this.status = "subscribed";
    this.aggregations = aggregations;
    this.columns = columns;
    this.groupBy = groupBy;
    this.isTree = groupBy && groupBy.length > 0;
    // this.dataWindow = new ArrayBackedMovingWindow(
    //   this.clientRange,
    //   range,
    //   this.bufferSize
    // );
    this.dataWindow.setRange(range.from, range.to);
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
      tableSchema,
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
      error("no matching operation found to complete");
      return;
    }
    const { type } = pendingOperation;
    info?.(`completeOperation ${type}`);

    pendingOperations.delete(requestId);
    if (type === "CHANGE_VP_RANGE") {
      const [from, to] = params as [number, number];
      this.dataWindow?.setRange(from, to);

      for (let i = this.pendingRangeRequests.length - 1; i >= 0; i--) {
        const pendingRangeRequest = this.pendingRangeRequests[i];
        if (pendingRangeRequest.requestId === requestId) {
          pendingRangeRequest.acked = true;
          break;
        } else {
          warn?.("range requests sent faster than they are being ACKed");
        }
      }
    } else if (type === "config") {
      const { aggregations, columns, filter, groupBy, sort } =
        pendingOperation.data;
      this.aggregations = aggregations;
      this.columns = columns;
      this.filter = filter;
      this.groupBy = groupBy;
      this.sort = sort;
      if (groupBy.length > 0) {
        this.isTree = true;
      } else if (this.isTree) {
        this.isTree = false;
      }

      debug?.(`config change confirmed, isTree : ${this.isTree}`);

      return {
        clientViewportId,
        type,
        config: pendingOperation.data,
      } as DataSourceSetConfigMessage;
    } else if (type === "groupBy") {
      this.isTree = pendingOperation.data.length > 0;
      this.groupBy = pendingOperation.data;
      debug?.(`groupBy change confirmed, isTree : ${this.isTree}`);
      return {
        clientViewportId,
        type,
        groupBy: pendingOperation.data,
      } as DataSourceGroupByMessage;
    } else if (type === "columns") {
      this.columns = pendingOperation.data;
      return {
        clientViewportId,
        type,
        columns: pendingOperation.data,
      } as DataSourceColumnsMessage;
    } else if (type === "filter") {
      this.filter = pendingOperation.data;
      return {
        clientViewportId,
        type,
        filter: pendingOperation.data,
      } as DataSourceFilterMessage;
    } else if (type === "aggregate") {
      this.aggregations = pendingOperation.data;
      return {
        clientViewportId,
        type: "aggregate",
        aggregations: this.aggregations,
      } as DataSourceAggregateMessage;
    } else if (type === "sort") {
      this.sort = pendingOperation.data;
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
  // When scrolling, we are in batch mode
  rangeRequest(requestId: string, range: VuuRange): RangeRequestTuple {
    if (debugEnabled) {
      this.rangeMonitor.set(range);
    }
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

      let debounceRequest: DataSourceDebounceRequest | undefined;

      // Don't use zero as a range cap, it's is likely a transient count reported immediately
      // following a groupBy operation.
      const maxRange = this.dataWindow.rowCount || undefined;
      const serverRequest =
        serverDataRequired && !this.rangeRequestAlreadyPending(range)
          ? ({
              type,
              viewPortId: this.serverViewportId,
              ...getFullRange(range, this.bufferSize, maxRange),
            } as ClientToServerViewPortRange)
          : null;
      if (serverRequest) {
        debugEnabled &&
          debug?.(
            `create CHANGE_VP_RANGE: [${serverRequest.from} - ${serverRequest.to}]`
          );
        // TODO check that there is not already a pending server request for more data
        this.awaitOperation(requestId, { type });
        const pendingRequest = this.pendingRangeRequests.at(-1);
        if (pendingRequest) {
          if (pendingRequest.acked) {
            // maybe at this point we check is the requests are disjoint ?
            console.warn("Range Request before previous request is filled");
          } else {
            const { from, to } = pendingRequest;
            if (this.dataWindow.outOfRange(from, to)) {
              debounceRequest = {
                clientViewportId: this.clientViewportId,
                type: "debounce-begin",
              };
            } else {
              warn?.("Range Request before previous request is acked");
            }
          }
        }
        this.pendingRangeRequests.push({ ...serverRequest, requestId });

        if (this.useBatchMode) {
          this.batchMode = true;
        }
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
            return toClient(row, this.keys, this.selectedRows);
          }),
        ];
      } else if (debounceRequest) {
        return [serverRequest, undefined, debounceRequest];
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

  openTreeNode(requestId: string, message: VuuUIMessageOutOpenTreeNode) {
    if (this.useBatchMode) {
      this.batchMode = true;
    }
    return {
      type: Message.OPEN_TREE_NODE,
      vpId: this.serverViewportId,
      treeKey: message.key,
    } as ClientToServerOpenTreeNode;
  }

  closeTreeNode(requestId: string, message: VuuUIMessageOutCloseTreeNode) {
    if (this.useBatchMode) {
      this.batchMode = true;
    }
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
    if (this.useBatchMode) {
      // next TABLE_ROWS we get will be triggered by selection on parent
      this.batchMode = true;
    }
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
    info?.("suspend");
  }

  resume() {
    this.suspended = false;
    if (debugEnabled) {
      debug?.(`resume: ${this.currentData()}`);
    }
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
          out.push(toClient(row, keys, this.selectedRows));
        }
      }
    }
    return out;
  }

  enable(requestId: string) {
    this.awaitOperation(requestId, { type: "enable" });
    info?.(`enable: ${this.serverViewportId}`);
    return {
      type: Message.ENABLE_VP,
      viewPortId: this.serverViewportId,
    } as ClientToServerEnable;
  }

  disable(requestId: string) {
    this.awaitOperation(requestId, { type: "disable" });
    info?.(`disable: ${this.serverViewportId}`);
    this.suspended = false;
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
    debug?.(`columnRequest: ${columns}`);
    return this.createRequest({ columns });
  }

  filterRequest(requestId: string, dataSourceFilter: DataSourceFilter) {
    this.awaitOperation(requestId, {
      type: "filter",
      data: dataSourceFilter,
    });

    if (this.useBatchMode) {
      this.batchMode = true;
    }
    const { filter } = dataSourceFilter;
    info?.(`filterRequest: ${filter}`);
    return this.createRequest({ filterSpec: { filter } });
  }

  setConfig(requestId: string, config: WithFullConfig) {
    this.awaitOperation(requestId, { type: "config", data: config });

    const { filter, ...remainingConfig } = config;

    if (this.useBatchMode) {
      this.batchMode = true;
    }

    debugEnabled
      ? debug?.(`setConfig ${JSON.stringify(config)}`)
      : info?.(`setConfig`);

    return this.createRequest(
      {
        ...remainingConfig,
        filterSpec:
          typeof filter?.filter === "string"
            ? {
                filter: filter.filter,
              }
            : {
                filter: "",
              },
      },
      true
    );
  }

  aggregateRequest(requestId: string, aggregations: VuuAggregation[]) {
    this.awaitOperation(requestId, { type: "aggregate", data: aggregations });
    info?.(`aggregateRequest: ${aggregations}`);
    return this.createRequest({ aggregations });
  }

  sortRequest(requestId: string, sort: VuuSort) {
    this.awaitOperation(requestId, { type: "sort", data: sort });
    info?.(`sortRequest: ${JSON.stringify(sort.sortDefs)}`);
    return this.createRequest({ sort });
  }

  groupByRequest(requestId: string, groupBy: VuuGroupBy = EMPTY_GROUPBY) {
    this.awaitOperation(requestId, { type: "groupBy", data: groupBy });
    if (this.useBatchMode) {
      this.batchMode = true;
    }
    if (!this.isTree) {
      this.dataWindow?.clear();
    }
    return this.createRequest({ groupBy });
  }

  selectRequest(requestId: string, selected: Selection) {
    // This is a simplistic implementation, there is a possibility we might be out of sync with
    // server if server responses are too slow.
    this.selectedRows = selected;
    this.awaitOperation(requestId, { type: "selection", data: selected });
    info?.(`selectRequest: ${selected}`);
    return {
      type: "SET_SELECTION",
      vpId: this.serverViewportId,
      selection: expandSelection(selected),
    } as ClientToServerSelection;
  }

  private removePendingRangeRequest(firstIndex: number, lastIndex: number) {
    for (let i = this.pendingRangeRequests.length - 1; i >= 0; i--) {
      const { from, to } = this.pendingRangeRequests[i];
      let isLast = true;
      if (
        (firstIndex >= from && firstIndex < to) ||
        (lastIndex > from && lastIndex < to)
      ) {
        if (!isLast) {
          console.warn(
            "removePendingRangeRequest TABLE_ROWS are not for latest request"
          );
        }
        this.pendingRangeRequests.splice(i, 1);
        break;
      } else {
        isLast = false;
      }
    }
  }

  private rangeRequestAlreadyPending = (range: VuuRange) => {
    const { bufferSize } = this;
    const bufferThreshold = bufferSize * 0.25;
    let { from: stillPendingFrom } = range;
    for (const { from, to } of this.pendingRangeRequests) {
      if (stillPendingFrom >= from && stillPendingFrom < to) {
        if (range.to + bufferThreshold <= to) {
          return true;
        } else {
          stillPendingFrom = to;
        }
      }
    }
    return false;
  };

  updateRows(rows: VuuRow[]) {
    const [firstRow, lastRow] = getFirstAndLastRows(rows);
    if (firstRow && lastRow) {
      this.removePendingRangeRequest(firstRow.rowIndex, lastRow.rowIndex);
    }

    if (rows.length === 1) {
      if (firstRow.vpSize === 0 && this.disabled) {
        debug?.(
          `ignore a SIZE=0 message on disabled viewport (${rows.length} rows)`
        );
        return;
      } else if (firstRow.updateType === "SIZE") {
        // record all size only updates, we may throttle them and always need
        // to know the value of last update received.
        this.setLastSizeOnlyUpdateSize(firstRow.vpSize);
      }
    }

    for (const row of rows) {
      if (this.isTree && isLeafUpdate(row)) {
        // Ignore blank rows sent after GroupBy;
        // is it safe to bomb out here ? ie assume all rows in set will be same
        continue;
      } else {
        // We always forward a size change to the UI, even if the size has not actually changed.
        // The UI will not re-render, but sometimes this is the only confirmation we have that
        // a column has been removed from a groupBy clause (which doesn't cause a size change if
        // none of the top level group items are expanded)
        // We can not always depend on receiving a SIZE record, sometimes the first indication we
        // have that size has changes id the vpSize on data records.
        if (
          row.updateType === "SIZE" ||
          this.dataWindow?.rowCount !== row.vpSize
        ) {
          this.dataWindow?.setRowCount(row.vpSize);
          this.rowCountChanged = true;
        }
        if (row.updateType === "U") {
          if (this.dataWindow?.setAtIndex(row)) {
            this.hasUpdates = true;
            if (!this.batchMode) {
              this.pendingUpdates.push(row);
            }
          }
        }
      }
    }
  }

  // This is called only after new data has been received from server - data
  // returned direcly from buffer does not use this.
  getClientRows(): Readonly<
    [DataSourceRow[] | undefined, DataUpdateMode | undefined]
  > {
    let out: DataSourceRow[] | undefined = undefined;
    let mode: DataUpdateMode = "size-only";

    if (!this.hasUpdates && !this.rowCountChanged) {
      return NO_DATA_UPDATE;
    }

    if (this.hasUpdates) {
      const { keys, selectedRows } = this;
      const toClient = this.isTree ? toClientRowTree : toClientRow;

      if (this.updateThrottleTimer) {
        self.clearTimeout(this.updateThrottleTimer);
        this.updateThrottleTimer = undefined;
      }

      if (this.pendingUpdates.length > 0) {
        out = [];
        mode = "update";
        for (const row of this.pendingUpdates) {
          out.push(toClient(row, keys, selectedRows));
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
            out.push(toClient(row, keys, selectedRows));
          }
          this.batchMode = false;
        }
      }
      this.hasUpdates = false;
    }

    if (this.throttleMessage(mode)) {
      return NO_DATA_UPDATE;
    } else {
      return [out, mode];
    }
  }

  private sendThrottledSizeMessage = () => {
    this.updateThrottleTimer = undefined;
    this.lastUpdateStatus.count = 3;
    this.postMessageToClient({
      clientViewportId: this.clientViewportId,
      mode: "size-only",
      size: this.lastUpdateStatus.size,
      type: "viewport-update",
    });
  };

  // If we are receiving multiple SIZE updates but no data, table is loading rows
  // outside of our viewport. We can safely throttle these requests. Doing so will
  // alleviate pressure on UI DataTable.
  private shouldThrottleMessage = (mode: DataUpdateMode) => {
    const elapsedTime = this.setLastUpdate(mode);
    return (
      mode === "size-only" &&
      elapsedTime > 0 &&
      elapsedTime < 500 &&
      this.lastUpdateStatus.count > 3
    );
  };

  private throttleMessage = (mode: DataUpdateMode) => {
    if (this.shouldThrottleMessage(mode)) {
      info?.("throttling updates setTimeout to 2000");
      if (this.updateThrottleTimer === undefined) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.updateThrottleTimer = setTimeout(
          this.sendThrottledSizeMessage,
          2000
        );
      }
      return true;
    } else if (this.updateThrottleTimer !== undefined) {
      clearTimeout(this.updateThrottleTimer);
      this.updateThrottleTimer = undefined;
    }
    return false;
  };

  getNewRowCount = () => {
    if (this.rowCountChanged && this.dataWindow) {
      this.rowCountChanged = false;
      return this.dataWindow.rowCount;
    }
  };

  createRequest(
    params: Partial<Omit<ClientToServerChangeViewPort, "type" | "viewPortId">>,
    overWrite = false
  ) {
    if (overWrite) {
      return {
        type: "CHANGE_VP",
        viewPortId: this.serverViewportId,
        ...params,
      } as ClientToServerChangeViewPort;
    } else {
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
      } as ClientToServerChangeViewPort;
    }
  }
}

const toClientRow = (
  { rowIndex, rowKey, sel: isSelected, data }: VuuRow,
  keys: KeySet,
  selectedRows: Selection
) => {
  return [
    rowIndex,
    keys.keyFor(rowIndex),
    true,
    false,
    0,
    0,
    rowKey,
    isSelected ? getSelectionStatus(selectedRows, rowIndex) : 0,
  ].concat(data) as DataSourceRow;
};

const toClientRowTree = (
  { rowIndex, rowKey, sel: isSelected, data }: VuuRow,
  keys: KeySet,
  selectedRows: Selection
) => {
  const [depth, isExpanded /* path */, , isLeaf /* label */, , count, ...rest] =
    data;

  return [
    rowIndex,
    keys.keyFor(rowIndex),
    isLeaf,
    isExpanded,
    depth,
    count,
    rowKey,
    isSelected ? getSelectionStatus(selectedRows, rowIndex) : 0,
  ].concat(rest) as DataSourceRow;
};
