import {
  DataSource,
  DataSourceConstructorProps,
  DataSourceEditHandler,
  DataSourceEvents,
  DataSourceFilter,
  DataSourceRow,
  DataSourceStatus,
  SubscribeCallback,
  SubscribeProps,
  WithFullConfig,
} from "@finos/vuu-data-types";
import {
  VuuAggregation,
  VuuTable,
  VuuGroupBy,
  VuuRange,
  VuuSort,
} from "@finos/vuu-protocol-types";
import {
  ColumnMap,
  EventEmitter,
  NO_CONFIG_CHANGES,
  NULL_RANGE,
  buildColumnMap,
  uuid,
  vanillaConfig,
} from "@finos/vuu-utils";
import { NDJsonReader, jsonToDataSourceRow } from "./rest-utils";
import { MovingWindow } from "./moving-window";

export type RestMetaData = {
  recordCount: number;
};

export class RestDataSource
  extends EventEmitter<DataSourceEvents>
  implements DataSource
{
  private static _api = "/api";

  private clientCallback: SubscribeCallback | undefined;
  #columnMap: ColumnMap = buildColumnMap([
    "bbg",
    "currency",
    "description",
    "exchange",
    "ric",
    "lotSize",
  ]);
  #config: WithFullConfig = vanillaConfig;
  #data: DataSourceRow[] = [];
  #dataWindow = new MovingWindow(NULL_RANGE);
  #range: VuuRange = NULL_RANGE;
  #title: string | undefined;

  aggregations: VuuAggregation[] = [];
  filter: DataSourceFilter = { filter: "" };
  groupBy: VuuGroupBy = [];
  selectedRowsCount = 0;
  size = 0;
  sort: VuuSort = { sortDefs: [] };
  status: DataSourceStatus = "initialising";
  table: VuuTable;

  viewport: string;

  constructor({
    table,
    title,
    viewport = uuid(),
  }: DataSourceConstructorProps & {
    url?: string;
  }) {
    super();

    if (!table) throw Error("RestDataSource constructor called without table");

    this.table = table;
    this.viewport = viewport;

    this.#config = {
      ...this.#config,
      columns: [
        "bbg",
        "currency",
        "description",
        "exchange",
        "ric",
        "isin",
        "lotSize",
      ],
    };
    this.#title = title;
  }

  private get pageSize() {
    return this.#range.to - this.#range.from;
  }

  static get api() {
    return this._api;
  }

  static set api(url: string) {
    this._api = url;
  }

  get url() {
    return `${RestDataSource.api}/${this.table.table}`;
  }

  get dataUrl() {
    const { from, to } = this.#range;
    return `${this.url}?origin=${from}&limit=${to - from}`;
  }

  get metaDataUrl() {
    return `${this.url}/summary`;
  }

  get title() {
    return this.#title ?? `${this.table.module} ${this.table.table}`;
  }

  set title(title: string) {
    this.#title = title;
  }

  async subscribe(
    { range, ...props }: SubscribeProps,
    callback: SubscribeCallback,
  ) {
    if (range) {
      this.range = range;
    }

    console.log(`subscribe ${JSON.stringify(props, null, 2)}`);
    this.clientCallback = callback;

    this.fetchData();
  }

  unsubscribe() {
    console.log("unsubscribe");
  }

  get columns() {
    return this.#config.columns;
  }

  get config() {
    return this.#config;
  }

  get range() {
    return this.#range;
  }

  set range(range: VuuRange) {
    console.log(`set range ${JSON.stringify(range)}`);
    if (range.from !== this.#range.from || range.to !== this.#range.to) {
      this.#range = range;
      this.#dataWindow.setRange(range);
      this.fetchData();
    }
  }

  private fetchData = async () => {
    const { recordCount } = await this.fetchMetaData();

    const pageCount = Math.ceil(recordCount / this.pageSize);
    this.emit("page-count", pageCount);

    const start = performance.now();
    const allDone = () => {
      const end = performance.now();
      console.log(
        `processing ${this.#dataWindow.data.length} rows took ${end - start}ms`,
      );
      this.clientCallback?.({
        clientViewportId: this.viewport,
        mode: "update",
        range: this.#range,
        rows: this.#dataWindow.data,
        size: recordCount,
        type: "viewport-update",
      });
    };

    console.log(`base ${RestDataSource.api}`);

    fetch(this.dataUrl, {
      mode: "cors",
    }).then(
      NDJsonReader(
        this.#range.from,
        (index, json) =>
          this.#dataWindow.add(
            jsonToDataSourceRow(index, json, this.#columnMap),
          ),
        allDone,
      ),
    );
  };

  private fetchMetaData = async () =>
    new Promise<RestMetaData>((resolve, reject) => {
      fetch(this.metaDataUrl, {
        mode: "cors",
      }).then((response) => {
        if (response.ok) {
          resolve(response.json());
        } else {
          reject(response.status);
        }
      });
    });

  private sendRowsToClient() {
    console.log(`send rows to client`);
  }

  applyEdit: DataSourceEditHandler = async () => {
    return "Method not implemented";
  };

  applyConfig = () => NO_CONFIG_CHANGES;

  openTreeNode = () => {
    throw new Error("openTreeNode, Method not implemented.");
  };
  closeTreeNode = () => {
    throw new Error("closeTreeNode, Method not implemented.");
  };

  remoteProcedureCall = async <T>() => "Method not implemented" as T;
  menuRpcCall = async () => {
    return "Method not supported";
  };
  rpcCall = async <T>() => {
    return "Method not supported" as T;
  };

  select = () => {
    throw new Error("remoteProcedureCall, Method not implemented.");
  };
}
