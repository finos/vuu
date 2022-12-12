import {
  ClientToServerRpcCall,
  VuuGroupBy,
  VuuAggregation,
  VuuRange,
  VuuTable,
  VuuSort,
} from "../../vuu-protocol-types";
import { EventEmitter, uuid } from "@vuu-ui/vuu-utils";
import { Filter } from "@vuu-ui/vuu-filters";
import { ConnectionManager, ServerAPI } from "./connection-manager";
import {
  DataSource,
  DataSourceCallbackMessage,
  DataSourceProps,
  SubscribeCallback,
  SubscribeProps,
} from "./data-source";
import { VuuUIMessageOutMenuRPC } from "./vuuUIMessageTypes";

export interface DataSourceColumn {}

// const log = (message: string, ...rest: unknown[]) => {
//   console.log(
//     `%c[RemoteDataSource] ${message}`,
//     "color: brown; font-weight: bold",
//     ...rest
//   );
// };

/*-----------------------------------------------------------------
 A RemoteDataView manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
export class RemoteDataSource extends EventEmitter implements DataSource {
  private bufferSize: number;
  private server: ServerAPI | null = null;
  private url: string;
  private visualLink: string;
  private status: string;
  private disabled: boolean;
  private suspended: boolean;
  private initialGroup: VuuGroupBy | undefined;
  private initialRange: VuuRange = { from: 0, to: 0 };
  private initialSort: any;
  private initialFilter: Filter | undefined;
  private initialFilterQuery: string | undefined;
  private initialAggregations: any;
  private pendingServer: any;
  private clientCallback: any;
  // private serverViewportId?: string;

  public columns: DataSourceColumn[];
  public rowCount: number | undefined;
  public table: VuuTable;
  public viewport: string | undefined;

  constructor({
    bufferSize = 100,
    aggregations,
    columns,
    filter,
    filterQuery,
    group,
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
    this.columns = columns;
    this.viewport = viewport;

    this.url = serverUrl || configUrl;
    this.visualLink = visualLink;

    this.status = "initialising";
    this.disabled = false;
    this.suspended = false;

    this.initialGroup = group;
    this.initialSort = sort;
    this.initialFilter = filter;
    this.initialFilterQuery = filterQuery;
    this.initialAggregations = aggregations;

    if (!serverUrl && !configUrl) {
      throw Error("RemoteDataSource expects serverUrl or configUrl");
    }

    this.pendingServer = ConnectionManager.connect(this.url);
  }

  async subscribe(
    {
      viewport = this.viewport ?? uuid(),
      table = this.table,
      columns = this.columns || [],
      aggregations = this.initialAggregations,
      range = this.initialRange,
      sort = this.initialSort,
      groupBy = this.initialGroup,
      filter = this.initialFilter,
      filterQuery = this.initialFilterQuery,
      title,
    }: SubscribeProps,
    callback: SubscribeCallback
  ) {
    if (!table) throw Error("RemoteDataSource subscribe called without table");

    this.clientCallback = callback;

    // store the range before we await the server. It's is possible the
    // range will be updated from the client before we have been able to
    // subscribe. This ensures we will subscribe with latest value.
    this.initialGroup = groupBy;
    this.initialRange = range;

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
    this.columns = columns;

    this.server = await this.pendingServer;

    const { bufferSize } = this;
    this.server?.subscribe(
      {
        aggregations,
        bufferSize,
        columns,
        filter,
        filterQuery,
        groupBy: this.initialGroup,
        viewport,
        table,
        range: this.initialRange,
        sort,
        title,
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
        message.size !== this.rowCount
      ) {
        this.rowCount = message.size;
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

  setColumns(columns: string[]) {
    this.columns = columns;
    return this;
  }

  setSubscribedColumns(columns: string[]) {
    if (
      columns.length !== this.columns.length ||
      !columns.every((columnName) => this.columns.includes(columnName))
    ) {
      this.columns = columns;
      // ???
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
        this.initialRange = { from, to };
      }
    }
  }

  group(groupBy: VuuGroupBy) {
    if (this.viewport) {
      // log(`groupBy ${JSON.stringify(groupBy)}`);
      const message = {
        viewport: this.viewport,
        type: "groupBy",
        groupBy,
      } as const;

      if (this.server) {
        this.server.send(message);
      } else {
        this.initialGroup = groupBy;
      }
    }
  }

  //TODO I think we should have a clear filter for API clarity
  filter(filter: Filter | undefined, filterQuery: string) {
    if (this.viewport) {
      // log(`filter ${filterQuery}`, {
      //   filter,
      // });
      const message = {
        viewport: this.viewport,
        type: "filterQuery",
        filter,
        filterQuery,
      } as const;

      if (this.server) {
        this.server.send(message);
      } else {
        this.initialFilter = filter;
        this.initialFilterQuery = filterQuery;
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

  // TODO columns cannot simply be strings
  sort(sort: VuuSort) {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "sort",
        sortDefs: sort.sortDefs,
      });
    }
  }

  createLink({ parentVpId, link: { fromColumn, toColumn } }: any) {
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

  async rpcCall(rpcRequest: ClientToServerRpcCall | VuuUIMessageOutMenuRPC) {
    return this.server?.rpcCall({
      viewport: this.viewport,
      ...rpcRequest,
    });
  }
}
