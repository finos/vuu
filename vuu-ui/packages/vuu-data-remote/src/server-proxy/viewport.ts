import {
  DataSourceFilter,
  DataSourceRow,
  DataSourceCallbackMessage,
  DataSourceDebounceRequest,
  DataSourceDisabledMessage,
  DataSourceEnabledMessage,
  DataSourceMenusMessage,
  DataSourceSetConfigMessage,
  DataSourceSubscribedMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinkRemovedMessage,
  DataSourceVisualLinksMessage,
  DataUpdateMode,
  TableSchema,
  WithFullConfig,
  ServerProxySubscribeMessage,
  VuuUIMessageOutOpenTreeNode,
  VuuUIMessageOutCloseTreeNode,
  WithRequestId,
  DataSourceFrozenMessage,
  DataSourceUnfrozenMessage,
} from "@vuu-ui/vuu-data-types";
import {
  VuuViewportChangeRequest,
  ClientToServerCloseTreeNode,
  VuuCreateVisualLink,
  VuuViewportCreateRequest,
  VuuViewportDisableRequest,
  VuuViewportEnableRequest,
  ClientToServerOpenTreeNode,
  VuuRemoveVisualLink,
  VuuViewportRangeRequest,
  LinkDescriptorWithLabel,
  VuuViewportCreateSuccessResponse,
  VuuAggregation,
  VuuMenu,
  VuuRange,
  VuuRow,
  VuuSort,
  VuuTable,
  VuuGroupDataRow,
  SelectRequest,
  FreezeViewportRequest,
  UnfreezeViewportRequest,
} from "@vuu-ui/vuu-protocol-types";
import { getFullRange, KeySet, logger, RangeMonitor } from "@vuu-ui/vuu-utils";
import {
  gapBetweenLastRowSentToClient,
  getFirstAndLastRows,
} from "../message-utils";
import { ArrayBackedMovingWindow } from "./array-backed-moving-window";
import * as Message from "./messages";

export type ViewportStatus =
  | ""
  | "subscribing"
  | "resubscribing"
  | "subscribed";

const { debug, debugEnabled, error, info, infoEnabled, warn } =
  logger("Viewport");

