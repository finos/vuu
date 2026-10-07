import {
  type DataEngine,
  inMemoryDataEngine,
  type LinkFilter,
  type RowHeader,
  type RowPredicate,
  type RowWriter,
  type ViewportBatch,
  type ViewportEngine,
} from "@heswell/vuu-viewport";
import type {
  DataSourceBase,
  DataSourceConfig,
  DataSourceConstructorProps,
  DataSourceEvents,
  DataSourceFilter,
  DataSourceRow,
  DataSourceRowWithBigint,
  DataSourceStatus,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  DataSourceSubscribedMessage,
  TableSchema,
  WithBaseFilter,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import type {
  LinkDescriptorWithLabel,
  SelectRequest,
  SelectRowRangeRequest,
  SelectRowRequest,
  VuuAggregation,
  VuuGroupBy,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
  VuuRpcMenuRequest,
  VuuRpcMenuResponse,
  VuuRpcServiceRequest,
  RpcResultError,
  RpcResultSuccess,
  VuuSort,
} from "@vuu-ui/vuu-protocol-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  type ColumnMap,
  type DataSourceConfigChanges,
  EventEmitter,
  NULL_RANGE,
  Range,
  filterAsQuery,
  isConfigChanged,
  metadataKeys,
  toSchemaColumn,
  uuid,
  vanillaConfig,
  withConfigDefaults,
} from "@vuu-ui/vuu-utils";
import { RowKeys } from "./RowKeys";
import { Table, type TableRow } from "./Table";

const { KEY } = metadataKeys;

// Runtime agnostic: rAF is not available when hosted outside a browser.
const nextFrame = (callback: () => void) => {
  if (typeof globalThis.requestAnimationFrame === "function") {
    globalThis.requestAnimationFrame(callback);
  } else {
    globalThis.setTimeout(callback, 0);
  }
};

const buildTableSchema = (
  columns: readonly ColumnDescriptor[],
  keyColumn?: string,
): TableSchema => ({
  columns: columns.map(toSchemaColumn),
  key: keyColumn ?? columns[0].name,
  table: { module: "", table: "Array" },
});

export interface EngineDataSourceConstructorProps
  extends Omit<DataSourceConstructorProps, "bufferSize" | "table"> {
  /**
   * Columns available to the dataSource, defaults to the columns of the
   * table schema. These are the default columns of the dataSource.
   */
  columnDescriptors?: readonly ColumnDescriptor[];
  /** Raw data, used to create a Table when no table is provided */
  data?: Array<Array<bigint | VuuRowDataItemType>>;
  /** analytics engine, defaults to the in-memory engine */
  dataEngine?: DataEngine;
  keyColumn?: string;
  menu?: VuuMenu;
  /** row level permission, applied before all other filters */
  permissionFilter?: RowPredicate;
  /** number of rows to fetch either side of the visible range */
  renderBufferSize?: number;
  table?: Table;
}

/**
 * A DataSource hosted in the same runtime as the data. All the analytics -
 * sorting, filtering, grouping, aggregation, selection and windowing - are
 * delegated to a viewport engine from `@heswell/vuu-viewport`. The engine
 * computes minimal deltas, which are converted here to the client protocol.
 */
/** client rows: 10 header slots, then column values */
const CLIENT_DATA_OFFSET = 10;

