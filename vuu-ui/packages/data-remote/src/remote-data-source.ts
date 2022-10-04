import {
  ClientToServerRpcCall,
  VuuAggregation,
  VuuSortCol,
  VuuTable,
} from "@vuu-ui/data-types";
import { EventEmitter, Filter, uuid } from "@vuu-ui/utils";
import { ConnectionManager, ServerAPI } from "./connection-manager";
import {
  DataSource,
  DataSourceProps,
  SubscribeCallback,
  SubscribeProps,
} from "./data-source";
import { VuuUIMessageIn } from "./vuuUIMessageTypes";

const defaultRange = { from: 0, to: 0 };

export interface DataSourceColumn {}

/*-----------------------------------------------------------------
 A RemoteDataView manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
export class RemoteDataSource extends EventEmitter implements DataSource {
  private bufferSize: number;
  private viewport: string | undefined;
  private server: ServerAPI | null = null;
  private url: string;
  private visualLink: string;
  private status: string;
  private disabled: boolean;
  private suspended: boolean;
  private initialGroup: any;
  private initialSort: any;
  private initialFilter: any;
  private initialFilterQuery: any;
  private initialAggregations: any;
  private pendingServer: any;
  private clientCallback: any;
  // private serverViewportId?: string;

  public columns: DataSourceColumn[];
  public rowCount: number;
  public table: VuuTable;

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

    this.rowCount = 0;

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
      range = defaultRange,
      sort = this.initialSort,
      groupBy = this.initialGroup,
      filter = this.initialFilter,
      filterQuery = this.initialFilterQuery,
    }: SubscribeProps,
    callback: SubscribeCallback
  ) {
    if (!table) throw Error("RemoteDataSource subscribe called without table");

    this.clientCallback = callback;

    if (this.status !== "initialising") {
      //TODO check if subscription details are still the same
      return;
    }

    // console.log(
    //   `%c[remoteDataSource] ${this.viewport} subscribe status ${this.status}`,
    //   'color:green;font-weight: bold;'
    // );

    this.status = "subscribing";
    this.viewport = viewport;
    this.table = table;
    this.columns = columns;

    this.server = await this.pendingServer;

    const { bufferSize } = this;
    this.server?.subscribe(
      {
        viewport,
        table,
        columns,
        aggregations,
        range,
        sort,
        groupBy,
        filter,
        filterQuery,
        bufferSize,
        visualLink: this.visualLink,
      },
      this.handleMessageFromServer
    );
  }

  handleMessageFromServer = (message: VuuUIMessageIn) => {
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
    if (!this.disabled && !this.suspended) {
      console.log(
        `unsubscribe from ${
          this.table ? JSON.stringify(this.table) : "no table"
        } (viewport ${this?.viewport})`
      );
      if (this.viewport) {
        this.server?.unsubscribe(this.viewport);
      }
      this.server?.destroy();
    }
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
      this.server?.send({
        viewport: this.viewport,
        type: "setViewRange",
        range: { from, to },
      });
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

  group(columns: string[]) {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "groupBy",
        groupBy: columns,
      });
    }
  }

  // TODO columns cannot simply be strings
  sort(columns: VuuSortCol[]) {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "sort",
        sortDefs: columns,
      });
    }
  }

  filter(filter: Filter, filterQuery: string) {
    if (this.viewport) {
      this.server?.send({
        viewport: this.viewport,
        type: "filterQuery",
        filter,
        filterQuery,
      });
    }
  }

  // getFilterData(column: string, searchText: string) {
  //   if (this.viewport) {
  //     this.server?.send({
  //     viewport: this.viewport,
  //     type: 'getFilterData',
  //     column,
  //     searchText
  //   });
  // }
  // }

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

  async rpcCall(rpcRequest: ClientToServerRpcCall) {
    return this.server?.rpcCall({
      viewport: this.viewport,
      ...rpcRequest,
    });
  }
}
