import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import type {
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuRange,
  VuuRowDataItemType,
  VuuRpcResponse,
  VuuRpcRequest,
  SelectRequest,
  SelectRowRequest,
} from "@vuu-ui/vuu-protocol-types";
import type {
  DataSourceRow,
  DataSourceConstructorProps,
  DataSourceStatus,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  MenuRpcResponse,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
  DataSourceFilter,
  DataSource,
} from "@vuu-ui/vuu-data-types";
import {
  BaseDataSource,
  getParentRow,
  isSingleValueFilter,
  KeySet,
  lastPathSegment,
  metadataKeys,
  missingAncestor,
  NULL_RANGE,
  TreeSourceNode,
  treeToDataSourceRows,
  uuid,
} from "@vuu-ui/vuu-utils";
import { IconProvider } from "./IconProvider";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";
import { FilterClause } from "@vuu-ui/vuu-filter-types";

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

export class TreeDataSource extends BaseDataSource implements DataSource {
  public columnDescriptors: ColumnDescriptor[];
  private clientCallback: DataSourceSubscribeCallback | undefined;
  private expandedRows = new Set<string>();
  private visibleRows: DataSourceRow[] = [];
  private visibleRowIndex: VisibleRowIndex = {};

  #aggregations: VuuAggregation[] = [];
  #data: DataSourceRow[];
  #iconProvider: IconProvider;
  #selectedRowsCount = 0;
  #size = 0;
  #status: DataSourceStatus = "initialising";
  #filterSet: number[] | undefined;

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
        groupBy: columns.slice(1),
      };
    }
  }

  async subscribe(
    {
      aggregations,
      columns,
      range,
      revealSelected,
      selectedKeyValues,
      viewport = this.viewport ?? uuid(),
    }: DataSourceSubscribeProps,
    callback: DataSourceSubscribeCallback,
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
    this.#selectedRowsCount = selectedKeyValues?.length ?? 0;

    if (selectedKeyValues) {
      this.applySelectedKeyValues(selectedKeyValues, revealSelected);
    }

    [this.visibleRows, this.visibleRowIndex] = getVisibleRows(
      this.#data,
      this.expandedRows,
    );

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

    if (range && !this._range.equals(range)) {
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

    requestAnimationFrame(() => {
      this.sendRowsToClient();
    });
  }

  get filter() {
    return this._config.filterSpec;
  }

  set filter(filter: DataSourceFilter) {
    // Note not using the setter
    this._config = {
      ...this._config,
      filterSpec: filter,
    };

    if (filter.filter) {
      this.applyFilter(filter);
    } else {
      this.#filterSet = undefined;
    }

    [this.visibleRows, this.visibleRowIndex] = getVisibleRows(
      this.#data,
      this.expandedRows,
      this.#filterSet,
    );

    const { from, to } = this.range;
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

  private applyFilter({ filter: filterQuery, filterStruct }: DataSourceFilter) {
    const filter = filterStruct ?? (parseFilter(filterQuery) as FilterClause);
    if (isSingleValueFilter(filter)) {
      const filterSet = [];
      const regex = new RegExp(`${filter.value}`, "i");
      for (const row of this.#data) {
        const { [KEY]: key, [IDX]: idx } = row;
        if (regex.test(lastPathSegment(key, "|"))) {
          filterSet.push(idx);
        }
      }
      this.#filterSet = filterSet;
    }
  }

  /**
   * used to apply an initial selection. These may not necessarily be
   * visible. If revealOnSelect is in force, expand nodes as necessary
   * to ensure selected nodes are visible
   */
  private applySelectedKeyValues(keys: string[], revealSelected = false) {
    keys.forEach((key) => {
      const rowIdx = this.indexOfRowWithKey(key);
      const row = this.#data[rowIdx];
      row[SELECTED] = 1;

      if (revealSelected && row[DEPTH] !== 1) {
        const keys = key.slice(6).split("|").slice(0, -1);

        let path = "$root";
        do {
          path = `${path}|${keys.shift()}`;
          this.expandedRows.add(path);
        } while (keys.length);
      }
    });
  }

  private indexOfRowWithKey = (key: string) =>
    this.#data.findIndex((row) => row[KEY] === key);

  select(selectRequest: Omit<SelectRequest, "vpId">) {
    // todo get a diff
    const updatedRows: DataSourceRow[] = [];

    switch (selectRequest.type) {
      case "SELECT_ROW": {
        const { preserveExistingSelection, rowKey } = selectRequest as Omit<
          SelectRowRequest,
          "vpId"
        >;
        for (const row of this.visibleRows) {
          const { [IDX]: rowIndex, [KEY]: key, [SELECTED]: sel } = row;
          if (
            sel === 1 &&
            preserveExistingSelection === false &&
            key !== rowKey
          ) {
            const deselectedRow = row.slice() as DataSourceRow;
            deselectedRow[SELECTED] = 0;
            this.visibleRows[rowIndex] = deselectedRow;
            updatedRows.push(deselectedRow);
          } else if (key === rowKey) {
            const selectedRow = row.slice() as DataSourceRow;
            selectedRow[SELECTED] = 1;
            this.visibleRows[rowIndex] = selectedRow;
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
  filterset?: number[],
): [visibleRows: DataSourceRow[], index: VisibleRowIndex] {
  const visibleRows: DataSourceRow[] = [];
  const visibleRowIndex: VisibleRowIndex = {};

  const data = filterset ?? rows;

  for (let i = 0, index = 0; i < data.length; i++) {
    const idx = filterset ? filterset[i] : i;
    const row = rows[idx];
    const {
      [COUNT]: count,
      [DEPTH]: depth,
      [KEY]: key,
      [IS_LEAF]: isLeaf,
    } = row;
    if (filterset) {
      // assume expanded for now

      // if we have skipped a higher level group (that didn't directly match
      // our filter criteria, add it.
      const previousRow = visibleRows.at(-1);
      if (missingAncestor(row, previousRow)) {
        let currentRow: DataSourceRow | undefined = row;
        const missingRows = [];
        while (currentRow) {
          currentRow = getParentRow(rows, currentRow);
          if (currentRow) {
            // we will get the missing rows in reverse order
            missingRows.unshift(currentRow);
          }
        }
        missingRows.forEach((row) => {
          visibleRows.push(cloneRow(row, index++, true));
        });
      }

      visibleRows.push(cloneRow(row, index++, true));
      visibleRowIndex[index] = i;
    } else {
      const isExpanded = expandedKeys.has(key);
      visibleRows.push(cloneRow(row, index, isExpanded));
      visibleRowIndex[index++] = i;
      const skipNonVisibleRows = !isLeaf && !isExpanded && count > 0;
      if (skipNonVisibleRows) {
        do {
          i += 1;
        } while (i < rows.length - 1 && rows[i + 1][DEPTH] > depth);
      }
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