interface Disable {
  type: "disable";
}
interface Enable {
  type: "enable";
}
interface Freeze {
  type: "freeze";
}
interface Unfreeze {
  type: "unfreeze";
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
interface SelectionOperation {
  data: Selection;
  type: "selection";
}

type AsyncOperationWithData =
  | ConfigOperation
  | ViewportFilter
  | SelectionOperation;

type AsyncOperation =
  | AsyncOperationWithData
  | ChangeViewportRange
  | Disable
  | Enable
  | Freeze
  | Unfreeze
  | VuuCreateVisualLink
  | VuuRemoveVisualLink;

type RangeRequestTuple = [
  VuuViewportRangeRequest | null,
  DataSourceRow[]?,
  DataSourceDebounceRequest?,
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
  #status: ViewportStatus = "";

  private aggregations: VuuAggregation[];
  private batchMode = false;
  private bufferSize: number;
  /**
   * clientRange is always the range requested by the client. We should assume
   * these are the rows visible to the user
   * TODO what is clientRange needed for ?
   */
  #clientRange: VuuRange;
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
  private pendingRangeRequests: (VuuViewportRangeRequest & {
    acked?: boolean;
    requestId: string;
  })[] = [];
  private postMessageToClient: (message: DataSourceCallbackMessage) => void;
  private rowCountChanged = false;
  private lastUpdateStatus: LastUpdateStatus = NO_UPDATE_STATUS;
  private updateThrottleTimer: number | undefined = undefined;
  private lastRowsReturnedToClient: [number, number] = [-1, -1];

  private rangeMonitor = new RangeMonitor("ViewPort");

  public clientViewportId: string;
  public disabled = false;
  public frozen = false;
  public isTree = false;
  public links?: LinkDescriptorWithLabel[];
  public linkedParent?: LinkedParent;
  public serverViewportId?: string;
  // TODO roll disabled/suspended into status
  public suspended = false;
  public suspendTimer: number | null = null;
  public table: VuuTable;
  public title: string | undefined;

  constructor(
    {
      aggregations,
      bufferSize = 50,
      columns,
      filterSpec: filter,
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
    postMessageToClient: (message: DataSourceCallbackMessage) => void,
  ) {
    this.aggregations = aggregations;
    this.bufferSize = bufferSize;
    this.#clientRange = range;
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
        `constructor #${viewport} ${table.table} bufferSize=${bufferSize}`,
      );
    this.dataWindow = new ArrayBackedMovingWindow(
      this.#clientRange,
      range,
      this.bufferSize,
    );

    this.postMessageToClient = postMessageToClient;
  }

  // Records SIZE only updates
  private setLastSizeOnlyUpdateSize = (size: number) => {
    this.lastUpdateStatus.size = size;
    if (size === 0) {
      this.lastRowsReturnedToClient[0] = -1;
      this.lastRowsReturnedToClient[1] = -1;
    }
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

  get clientRange() {
    return this.#clientRange;
  }

  get status() {
    return this.#status;
  }

  set status(status: ViewportStatus) {
    this.#status = status;
  }

  subscribe() {
    const { filter } = this.filter;
    this.status =
      this.#status === "subscribed" ? "resubscribing" : "subscribing";
    return {
      type: Message.CREATE_VP,
      table: this.table,
      range: getFullRange(this.#clientRange, this.bufferSize),
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: { filter },
    } as VuuViewportCreateRequest;
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
      table,
    }: VuuViewportCreateSuccessResponse,
    baseTableSchema: TableSchema,
  ) {
    this.serverViewportId = viewPortId;
    this.status = "subscribed";
    this.aggregations = aggregations;
    this.columns = columns;
    this.groupBy = groupBy;
    this.isTree = groupBy && groupBy.length > 0;
    this.dataWindow.setRange(range.from, range.to);

    // If the table we have subscribed to is a session table, the tablename will
    // be a unique name for this instance. It must be used in subsequent operations
    // that require table, e.g RPC calls
    const tableSchema =
      table === baseTableSchema.table.table
        ? baseTableSchema
        : {
            ...baseTableSchema,
            table: {
              ...baseTableSchema.table,
              session: table,
            },
          };

    return {
      aggregations,
      type: "subscribed",
      clientViewportId: this.clientViewportId,
      columns,
      filterSpec: filter,
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
      error(
        `no matching operation found to complete for requestId ${requestId}`,
      );
      return;
    }
    const { type } = pendingOperation;
    info?.(`completeOperation ${type}`);

    pendingOperations.delete(requestId);
    if (type === "CHANGE_VP_RANGE") {
      const [from, to] = params as [number, number];
      infoEnabled &&
        info(
          `completeOperation CHANGE_VP_RANGE
        window setRange (${from}:${to}) ${this.pendingRangeRequests.length} range requests pending`,
        );
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
      const {
        aggregations,
        columns,
        filterSpec: filter,
        groupBy,
        sort,
      } = pendingOperation.data;
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
    } else if (type === "freeze") {
      this.disabled = true; // assuming its _SUCCESS, of course
      return {
        type: "frozen",
        clientViewportId,
      } as DataSourceFrozenMessage;
    } else if (type === "unfreeze") {
      this.frozen = false;
      return {
        type: "unfrozen",
        clientViewportId,
      } as DataSourceUnfrozenMessage;
    } else if (type === "CREATE_VISUAL_LINK") {
      const [colName, parentViewportId, parentColName] = params;
      this.linkedParent = {
        colName,
        parentViewportId,
        parentColName,
      } as LinkedParent;
      this.pendingLinkedParent = undefined;
      return {
        requestId,
        type: "vuu-link-created",
        clientViewportId,
        colName,
        parentViewportId,
        parentColName,
      } as WithRequestId<DataSourceVisualLinkCreatedMessage>;
    } else if (type === "REMOVE_VISUAL_LINK") {
      this.linkedParent = undefined;
      return {
        requestId,
        type: "vuu-link-removed",
        clientViewportId,
      } as WithRequestId<DataSourceVisualLinkRemovedMessage>;
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
    infoEnabled &&
      info(
        `(bufferSize ${this.bufferSize}) rangeRequest (${range.from}:${range.to}) current: window client (${this.dataWindow.clientRange.from}:${this.dataWindow.clientRange.to}), full (${this.dataWindow.range.from}:${this.dataWindow.range.to}) `,
      );

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
        range.to,
      );
      infoEnabled &&
        info(
          `updated: dataWindow clientRange (${this.dataWindow.clientRange.from}:${this.dataWindow.clientRange.to}), fullRange (${this.dataWindow.range.from}:${this.dataWindow.range.to}) serverDataRequired ${serverDataRequired ? "Y" : "N"} ${clientRows.length} rows returned from local buffer`,
        );
      // console.log(
      //   `[Viewport] updated: window client (${this.dataWindow.clientRange.from}:${this.dataWindow.clientRange.to}), full (${this.dataWindow.range.from}:${this.dataWindow.range.to})
      //     serverDataRequired ${serverDataRequired ? "Y" : "N"}
      //     ${clientRows.length} rows returned from local cache (${clientRows.map((r) => r.rowIndex).join(",")})`,
      // );

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
            } as VuuViewportRangeRequest)
          : null;
      if (serverRequest) {
        infoEnabled &&
          info(
            `create CHANGE_VP_RANGE: (${serverRequest.from} - ${serverRequest.to})`,
          );
        debugEnabled &&
          debug?.(
            `create CHANGE_VP_RANGE: [${serverRequest.from} - ${serverRequest.to}]`,
          );
        // TODO check that there is not already a pending server request for more data
        // were we await an operation that might not be sent (if still subscribing)

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
      } else if (clientRows.length > 0) {
        this.batchMode = false;
      }

      // always reset the keys here, even if we're not going to return rows immediately.
      this.keys.reset(this.dataWindow.clientRange);

      const toClient = this.isTree ? toClientRowTree : toClientRow;
      if (clientRows.length) {
        this.lastRowsReturnedToClient[0] = clientRows[0].rowIndex;
        this.lastRowsReturnedToClient[1] = clientRows.at(-1)?.rowIndex ?? -1;

        return [
          serverRequest,
          clientRows.map((row) => {
            return toClient(row, this.keys);
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
    this.links = links.filter(
      (link) => link.parentVpId !== this.serverViewportId,
    );
    return [
      {
        type: "vuu-links",
        links: this.links,
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
    const treeKey =
      message.index === undefined
        ? message.key
        : this.getKeyForRowAtIndex(message.index);
    infoEnabled && info(`treeKey ${treeKey}`);
    return {
      type: Message.OPEN_TREE_NODE,
      vpId: this.serverViewportId,
      treeKey,
    } as ClientToServerOpenTreeNode;
  }

  closeTreeNode(requestId: string, message: VuuUIMessageOutCloseTreeNode) {
    const treeKey =
      message.index === undefined
        ? message.key
        : this.getKeyForRowAtIndex(message.index);
    return {
      type: Message.CLOSE_TREE_NODE,
      vpId: this.serverViewportId,
      treeKey,
    } as ClientToServerCloseTreeNode;
  }

  createLink(requestId: string, vuuCreateVisualLink: VuuCreateVisualLink) {
    const message = {
      ...vuuCreateVisualLink,
      childVpId: this.serverViewportId,
    } as VuuCreateVisualLink;
    this.awaitOperation(requestId, message);
    return message as VuuCreateVisualLink;
  }

  removeLink(requestId: string) {
    const message = {
      type: "REMOVE_VISUAL_LINK",
      childVpId: this.serverViewportId,
    } as VuuRemoveVisualLink;
    this.awaitOperation(requestId, message);
    return message as VuuRemoveVisualLink;
  }

  suspend() {
    this.suspended = true;
    info?.("suspend");
  }

  resume(): [number, DataSourceRow[]] {
    this.suspended = false;
    if (debugEnabled) {
      debug?.(`resume: ${this.currentData()}`);
    }
    return [this.size, this.currentData()];
  }

  currentData() {
    const out: DataSourceRow[] = [];
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
    info?.(`enable: ${this.serverViewportId}`);
    return {
      type: Message.ENABLE_VP,
      viewPortId: this.serverViewportId,
    } as VuuViewportEnableRequest;
  }

  disable(requestId: string) {
    this.awaitOperation(requestId, { type: "disable" });
    info?.(`disable: ${this.serverViewportId}`);
    this.suspended = false;
    return {
      type: Message.DISABLE_VP,
      viewPortId: this.serverViewportId,
    } as VuuViewportDisableRequest;
  }

  freeze(requestId: string) {
    this.awaitOperation(requestId, { type: "freeze" });
    info?.(`freeze: ${this.serverViewportId}`);
    return {
      type: "FREEZE_VP",
      viewPortId: this.serverViewportId,
    } as FreezeViewportRequest;
  }

  unfreeze(requestId: string) {
    this.awaitOperation(requestId, { type: "unfreeze" });
    info?.(`unfreeze: ${this.serverViewportId}`);
    this.suspended = false;
    return {
      type: "UNFREEZE_VP",
      viewPortId: this.serverViewportId,
    } as UnfreezeViewportRequest;
  }

  setConfig(requestId: string, config: WithFullConfig) {
    this.awaitOperation(requestId, { type: "config", data: config });

    const { filterSpec: filter, ...remainingConfig } = config;

    debugEnabled
      ? debug?.(`setConfig ${JSON.stringify(config)}`)
      : info?.(`setConfig`);

    if (!this.isTree && config.groupBy.length > 0) {
      this.dataWindow?.clear();
      this.lastRowsReturnedToClient[0] = -1;
      this.lastRowsReturnedToClient[1] = -1;
    }

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
      true,
    );
  }

  selectRequest(request: SelectRequest): SelectRequest {
    info?.(`selectRequest: ${request.type}`);
    if (this.serverViewportId) {
      return {
        ...request,
        vpId: this.serverViewportId,
      };
    } else {
      throw Error(
        `[Viewport] cannot process ${request.type} before serverViewportId has been set`,
      );
    }
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
            "removePendingRangeRequest TABLE_ROWS are not for latest request",
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

  clearCache() {
    this.dataWindow.setRowCount(0);
    this.postMessageToClient({
      clientViewportId: this.clientViewportId,
      type: "viewport-clear",
    });
  }

  updateRows(rows: VuuRow[]) {
    const [firstRow, lastRow] = getFirstAndLastRows(rows);
    if (firstRow && lastRow) {
      this.removePendingRangeRequest(firstRow.rowIndex, lastRow.rowIndex);
    }

    if (rows.length === 1) {
      if (firstRow.vpSize === 0 && this.disabled) {
        debug?.(
          `ignore a SIZE=0 message on disabled viewport (${rows.length} rows)`,
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

  private getKeyForRowAtIndex(rowIndex: number) {
    const row = this.dataWindow.getAtIndex(rowIndex);
    return row?.rowKey;
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
      const { keys } = this;
      const toClient = this.isTree ? toClientRowTree : toClientRow;

      if (this.updateThrottleTimer) {
        self.clearTimeout(this.updateThrottleTimer);
        this.updateThrottleTimer = undefined;
      }

      if (
        this.pendingUpdates.length > 0 &&
        this.dataWindow.hasAllRowsWithinRange
      ) {
        out = [];
        mode = "update";

        const missingRows = gapBetweenLastRowSentToClient(
          this.lastRowsReturnedToClient,
          this.pendingUpdates,
          this.dataWindow.clientRange,
          this.dataWindow.rowCount,
        );
        if (missingRows) {
          for (let i = missingRows.from; i < missingRows.to; i++) {
            const row = this.dataWindow.getAtIndex(i);
            if (row) {
              out.push(toClient(row, keys));
            } else {
              console.warn("[Viewport] missing row not in data cache");
            }
          }
          for (const row of this.pendingUpdates) {
            out.push(toClient(row, keys));
          }

          // for (const row of this.dataWindow.getData()) {
          //   out.push(toClient(row, keys, selectedRows));
          // }
          out.sort(
            ([idx1]: DataSourceRow, [idx2]: DataSourceRow) => idx1 - idx2,
          );
        } else {
          for (const row of this.pendingUpdates) {
            out.push(toClient(row, keys));
          }
        }

        this.lastRowsReturnedToClient[0] = out.at(0)?.[0] ?? -1;
        this.lastRowsReturnedToClient[1] = out.at(-1)?.[0] ?? -1;
      } else if (this.pendingUpdates.length > 0) {
        // We have updates, but local cache does not have all rows to fill client range.
        // That means we must be processing a full range refresh, but don't yet have all
        // the data to send to client. When remaining rows are received, we will forward
        // rows to client.
        // Reset the lastRowsReturnedToClient. otherwise we would skip these pending updates
        this.lastRowsReturnedToClient[0] = -1;
        this.lastRowsReturnedToClient[1] = -1;
      }
      this.pendingUpdates.length = 0;
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
          2000,
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
    params: Partial<Omit<VuuViewportChangeRequest, "type" | "viewPortId">>,
    overWrite = false,
  ) {
    if (overWrite) {
      return {
        type: "CHANGE_VP",
        viewPortId: this.serverViewportId,
        ...params,
      } as VuuViewportChangeRequest;
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
      } as VuuViewportChangeRequest;
    }
  }
}

const isNew = false;

const toClientRow = (
  { rowIndex, rowKey, sel: isSelected, data, ts }: VuuRow,
  keys: KeySet,
) => {
  return [
    rowIndex,
    keys.keyFor(rowIndex),
    true,
    false,
    0,
    0,
    rowKey,
    isSelected,
    ts,
    isNew,
  ].concat(data) as DataSourceRow;
};

const toClientRowTree = (
  { rowIndex, rowKey, sel: isSelected, data, ts }: VuuRow,
  keys: KeySet,
) => {
  const [depth, isExpanded /* path */, , isLeaf /* label */, , count, ...rest] =
    data as VuuGroupDataRow;

  return [
    rowIndex,
    keys.keyFor(rowIndex),
    isLeaf,
    isExpanded,
    depth,
    count,
    rowKey,
    isSelected,
    ts,
    isNew,
  ].concat(rest) as DataSourceRow;
};
