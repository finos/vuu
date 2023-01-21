import {
  VuuGroupBy,
  VuuAggregation,
  VuuRange,
  VuuTable,
  VuuSort,
  VuuMenuRpcRequest,
} from "@finos/vuu-protocol-types";
import { EventEmitter, uuid } from "@finos/vuu-utils";
import { ConnectionManager, ServerAPI } from "./connection-manager";
import {
  DataSource,
  DataSourceCallbackMessage,
  DataSourceFilter,
  DataSourceProps,
  SubscribeCallback,
  SubscribeProps,
} from "./data-source";
import { getServerUrl } from "./hooks/useServerConnection";
import { MenuRpcResponse } from "./vuuUIMessageTypes";
import { LinkWithLabel } from "./server-proxy/server-proxy";

// const log = (message: string, ...rest: unknown[]) => {
//   console.log(
//     `%c[RemoteDataSource] ${message}`,
//     "color: brown; font-weight: bold",
//     ...rest
//   );
// };

/*-----------------------------------------------------------------
 A RemoteDataSource manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
export class RemoteDataSource extends EventEmitter implements DataSource {
  private bufferSize: number;
  private server: ServerAPI | null = null;
  private url: string;
  private visualLink: string;
  private status: string;
  private disabled: boolean;
  private suspended: boolean;
  private initialGroupBy: VuuGroupBy = [];
  private initialRange: VuuRange = { from: 0, to: 0 };
  private initialSort: VuuSort = { sortDefs: [] };
  private initialFilter: DataSourceFilter = { filter: "" };
  private initialAggregations: any;
  private pendingServer: any;
  private clientCallback: any;

  #columns: string[];
  #filter: DataSourceFilter = { filter: "" };
  #groupBy: VuuGroupBy = [];
  #size = 0;
  #sort: VuuSort = { sortDefs: [] };

  public rowCount: number | undefined;
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
    configUrl,
    serverUrl,
    viewport,
    "visual-link": visualLink,
  }: DataSourceProps) {
    super();
    this.bufferSize = bufferSize;
    this.table = table;
    this.#columns = columns;
    this.viewport = viewport;

    this.url = serverUrl ?? configUrl ?? getServerUrl();
    this.visualLink = visualLink;

    this.status = "initialising";
    this.disabled = false;
    this.suspended = false;

    if (aggregations) {
      this.initialAggregations = aggregations;
    }
    if (filter) {
      this.initialFilter = filter;
    }
    if (groupBy) {
      this.initialGroupBy = groupBy;
    }
    if (sort) {
      this.initialSort = sort;
    }

    if (!this.url) {
      throw Error(
        "RemoteDataSource expects serverUrl or configUrl as argument or that serverUrl has already been set"
      );
    }

    this.pendingServer = ConnectionManager.connect(this.url);
  }

  async subscribe(
    {
      viewport = this.viewport ?? uuid(),
      table = this.table,
      columns = this.#columns || [],
      aggregations = this.initialAggregations,
      range = this.initialRange,
      sort = this.initialSort,
      groupBy = this.initialGroupBy,
      filter = this.initialFilter,
    }: SubscribeProps,
    callback: SubscribeCallback
  ) {
    if (!table) throw Error("RemoteDataSource subscribe called without table");

    this.clientCallback = callback;

    // store the range before we await the server. It's is possible the
    // range will be updated from the client before we have been able to
    // subscribe. This ensures we will subscribe with latest value.
    this.initialFilter = filter;
    this.initialGroupBy = groupBy;
    this.initialRange = range;
    this.initialSort = sort;

    if (this.status !== "initialising") {
      //TODO check if subscription details are still the same
      return;
    }

    // console.log(
    //   `%c[remoteDataSource] ${this.viewport} subscribe
    //     RemoteDataSource bufferSize ${this.bufferSize}
    //     range ${JSON.stringify(range)}
    //     status ${this.status}`,
    //   "color:green;font-weight: bold;"
    // );

    this.status = "subscribing";
    this.viewport = viewport;
    this.table = table;
    this.#columns = columns;

    this.server = await this.pendingServer;

    const { bufferSize } = this;
    this.server?.subscribe(
      {
        aggregations,
        bufferSize,
        columns,
        filter: this.initialFilter,
        groupBy: this.initialGroupBy,
        viewport,
        table,
        range: this.initialRange,
        sort: this.initialSort,
        visualLink: this.visualLink,
      },
      this.handleMessageFromServer
    );
  }

  handleMessageFromServer = (message: DataSourceCallbackMessage) => {
    if (message.type === "subscribed") {
      this.status = "subscribed";
      // this.serverViewportId = message.serverViewportId;
      this.emit("subscribed", message);
      const { clientViewportId, ...rest } = message;
      this.clientCallback(rest);
    } else if (message.type === "disabled") {
      this.status = "disabled";
    } else if (message.type === "enabled") {
      this.status = "enabled";
    } else {
      if (
        message.type === "viewport-update" &&
        message.size !== undefined &&
        message.size !== this.#size
      ) {
        // deprecated
        this.rowCount = message.size;
        this.#size = message.size;
      }
      this.clientCallback(message);
    }
  };

  unsubscribe() {
    if (this.viewport) {
      this.server?.unsubscribe(this.viewport);
    }
    this.server?.destroy(this.viewport);
  }

  suspend() {
    if (this.viewport) {
      this.suspended = true;
      this.server?.send({
        type: "suspend",
        viewport: this.viewport,
      });
    }
    return this;
  }

  resume() {
    if (this.viewport && this.suspended) {
      // should we await this ?s
      this.server?.send({
        type: "resume",
        viewport: this.viewport,
      });
      this.suspended = false;
    }
    return this;
  }

  disable() {
    if (this.viewport) {
      this.status = "disabling";
      this.disabled = true;
      this.server?.send({
        viewport: this.viewport,
        type: "disable",
      });
    }
    return this;
  }

  enable() {
    if (this.viewport && this.disabled) {
      this.status = "enabling";
      // should we await this ?s
      this.server?.send({
        viewport: this.viewport,
        type: "enable",
      });
      this.disabled = false;
    }
    return this;
  }

  setSubscribedColumns(columns: string[]) {
    if (this.viewport) {
      this.columns = columns;

      const message = {
        viewport: this.viewport,
        type: "setColumns",
        columns,
      } as const;
      if (this.server) {
        this.server.send(message);
      }
    }
  }

  setRange(from: number, to: number) {
    if (this.viewport) {
      // log(`setRange ${from} - ${to}`);
      const message = {
        viewport: this.viewport,
        type: "setViewRange",
        range: { from, to },
      } as const;

      if (this.server) {
        this.server.send(message);
      } else {
        console.log(`set initial range to ${from} ${to}`);
        this.initialRange = { from, to };
      }
    }
  }

  select(selected: number[]) {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "select",
        selected,
      });
    }
  }

  selectAll() {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "selectAll",
      });
    }
  }

  selectNone() {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "selectNone",
      });
    }
  }

  aggregate(aggregations: VuuAggregation[]) {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "aggregate",
        aggregations,
      });
    }
  }

  openTreeNode(key: string) {
    if (this.viewport) {
      // log(`openTreeNode ${key}`);
      this.server?.send({
        viewport: this.viewport,
        type: "openTreeNode",
        key,
      });
    }
  }

  closeTreeNode(key: string) {
    if (this.viewport) {
      // log(`closeTreeNode ${key}`);
      this.server?.send({
        viewport: this.viewport,
        type: "closeTreeNode",
        key,
      });
    }
  }

  get size() {
    return this.#size;
  }

  get columns() {
    return this.#columns;
  }

  set columns(columns: string[]) {
    console.log(`set columns ${columns.join(",")}`);
  }

  get sort() {
    return this.#sort;
  }

  set sort(sort: VuuSort) {
    // TODO should we wait until server ACK before we assign #sort ?
    this.#sort = sort;
    if (this.viewport) {
      const message = {
        viewport: this.viewport,
        type: "sort",
        sort,
      } as const;
      if (this.server) {
        this.server.send(message);
      } else {
        this.initialSort = sort;
      }
    }
  }

  get filter() {
    return this.#filter;
  }

  set filter(filter: DataSourceFilter) {
    // TODO should we wait until server ACK before we assign #sort ?
    this.#filter = filter;
    console.log(`RemoteDataSource ${JSON.stringify(filter)}`);
    if (this.viewport) {
      const message = {
        viewport: this.viewport,
        type: "filter",
        filter,
      } as const;
      if (this.server) {
        this.server.send(message);
      } else {
        this.initialFilter = filter;
      }
    }
  }

  get groupBy() {
    return this.#groupBy;
  }

  set groupBy(groupBy: VuuGroupBy) {
    this.#groupBy = groupBy;
    if (this.viewport) {
      const message = {
        viewport: this.viewport,
        type: "groupBy",
        groupBy,
      } as const;

      if (this.server) {
        this.server.send(message);
      } else {
        this.initialGroupBy = groupBy;
      }
    }
  }

  createLink({ parentVpId, link: { fromColumn, toColumn } }: LinkWithLabel) {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "createLink",
        parentVpId: parentVpId,
        // childVpId: this.serverViewportId,
        parentColumnName: toColumn,
        childColumnName: fromColumn,
      });
    }
  }

  removeLink() {
    if (this.viewport) {
      this.server?.send({
        type: "removeLink",
        viewport: this.viewport,
      });
    }
  }

  async menuRpcCall(rpcRequest: Omit<VuuMenuRpcRequest, "vpId">) {
    if (this.viewport) {
      return this.server?.rpcCall<MenuRpcResponse>({
        vpId: this.viewport,
        ...rpcRequest,
      } as VuuMenuRpcRequest);
    }
  }

  setTitle(title: string) {
    console.log(`RemoteDataSource setTitle ${title}`);
  }
}
