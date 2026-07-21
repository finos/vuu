import type {
  DataSource,
  DataSourceBase,
  DataSourceCallbackMessage,
  DataSourceConstructorProps,
  DataSourceStatus,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  DataSourceVisualLinkCreatedMessage,
  DeleteRowMode,
  EditSessionMode,
  OptimizeStrategy,
  ServerAPI,
  TableSchema,
  WithBaseFilter,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import type {
  LinkDescriptorWithLabel,
  RpcResultError,
  RpcResultSuccess,
  SelectRequest,
  VuuCreateVisualLink,
  VuuGroupBy,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
  VuuRpcMenuRequest,
  VuuRpcResponse,
  VuuRpcServiceRequest,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import { MenuRpcResponse } from "@vuu-ui/vuu-data-types";
import {
  BaseDataSource,
  combineFilters,
  debounce,
  isConfigChanged,
  isInlineEditingSession,
  isRpcSuccess,
  isSelectSuccessWithRowCount,
  isViewportMenusAction,
  isVisualLinksAction,
  itemsOrOrderChanged,
  logger,
  Range,
  toRpcEditSessionMode,
  StaleUpdateError,
  throttle,
  uuid,
} from "@vuu-ui/vuu-utils";
import ConnectionManager from "./ConnectionManager";
import { isDataSourceConfigMessage } from "./data-source";

type RangeRequest = (range: VuuRange) => void;

const { info, infoEnabled } = logger("VuuDataSource");

/**
 * Autosubscribe columns are always included in a subscription.
 * The same columns may or may not be included in subscription
 * requested by client and client may change column list over
 * lifetime of dataSource. Always make sure we include the
 * autosubscription columns, but never repeat them
 */
const combineColumnsWithAutosubscribeColumns = (
  columns: string[],
  autosubscribeColumns: string[] = [],
) => {
  if (autosubscribeColumns.length === 0) {
    return columns;
  } else {
    const out = columns.slice();
    autosubscribeColumns.forEach((name) => {
      if (!out.includes(name)) {
        out.push(name);
      }
    });
    return out;
  }
};

/*---------------------------------------------------------------------
 A VuuDataSource manages a single subscription via the ServerProxy
  ---------------------------------------------------------------------*/
export class VuuDataSource extends BaseDataSource implements DataSourceBase {
  private bufferSize: number;
  private server: ServerAPI | null = null;
  rangeRequest: RangeRequest;

  /**
   * this is the combined set of regular columns and autosubscribe columns
   */
  #allColumns: undefined | string[];
  #autosubscribeColumns: string[] = [];
  #pendingVisualLink?: LinkDescriptorWithLabel;
  #links: LinkDescriptorWithLabel[] | undefined;
  #menu: VuuMenu | undefined;
  #optimize: OptimizeStrategy = "throttle";
  #selectedRowsCount = 0;
  #sessionDataSource: DataSource | undefined = undefined;
  #sessionTableMessageColumn: string | undefined = undefined;
  #status: DataSourceStatus = "initialising";
  #tableSchema: TableSchema | undefined;

  public table: VuuTable;

  constructor({
    sessionTableMessageColumn,
    ...props
  }: DataSourceConstructorProps) {
    super(props);

    const { bufferSize = 100, table, visualLink } = props;

    if (!table)
      throw Error("RemoteDataSource constructor called without table");

    this.bufferSize = bufferSize;
    this.table = table;

    this.#pendingVisualLink = visualLink;
    this.#sessionTableMessageColumn = sessionTableMessageColumn;
    // this.rangeRequest = this.throttleRangeRequest;
    this.rangeRequest = this.rawRangeRequest;

    if (props.autosubscribeColumns) {
      this.#autosubscribeColumns = props.autosubscribeColumns;
      this.#allColumns = combineColumnsWithAutosubscribeColumns(
        super.columns,
        props.autosubscribeColumns,
      );
    }
  }

  async subscribe(
    subscribeProps: DataSourceSubscribeProps,
    callback: DataSourceSubscribeCallback,
  ) {
    // super.subscribe(subscribeProps, this.handleMessageFromServer);
    super.subscribe(subscribeProps, callback);
    const { viewport = this.viewport || (this.viewport = uuid()) } =
      subscribeProps;

    console.log(`[VuuDataSource] subscribe ${this.viewport}`);

    if (
      this.#status === "disabled" ||
      this.#status === "disabling" ||
      this.#status === "enabling"
    ) {
      // We can subscribe to a disabled dataSource. No request will be
      // sent to server to create a new VP, just to enable the existing one.
      // The current subscribing client becomes the subscription owner
      this.enable(callback);
      return;
    }

    if (this.#status !== "initialising" && this.#status !== "unsubscribed") {
      throw Error(
        `[VuuDataSource] invalid status ${this.#status} for subscribe`,
      );
    }

    this.#status = "subscribing";

    this.server = await ConnectionManager.serverAPI;

    const { bufferSize } = this;

    const { columns, ...dataSourceConfig } = combineFilters(this.config);

    // TODO and await response here
    this.server?.subscribe(
      {
        ...dataSourceConfig,
        bufferSize,
        columns: this.columns,
        range: this._range.withBuffer,
        table: this.table,
        title: this._title,
        viewport,
      },
      this.handleMessageFromServer,
    );
  }

  handleMessageFromServer = (message: DataSourceCallbackMessage) => {
    if (message.type === "subscribed") {
      this.#status = "subscribed";
      this.tableSchema = message.tableSchema;
      this._clientCallback?.(message);
      if (this.#pendingVisualLink) {
        this.visualLink = this.#pendingVisualLink;
        this.#pendingVisualLink = undefined;
      }
      this.emit("subscribed", message);
    } else if (message.type === "disabled") {
      this.#status = "disabled";
    } else if (message.type === "enabled") {
      this.#status = "subscribed";
      this.emit("enabled", this.viewport);
    } else if (isDataSourceConfigMessage(message)) {
      // This is an ACK for a CHANGE_VP message. Nothing to do here. We need
      // to wait for data to be returned before we can consider the change
      // to be in effect.
      return;
    } else if (message.type === "debounce-begin") {
      this.optimize = "debounce";
    } else {
      if (message.type === "viewport-update") {
        if (message.size !== undefined && message.size !== this.size) {
          this.size = message.size;
          this.emit("resize", message.size);
        }

        if (
          Array.isArray(message.rows) &&
          message.rows.length > 0 &&
          this.#sessionDataSource
        ) {
          this.emit("remote-update-during-local-edit", message.rows);
          console.log(
            `updates incoming whilst edit in progress ${this.viewport}`,
          );
          console.table(message.rows);
          return;
        }
      } else if (message.type === "viewport-clear") {
        this.size = 0;
        this.emit("resize", 0);
      }
      // This is used to remove any progress indication from the UI. We wait for actual data rather than
      // just the CHANGE_VP_SUCCESS ack as there is often a delay between receiving the ack and the data.
      // It may be a SIZE only message, eg in the case of removing a groupBy column from a multi-column
      // groupby, where no tree nodes are expanded.
      if (this.isAwaitingConfirmationOfConfigChange) {
        this.confirmConfigChange();
      }

      if (isViewportMenusAction(message)) {
        this.#menu = message.menu;
      } else if (isVisualLinksAction(message)) {
        this.#links = message.links as LinkDescriptorWithLabel[];
      } else {
        if (infoEnabled && message.type === "viewport-update") {
          info(
            `handleMessageFromServer<viewport-update> range (${message.range?.from}:${message.range?.to}) rows ${message.rows?.at(0)?.[0]} - ${message.rows?.at(-1)?.[0]}`,
          );
        }
        this._clientCallback?.(message);
      }

      if (this.optimize === "debounce") {
        this.revertDebounce();
      }
    }
  };

  handleSessionMessageFromServer = (msg: DataSourceCallbackMessage) => {
    if (msg.type === "subscribed") {
      console.log(`[VuuDataSource subscribed to session table]`);
    } else if (msg.type === "viewport-update") {
      if (msg.size !== undefined && msg.size !== this.size) {
        this.size = msg.size;
        this.emit("resize", msg.size);
      }
      console.log(`[VuuDataSource] clientCallback with ${msg.type}`);
      this._clientCallback?.(msg);
    }
  };

  unsubscribe() {
    if (this.#status !== "unsubscribed") {
      info?.(`unsubscribe #${this.viewport}`);
      if (this.viewport) {
        this.server?.unsubscribe(this.viewport);
        this.emit("unsubscribed", this.viewport);
      }
      this.server?.destroy(this.viewport);
      this.server = null;
      this.removeAllListeners();
      this.#status = "unsubscribed";
      this.viewport = "";
      this.range = Range(0, 0);
    }
  }

  suspend(
    escalateToDisable = this._defaultSuspenseProps.escalateToDisable,
    escalateDelay = this._defaultSuspenseProps.escalateDelay,
  ) {
    if (this.#status !== "unsubscribed") {
      info?.(`suspend #${this.viewport}, current status ${this.#status}`);
      if (this.viewport) {
        this.#status = "suspended";
        this.server?.send({
          escalateDelay,
          escalateToDisable,
          type: "suspend",
          viewport: this.viewport,
        });
        this.emit("suspended", this.viewport);
      }
    }
  }

  /**
   * Tell the server we wish to resume receiving messages. Server will send a
   * snapshot of rows currently in cache. This can be used to update with
   * latest data, e.g after an edit session during which we might have ignored
   * some updates.
   */
  private sendResumeMessage() {
    this.server?.send({
      type: "resume",
      viewport: this.viewport,
    });
  }

  resume(callback?: DataSourceSubscribeCallback) {
    const isDisabled = this.#status.startsWith("disabl");
    const isSuspended = this.#status === "suspended";
    info?.(`resume #${this.viewport}, current status ${this.#status}`);
    if (callback) {
      this._clientCallback = callback;
    }
    if (this.viewport) {
      if (isDisabled) {
        this.enable();
      } else if (isSuspended) {
        this.sendResumeMessage();
        this.#status = "subscribed";
        this.emit("resumed", this.viewport);

        if (this.#selectedRowsCount > 0) {
          this.emit("row-selection", this.#selectedRowsCount);
        }
      }
    }
  }

  freeze() {
    super.freeze();
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "FREEZE_VP",
      });
    }
  }

  unfreeze() {
    super.unfreeze();
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "UNFREEZE_VP",
      });
    }
  }

  disable() {
    info?.(`disable #${this.viewport}, current status ${this.#status}`);
    if (this.viewport) {
      this.#status = "disabling";
      this.server?.send({
        viewport: this.viewport,
        type: "disable",
      });
      this.emit("disabled", this.viewport);
    }
  }

  enable(callback?: DataSourceSubscribeCallback) {
    info?.(`enable #${this.viewport}, current status ${this.#status}`);
    if (
      this.viewport &&
      (this.#status === "disabled" || this.#status === "disabling")
    ) {
      this.#status = "enabling";
      if (callback) {
        this._clientCallback = callback;
      }
      this.server?.send({
        viewport: this.viewport,
        type: "enable",
      });
      // TODO is this a bit premature ?
      this.emit("enabled", this.viewport);
    }
  }

  async select(selectRequest: Omit<SelectRequest, "vpId">) {
    if (this.viewport && this.server) {
      const response = await this.server.select({
        ...selectRequest,
        vpId: this.viewport,
      } as SelectRequest);
      if (isSelectSuccessWithRowCount(response)) {
        console.log(
          `[VuuDataSource] select selectedRowCount ${response.selectedRowCount}`,
        );
        this.#selectedRowsCount = response.selectedRowCount;
        this.emit("row-selection", response.selectedRowCount);
      } else {
        console.warn(`select error`);
      }
    }
  }

  openTreeNode(keyOrIndex: string | number) {
    if (this.viewport) {
      const [key, index] =
        typeof keyOrIndex === "string" ? [keyOrIndex] : [undefined, keyOrIndex];
      this.server?.send({
        index,
        key,
        type: "openTreeNode",
        viewport: this.viewport,
      });
    }
  }

  closeTreeNode(keyOrIndex: string | number) {
    if (this.viewport) {
      const [key, index] =
        typeof keyOrIndex === "string" ? [keyOrIndex] : [undefined, keyOrIndex];
      this.server?.send({
        index,
        key,
        type: "closeTreeNode",
        viewport: this.viewport,
      });
    }
  }

  //TODO is this going to be confusing - the lack of symmetry between set and get columns
  // when there are autoSubscribe columns ?
  // alternative would be an allColumns prop, but every datasource would then have to add it.
  get columns() {
    return this.#allColumns ?? super.columns;
  }

  set columns(columns: string[]) {
    super.columns = columns;
    if (this.#autosubscribeColumns.length) {
      this.#allColumns = combineColumnsWithAutosubscribeColumns(
        columns,
        this.#autosubscribeColumns,
      );
    }
  }

  get tableSchema() {
    return this.#tableSchema;
  }

  set tableSchema(tableSchema: TableSchema | undefined) {
    this.#tableSchema = tableSchema;
    // TOSO emit an event
  }

  get links() {
    return this.#links;
  }

  get menu() {
    return this.#menu;
  }

  get status() {
    return this.#status;
  }

  get optimize() {
    return this.#optimize;
  }

  set optimize(optimize: OptimizeStrategy) {
    if (optimize !== this.#optimize) {
      this.#optimize = optimize;
      switch (optimize) {
        case "none":
          this.rangeRequest = this.rawRangeRequest;
          break;
        case "debounce":
          this.rangeRequest = this.debounceRangeRequest;
          break;
        case "throttle":
          this.rangeRequest = this.throttleRangeRequest;
          break;
      }
      this.emit("optimize", optimize);
    }
  }

  private revertDebounce = debounce(() => {
    this.optimize = "throttle";
  }, 100);

  get selectedRowsCount() {
    return this.#selectedRowsCount;
  }

  private rawRangeRequest: RangeRequest = (range) => {
    if (this.viewport && this.server) {
      this.server.send({
        viewport: this.viewport,
        type: "setViewRange",
        range,
      });
    }
  };

  private debounceRangeRequest: RangeRequest = debounce((range: VuuRange) => {
    if (this.viewport && this.server) {
      this.server.send({
        viewport: this.viewport,
        type: "setViewRange",
        range,
      });
    }
  }, 50);

  private throttleRangeRequest: RangeRequest = throttle((range: VuuRange) => {
    if (this.viewport && this.server) {
      this.server.send({
        viewport: this.viewport,
        type: "setViewRange",
        range,
      });
    }
  }, 80);

  get config() {
    return super.config;
  }

  set config(config: WithBaseFilter<WithFullConfig>) {
    const { noChanges, columnsChanged } = isConfigChanged(this.config, config);
    if (!noChanges) {
      super.config = config;

      const { columns, ...dataSourceConfig } = combineFilters(this.config);
      const serverConfig: WithFullConfig = {
        ...dataSourceConfig,
        columns: combineColumnsWithAutosubscribeColumns(
          columns,
          this.#autosubscribeColumns,
        ),
      };

      if (columnsChanged && this.#autosubscribeColumns.length) {
        this.#allColumns = combineColumnsWithAutosubscribeColumns(
          columns,
          this.#autosubscribeColumns,
        );
      }

      this.server?.send({
        viewport: this.viewport,
        type: "config",
        config: serverConfig,
      });
    }
  }

  set impendingConfig(config: WithBaseFilter<WithFullConfig>) {
    if (config !== this.config) {
      super.impendingConfig = config;
      this.server?.send({
        viewport: this.viewport,
        type: "config",
        config: combineFilters(this.config),
      });
    }
  }

  get groupBy() {
    return this._configWithVisualLink.groupBy;
  }

  set groupBy(groupBy: VuuGroupBy) {
    if (itemsOrOrderChanged(this.groupBy, groupBy)) {
      const wasGrouped = this.groupBy.length > 0;

      this.impendingConfig = {
        ...this._configWithVisualLink,
        groupBy,
      };

      if (!wasGrouped && groupBy.length > 0 && this.viewport) {
        // clear data from table whilst we wait for grouped data from server
        this._clientCallback?.({
          clientViewportId: this.viewport,
          mode: "batch",
          type: "viewport-update",
          size: 0,
          rows: [],
        });
      }
    }
  }

  get range() {
    return super.range;
  }

  set range(range: Range) {
    super.range = range;
    if (this.#sessionDataSource) {
      this.#sessionDataSource.range = range;
    }
  }

  get title() {
    return super.title || `${this.table.module} ${this.table.table}`;
  }

  set title(title: string) {
    super.title = title;
    if (this.viewport && title) {
      // This message doesn't actually trigger a message to Vuu server
      // it will be used to recompute visual link labels
      this.server?.send({
        type: "setTitle",
        title,
        viewport: this.viewport,
      });
    }
  }

  get visualLink() {
    return this._configWithVisualLink.visualLink;
  }

  set visualLink(visualLink: LinkDescriptorWithLabel | undefined) {
    this._configWithVisualLink = {
      ...this._configWithVisualLink,
      visualLink,
    };

    if (visualLink) {
      const {
        parentClientVpId,
        link: { fromColumn, toColumn },
      } = visualLink;

      if (this.viewport) {
        this.server
          ?.rpcCall<DataSourceVisualLinkCreatedMessage>({
            childColumnName: fromColumn,
            childVpId: this.viewport,
            parentColumnName: toColumn,
            parentVpId: parentClientVpId,
            type: "CREATE_VISUAL_LINK",
          } as VuuCreateVisualLink)
          .then((response) => {
            this.emit("visual-link-created", response);
          });
      }
    } else {
      if (this.viewport) {
        this.server
          ?.rpcCall({
            type: "REMOVE_VISUAL_LINK",
            childVpId: this.viewport,
          })
          .then(() => {
            this.emit("visual-link-removed");
          });
      }
    }

    this.emit("config", this._configWithVisualLink, this.range);
  }

  async remoteProcedureCall<T extends VuuRpcResponse = VuuRpcResponse>() {
    return Promise.reject<T>();
  }

  createSessionDataSource(sessionTable: VuuTable) {
    //TODO filters, sort etc
    const columns = this.#sessionTableMessageColumn
      ? this.columns.concat(this.#sessionTableMessageColumn)
      : this.columns;
    return new VuuDataSource({
      columns: columns,
      table: sessionTable,
    });
  }

  async beginEditSession(editSessionMode: EditSessionMode = "all-rows") {
    const rpcResponse = await this?.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "beginEditSession",
      params: {
        editSessionMode: toRpcEditSessionMode(editSessionMode),
      },
    });

    if (isRpcSuccess(rpcResponse)) {
      const { table: sessionTable } = rpcResponse.data as { table: VuuTable };

      if (isInlineEditingSession(editSessionMode)) {
        const columns = this.#sessionTableMessageColumn
          ? this.columns.concat(this.#sessionTableMessageColumn)
          : this.columns;
        this.#sessionDataSource = new VuuDataSource({
          ...this.config,
          columns,
          table: sessionTable,
          viewport: sessionTable.table,
        });

        this.#sessionDataSource.subscribe(
          {
            range: this.range,
          },
          this.handleSessionMessageFromServer,
        );
      } else {
        return new VuuDataSource({
          ...this.config,
          table: sessionTable,
          viewport: sessionTable.table,
        });
      }

      // we need to route messages from the session datasource to listening
      // client whilst still monitoring responses on the source table to which
      // we are currently subscribed.
    } else {
      throw Error(
        `[VuuDataSource] beginEditSession ${rpcResponse.errorMessage}`,
      );
      ///
    }
  }

  async editCell(key: string, column: string, data: VuuRowDataItemType) {
    const rpcHost = this.#sessionDataSource ?? this;
    return rpcHost.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "editCell",
      params: {
        column,
        data,
        key,
      },
    });
  }

  async endEditSession(saveChanges = false, force = false) {
    const type = "RPC_REQUEST";
    const rpcName = "endEditSession";
    const sessionDataSource = this.#sessionDataSource;
    const rpcHost = sessionDataSource ?? this;

    if (sessionDataSource) {
      // timing is important here. By breaking this reference before
      // we send the endEdit RPC call, the application of session edits
      // to the source table will be handled correctly.
      this.#sessionDataSource = undefined;
    }

    const rpcResponse = await rpcHost.rpcRequest?.(
      saveChanges
        ? { type, rpcName, params: { save: true, force } }
        : { type, rpcName, params: {} },
    );

    if (isRpcSuccess(rpcResponse)) {
      if (sessionDataSource) {
        sessionDataSource?.unsubscribe();
      }
    } else {
      if (rpcResponse?.errorMessage === "stale update") {
        this.#sessionDataSource = sessionDataSource;
        throw new StaleUpdateError(rpcResponse.errorMessage);
      } else {
        throw Error("unknown error");
      }
    }

    this.sendResumeMessage();
  }

  async rpcRequest(rpcRequest: Omit<VuuRpcServiceRequest, "context">) {
    if (this.viewport && this.server) {
      return this.server?.rpcCall<RpcResultSuccess | RpcResultError>({
        ...rpcRequest,
        context: { type: "VIEWPORT_CONTEXT", viewPortId: this.viewport },
      } as VuuRpcServiceRequest);
    } else {
      throw Error(`rpcCall server or viewport are undefined`);
    }
  }

  async menuRpcCall(rpcRequest: Omit<VuuRpcMenuRequest, "vpId">) {
    if (this.viewport) {
      return this.server?.rpcCall<MenuRpcResponse>({
        ...rpcRequest,
        vpId: this.viewport,
      } as VuuRpcMenuRequest);
    }
  }

  insertRow() {
    return Promise.resolve("not supported");
    // return this.menuRpcCall(vuuAddRowRequest(rowKey, data)).then((response) => {
    //   if (response?.error) {
    //     return response.error;
    //   } else {
    //     return true;
    //   }
    // });
  }
  async deleteRow(
    key: string,
    mode: DeleteRowMode = "hard",
  ): Promise<true | string> {
    const rpcHost = this.#sessionDataSource ?? this;
    const response = await rpcHost.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "deleteRow",
      params: { key, mode },
    });
    if (isRpcSuccess(response)) {
      return true;
    }
    return response?.errorMessage ?? "deleteRow failed";
  }

  async deleteSelectedRows(
    mode: DeleteRowMode = "soft",
  ): Promise<RpcResultSuccess | RpcResultError> {
    const rpcHost = this.#sessionDataSource ?? this;
    const response = await rpcHost.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "deleteSelectedRows",
      params: { mode },
    });
    return (
      response ?? {
        type: "ERROR_RESULT",
        errorMessage: "deleteSelectedRows failed",
      }
    );
  }

  async addRow(
    rowData: Record<string, VuuRowDataItemType> = {},
  ): Promise<true | string> {
    const response = await this.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "addRow",
      params: { data: rowData },
    });
    if (isRpcSuccess(response)) {
      return true;
    }
    return response?.errorMessage ?? "addRow failed";
  }

  async undoRowChange(key: string): Promise<RpcResultSuccess | RpcResultError> {
    const rpcHost = this.#sessionDataSource ?? this;
    const response = await rpcHost.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "undoRowChange",
      params: { key },
    });
    return (
      response ?? { type: "ERROR_RESULT", errorMessage: "undoRowChange failed" }
    );
  }
}
