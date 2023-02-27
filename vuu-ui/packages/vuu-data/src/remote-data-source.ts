import { Selection } from "@finos/vuu-datagrid-types";
import {
  LinkDescriptorWithLabel,
  VuuGroupBy,
  VuuAggregation,
  VuuRange,
  VuuTable,
  VuuSort,
  ClientToServerMenuRPC,
} from "@finos/vuu-protocol-types";
import { DataSourceFilter } from "@finos/vuu-data-types";

import { EventEmitter, uuid } from "@finos/vuu-utils";
import {
  DataSource,
  DataSourceCallbackMessage,
  DataSourceConstructorProps,
  SubscribeCallback,
  SubscribeProps,
  DataSourceConfig,
  DataSourceEvents,
  isDataSourceConfigMessage,
  toDataSourceConfig,
} from "./data-source";
import { getServerAPI, ServerAPI } from "./connection-manager";
import { MenuRpcResponse } from "./vuuUIMessageTypes";

/*-----------------------------------------------------------------
 A RemoteDataSource manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
export class RemoteDataSource
  extends EventEmitter<DataSourceEvents>
  implements DataSource
{
  private bufferSize: number;
  private server: ServerAPI | null = null;
  private status = "initialising";
  private disabled = false;
  private suspended = false;
  private clientCallback: SubscribeCallback | undefined;

  #aggregations: VuuAggregation[] = [];
  #columns: string[] = [];
  #config: DataSourceConfig | undefined;
  #filter: DataSourceFilter = { filter: "" };
  #groupBy: VuuGroupBy = [];
  #range: VuuRange = { from: 0, to: 0 };
  #selectedRowsCount = 0;
  #size = 0;
  #sort: VuuSort = { sortDefs: [] };
  #title: string | undefined;
  #visualLink: LinkDescriptorWithLabel | undefined;

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

    if (aggregations) {
      this.#aggregations = aggregations;
    }
    if (columns) {
      this.#columns = columns;
    }
    if (filter) {
      this.#filter = filter;
    }
    if (groupBy) {
      this.#groupBy = groupBy;
    }
    if (sort) {
      this.#sort = sort;
    }
    this.#title = title;
    this.#visualLink = visualLink;

    this.refreshConfig();
  }

  async subscribe(
    {
      viewport = this.viewport ?? uuid(),
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

    // store the range before we await the server. It's is possible the
    // range will be updated from the client before we have been able to
    // subscribe. This ensures we will subscribe with latest value.
    if (aggregations) {
      this.#aggregations = aggregations;
    }
    if (columns) {
      this.#columns = columns;
    }
    if (filter) {
      this.#filter = filter;
    }
    if (groupBy) {
      this.#groupBy = groupBy;
    }
    if (range) {
      this.#range = range;
    }
    if (sort) {
      this.#sort = sort;
    }

    if (this.status !== "initialising") {
      //TODO check if subscription details are still the same
      return;
    }

    this.status = "subscribing";
    this.viewport = viewport;

    this.server = await getServerAPI();

    const { bufferSize } = this;

    this.server?.subscribe(
      {
        aggregations: this.#aggregations,
        bufferSize,
        columns: this.#columns,
        filter: this.#filter,
        groupBy: this.#groupBy,
        viewport,
        table: this.table,
        range: this.#range,
        sort: this.#sort,
        title: this.#title,
        visualLink: this.visualLink,
      },
      this.handleMessageFromServer
    );
  }

  handleMessageFromServer = (message: DataSourceCallbackMessage) => {
    if (message.type === "subscribed") {
      this.status = "subscribed";
      this.clientCallback?.(message);
    } else if (message.type === "disabled") {
      this.status = "disabled";
    } else if (message.type === "enabled") {
      this.status = "enabled";
    } else if (isDataSourceConfigMessage(message)) {
      this.emit("config", toDataSourceConfig(message), true);
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
      this.clientCallback?.(message);
    }
  };

  unsubscribe() {
    if (this.viewport) {
      this.server?.unsubscribe(this.viewport);
    }
    this.server?.destroy(this.viewport);
    this.removeAllListeners();
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
      // should we await this ?
      this.server?.send({
        viewport: this.viewport,
        type: "enable",
      });
      this.disabled = false;
    }
    return this;
  }

  select(selected: Selection) {
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

  // Build the config structure in advance of any get requests and on every change.
  // We do not build config on the fly in the getter as we want to avoid creating a
  // new strucutre on each request - the object is 'stable' in React terminology.
  private refreshConfig(): DataSourceConfig | undefined {
    const { aggregations, columns, filter, groupBy, sort, visualLink } = this;
    const hasAggregations = aggregations.length > 0;
    const hasColumns = columns.length > 0;
    const hasFilter = filter.filter !== "";
    const hasGroupBy = groupBy.length > 0;
    const hasSort = sort.sortDefs.length > 0;
    const hasVisualLink = visualLink !== undefined;

    if (hasAggregations || hasColumns || hasFilter || hasGroupBy || hasSort) {
      const result: DataSourceConfig = {};
      hasAggregations && (result.aggregations = aggregations);
      hasColumns && (result.columns = columns);
      hasFilter && (result.filter = filter);
      hasGroupBy && (result.groupBy = groupBy);
      hasSort && (result.sort = sort);
      hasVisualLink && (result.visualLink = visualLink);
      return (this.#config = result);
    } else {
      return (this.#config = undefined);
    }
  }

  get config() {
    return this.#config;
  }

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
    this.#range = range;
    if (this.viewport) {
      if (this.server) {
        this.server.send({
          viewport: this.viewport,
          type: "setViewRange",
          range,
        });
      }
    }
  }

  get columns() {
    return this.#columns;
  }

  set columns(columns: string[]) {
    console.log(`RemoteDataSOurce ${columns.join(",")}`);
    this.#columns = columns;
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
    const newConfig = this.refreshConfig();
    this.emit("config", newConfig, false);
  }

  get aggregations() {
    return this.#aggregations;
  }

  set aggregations(aggregations: VuuAggregation[]) {
    this.#aggregations = aggregations;
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "aggregate",
        aggregations,
      });
    }

    this.refreshConfig();
    this.emit("config", { aggregations }, false);
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
      }
    }
    this.refreshConfig();
    this.emit("config", { sort }, false);
  }

  get filter() {
    return this.#filter;
  }

  set filter(filter: DataSourceFilter) {
    // TODO should we wait until server ACK before we assign #sort ?
    this.#filter = filter;
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
    this.refreshConfig();
    this.emit("config", { filter }, false);
  }

  get groupBy() {
    return this.#groupBy;
  }

  set groupBy(groupBy: VuuGroupBy) {
    this.#groupBy = groupBy ?? [];
    if (this.viewport) {
      const message = {
        viewport: this.viewport,
        type: "groupBy",
        groupBy: this.#groupBy,
      } as const;

      if (this.server) {
        this.server.send(message);
      }
    }
    this.refreshConfig();
    this.emit("config", { groupBy }, false);
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
    return this.#visualLink;
  }

  set visualLink(visualLink: LinkDescriptorWithLabel | undefined) {
    this.#visualLink = visualLink;

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
    this.refreshConfig();
    this.emit("config", { visualLink }, false);
  }

  async menuRpcCall(rpcRequest: Omit<ClientToServerMenuRPC, "vpId">) {
    if (this.viewport) {
      return this.server?.rpcCall<MenuRpcResponse>({
        vpId: this.viewport,
        ...rpcRequest,
      } as ClientToServerMenuRPC);
    }
  }
}
