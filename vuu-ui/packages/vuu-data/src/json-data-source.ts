import { ColumnDescriptor, Selection } from "@finos/vuu-datagrid-types";
import {
  LinkDescriptorWithLabel,
  VuuGroupBy,
  VuuAggregation,
  VuuRange,
  VuuSort,
  ClientToServerMenuRPC,
} from "@finos/vuu-protocol-types";
import { DataSourceFilter } from "@finos/vuu-data-types";
import {
  EventEmitter,
  isSelected,
  JsonData,
  jsonToDataSourceRows,
  KeySet,
  metadataKeys,
  uuid,
} from "@finos/vuu-utils";
import type {
  DataSource,
  DataSourceConstructorProps,
  DataSourceEvents,
  SubscribeCallback,
  SubscribeProps,
  DataSourceRow,
} from "./data-source";

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
  private status = "initialising";
  public columnDescriptors: ColumnDescriptor[];
  private clientCallback: SubscribeCallback | undefined;
  private expandedRows = new Set<string>();
  private visibleRows: DataSourceRow[] = [];

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

  public rowCount: number | undefined;
  public viewport: string;

  private keys = new KeySet(this.#range);

  constructor({
    aggregations,
    data,
    filter,
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
        ([index, index] as Partial<DataSourceRow>).concat(row.slice(2))
      ) as DataSourceRow[];
    this.viewport = viewport || uuid();
    if (aggregations) {
      this.#aggregations = aggregations;
    }
    if (this.columnDescriptors) {
      this.#columns = this.columnDescriptors.map((c) => c.name);
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
      tableMeta: { columns: [], dataTypes: [] },
    });

    this.clientCallback({
      clientViewportId: this.viewport,
      type: "viewport-update",
      size: this.visibleRows.length,
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
    this.expandedRows.add(key);
    this.visibleRows = getVisibleRows(this.#data, this.expandedRows);
    const { from, to } = this.#range;
    this.clientCallback?.({
      clientViewportId: this.viewport,
      rows: this.visibleRows
        .slice(from, to)
        .map((row) => toClientRow(row, this.keys)),
      size: this.visibleRows.length,
      type: "viewport-update",
    });

    console.log(this.expandedRows);
  }

  closeTreeNode(key: string, cascade = false) {
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
      this.sendRowsToClient();
    });
  }

  private sendRowsToClient() {
    const { from, to } = this.#range;
    this.clientCallback?.({
      clientViewportId: this.viewport,
      rows: this.visibleRows
        .slice(from, to)
        .map((row) => toClientRow(row, this.keys)),
      size: this.visibleRows.length,
      type: "viewport-update",
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
        `JsonDataSource getChildRows row not found for key ${rowKey}`
      );
    }

    const sections = rowKey.split("|").slice(1);
    console.log({ sections, parentRow });

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
  isExpanded: boolean
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
