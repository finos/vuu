import {
  DataSource,
  DataSourceConstructorProps,
  DataSourceEditHandler,
  DataSourceStatus,
  SubscribeCallback,
  SubscribeProps,
  WithBaseFilter,
  WithFullConfig,
} from "@finos/vuu-data-types";
import { VuuTable, VuuGroupBy, VuuRange } from "@finos/vuu-protocol-types";
import {
  BaseDataSource,
  ColumnMap,
  NULL_RANGE,
  buildColumnMap,
  hasFilter,
  hasSort,
} from "@finos/vuu-utils";
import {
  NDJsonReader,
  filterToQueryString,
  jsonToDataSourceRow,
  sortToQueryString,
} from "./rest-utils";
import { MovingWindow } from "./moving-window";

export type RestMetaData = {
  recordCount: number;
};

export class RestDataSource extends BaseDataSource implements DataSource {
  private static _api = "/api";

  #columnMap: ColumnMap = buildColumnMap([
    "bbg",
    "currency",
    "description",
    "exchange",
    "ric",
    "lotSize",
  ]);
  #dataWindow = new MovingWindow(NULL_RANGE);

  groupBy: VuuGroupBy = [];
  selectedRowsCount = 0;
  status: DataSourceStatus = "initialising";
  table: VuuTable;

  constructor(props: DataSourceConstructorProps & { url?: string }) {
    super(props);

    const { table } = props;

    if (!table) throw Error("RestDataSource constructor called without table");
    this.table = table;
  }

  async subscribe(subscribeProps: SubscribeProps, callback: SubscribeCallback) {
    super.subscribe(subscribeProps, callback);

    console.log(`subscribe ${JSON.stringify(subscribeProps, null, 2)}`);

    this.rangeRequest(this._range);
  }

  unsubscribe() {
    console.log("unsubscribe");
  }

  private get pageSize() {
    return this._range.to - this._range.from;
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
    const { from, to } = this._range;
    return `${this.url}?origin=${from}&limit=${to - from}${this.queryStringParameters}`;
  }

  get metaDataUrl() {
    return `${this.url}/summary`;
  }

  private get queryStringParameters() {
    const params: string[] = [];
    if (hasSort(this._config)) {
      params.push(sortToQueryString(this._config.sort));
    }

    if (hasFilter(this._config)) {
      params.push(filterToQueryString(this._config.filterSpec));
    }

    return params.join("");
  }

  get title() {
    return this._title ?? `${this.table.module} ${this.table.table}`;
  }

  set title(title: string) {
    this._title = title;
  }

  rangeRequest(range: VuuRange) {
    console.log(`set range ${JSON.stringify(range)}`);
    this.#dataWindow.setRange(range);
    this.fetchData();
  }

  get config() {
    return super.config;
  }

  set config(config: WithBaseFilter<WithFullConfig>) {
    const previousConfig = this._config;
    super.config = config;

    if (this._config !== previousConfig) {
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
      this._clientCallback?.({
        clientViewportId: this.viewport,
        mode: "update",
        range: this._range,
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
        this._range.from,
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
