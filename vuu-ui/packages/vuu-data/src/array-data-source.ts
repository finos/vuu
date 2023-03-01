import { ColumnDescriptor, Selection } from "@finos/vuu-datagrid-types";
import {
  LinkDescriptorWithLabel,
  VuuGroupBy,
  VuuAggregation,
  VuuRange,
  VuuSort,
  VuuTableMeta,
  VuuRowDataItemType,
  ClientToServerMenuRPC,
} from "@finos/vuu-protocol-types";
import { DataSourceFilter } from "@finos/vuu-data-types";
import {
  EventEmitter,
  isSelected,
  KeySet,
  metadataKeys,
  uuid,
} from "@finos/vuu-utils";
import {
  DataSource,
  DataSourceConstructorProps,
  SubscribeCallback,
  SubscribeProps,
  DataSourceRow,
} from "./data-source";

export interface ArrayDataSourceConstructorProps
  extends Omit<DataSourceConstructorProps, "bufferSize" | "table"> {
  columnDescriptors: ColumnDescriptor[];
  data: VuuRowDataItemType[][];
}

const { IDX, SELECTED } = metadataKeys;

const toDataSourceRow = (
  data: VuuRowDataItemType[],
  index: number
): DataSourceRow => [
  index,
  index,
  true,
  false,
  1,
  0,
  data[0] as string,
  0,
  ...data,
];

const buildTableMeta = (columns: ColumnDescriptor[]): VuuTableMeta => {
  const meta = {
    columns: [],
    dataTypes: [],
  } as VuuTableMeta;

  columns.forEach((column) => {
    meta.columns.push(column.name);
    meta.dataTypes.push(column.serverDataType ?? "string");
  });

  return meta;
};

const toClientRow = (row: DataSourceRow, keys: KeySet) => {
  const [rowIndex] = row;
  const clientRow = row.slice() as DataSourceRow;
  clientRow[1] = keys.keyFor(rowIndex);
  return clientRow;
};

export class ArrayDataSource extends EventEmitter implements DataSource {
  private columnDescriptors: ColumnDescriptor[];
  private status = "initialising";
  private disabled = false;
  private suspended = false;
  private clientCallback: SubscribeCallback | undefined;
  private tableMeta: VuuTableMeta;

  #aggregations: VuuAggregation[] = [];
  #columns: string[] = [];
  #data: DataSourceRow[];
  #filter: DataSourceFilter = { filter: "" };
  #groupBy: VuuGroupBy = [];
  #range: VuuRange = { from: 0, to: 0 };
  #selectedRowsCount = 0;
  #size = 0;
  #sort: VuuSort = { sortDefs: [] };
  #title: string | undefined;

  public viewport: string;

  private keys = new KeySet(this.#range);

  constructor({
    aggregations,
    columnDescriptors,
    columns,
    data,
    filter,
    groupBy,
    sort,
    title,
    viewport,
  }: ArrayDataSourceConstructorProps) {
    super();

    if (!data || !columnDescriptors) {
      throw Error("ArrayDataSource constructor called without data");
    }

    this.columnDescriptors = columnDescriptors;
    this.tableMeta = buildTableMeta(columnDescriptors);

    this.#data = data.map<DataSourceRow>(toDataSourceRow);
    this.viewport = viewport || uuid();
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

    console.log(`subscribe range ${range?.from} ${range?.to}`);

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
      tableMeta: this.tableMeta,
    });

    this.clientCallback({
      clientViewportId: this.viewport,
      type: "viewport-update",
      size: this.#data.length,
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

  select(selected: Selection) {
    const updatedRows: DataSourceRow[] = [];
    for (const row of this.#data) {
      const { [IDX]: rowIndex, [SELECTED]: sel } = row;
      const wasSelected = sel === 1;
      const nowSelected = isSelected(selected, rowIndex);
      if (nowSelected !== wasSelected) {
        const selectedRow = row.slice() as DataSourceRow;
        selectedRow[SELECTED] = nowSelected ? 1 : 0;
        this.#data[rowIndex] = selectedRow;
        updatedRows.push(selectedRow);
      }
    }

    if (updatedRows.length > 0) {
      this.clientCallback?.({
        clientViewportId: this.viewport,
        mode: "update",
        type: "viewport-update",
        rows: updatedRows,
      });
    }
  }

  openTreeNode(key: string) {
    console.log("TODO: open tree node", { key });
  }

  closeTreeNode(key: string) {
    console.log("TODO: close tree node", { key });
  }

  get config() {
    return undefined;
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
    this.keys.reset(range);
    requestAnimationFrame(() => {
      this.clientCallback?.({
        clientViewportId: this.viewport,
        rows: this.#data
          .slice(range.from, range.to)
          .map((row) => toClientRow(row, this.keys)),
        size: this.#data.length,
        type: "viewport-update",
      });
    });
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

  async menuRpcCall(rpcRequest: Omit<ClientToServerMenuRPC, "vpId">) {
    console.log("rmenuRpcCall", {
      rpcRequest,
    });
    return undefined;
  }
}
