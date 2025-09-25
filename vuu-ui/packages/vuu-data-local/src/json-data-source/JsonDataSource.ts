import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import type {
  LinkDescriptorWithLabel,
  VuuGroupBy,
  VuuAggregation,
  VuuSort,
  VuuRowDataItemType,
  VuuRpcResponse,
  VuuRpcRequest,
  VuuRpcEditResponse,
  SelectRequest,
  SelectRowRequest,
} from "@vuu-ui/vuu-protocol-types";
import type {
  DataSourceFilter,
  DataSourceRow,
  DataSource,
  DataSourceConstructorProps,
  DataSourceEvents,
  DataSourceStatus,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  WithFullConfig,
  MenuRpcResponse,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
} from "@vuu-ui/vuu-data-types";
import {
  EventEmitter,
  JsonData,
  jsonToDataSourceRows,
  KeySet,
  metadataKeys,
  NO_CONFIG_CHANGES,
  NULL_RANGE,
  Range,
  uuid,
  vanillaConfig,
} from "@vuu-ui/vuu-utils";

const NULL_SCHEMA = { columns: [], key: "", table: { module: "", table: "" } };

export interface JsonDataSourceConstructorProps
  extends Omit<DataSourceConstructorProps, "bufferSize" | "table"> {
  data: JsonData;
}

const { DEPTH, IDX, IS_EXPANDED, IS_LEAF, KEY, SELECTED } = metadataKeys;

const toClientRow = (row: DataSourceRow, keys: KeySet) => {
  const [rowIndex] = row;
  const clientRow = row.slice() as DataSourceRow;
  clientRow[1] = keys.keyFor(rowIndex);
  return clientRow;
};

