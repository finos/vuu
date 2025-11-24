import type {
  DataSource,
  DataSourceCallbackMessage,
  DataSourceConstructorProps,
  DataSourceStatus,
  DataSourceVisualLinkCreatedMessage,
  OptimizeStrategy,
  ServerAPI,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
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
  VuuRpcEditError,
  VuuRpcEditRequest,
  VuuRpcEditResponse,
  VuuRpcMenuRequest,
  VuuRpcResponse,
  VuuRpcServiceRequest,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";

import {
  BaseDataSource,
  combineFilters,
  debounce,
  isSelectSuccessWithRowCount,
  isViewportMenusAction,
  isVisualLinksAction,
  itemsOrOrderChanged,
  logger,
  Range,
  throttle,
  uuid,
  vuuEditCellRequest,
} from "@vuu-ui/vuu-utils";
import ConnectionManager from "./ConnectionManager";
import { isDataSourceConfigMessage } from "./data-source";

import { MenuRpcResponse } from "@vuu-ui/vuu-data-types";

type RangeRequest = (range: VuuRange) => void;

const { info, infoEnabled } = logger("VuuDataSource");

/**
 * Autosubscribe columns ar always included in a subscription.
 * The same columns may or may not be included in subscription
 * requested by client and client may change column list over
 * lifetime of dataSource. Always make sure we include the
 * autosubscription columns, but never repeat them
 */
const ensureAutosubscribeColumnsIncluded = (
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
export class VuuDataSource extends BaseDataSource implements DataSource {
  private bufferSize: number;
  private server: ServerAPI | null = null;
  rangeRequest: RangeRequest;

  #autosubscribeColumns: string[] = [];
  #pendingVisualLink?: LinkDescriptorWithLabel;
  #links: LinkDescriptorWithLabel[] | undefined;
  #menu: VuuMenu | undefined;
  #optimize: OptimizeStrategy = "throttle";
  #selectedRowsCount = 0;
  #status: DataSourceStatus = "initialising";
  #tableSchema: TableSchema | undefined;

  public table: VuuTable;

  constructor(props: DataSourceConstructorProps) {
    super(props);

    const { bufferSize = 100, table, visualLink } = props;

    if (!table)
      throw Error("RemoteDataSource constructor called without table");

    this.bufferSize = bufferSize;
    this.table = table;

    this.#pendingVisualLink = visualLink;

    // this.rangeRequest = this.throttleRangeRequest;
    this.rangeRequest = this.rawRangeRequest;

    if (props.autosubscribeColumns) {
      this.#autosubscribeColumns = props.autosubscribeColumns;
    }
  }

  async subscribe(
    subscribeProps: DataSourceSubscribeProps,
    callback: DataSourceSubscribeCallback,
  ) {
    super.subscribe(subscribeProps, callback);
    const { viewport = this.viewport || (this.viewport = uuid()) } =
      subscribeProps;

    if (this.#status === "disabled" || this.#status === "disabling") {
      this.enable(callback);
      return;
    }

    if (
      this.#status !== "initialising" &&
      this.#status !== "unsubscribed"
      // We can subscribe to a disabled dataSource. No request will be
      // sent to server to create a new VP, just to enable the existing one.
      // The current subscribing client becomes the subscription owner
    ) {
      return;
    }

    this.#status = "subscribing";
    // this.#selectedRowsCount = selectionCount(selectedIndexValues);

    this.server = await ConnectionManager.serverAPI;

    const { bufferSize } = this;

    const { columns, ...dataSourceConfig } = combineFilters(this.config);

    // TODO and await response here
    this.server?.subscribe(
      {
        ...dataSourceConfig,
        bufferSize,
        columns: ensureAutosubscribeColumnsIncluded(
          columns,
          this.#autosubscribeColumns,
        ),
        range: this._range,
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
      this.#status = "enabled";
    } else if (isDataSourceConfigMessage(message)) {
      // This is an ACK for a CHANGE_VP message. Nothing to do here. We need
      // to wait for data to be returned before we can consider the change
      // to be in effect.
      return;
    } else if (message.type === "debounce-begin") {
      this.optimize = "debounce";
    } else {
      if (
        message.type === "viewport-update" &&
        message.size !== undefined &&
        message.size !== this.size
      ) {
        this.size = message.size;
        this.emit("resize", message.size);
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
        this.server?.send({
          type: "resume",
          viewport: this.viewport,
        });
        this.#status = "subscribed";
        this.emit("resumed", this.viewport);
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
    if (config !== this.config) {
      super.config = config;

      const { columns, ...dataSourceConfig } = combineFilters(this.config);
      const serverConfig: WithFullConfig = {
        ...dataSourceConfig,
        columns: ensureAutosubscribeColumnsIncluded(
          columns,
          this.#autosubscribeColumns,
        ),
      };

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

  async editRpcCall(rpcRequest: Omit<VuuRpcEditRequest, "vpId">) {
    if (this.viewport && this.server) {
      return this.server.rpcCall<VuuRpcEditResponse>({
        ...rpcRequest,
        vpId: this.viewport,
      });
    } else {
      return {
        error: "Either viewport or server is undefined",
        type: "VP_EDIT_RPC_REJECT",
      } as VuuRpcEditError;
    }
  }

  applyEdit(rowKey: string, columnName: string, value: VuuRowDataItemType) {
    return this.editRpcCall(vuuEditCellRequest(rowKey, columnName, value)).then(
      (response) => {
        if (response.type === "VP_EDIT_RPC_REJECT") {
          return response.error;
        } else {
          return true;
        }
      },
    );
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
  deleteRow() {
    return Promise.resolve("not supported");
    // return this.menuRpcCall(vuuDeleteRowRequest(rowKey)).then((response) => {
    //   if (response?.error) {
    //     return response.error;
    //   } else {
    //     return true;
    //   }
    // });
  }
}
