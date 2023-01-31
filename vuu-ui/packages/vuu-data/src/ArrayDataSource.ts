import {
  LinkDescriptorWithLabel,
  VuuGroupBy,
  VuuAggregation,
  VuuRange,
  VuuSort,
  VuuMenuRpcRequest,
  VuuTableMeta,
} from "@finos/vuu-protocol-types";
import { EventEmitter, uuid } from "@finos/vuu-utils";
import {
  DataSource,
  DataSourceFilter,
  DataSourceConstructorProps,
  SubscribeCallback,
  SubscribeProps,
  DataSourceRow,
} from "./data-source";

export interface ArrayDataSourceConstructorProps
  extends Omit<DataSourceConstructorProps, "bufferSize" | "table"> {
  data: Array<DataSourceRow>;
  tableMeta: VuuTableMeta;
}

export class ArrayDataSource extends EventEmitter implements DataSource {
  private status = "initialising";
  private disabled = false;
  private suspended = false;
  private clientCallback: SubscribeCallback | undefined;

  #aggregations: VuuAggregation[] = [];
  #columns: string[] = [];
  #data: DataSourceRow[];
  #filter: DataSourceFilter = { filter: "" };
  #groupBy: VuuGroupBy = [];
  #range: VuuRange = { from: 0, to: 0 };
  #size = 0;
  #sort: VuuSort = { sortDefs: [] };
  #tableMeta: VuuTableMeta;
  #title: string | undefined;

  public rowCount: number | undefined;
  public viewport: string | undefined;

  constructor({
    aggregations,
    columns,
    data,
    filter,
    groupBy,
    sort,
    tableMeta,
    title,
    viewport,
    "visual-link": visualLink,
  }: ArrayDataSourceConstructorProps) {
    super();

    if (!data) throw Error("ArrayDataSource constructor called without data");

    this.#data = data;
    this.#tableMeta = tableMeta;
    this.viewport = viewport;
    this.visualLink = visualLink;
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

    this.viewport = viewport;

    this.status = "subscribed";

    this.clientCallback?.({
      aggregations: this.#aggregations,
      type: "subscribed",
      clientViewportId: this.viewport,
      columns: this.#columns,
      filter: this.#filter,
      groupBy: this.#groupBy,
      range: this.#range,
      sort: this.#sort,
      tableMeta: this.#tableMeta,
    });
  }

  unsubscribe() {
    console.log("noop");
  }

  suspend() {
    console.log("noop");
    return this;
  }

  resume() {
    console.log("noop");
    return this;
  }

  disable() {
    console.log("noop");
    return this;
  }

  enable() {
    console.log("noop");
    return this;
  }

  select(selected: number[]) {
    console.log("TODO: select", {
      selected,
    });
  }

  selectAll() {
    console.log("TODO: selectAll");
  }

  selectNone() {
    console.log("TODO: select none");
  }

  openTreeNode(key: string) {
    console.log("TODO: open tree node", { key });
  }

  closeTreeNode(key: string) {
    console.log("TODO: close tree node", { key });
  }

  get size() {
    return this.#size;
  }

  get range() {
    return this.#range;
  }

  set range(range: VuuRange) {
    this.#range = range;
    console.log(`ArrayDataSource setRange ${range.from} - ${range.to}`);
  }

  get columns() {
    return this.#columns;
  }

  set columns(columns: string[]) {
    this.#columns = columns;
    console.log(`ArrayDataSource setColumns ${columns.join(",")}`);
  }

  get aggregations() {
    return this.#aggregations;
  }

  set aggregations(aggregations: VuuAggregation[]) {
    this.#aggregations = aggregations;
  }

  get sort() {
    return this.#sort;
  }

  set sort(sort: VuuSort) {
    // TODO should we wait until server ACK before we assign #sort ?
    this.#sort = sort;
  }

  get filter() {
    return this.#filter;
  }

  set filter(filter: DataSourceFilter) {
    // TODO should we wait until server ACK before we assign #sort ?
    this.#filter = filter;
    console.log(`RemoteDataSource ${JSON.stringify(filter)}`);
  }

  get groupBy() {
    return this.#groupBy;
  }

  set groupBy(groupBy: VuuGroupBy) {
    this.#groupBy = groupBy;
  }

  get title() {
    return this.#title;
  }

  set title(title: string | undefined) {
    this.#title = title;
  }

  createLink({
    parentVpId,
    link: { fromColumn, toColumn },
  }: LinkDescriptorWithLabel) {
    console.log("create link", {
      parentVpId,
      fromColumn,
      toColumn,
    });
  }

  removeLink() {
    console.log("remove link");
  }

  async menuRpcCall(rpcRequest: Omit<VuuMenuRpcRequest, "vpId">) {
    console.log("rmenuRpcCall", {
      rpcRequest,
    });
    return undefined;
  }
}