export class JsonDataSource
  extends EventEmitter<DataSourceEvents>
  implements DataSource
{
  public columnDescriptors: ColumnDescriptor[];
  private clientCallback: DataSourceSubscribeCallback | undefined;
  private expandedRows = new Set<string>();
  private visibleRows: DataSourceRow[] = [];

  #aggregations: VuuAggregation[] = [];
  #config: WithFullConfig = vanillaConfig;
  #data: DataSourceRow[];
  #filter: DataSourceFilter = { filter: "" };
  #groupBy: VuuGroupBy = [];
  #range = Range(0, 0);
  #selectedRowsCount = 0;
  #size = 0;
  #sort: VuuSort = { sortDefs: [] };
  #status: DataSourceStatus = "initialising";
  #title: string | undefined;

  public rowCount: number | undefined;
  public viewport: string;

  private keys = new KeySet(this.#range);

  constructor({
    aggregations,
    data,
    filterSpec,
    groupBy,
    sort,
    title,
    viewport,
  }: JsonDataSourceConstructorProps) {
    super();
    if (!data) {
      throw Error("JsonDataSource constructor called without data");
    }

    [this.columnDescriptors, this.#data] = jsonToDataSourceRows(data);

    this.visibleRows = this.#data
      .filter((row) => row[DEPTH] === 0)
      .map((row, index) =>
        ([index, index] as Partial<DataSourceRow>).concat(row.slice(2)),
      ) as DataSourceRow[];
    this.viewport = viewport || uuid();
    if (aggregations) {
      this.#aggregations = aggregations;
    }
    if (this.columnDescriptors) {
      this.#config = {
        ...this.#config,
        columns: this.columnDescriptors.map((c) => c.name),
      };
    }
    if (filterSpec) {
      this.#filter = filterSpec;
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
      filterSpec,
    }: DataSourceSubscribeProps,
    callback: DataSourceSubscribeCallback,
  ) {
    this.clientCallback = callback;

    if (aggregations) {
      this.#aggregations = aggregations;
    }
    if (columns) {
      this.#config = {
        ...this.#config,
        columns,
      };
    }
    if (filterSpec) {
      this.#filter = filterSpec;
    }
    if (groupBy) {
      this.#groupBy = groupBy;
    }
    if (sort) {
      this.#sort = sort;
    }

    if (this.#status !== "initialising") {
      //TODO check if subscription details are still the same
      return;
    }

    this.viewport = viewport;

    this.#status = "subscribed";

    this.clientCallback?.({
      aggregations: this.#aggregations,
      type: "subscribed",
      clientViewportId: this.viewport,
      columns: this.#config.columns,
      filterSpec: this.#filter,
      groupBy: this.#groupBy,
      range: this.#range,
      sort: this.#sort,
      tableSchema: NULL_SCHEMA,
    });

    this.clientCallback({
      clientViewportId: this.viewport,
      mode: "size-only",
      type: "viewport-update",
      size: this.visibleRows.length,
    });

    if (range && !this.#range.equals(range)) {
      this.range = range;
    } else if (this.#range !== NULL_RANGE) {
      this.sendRowsToClient();
    }
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
  set data(data: JsonData) {
    [this.columnDescriptors, this.#data] = jsonToDataSourceRows(data);
    this.visibleRows = this.#data
      .filter((row) => row[DEPTH] === 0)
      .map((row, index) =>
        ([index, index] as Partial<DataSourceRow>).concat(row.slice(2)),
      ) as DataSourceRow[];

    requestAnimationFrame(() => {
      this.sendRowsToClient();
    });
  }

  // TODO - finish this implementation
  select(selectRequest: Omit<SelectRequest, "vpId">) {
    const updatedRows: DataSourceRow[] = [];
    switch (selectRequest.type) {
      case "SELECT_ROW": {
        const { preserveExistingSelection, rowKey } = selectRequest as Omit<
          SelectRowRequest,
          "vpId"
        >;
        for (const row of this.#data) {
          const { [IDX]: rowIndex, [KEY]: key, [SELECTED]: sel } = row;
          if (
            sel === 1 &&
            preserveExistingSelection === false &&
            key !== rowKey
          ) {
            const deselectedRow = row.slice() as DataSourceRow;
            deselectedRow[SELECTED] = 0;
            this.#data[rowIndex] = deselectedRow;
            updatedRows.push(deselectedRow);
          } else if (key === rowKey) {
            const selectedRow = row.slice() as DataSourceRow;
            selectedRow[SELECTED] = 1;
            this.#data[rowIndex] = selectedRow;
            updatedRows.push(selectedRow);
          }
        }

        break;
      }
      case "DESELECT_ROW": {
        break;
      }

      default:
      // ignore
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

  private getRowKey(keyOrIndex: string | number) {
    if (typeof keyOrIndex === "string") {
      return keyOrIndex;
    }
    const row = this.visibleRows[keyOrIndex];
    if (row === undefined) {
      throw Error(`row not found at index ${keyOrIndex}`);
    }
    return row?.[KEY];
  }

  openTreeNode(keyOrIndex: string | number) {
    const key = this.getRowKey(keyOrIndex);

    this.expandedRows.add(key);
    this.visibleRows = getVisibleRows(this.#data, this.expandedRows);
    const { from, to } = this.#range;
    this.clientCallback?.({
      clientViewportId: this.viewport,

      mode: "batch",
      rows: this.visibleRows
        .slice(from, to)
        .map((row) => toClientRow(row, this.keys)),
      size: this.visibleRows.length,
      type: "viewport-update",
    });
  }

  closeTreeNode(keyOrIndex: string | number, cascade = false) {
    const key = this.getRowKey(keyOrIndex);

    this.expandedRows.delete(key);
    if (cascade) {
      for (const rowKey of this.expandedRows.keys()) {
        if (rowKey.startsWith(key)) {
          this.expandedRows.delete(rowKey);
        }
      }
    }
    this.visibleRows = getVisibleRows(this.#data, this.expandedRows);
    this.sendRowsToClient();
  }

  get status() {
    return this.#status;
  }

  get config() {
    return this.#config;
  }

  applyConfig() {
    return NO_CONFIG_CHANGES;
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

  set range(range: Range) {
    this.#range = range;
    this.keys.reset(range);
    requestAnimationFrame(() => {
      this.sendRowsToClient();
    });
  }

  private sendRowsToClient() {
    const { from, to } = this.#range;
    this.clientCallback?.({
      clientViewportId: this.viewport,
      mode: "batch",
      rows: this.visibleRows
        .slice(from, to)
        .map((row) => toClientRow(row, this.keys)),
      size: this.visibleRows.length,
      type: "viewport-update",
    });
  }

  get columns() {
    return this.#config.columns;
  }

  set columns(columns: string[]) {
    // TODO use setter
    this.#config = {
      ...this.#config,
      columns,
    };
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
  }

  get groupBy() {
    return this.#groupBy;
  }

  set groupBy(groupBy: VuuGroupBy) {
    this.#groupBy = groupBy;
  }

  get title() {
    return this.#title ?? "";
  }

  set title(title: string) {
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

  async remoteProcedureCall<T extends VuuRpcResponse = VuuRpcResponse>() {
    return Promise.reject<T>();
  }

  async menuRpcCall(
    rpcRequest: Omit<VuuRpcRequest, "vpId">,
  ): Promise<
    | MenuRpcResponse
    | VuuUIMessageInRPCEditReject
    | VuuUIMessageInRPCEditResponse
    | undefined
  > {
    console.log("rmenuRpcCall", {
      rpcRequest,
    });
    return undefined;
  }

  async editRpcCall(): Promise<VuuRpcEditResponse> {
    throw Error("JSONDataSource does not implement editRpcCall");
  }

  applyEdit(
    rowKey: string,
    columnName: string,
    value: VuuRowDataItemType,
  ): Promise<true> {
    console.log(`ArrayDataSource applyEdit ${rowKey} ${columnName} ${value}`);
    return Promise.resolve(true);
  }

  getChildRows(rowKey: string) {
    const parentRow = this.#data.find((row) => row[KEY] === rowKey);
    if (parentRow) {
      const { [IDX]: parentIdx, [DEPTH]: parentDepth } = parentRow;
      let rowIdx = parentIdx + 1;
      const childRows = [];
      do {
        const { [DEPTH]: depth } = this.#data[rowIdx];
        if (depth === parentDepth + 1) {
          childRows.push(this.#data[rowIdx]);
        } else if (depth <= parentDepth) {
          break;
        }
        rowIdx += 1;
      } while (rowIdx < this.#data.length);
      return childRows;
    } else {
      console.warn(
        `JsonDataSource getChildRows row not found for key ${rowKey}`,
      );
    }

    return [];
  }

  getRowsAtDepth(depth: number, visibleOnly = true) {
    const rows = visibleOnly ? this.visibleRows : this.#data;
    return rows.filter((row) => row[DEPTH] === depth);
  }
}

type Index = {
  value: number;
};

function getVisibleRows(rows: DataSourceRow[], expandedKeys: Set<string>) {
  const visibleRows: DataSourceRow[] = [];
  const index: Index = { value: 0 };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const { [DEPTH]: depth, [KEY]: key, [IS_LEAF]: isLeaf } = row;
    const isExpanded = expandedKeys.has(key);
    visibleRows.push(cloneRow(row, index, isExpanded));
    if (!isLeaf && !isExpanded) {
      do {
        i += 1;
      } while (i < rows.length - 1 && rows[i + 1][DEPTH] > depth);
    }
  }
  return visibleRows;
}

const cloneRow = (
  row: DataSourceRow,
  index: Index,
  isExpanded: boolean,
): DataSourceRow => {
  const dolly = row.slice() as DataSourceRow;
  dolly[0] = index.value;
  dolly[1] = index.value;
  if (isExpanded) {
    dolly[IS_EXPANDED] = true;
  }
  index.value += 1;
  return dolly;
};
