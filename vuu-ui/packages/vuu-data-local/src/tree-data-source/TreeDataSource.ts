import type { ColumnDescriptor } from "@finos/vuu-table-types";
import type {
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuRange,
  VuuRowDataItemType,
  VuuRpcResponse,
  VuuRpcRequest,
} from "@finos/vuu-protocol-types";
import type {
  DataSourceRow,
  DataSourceConstructorProps,
  DataSourceStatus,
  SubscribeCallback,
  SubscribeProps,
  Selection,
  MenuRpcResponse,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
} from "@finos/vuu-data-types";
import {
  BaseDataSource,
  isSelected,
  KeySet,
  metadataKeys,
  NULL_RANGE,
  rangesAreSame,
  TreeSourceNode,
  treeToDataSourceRows,
  uuid,
} from "@finos/vuu-utils";
import { IconProvider } from "./IconProvider";

const NULL_SCHEMA = { columns: [], key: "", table: { module: "", table: "" } };

type VisibleRowIndex = Record<number, number>;

export interface TreeDataSourceConstructorProps
  extends Omit<DataSourceConstructorProps, "bufferSize" | "table"> {
  data: TreeSourceNode[];
}

const { COUNT, DEPTH, IDX, IS_EXPANDED, IS_LEAF, KEY, SELECTED } = metadataKeys;

const toClientRow = (row: DataSourceRow, keys: KeySet) => {
  const [rowIndex] = row;
  const clientRow = row.slice() as DataSourceRow;
  clientRow[1] = keys.keyFor(rowIndex);
  return clientRow;
};

export class TreeDataSource extends BaseDataSource {
  public columnDescriptors: ColumnDescriptor[];
  private clientCallback: SubscribeCallback | undefined;
  private expandedRows = new Set<string>();
  private visibleRows: DataSourceRow[] = [];
  private visibleRowIndex: VisibleRowIndex = {};
  private selectedRows: Selection = [];

  #aggregations: VuuAggregation[] = [];
  #data: DataSourceRow[];
  #iconProvider: IconProvider;
  #selectedRowsCount = 0;
  #size = 0;
  #status: DataSourceStatus = "initialising";

  public rowCount: number | undefined;

  private keys = new KeySet(this._range);

  constructor({ data, ...props }: TreeDataSourceConstructorProps) {
    super(props);

    if (!data) {
      throw Error("TreeDataSource constructor called without data");
    }
    this.#iconProvider = new IconProvider();

    [this.columnDescriptors, this.#data] = treeToDataSourceRows(
      data,
      this.#iconProvider,
    );

    if (this.columnDescriptors) {
      const columns = this.columnDescriptors.map((c) => c.name);
      this._config = {
        ...this._config,
        columns,
        groupBy: columns,
      };
    }
  }

  async subscribe(
    {
      viewport = this.viewport ?? uuid(),
      columns,
      aggregations,
      range,
    }: SubscribeProps,
    callback: SubscribeCallback,
  ) {
    this.clientCallback = callback;

    if (aggregations) {
      this.#aggregations = aggregations;
    }
    if (columns) {
      this._config = {
        ...this._config,
        columns,
      };
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
      columns: this.columns,
      filterSpec: this.filter,
      groupBy: this._config.groupBy,
      range: this.range,
      sort: this.sort,
      tableSchema: NULL_SCHEMA,
    });

    this.clientCallback({
      clientViewportId: this.viewport,
      mode: "size-only",
      type: "viewport-update",
      size: this.visibleRows.length,
    });

    if (range && !rangesAreSame(this._range, range)) {
      this.range = range;
    } else if (this._range !== NULL_RANGE) {
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
  set data(data: TreeSourceNode[]) {
    [this.columnDescriptors, this.#data] = treeToDataSourceRows(data);
    // console.table(this.#data.slice(0, 20));
    [this.visibleRows, this.visibleRowIndex] = getVisibleRows(
      this.#data,
      this.expandedRows,
    );

    // console.table(this.#data);
    console.table(this.visibleRows);

    console.log({ visibleRows: this.visibleRows });

    requestAnimationFrame(() => {
      this.sendRowsToClient();
    });
  }

  // Incoming Selection references visibleRow indices
  select(selected: Selection) {
    // todo get a diff
    const updatedRows: DataSourceRow[] = [];
    for (const row of this.visibleRows) {
      const { [IDX]: rowIndex, [SELECTED]: sel } = row;
      const wasSelected = sel === 1;
      const nowSelected = isSelected(selected, rowIndex);
      if (nowSelected !== wasSelected) {
        const selectedRow = row.slice() as DataSourceRow;
        const selectedValue = nowSelected ? 1 : 0;
        selectedRow[SELECTED] = selectedValue;
        const dataRowIdx = this.visibleRowIndex[rowIndex];
        this.visibleRows[rowIndex] = selectedRow;
        this.#data[dataRowIdx][SELECTED] = selectedValue;
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

  private getRowKey(keyOrIndex: string | number) {
    if (typeof keyOrIndex === "string") {
      return keyOrIndex;
    }
    const row = this.getRowAtIndex(keyOrIndex);
    if (row === undefined) {
      throw Error(`row not found at index ${keyOrIndex}`);
    }
    return row[KEY];
  }

  openTreeNode(keyOrIndex: string | number) {
    const key = this.getRowKey(keyOrIndex);
    this.expandedRows.add(key);
    [this.visibleRows, this.visibleRowIndex] = getVisibleRows(
      this.#data,
      this.expandedRows,
    );

    const { from, to } = this._range;
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
    [this.visibleRows, this.visibleRowIndex] = getVisibleRows(
      this.#data,
      this.expandedRows,
    );
    this.sendRowsToClient();
  }

  get status() {
    return this.#status;
  }

  get selectedRowsCount() {
    return this.#selectedRowsCount;
  }

  get size() {
    return this.#size;
  }

  rangeRequest(range: VuuRange) {
    this.keys.reset(range);
    requestAnimationFrame(() => {
      this.sendRowsToClient();
    });
  }

  private sendRowsToClient() {
    const { from, to } = this._range;
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

  getRowAtIndex(rowIdx: number) {
    return this.visibleRows[rowIdx];
  }
}

function getVisibleRows(
  rows: DataSourceRow[],
  expandedKeys: Set<string>,
): [visibleRows: DataSourceRow[], index: VisibleRowIndex] {
  const visibleRows: DataSourceRow[] = [];
  const visibleRowIndex: VisibleRowIndex = {};

  for (let i = 0, index = 0; i < rows.length; i++) {
    const row = rows[i];
    const {
      [COUNT]: count,
      [DEPTH]: depth,
      [KEY]: key,
      [IS_LEAF]: isLeaf,
    } = row;
    const isExpanded = expandedKeys.has(key);
    visibleRows.push(cloneRow(row, index, isExpanded));
    visibleRowIndex[index] = i;
    index += 1;
    const skipNonVisibleRows = !isLeaf && !isExpanded && count > 0;
    if (skipNonVisibleRows) {
      do {
        i += 1;
      } while (i < rows.length - 1 && rows[i + 1][DEPTH] > depth);
    }
  }
  return [visibleRows, visibleRowIndex];
}

const cloneRow = (
  row: DataSourceRow,
  index: number,
  isExpanded: boolean,
): DataSourceRow => {
  const dolly = row.slice() as DataSourceRow;
  dolly[0] = index;
  dolly[1] = index;
  if (isExpanded) {
    dolly[IS_EXPANDED] = true;
  }
  return dolly;
};
