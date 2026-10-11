import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import type {
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuRange,
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
  DataSourceFilter,
  TableSchema,
  DataSourceBase,
} from "@vuu-ui/vuu-data-types";
import {
  BaseDataSource,
  getParentRow,
  isSingleValueFilter,
  KeySet,
  lastPathSegment,
  metadataKeys,
  NULL_RANGE,
  TreeSourceNode,
  treeToDataSourceRows,
  uuid,
} from "@vuu-ui/vuu-utils";
import { IconProvider } from "./IconProvider";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";
import { FilterClause } from "@vuu-ui/vuu-filter-types";

// The number of Level columns depends on the depth of the tree
const treeSchema = (columns: ColumnDescriptor[]): TableSchema => ({
  columns: columns.map(({ name }) => ({ name, serverDataType: "string" })),
  key: "",
  table: { module: "", table: "" },
});

type VisibleRowIndex = Record<number, number>;

export interface TreeNodeFilterProps {
  depth: number;
  key: string;
  label: string;
  nodeData: unknown;
}

/**
 * Tests a single tree node. Nodes that pass are displayed, along with all of
 * their ancestors.
 */
export type TreeNodeFilterPredicate = (node: TreeNodeFilterProps) => boolean;

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

export class TreeDataSource extends BaseDataSource implements DataSourceBase {
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
  /**
   * While filtered, all nodes are expanded unless explicitly collapsed. These
   * are tracked separately from expandedRows, which are restored when the
   * filter is cleared.
   */
  #filterCollapsedRows = new Set<string>();

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

    this.expandedRows = getInitiallyExpandedKeys(data);

    if (this.columnDescriptors) {
      const columns = this.columnDescriptors.map((c) => c.name);
      this._configWithVisualLink = {
        ...this._configWithVisualLink,
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
      this._configWithVisualLink = {
        ...this._configWithVisualLink,
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

    this.computeVisibleRows();

    this.clientCallback?.({
      aggregations: this.#aggregations,
      type: "subscribed",
      clientViewportId: this.viewport,
      columns: this.columns,
      filterSpec: this.filter,
      groupBy: this._configWithVisualLink.groupBy,
      range: this.range,
      sort: this.sort,
      tableSchema: treeSchema(this.columnDescriptors),
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
    return this._configWithVisualLink.filterSpec;
  }

  set filter(filter: DataSourceFilter) {
    // Note not using the setter
    this._configWithVisualLink = {
      ...this._configWithVisualLink,
      filterSpec: filter,
    };

    if (filter.filter) {
      this.applyFilter(filter);
    } else {
      this.#filterSet = undefined;
    }

    this.refreshVisibleRows();
  }

  /**
   * An alternative to a filter expression, filters on any attribute of a
   * tree node, including nodeData. Pass undefined to clear the filter.
   */
  filterNodes(predicate?: TreeNodeFilterPredicate) {
    if (predicate) {
      const filterSet: number[] = [];
      const { count: nodeDataIndex } = metadataKeys;
      for (const row of this.#data) {
        const { [DEPTH]: depth, [KEY]: key, [IDX]: idx } = row;
        const label = row[nodeDataIndex + depth];
        if (
          predicate({
            depth,
            key,
            label: typeof label === "string" ? label : "",
            nodeData: row[nodeDataIndex],
          })
        ) {
          filterSet.push(idx);
        }
      }
      this.#filterSet = filterSet;
    } else {
      this.#filterSet = undefined;
    }
    this.refreshVisibleRows();
  }

  private computeVisibleRows() {
    [this.visibleRows, this.visibleRowIndex] = getVisibleRows(
      this.#data,
      this.expandedRows,
      this.#filterSet,
      this.#filterCollapsedRows,
    );
  }

  private refreshVisibleRows() {
    this.#filterCollapsedRows.clear();
    this.computeVisibleRows();

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
        const { [DEPTH]: depth, [KEY]: key, [IDX]: idx } = row;
        // the label follows nodeData and one column per ancestor level
        const label = row[metadataKeys.count + depth];
        if (
          regex.test(lastPathSegment(key, "|")) ||
          (typeof label === "string" && regex.test(label))
        ) {
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
      if (rowIdx === -1) {
        // e.g a stale or mistyped url, there is nothing to select
        return;
      }
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
    if (this.#filterSet) {
      this.#filterCollapsedRows.delete(key);
    } else {
      this.expandedRows.add(key);
    }
    this.computeVisibleRows();

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
    if (this.#filterSet) {
      this.#filterCollapsedRows.add(key);
    } else {
      this.expandedRows.delete(key);
      if (cascade) {
        for (const rowKey of this.expandedRows.keys()) {
          if (rowKey.startsWith(key)) {
            this.expandedRows.delete(rowKey);
          }
        }
      }
    }
    this.computeVisibleRows();
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
  ): Promise<MenuRpcResponse | undefined> {
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

// keys must match those assigned by treeToDataSourceRows
const getInitiallyExpandedKeys = (
  treeSourceNodes: TreeSourceNode[],
  keyBase = "$root",
  expandedKeys = new Set<string>(),
) => {
  for (const { childNodes, expanded, keySegment, label } of treeSourceNodes) {
    const key = `${keyBase}|${keySegment ?? label}`;
    if (expanded) {
      expandedKeys.add(key);
    }
    if (childNodes) {
      getInitiallyExpandedKeys(childNodes, key, expandedKeys);
    }
  }
  return expandedKeys;
};

function getVisibleRows(
  rows: DataSourceRow[],
  expandedKeys: Set<string>,
  filterset?: number[],
  filterCollapsedKeys?: Set<string>,
): [visibleRows: DataSourceRow[], index: VisibleRowIndex] {
  const visibleRows: DataSourceRow[] = [];
  const visibleRowIndex: VisibleRowIndex = {};

  if (filterset) {
    // matching rows are displayed along with all their ancestors, expanded
    // unless explicitly collapsed
    const included = new Set<number>();
    for (const idx of filterset) {
      let row: DataSourceRow | undefined = rows[idx];
      while (row && !included.has(row[IDX])) {
        included.add(row[IDX]);
        row = getParentRow(rows, row);
      }
    }
    let collapsedKey: string | undefined;
    for (let i = 0, index = 0; i < rows.length; i++) {
      const row = rows[i];
      const { [COUNT]: count, [KEY]: key } = row;
      if (!included.has(row[IDX])) {
        continue;
      } else if (
        collapsedKey !== undefined &&
        key.startsWith(`${collapsedKey}|`)
      ) {
        continue;
      }
      const isCollapsed = filterCollapsedKeys?.has(key) ?? false;
      collapsedKey = isCollapsed ? key : undefined;
      visibleRowIndex[index] = i;
      visibleRows.push(cloneRow(row, index++, count > 0 && !isCollapsed));
    }
  } else {
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
