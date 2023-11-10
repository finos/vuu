import { DataSourceFilter, DataSourceRow } from "@finos/vuu-data-types";
import { Selection } from "@finos/vuu-datagrid-types";
import {
  ClientToServerEditRpc,
  ClientToServerMenuRPC,
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuGroupBy,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
  VuuSort,
  VuuTable,
} from "@finos/vuu-protocol-types";

import { parseFilter } from "@finos/vuu-filter-parser";
import {
  debounce,
  EventEmitter,
  itemsOrOrderChanged,
  logger,
  metadataKeys,
  throttle,
  uuid,
} from "@finos/vuu-utils";
import { getServerAPI, ServerAPI } from "./connection-manager";
import {
  configChanged,
  DataSource,
  DataSourceCallbackMessage,
  DataSourceConfig,
  DataSourceConstructorProps,
  DataSourceEvents,
  DataSourceStatus,
  isDataSourceConfigMessage,
  OptimizeStrategy,
  SubscribeCallback,
  SubscribeProps,
  vanillaConfig,
  withConfigDefaults,
  WithFullConfig,
} from "./data-source";

import {
  isViewportMenusAction,
  isVisualLinksAction,
  MenuRpcResponse,
} from "./vuuUIMessageTypes";

type RangeRequest = (range: VuuRange) => void;

const { info } = logger("RemoteDataSource");

const { KEY } = metadataKeys;