export class EngineDataSource
  extends EventEmitter<DataSourceEvents>
  implements DataSourceBase<DataSourceRowWithBigint>
{
  protected clientCallback: DataSourceSubscribeCallback | undefined;
  protected columnDescriptors: readonly ColumnDescriptor[];
  protected _config: WithBaseFilter<WithFullConfig> & {
    visualLink?: LinkDescriptorWithLabel;
  } = vanillaConfig;
  protected _menu: VuuMenu | undefined;

  public tableSchema: TableSchema;
  public viewport: string;

  #dataEngine: DataEngine;
  #engine: ViewportEngine<DataSourceRowWithBigint> | undefined;
  #freezeTimestamp: number | undefined = undefined;
  #keys = new RowKeys(NULL_RANGE);
  #linkFilter: LinkFilter | undefined;
  #links: LinkDescriptorWithLabel[] | undefined;
  #maxRangeEnd = Number.MAX_SAFE_INTEGER;
  #pendingChanges = false;
  #permissionFilter: RowPredicate | undefined;
  #preserveScrollPositionAcrossConfigChange = false;
  #range = Range(0, 0);
  #renderBufferSize: number;
  /** client rows last sent, by position, within buffered range */
  #rows = new Map<number, DataSourceRowWithBigint>();
  // all keys in #rows lie within [#rowsLo, #rowsHi), allows incremental pruning
  #rowsLo = Number.MAX_SAFE_INTEGER;
  #rowsHi = 0;
  #bufferedRangeCache: VuuRange | undefined = undefined;
  #bufferedRangeSource: Range | undefined = undefined;
  #bufferedRangeMax = -1;
  #size = 0;
  #status: DataSourceStatus = "initialising";
  #table: Table;
  #title: string | undefined;

  constructor({
    aggregations,
    baseFilterSpec,
    columnDescriptors,
    columns,
    data,
    dataEngine = inMemoryDataEngine,
    filterSpec,
    groupBy,
    keyColumn,
    menu,
    permissionFilter,
    renderBufferSize = 0,
    sort,
    table,
    title,
    viewport,
  }: EngineDataSourceConstructorProps) {
    super();
    if (table === undefined && (data === undefined || !columnDescriptors)) {
      throw Error(
        "[EngineDataSource] must be constructed with a table, or with data and columnDescriptors",
      );
    }

    this.#table =
      table ??
      new Table(
        buildTableSchema(columnDescriptors as ColumnDescriptor[], keyColumn),
        data,
      );
    this.tableSchema = this.#table.schema;
    this.columnDescriptors = columnDescriptors ?? this.tableSchema.columns;
    this.#dataEngine = dataEngine;
    this.#permissionFilter = permissionFilter;
    this.#renderBufferSize = renderBufferSize;
    this._menu = menu;
    this.viewport = viewport || uuid();
    this.#title = title;

    this._config = this.#normaliseConfig({
      ...this._config,
      aggregations: aggregations || this._config.aggregations,
      baseFilterSpec,
      columns: columns ?? this.columnDescriptors.map((col) => col.name),
      filterSpec: filterSpec || this._config.filterSpec,
      groupBy: groupBy || this._config.groupBy,
      sort: sort || this._config.sort,
    });

    this.#engine = this.#createEngine();
  }

  #createEngine() {
    const { aggregations, baseFilterSpec, filterSpec, groupBy, sort } =
      this._config;
    const engine = this.#dataEngine.createViewport(this.#table.engineTable, {
      aggregations,
      baseFilterSpec: baseFilterSpec?.filter
        ? { filter: baseFilterSpec.filter }
        : undefined,
      columns: this.#engineColumns,
      filterSpec: { filter: filterSpec.filter },
      groupBy,
      id: this.viewport,
      onPendingChanges: this.#handlePendingChanges,
      rowWriter: this.#rowWriter,
      permissionFilter: this.#permissionFilter,
      range: this.#bufferedRange,
      sort,
    });
    if (this.#linkFilter) {
      engine.setLinkFilter(this.#linkFilter);
    }
    this.#size = engine.size;
    return engine;
  }

  protected get engine(): ViewportEngine<DataSourceRowWithBigint> {
    if (this.#engine === undefined) {
      this.#engine = this.#createEngine();
    }
    return this.#engine;
  }

  get #engineColumns() {
    const { columns } = this._config;
    return columns.length > 0
      ? columns
      : this.columnDescriptors.map((col) => col.name);
  }

  get #isGrouped() {
    return this._config.groupBy.length > 0;
  }

  get #isLive() {
    return this.#status === "subscribed" && this.clientCallback !== undefined;
  }

  get #bufferedRange(): VuuRange {
    if (
      this.#bufferedRangeCache === undefined ||
      this.#bufferedRangeSource !== this.#range ||
      this.#bufferedRangeMax !== this.#maxRangeEnd
    ) {
      const { from, to } = this.#range.withBuffer;
      this.#bufferedRangeCache = { from, to: Math.min(to, this.#maxRangeEnd) };
      this.#bufferedRangeSource = this.#range;
      this.#bufferedRangeMax = this.#maxRangeEnd;
    }
    return this.#bufferedRangeCache;
  }

  #clearRows() {
    this.#rows.clear();
    this.#rowsLo = Number.MAX_SAFE_INTEGER;
    this.#rowsHi = 0;
  }

  #handlePendingChanges = () => {
    if (!this.#pendingChanges) {
      this.#pendingChanges = true;
      queueMicrotask(this.#flushPendingChanges);
    }
  };

  #flushPendingChanges = () => {
    if (this.#pendingChanges && this.#engine) {
      this.#pendingChanges = false;
      if (this.#status !== "suspended") {
        this.#dispatch(this.#engine.flush());
      }
    }
  };

  // ---------------------------------------------------------------------------
  // client protocol
  // ---------------------------------------------------------------------------

  /**
   * The engine builds client rows directly: header fields first, then column
   * values written by the engine from CLIENT_DATA_OFFSET. Values are already
   * in protocol form (bigints converted). _config is updated before the
   * engine is called, so #isGrouped is current here.
   */
  #rowWriter: RowWriter<DataSourceRowWithBigint> = {
    dataOffset: CLIENT_DATA_OFFSET,
    treeColumnsInData: false,
    create: (header: Readonly<RowHeader>, valueCount: number) => {
      const { rowIndex } = header;
      const clientRow = new Array(CLIENT_DATA_OFFSET + valueCount) as unknown[];
      clientRow[0] = rowIndex;
      clientRow[1] = this.#keys.keyFor(rowIndex);
      if (this.#isGrouped) {
        clientRow[2] = header.isLeaf;
        clientRow[3] = header.isExpanded;
        clientRow[4] = header.depth;
        clientRow[5] = header.childCount;
      } else {
        clientRow[2] = true;
        clientRow[3] = false;
        clientRow[4] = 0;
        clientRow[5] = 0;
      }
      clientRow[6] = header.rowKey;
      clientRow[7] = header.sel;
      clientRow[8] = header.ts;
      clientRow[9] = false;
      return clientRow as DataSourceRowWithBigint;
    },
    values: (row) => row as unknown[],
  };

  #cacheRow(clientRow: DataSourceRowWithBigint) {
    const rowIndex = clientRow[0];
    this.#rows.set(rowIndex, clientRow);
    if (rowIndex < this.#rowsLo) this.#rowsLo = rowIndex;
    if (rowIndex >= this.#rowsHi) this.#rowsHi = rowIndex + 1;
  }

  /**
   * Remove cached rows outside the buffered range or beyond size. Cost is
   * proportional to the number of indices leaving the range, not cache size.
   */
  #pruneRows() {
    const lo = this.#rowsLo;
    const hi = this.#rowsHi;
    if (lo >= hi) {
      return;
    }
    const { from, to: bufferedTo } = this.#bufferedRange;
    const to = Math.min(bufferedTo, this.#size);
    if (to <= from || to <= lo || from >= hi) {
      this.#clearRows();
      return;
    }
    const rows = this.#rows;
    for (let i = lo, end = Math.min(hi, from); i < end; i++) {
      rows.delete(i);
    }
    for (let i = Math.max(to, lo); i < hi; i++) {
      rows.delete(i);
    }
    this.#rowsLo = Math.max(lo, from);
    this.#rowsHi = Math.min(hi, to);
  }

  #dispatch(batch: ViewportBatch<DataSourceRowWithBigint>) {
    const sizeChanged = batch.size !== this.#size;
    this.#size = batch.size;
    if (sizeChanged) {
      this.#pruneRows();
    }
    if (!this.#isLive) {
      return;
    }
    if (batch.rows.length > 0) {
      const { rows } = batch;
      for (let i = 0; i < rows.length; i++) {
        this.#cacheRow(rows[i]);
      }
      this.clientCallback?.({
        clientViewportId: this.viewport,
        mode: "batch",
        range: this.#range,
        rows: rows as DataSourceRow[],
        size: batch.size,
        type: "viewport-update",
      });
    } else if (sizeChanged) {
      this.sendSizeUpdateToClient();
    }
    if (sizeChanged) {
      this.emit("resize", batch.size, this.#maxRangeEnd);
    }
  }

  sendSizeUpdateToClient() {
    this.clientCallback?.({
      clientViewportId: this.viewport,
      mode: "size-only",
      type: "viewport-update",
      size: this.size,
    });
  }

  /** Send every row in the current range, irrespective of what was sent before */
  sendRowsToClient() {
    this.#clearRows();
    this.#pendingChanges = false;
    this.#dispatch(this.engine.getCurrentRange());
  }

  // ---------------------------------------------------------------------------
  // subscription lifecycle
  // ---------------------------------------------------------------------------

  async subscribe(
    {
      viewport = this.viewport ?? (this.viewport = uuid()),
      columns,
      aggregations,
      baseFilterSpec,
      range,
      sort,
      groupBy,
      filterSpec,
    }: DataSourceSubscribeProps,
    callback: DataSourceSubscribeCallback,
  ) {
    this.clientCallback = callback;
    this.viewport = viewport;
    this.#status = "subscribed";

    if (this.tableSchema.rangeLimits) {
      this.#maxRangeEnd = this.tableSchema.rangeLimits.maxRangeEnd;
    }

    let config = this._config;
    const hasConfigProps =
      aggregations || columns || filterSpec || groupBy || sort;
    if (hasConfigProps) {
      config = {
        ...config,
        aggregations: aggregations || config.aggregations,
        baseFilterSpec: baseFilterSpec || config.baseFilterSpec,
        columns: columns || config.columns,
        filterSpec: filterSpec || config.filterSpec,
        groupBy: groupBy || config.groupBy,
        sort: sort || config.sort,
      };
    }

    const subscribedMessage: DataSourceSubscribedMessage = {
      ...config,
      type: "subscribed",
      clientViewportId: this.viewport,
      range: this.#range,
      tableSchema: this.tableSchema,
    };
    this.clientCallback?.(subscribedMessage);
    this.emit("subscribed", subscribedMessage);

    if (hasConfigProps) {
      this.config = config;
    }

    this.sendSizeUpdateToClient();
    this.emit("resize", this.size, this.#maxRangeEnd);

    if (
      range &&
      (range.from !== this.#range.from || range.to !== this.#range.to)
    ) {
      this.setRange(range, true);
    } else {
      this.sendRowsToClient();
    }

    if (this.#range.to !== 0) {
      this.emit(
        "page-count",
        Math.ceil(this.size / (this.#range.to - this.#range.from)),
      );
    }
  }

  unsubscribe() {
    this.#status = "unsubscribed";
    this.emit("unsubscribed", this.viewport);
    this.removeAllListeners();
    this.clientCallback = undefined;
    this.#engine?.destroy();
    this.#engine = undefined;
    this.#pendingChanges = false;
    this.#clearRows();
  }

  suspend() {
    if (this.#status !== "unsubscribed") {
      this.#status = "suspended";
      this.emit("suspended", this.viewport);
    }
  }

  resume(callback?: DataSourceSubscribeCallback) {
    if (callback) {
      this.clientCallback = callback;
    }
    if (this.#status === "suspended") {
      this.#status = "subscribed";
    }
    this.emit("resumed", this.viewport);
    const selectedRowCount = this.engine.selectedRowCount;
    if (selectedRowCount > 0) {
      this.emit("row-selection", selectedRowCount);
    }
    this.sendRowsToClient();
  }

  disable() {
    this.emit("disabled", this.viewport);
  }

  enable() {
    this.emit("enabled", this.viewport);
  }

  get status() {
    return this.#status;
  }

  // ---------------------------------------------------------------------------
  // range
  // ---------------------------------------------------------------------------

  get range() {
    return this.#range;
  }

  set range(range: Range) {
    this.setRange(range);
  }

  get maxRangeEnd() {
    return this.#maxRangeEnd;
  }

  get pageSize() {
    return this.#range.to - this.#range.from;
  }

  protected setRange(range: Range, forceFullRefresh = false) {
    this.#constrainRangeToMaxRangeEnd(range);
    if (range.from !== this.#range.from || range.to !== this.#range.to) {
      const currentPageCount = Math.ceil(
        this.size / (this.#range.to - this.#range.from),
      );
      const newPageCount = Math.ceil(this.size / (range.to - range.from));
      this.#range = range;
      const bufferedRange = this.#bufferedRange;
      const keysResequenced = this.#keys.reset(bufferedRange);
      this.#pendingChanges = false;
      const batch = this.engine.setRange(bufferedRange);
      this.#pruneRows();
      if (forceFullRefresh || keysResequenced === true) {
        this.sendRowsToClient();
      } else {
        this.#dispatch(batch);
      }
      nextFrame(() => {
        if (newPageCount !== currentPageCount) {
          this.emit("page-count", newPageCount);
        }
        this.emit("range", range);
      });
    } else if (forceFullRefresh) {
      this.sendRowsToClient();
    }
  }

  #constrainRangeToMaxRangeEnd(range: Range) {
    if (this.#maxRangeEnd === Number.MAX_SAFE_INTEGER) {
      return;
    }
    const pageSize = Math.max(0, range.to - range.from);
    if (range.from >= this.#maxRangeEnd) {
      range.from = Math.max(0, this.#maxRangeEnd - pageSize);
      range.to = this.#maxRangeEnd;
    } else if (range.to > this.#maxRangeEnd) {
      range.to = this.#maxRangeEnd;
    }
  }

  // ---------------------------------------------------------------------------
  // config
  // ---------------------------------------------------------------------------

  #normaliseConfig(
    config: WithBaseFilter<DataSourceConfig>,
  ): WithBaseFilter<WithFullConfig> {
    return withConfigDefaults(
      config?.filterSpec?.filter && config.filterSpec.filterStruct === undefined
        ? {
            ...config,
            filterSpec: {
              filter: config.filterSpec.filter,
              filterStruct: parseFilter(config.filterSpec.filter),
            },
          }
        : config,
    );
  }

  get config() {
    return this._config;
  }

  set config(config: WithBaseFilter<WithFullConfig>) {
    const { noChanges, ...configChanges } = isConfigChanged(
      this._config,
      config,
    );
    if (noChanges === true) {
      return;
    }
    const { visualLink } = this._config;
    this._config = { ...this.#normaliseConfig(config), visualLink };
    this.#applyConfigToEngine(configChanges);

    if (
      configChanges.filterChanged ||
      configChanges.baseFilterChanged ||
      configChanges.groupByChanged
    ) {
      nextFrame(() => {
        this.emit("resize", this.size);
      });
    }

    if (this.#status === "subscribed") {
      nextFrame(() => {
        this.sendSizeUpdateToClient();
        if (this.#preserveScrollPositionAcrossConfigChange) {
          this.#preserveScrollPositionAcrossConfigChange = false;
          this.sendRowsToClient();
        } else {
          this.setRange(this.#range.reset, true);
        }
        this.emit("config", this._config, this.range, undefined, configChanges);
      });
    }
  }

  #applyConfigToEngine(configChanges: DataSourceConfigChanges) {
    const { aggregations, baseFilterSpec, filterSpec, groupBy, sort } =
      this._config;
    const engine = this.engine;
    if (configChanges.baseFilterChanged) {
      engine.setBaseFilter(
        baseFilterSpec?.filter ? { filter: baseFilterSpec.filter } : undefined,
      );
    }
    const batch = engine.setConfig({
      aggregations,
      columns: this.#engineColumns,
      filterSpec: { filter: filterSpec.filter },
      groupBy,
      sort,
    });
    // rows will be resent to client in full on next frame, but the cache is
    // populated now, so rows are immediately available via getRowAtIndex
    this.#clearRows();
    for (const row of batch.rows) {
      this.#cacheRow(row);
    }
    this.#size = batch.size;
    this.#pendingChanges = false;
  }

  get aggregations() {
    return this._config.aggregations;
  }

  set aggregations(aggregations: VuuAggregation[]) {
    this.config = { ...this._config, aggregations };
  }

  get baseFilter() {
    return this._config.baseFilterSpec;
  }

  set baseFilter(baseFilterSpec: DataSourceFilter | undefined) {
    this.config = { ...this._config, baseFilterSpec };
  }

  get columns() {
    return this._config.columns;
  }

  set columns(columns: string[]) {
    this.config = { ...this._config, columns };
  }

  get filter() {
    return this._config.filterSpec;
  }

  set filter(filterSpec: DataSourceFilter) {
    this.config = { ...this._config, filterSpec };
  }

  setFilter(filter: Filter) {
    this.filter = { filter: filterAsQuery(filter), filterStruct: filter };
  }

  clearFilter() {
    this.filter = { filter: "" };
  }

  get groupBy() {
    return this._config.groupBy;
  }

  set groupBy(groupBy: VuuGroupBy) {
    this.config = { ...this._config, groupBy };
  }

  get sort() {
    return this._config.sort;
  }

  set sort(sort: VuuSort) {
    this.config = { ...this._config, sort };
  }

  get visualLink() {
    return this._config.visualLink;
  }

  set visualLink(visualLink: LinkDescriptorWithLabel | undefined) {
    this._config = { ...this._config, visualLink };
  }

  // ---------------------------------------------------------------------------
  // host controls - permission and visual link filtering
  // ---------------------------------------------------------------------------

  setPermissionFilter(permissionFilter: RowPredicate | undefined) {
    this.#permissionFilter = permissionFilter;
    this.#pendingChanges = false;
    this.#dispatch(this.engine.setPermissionFilter(permissionFilter));
  }

  /**
   * Restrict rows to those whose column value is one of values. Used to
   * implement visual linking. Undefined removes the restriction.
   */
  setLinkFilter(linkFilter: LinkFilter | undefined) {
    this.#linkFilter = linkFilter;
    this.#pendingChanges = false;
    this.#dispatch(this.engine.setLinkFilter(linkFilter));
  }

  // ---------------------------------------------------------------------------
  // selection and tree
  // ---------------------------------------------------------------------------

  select(selectRequest: Omit<SelectRequest, "vpId">) {
    const engine = this.engine;
    this.#flushIfPending();
    let batch: ViewportBatch<DataSourceRowWithBigint>;
    switch (selectRequest.type) {
      case "SELECT_ROW": {
        const { preserveExistingSelection, rowKey } = selectRequest as Omit<
          SelectRowRequest,
          "vpId"
        >;
        batch = engine.selectRow(rowKey, preserveExistingSelection);
        break;
      }
      case "DESELECT_ROW": {
        const { preserveExistingSelection, rowKey } = selectRequest as Omit<
          SelectRowRequest,
          "vpId"
        >;
        batch = engine.deselectRow(rowKey, preserveExistingSelection);
        break;
      }
      case "SELECT_ROW_RANGE": {
        const { preserveExistingSelection, fromRowKey, toRowKey } =
          selectRequest as Omit<SelectRowRangeRequest, "vpId">;
        batch = engine.selectRowRange(
          fromRowKey,
          toRowKey,
          preserveExistingSelection,
        );
        break;
      }
      case "SELECT_ALL":
        batch = engine.selectAll();
        break;
      case "DESELECT_ALL":
        batch = engine.deselectAll();
        break;
      default:
        return;
    }
    this.#dispatch(batch);
    this.emit(
      "row-selection",
      selectRequest.type === "SELECT_ALL" ? this.size : this.selectedRowsCount,
    );
  }

  get selectedRowsCount() {
    return this.engine.selectedRowCount;
  }

  /** keys (in the source table) of selected rows */
  getSelectedRowIds(): string[] {
    return this.engine.getSelectedRowKeys();
  }

  /** distinct values of column across selected rows */
  getSelectedValues(column: string) {
    return this.engine.getSelectedValues(column);
  }

  #getRowKey(keyOrIndex: string | number) {
    if (typeof keyOrIndex === "string") {
      return keyOrIndex;
    }
    const row = this.getRowAtIndex(keyOrIndex);
    if (row === undefined) {
      throw Error(`[EngineDataSource] row not found at index ${keyOrIndex}`);
    }
    return row[KEY];
  }

  openTreeNode(keyOrIndex: string | number) {
    const treeKey = this.#getRowKey(keyOrIndex);
    this.#flushIfPending();
    this.#dispatch(this.engine.openTreeNode(treeKey));
  }

  closeTreeNode(keyOrIndex: string | number) {
    const treeKey = this.#getRowKey(keyOrIndex);
    this.#flushIfPending();
    this.#dispatch(this.engine.closeTreeNode(treeKey));
  }

  // ---------------------------------------------------------------------------
  // data access
  // ---------------------------------------------------------------------------

  #flushIfPending() {
    if (this.#pendingChanges) {
      this.#flushPendingChanges();
    }
  }

  get size() {
    this.#flushIfPending();
    return this.#size;
  }

  get table() {
    return this.tableSchema.table;
  }

  /** The table backing this dataSource */
  get dataTable() {
    return this.#table;
  }

  get columnMap(): ColumnMap {
    const map: ColumnMap = {};
    this.#engineColumns.forEach((name, i) => {
      map[name] = i + metadataKeys.count;
    });
    return map;
  }

  #buildLeafRow(position: number): DataSourceRowWithBigint | undefined {
    const rowIdx = this.engine.rowIndexAt(position);
    if (rowIdx === -1) {
      return undefined;
    }
    const engineTable = this.#table.engineTable;
    const tableRow = engineTable.rows[rowIdx] as TableRow;
    const { columnMap } = engineTable;
    const rowKey = String(tableRow[engineTable.indexOfKeyField]);
    const selected = this.engine.selectedKeys.has(rowKey) ? 1 : 0;
    const tsIdx = columnMap.vuuUpdatedTimestamp;
    const ts = tsIdx === undefined ? 0 : Number(tableRow[tsIdx]) || 0;
    const row: DataSourceRowWithBigint = [
      position,
      position,
      true,
      false,
      0,
      0,
      rowKey,
      selected,
      ts,
      false,
    ];
    for (const name of this.#engineColumns) {
      const idx = columnMap[name];
      row.push(idx === undefined ? "" : tableRow[idx]);
    }
    return row;
  }

  /**
   * Flat (ungrouped) rows can be resolved at any index. Grouped rows are
   * only available within the current (buffered) client range, consistent
   * with a remote Vuu dataSource.
   */
  getRowAtIndex(rowIndex: number): DataSourceRowWithBigint | undefined {
    this.#flushIfPending();
    const row = this.#rows.get(rowIndex);
    if (row === undefined && !this.#isGrouped && rowIndex < this.#size) {
      return this.#buildLeafRow(rowIndex);
    }
    return row;
  }

  getRowByKey(key: string): DataSourceRowWithBigint | undefined {
    this.#flushIfPending();
    for (const row of this.#rows.values()) {
      if (row[KEY] === key) {
        return row;
      }
    }
    if (!this.#isGrouped) {
      const engineTable = this.#table.engineTable;
      const keyIdx = engineTable.indexOfKeyField;
      const size = this.#size;
      for (let pos = 0; pos < size; pos++) {
        const rowIdx = this.engine.rowIndexAt(pos);
        if (rowIdx !== -1 && String(engineTable.rows[rowIdx][keyIdx]) === key) {
          return this.#buildLeafRow(pos);
        }
      }
    }
    return undefined;
  }

  getTypeaheadSuggestions(column: string, pattern?: string): Promise<string[]> {
    this.#flushIfPending();
    return Promise.resolve(this.engine.getUniqueValues(column, pattern, 20));
  }

  // ---------------------------------------------------------------------------
  // misc
  // ---------------------------------------------------------------------------

  get links() {
    return this.#links;
  }

  set links(links: LinkDescriptorWithLabel[] | undefined) {
    this.#links = links;
    if (links) {
      this.clientCallback?.({
        clientViewportId: this.viewport,
        type: "vuu-links",
        links,
      });
    }
  }

  get menu() {
    return this._menu;
  }

  get title() {
    return this.#title ?? `${this.table.module} ${this.table.table}`;
  }

  set title(title: string) {
    this.#title = title;
    this.emit("title-changed", this.viewport, title);
  }

  async rpcRequest(
    rpcRequest: Omit<VuuRpcServiceRequest, "context">,
  ): Promise<RpcResultSuccess | RpcResultError> {
    return {
      type: "ERROR_RESULT",
      errorMessage: `[EngineDataSource] no service to handle RPC request ${rpcRequest.rpcName}`,
    };
  }

  async menuRpcCall(
    rpcRequest: Omit<VuuRpcMenuRequest, "vpId">,
  ): Promise<VuuRpcMenuResponse> {
    throw Error(
      `[EngineDataSource] menuRpcCall no service for ${rpcRequest.rpcName}`,
    );
  }

  freeze() {
    if (this.isFrozen) {
      throw Error(
        "[EngineDataSource] cannot freeze, dataSource is already frozen",
      );
    }
    this.#freezeTimestamp = Date.now();
    this.emit("freeze", true, this.#freezeTimestamp);
    this.#preserveScrollPositionAcrossConfigChange = true;
    this.baseFilter = {
      filter: `vuuCreatedTimestamp < ${this.#freezeTimestamp}`,
    };
  }

  unfreeze() {
    if (!this.isFrozen) {
      throw Error(
        "[EngineDataSource] cannot unfreeze, dataSource is not frozen",
      );
    }
    const freezeTimestamp = this.#freezeTimestamp as number;
    this.#freezeTimestamp = undefined;
    this.emit("freeze", false, freezeTimestamp);
    this.#preserveScrollPositionAcrossConfigChange = true;
    this.baseFilter = { filter: "" };
  }

  get freezeTimestamp() {
    return this.#freezeTimestamp;
  }

  get isFrozen() {
    return typeof this.#freezeTimestamp === "number";
  }
}