/*-----------------------------------------------------------------
 A RemoteDataSource manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
export class RemoteDataSource
  extends EventEmitter<DataSourceEvents>
  implements DataSource
{
  private bufferSize: number;
  private server: ServerAPI | null = null;
  private clientCallback: SubscribeCallback | undefined;
  private configChangePending: DataSourceConfig | undefined;
  private rangeRequest: RangeRequest;

  #config: WithFullConfig = vanillaConfig;
  #groupBy: VuuGroupBy = [];
  #links: LinkDescriptorWithLabel[] | undefined;
  #menu: VuuMenu | undefined;
  #optimize: OptimizeStrategy = "throttle";
  #range: VuuRange = { from: 0, to: 0 };
  #selectedRowsCount = 0;
  #size = 0;
  #status: DataSourceStatus = "initialising";

  #title: string | undefined;

  public table: VuuTable;
  public viewport: string | undefined;

  constructor({
    bufferSize = 100,
    aggregations,
    columns,
    filter,
    groupBy,
    sort,
    table,
    title,
    viewport,
    visualLink,
  }: DataSourceConstructorProps) {
    super();

    if (!table)
      throw Error("RemoteDataSource constructor called without table");

    this.bufferSize = bufferSize;
    this.table = table;
    this.viewport = viewport;

    this.#config = {
      ...this.#config,
      aggregations: aggregations || this.#config.aggregations,
      columns: columns || this.#config.columns,
      filter: filter || this.#config.filter,
      groupBy: groupBy || this.#config.groupBy,
      sort: sort || this.#config.sort,
      visualLink: visualLink || this.#config.visualLink,
    };

    this.#title = title;
    this.rangeRequest = this.throttleRangeRequest;
  }

  async subscribe(
    {
      viewport = this.viewport ?? (this.viewport = uuid()),
      columns,
      aggregations,
      range,
      sort,
      groupBy,
      filter,
    }: SubscribeProps,
    callback: SubscribeCallback
  ) {
    this.clientCallback = callback;
    if (aggregations || columns || filter || groupBy || sort) {
      this.#config = {
        ...this.#config,
        aggregations: aggregations || this.#config.aggregations,
        columns: columns || this.#config.columns,
        filter: filter || this.#config.filter,
        groupBy: groupBy || this.#config.groupBy,
        sort: sort || this.#config.sort,
      };
    }

    // store the range before we await the server. It's is possible the
    // range will be updated from the client before we have been able to
    // subscribe. This ensures we will subscribe with latest value.
    if (range) {
      this.#range = range;
    }

    if (
      this.#status !== "initialising" &&
      this.#status !== "unsubscribed" &&
      // We can subscribe to a disabled dataSource. No request will be
      // sent to server to create a new VP, just to enable the existing one.
      // The current subscribing client becomes the subscription owner
      this.#status !== "disabled"
    ) {
      return;
    }

    this.#status = "subscribing";
    this.viewport = viewport;

    this.server = await getServerAPI();

    const { bufferSize } = this;

    this.server?.subscribe(
      {
        ...this.#config,
        bufferSize,
        viewport,
        table: this.table,
        range: this.#range,
        title: this.#title,
      },
      this.handleMessageFromServer
    );
  }

  handleMessageFromServer = (message: DataSourceCallbackMessage) => {
    if (message.type === "subscribed") {
      this.#status = "subscribed";
      this.clientCallback?.(message);
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
        message.size !== this.#size
      ) {
        this.#size = message.size;
        this.emit("resize", message.size);
      }
      // This is used to remove any progress indication from the UI. We wait for actual data rather than
      // just the CHANGE_VP_SUCCESS ack as there is often a delay between receiving the ack and the data.
      // It may be a SIZE only message, eg in the case of removing a groupBy column from a multi-column
      // groupby, where no tree nodes are expanded.
      if (this.configChangePending) {
        this.setConfigPending();
      }

      if (isViewportMenusAction(message)) {
        this.#menu = message.menu;
      } else if (isVisualLinksAction(message)) {
        this.#links = message.links as LinkDescriptorWithLabel[];
      } else {
        this.clientCallback?.(message);
      }

      if (this.optimize === "debounce") {
        this.revertDebounce();
      }
    }
  };

  unsubscribe() {
    info?.(`unsubscribe #${this.viewport}`);
    if (this.viewport) {
      this.server?.unsubscribe(this.viewport);
    }
    this.server?.destroy(this.viewport);
    this.server = null;
    this.removeAllListeners();
    this.#status = "unsubscribed";
    this.viewport = undefined;
    this.range = { from: 0, to: 0 };
  }

  suspend() {
    info?.(`suspend #${this.viewport}, current status ${this.#status}`);
    if (this.viewport) {
      this.#status = "suspended";
      this.server?.send({
        type: "suspend",
        viewport: this.viewport,
      });
    }
    return this;
  }

  resume() {
    info?.(`resume #${this.viewport}, current status ${this.#status}`);
    if (this.viewport) {
      if (this.#status === "disabled" || this.#status === "disabling") {
        this.enable();
      } else if (this.#status === "suspended") {
        this.server?.send({
          type: "resume",
          viewport: this.viewport,
        });
        this.#status = "subscribed";
      }
    }
    return this;
  }

  disable() {
    info?.(`disable #${this.viewport}, current status ${this.#status}`);
    if (this.viewport) {
      this.#status = "disabling";
      this.server?.send({
        viewport: this.viewport,
        type: "disable",
      });
    }
    return this;
  }

  enable(callback?: SubscribeCallback) {
    info?.(`enable #${this.viewport}, current status ${this.#status}`);
    if (
      this.viewport &&
      (this.#status === "disabled" || this.#status === "disabling")
    ) {
      this.#status = "enabling";
      if (callback) {
        this.clientCallback = callback;
      }
      this.server?.send({
        viewport: this.viewport,
        type: "enable",
      });
    }
    return this;
  }

  select(selected: Selection) {
    //TODO this isn't always going to be correct - need to count
    // selection block items
    this.#selectedRowsCount = selected.length;
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "select",
        selected,
      });
    }
  }

  openTreeNode(key: string) {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "openTreeNode",
        key,
      });
    }
  }

  closeTreeNode(key: string) {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "closeTreeNode",
        key,
      });
    }
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

  get size() {
    return this.#size;
  }

  get range() {
    return this.#range;
  }

  set range(range: VuuRange) {
    if (range.from !== this.#range.from || range.to !== this.#range.to) {
      this.#range = range;
      this.rangeRequest(range);
    }
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
    return this.#config;
  }

  set config(config: DataSourceConfig) {
    if (configChanged(this.#config, config)) {
      if (config) {
        const newConfig: DataSourceConfig =
          config?.filter?.filter && config?.filter.filterStruct === undefined
            ? {
                ...config,
                filter: {
                  filter: config.filter.filter,
                  filterStruct: parseFilter(config.filter.filter),
                },
              }
            : config;

        this.#config = withConfigDefaults(newConfig);

        if (this.#config && this.viewport && this.server) {
          if (config) {
            this.server?.send({
              viewport: this.viewport,
              type: "config",
              config: this.#config,
            });
          }
        }
        this.emit("config", this.#config);
      }
    }
  }

  //TODO replace all these individual server calls with calls to setConfig
  get columns() {
    return this.#config.columns;
  }

  set columns(columns: string[]) {
    this.#config = {
      ...this.#config,
      columns,
    };
    if (this.viewport) {
      const message = {
        viewport: this.viewport,
        type: "setColumns",
        columns,
      } as const;
      if (this.server) {
        this.server.send(message);
      }
    }
    this.emit("config", this.#config);
  }

  get aggregations() {
    return this.#config.aggregations;
  }

  set aggregations(aggregations: VuuAggregation[]) {
    this.#config = {
      ...this.#config,
      aggregations,
    };
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "aggregate",
        aggregations,
      });
    }
    this.emit("config", this.#config);
  }

  get sort() {
    return this.#config.sort;
  }

  set sort(sort: VuuSort) {
    // TODO should we wait until server ACK before we assign #sort ?
    this.#config = {
      ...this.#config,
      sort,
    };
    if (this.viewport) {
      const message = {
        viewport: this.viewport,
        type: "sort",
        sort,
      } as const;
      if (this.server) {
        this.server.send(message);
      }
    }
    this.emit("config", this.#config);
  }

  get filter() {
    return this.#config.filter;
  }

  set filter(filter: DataSourceFilter) {
    // TODO should we wait until server ACK before we assign #sort ?
    this.#config = {
      ...this.#config,
      filter,
    };
    if (this.viewport) {
      const message = {
        viewport: this.viewport,
        type: "filter",
        filter,
      } as const;
      if (this.server) {
        this.server.send(message);
      }
    }
    this.emit("config", this.#config);
  }

  get groupBy() {
    return this.#config.groupBy;
  }

  set groupBy(groupBy: VuuGroupBy) {
    if (itemsOrOrderChanged(this.groupBy, groupBy)) {
      const wasGrouped = this.#groupBy.length > 0;
      this.#config = {
        ...this.#config,
        groupBy,
      };
      if (this.viewport) {
        const message = {
          viewport: this.viewport,
          type: "groupBy",
          groupBy: this.#config.groupBy,
        } as const;

        if (this.server) {
          this.server.send(message);
        }
      }
      if (!wasGrouped && groupBy.length > 0 && this.viewport) {
        this.clientCallback?.({
          clientViewportId: this.viewport,
          mode: "batch",
          type: "viewport-update",
          size: 0,
          rows: [],
        });
      }
      this.emit("config", this.#config);
      this.setConfigPending({ groupBy });
    }
  }

  get title() {
    return this.#title;
  }

  set title(title: string | undefined) {
    this.#title = title;
    if (this.viewport && title) {
      this.server?.send({
        type: "setTitle",
        title,
        viewport: this.viewport,
      });
    }
  }

  get visualLink() {
    return this.#config.visualLink;
  }

  set visualLink(visualLink: LinkDescriptorWithLabel | undefined) {
    this.#config = {
      ...this.#config,
      visualLink,
    };

    if (visualLink) {
      const {
        parentClientVpId,
        link: { fromColumn, toColumn },
      } = visualLink;

      if (this.viewport) {
        this.server?.send({
          viewport: this.viewport,
          type: "createLink",
          parentClientVpId,
          parentColumnName: toColumn,
          childColumnName: fromColumn,
        });
      }
    } else {
      if (this.viewport) {
        this.server?.send({
          type: "removeLink",
          viewport: this.viewport,
        });
      }
    }
    this.emit("config", this.#config);
  }

  private setConfigPending(config?: DataSourceConfig) {
    const pendingConfig = this.configChangePending;
    this.configChangePending = config;

    if (config !== undefined) {
      this.emit("config", config, false);
    } else {
      this.emit("config", pendingConfig, true);
    }
  }

  async menuRpcCall(
    rpcRequest: Omit<ClientToServerMenuRPC, "vpId"> | ClientToServerEditRpc
  ) {
    if (this.viewport) {
      return this.server?.rpcCall<MenuRpcResponse>({
        vpId: this.viewport,
        ...rpcRequest,
      } as ClientToServerMenuRPC);
    }
  }

  applyEdit(row: DataSourceRow, columnName: string, value: VuuRowDataItemType) {
    return this.menuRpcCall({
      rowKey: row[KEY],
      field: columnName,
      value: value,
      type: "VP_EDIT_CELL_RPC",
    }).then((response) => {
      if (response?.error) {
        return response.error;
      } else {
        return true;
      }
    });
  }
}
