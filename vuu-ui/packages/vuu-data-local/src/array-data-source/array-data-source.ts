import {
  DataSource,
  DataSourceConfig,
  DataSourceConstructorProps,
  DataSourceEvents,
  DataSourceFilter,
  DataSourceRow,
  DataSourceStatus,
  DataSourceSubscribedMessage,
  Selection,
  SubscribeCallback,
  SubscribeProps,
  TableSchema,
  WithBaseFilter,
  WithFullConfig,
} from "@finos/vuu-data-types";
import { filterPredicate, parseFilter } from "@finos/vuu-filter-parser";
import type {
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuGroupBy,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
  VuuRpcRequest,
  VuuRpcResponse,
  VuuSort,
} from "@finos/vuu-protocol-types";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  ColumnMap,
  DataSourceConfigChanges,
  EventEmitter,
  KeySet,
  NULL_RANGE,
  buildColumnMap,
  combineFilters,
  getAddedItems,
  getMissingItems,
  hasBaseFilter,
  hasFilter,
  hasGroupBy,
  hasSort,
  isConfigChanged,
  isEditCellRequest,
  isGroupByChanged,
  logger,
  metadataKeys,
  rangeNewItems,
  rangesAreSame,
  resetRange,
  selectionCount,
  uuid,
  vanillaConfig,
  withConfigDefaults,
} from "@finos/vuu-utils";
import { aggregateData } from "./aggregate-utils";
import { buildDataToClientMap, toClientRow } from "./array-data-utils";
import { GroupMap, collapseGroup, expandGroup, groupRows } from "./group-utils";
import { sortRows } from "./sort-utils";

const { debug, info } = logger("ArrayDataSource");

const { KEY } = metadataKeys;

export interface ArrayDataSourceConstructorProps
  extends Omit<DataSourceConstructorProps, "bufferSize" | "table"> {
  columnDescriptors: ColumnDescriptor[];
  data: Array<VuuRowDataItemType[]>;
  dataMap?: ColumnMap;
  keyColumn?: string;
  rangeChangeRowset?: "delta" | "full";
}

const toDataSourceRow =
  (key: number) =>
  (data: VuuRowDataItemType[], index: number): DataSourceRow => {
    return [index, index, true, false, 1, 0, String(data[key]), 0, ...data];
  };

// const isError = (err: unknown): err is { message: string } =>
//   typeof err === "object" && err !== null && err.hasOwnProperty("message");

const buildTableSchema = (
  columns: ColumnDescriptor[],
  keyColumn?: string,
): TableSchema => {
  const schema: TableSchema = {
    columns: columns.map(({ name, serverDataType = "string" }) => ({
      name,
      serverDataType,
    })),
    key: keyColumn ?? columns[0].name,
    table: { module: "", table: "Array" },
  };

  return schema;
};

export class ArrayDataSource
  extends EventEmitter<DataSourceEvents>
  implements DataSource
{
  private clientCallback: SubscribeCallback | undefined;
  private columnDescriptors: ColumnDescriptor[];
  /** sorted offsets of data within raw data, reflecting sort order
   * of columns specified by client.
   */
  private dataIndices: number[] | undefined;
  /** Map reflecting positions of data items in raw data */
  private dataMap: ColumnMap | undefined;
  private groupMap: undefined | GroupMap;
  /** the index of key field within raw data row */
  private key: number;
  private lastRangeServed: VuuRange = { from: 0, to: 0 };
  private rangeChangeRowset: "delta" | "full";
  private openTreeNodes: string[] = [];

  /** Map reflecting positions of columns in client data sent to user */
  #columnMap: ColumnMap;
  protected _config: WithBaseFilter<WithFullConfig> & {
    visualLink?: LinkDescriptorWithLabel;
  } = vanillaConfig;
  #data: DataSourceRow[];
  #keys = new KeySet(NULL_RANGE);
  #links: LinkDescriptorWithLabel[] | undefined;
  #range: VuuRange = NULL_RANGE;
  #selectedRowsCount = 0;
  #status: DataSourceStatus = "initialising";
  #title: string | undefined;

  protected _menu: VuuMenu | undefined;
  protected selectedRows: Selection = [];

  public tableSchema: TableSchema;
  public viewport: string;

  protected processedData: DataSourceRow[] | undefined = undefined;

  constructor({
    aggregations,
    baseFilterSpec,
    // different from RemoteDataSource
    columnDescriptors,
    data,
    dataMap,
    filterSpec,
    groupBy,
    keyColumn,
    rangeChangeRowset = "delta",
    sort,
    title,
    viewport,
  }: ArrayDataSourceConstructorProps) {
    super();
    if (!data || !columnDescriptors) {
      throw Error(
        "ArrayDataSource constructor called without data or without columnDescriptors",
      );
    }

    this.columnDescriptors = columnDescriptors;
    this.dataMap = dataMap;
    this.key = keyColumn
      ? this.columnDescriptors.findIndex((col) => col.name === keyColumn)
      : 0;
    this.rangeChangeRowset = rangeChangeRowset;
    this.tableSchema = buildTableSchema(columnDescriptors, keyColumn);
    this.viewport = viewport || uuid();
    this.#title = title;

    const columns = columnDescriptors.map((col) => col.name);
    this.#columnMap = buildColumnMap(columns);
    this.dataIndices = buildDataToClientMap(this.#columnMap, this.dataMap);
    this.#data = data.map<DataSourceRow>(toDataSourceRow(this.key));

    this.config = {
      ...this._config,
      aggregations: aggregations || this._config.aggregations,
      baseFilterSpec,
      columns,
      filterSpec: filterSpec || this._config.filterSpec,
      groupBy: groupBy || this._config.groupBy,
      sort: sort || this._config.sort,
    };

    debug?.(`columnMap: ${JSON.stringify(this.#columnMap)}`);
  }

  async subscribe(
    {
      viewport = this.viewport ?? (this.viewport = uuid()),
      columns,
      aggregations,
      baseFilterSpec,
      range,
      selectedIndexValues,
      selectedKeyValues,
      sort,
      groupBy,
      filterSpec,
    }: SubscribeProps,
    callback: SubscribeCallback,
  ) {
    this.clientCallback = callback;
    this.viewport = viewport;
    this.#status = "subscribed";
    this.selectedRows =
      selectedIndexValues ??
      this.convertKeysToIndexValues(selectedKeyValues) ??
      [];
    this.#selectedRowsCount = selectionCount(this.selectedRows);
    this.lastRangeServed = { from: 0, to: 0 };

    let config = this._config;

    const hasConfigProps =
      aggregations || columns || filterSpec || groupBy || sort;
    if (hasConfigProps) {
      if (range) {
        this.setRange(range);
      }
      config = {
        ...config,
        aggregations: aggregations || this._config.aggregations,
        baseFilterSpec: baseFilterSpec || this._config.baseFilterSpec,
        columns: columns || this._config.columns,
        filterSpec: filterSpec || this._config.filterSpec,
        groupBy: groupBy || this._config.groupBy,
        sort: sort || this._config.sort,
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
      // invoke setter to action config
      this.config = config;
    } else {
      this.clientCallback({
        clientViewportId: this.viewport,
        mode: "size-only",
        type: "viewport-update",
        size: this.#data.length,
      });
      if (range && !rangesAreSame(this.#range, range)) {
        this.range = range;
      } else if (this.#range !== NULL_RANGE) {
        this.sendRowsToClient();
      }

      if (this.range.to !== 0) {
        const pageCount = Math.ceil(
          this.size / (this.range.to - this.range.from),
        );
        this.emit("page-count", pageCount);
      }
    }
  }

  unsubscribe() {
    this.#status = "unsubscribed";
    this.emit("unsubscribed", this.viewport);
  }

  suspend() {
    if (this.#status !== "unsubscribed") {
      info?.(`suspend #${this.viewport}, current status ${this.#status}`);
      this.#status = "suspended";
      this.emit("suspended", this.viewport);
    }
  }

  resume(callback?: SubscribeCallback) {
    const isSuspended = this.#status === "suspended";
    info?.(`resume #${this.viewport}, current status ${this.#status}`);
    if (callback) {
      this.clientCallback = callback;
    }

    if (isSuspended) {
      this.#status = "subscribed";
    }
    this.emit("resumed", this.viewport);

    this.sendRowsToClient(true);
  }

  disable() {
    this.emit("disabled", this.viewport);
  }

  enable() {
    this.emit("enabled", this.viewport);
  }

  select(selected: Selection) {
    this.#selectedRowsCount = selectionCount(selected);
    debug?.(`select ${JSON.stringify(selected)}`);
    this.selectedRows = selected;
    this.setRange(this.#range, true);
    this.emit("row-selection", selected, this.#selectedRowsCount);
  }

  private getRowKey(keyOrIndex: string | number) {
    if (typeof keyOrIndex === "string") {
      return keyOrIndex;
    }
    const row = this.getRowAtIndex(keyOrIndex);
    if (row === undefined) {
      throw Error(`row not found at index ${keyOrIndex}`);
    }
    return row?.[KEY];
  }

  openTreeNode(keyOrIndex: string | number) {
    const key = this.getRowKey(keyOrIndex);
    this.openTreeNodes.push(key);
    this.processedData = expandGroup(
      this.openTreeNodes,
      this.#data,
      this._config.groupBy,
      this.#columnMap,
      this.groupMap as GroupMap,
      this.processedData as DataSourceRow[],
    );
    this.setRange(resetRange(this.#range), true);
  }

  closeTreeNode(keyOrIndex: string | number) {
    const key = this.getRowKey(keyOrIndex);
    this.openTreeNodes = this.openTreeNodes.filter((value) => value !== key);
    if (this.processedData) {
      this.processedData = collapseGroup(key, this.processedData);
      this.setRange(resetRange(this.#range), true);
    }
  }

  get pageSize() {
    return this.#range.to - this.#range.from;
  }

  get links() {
    return this.#links;
  }

  set links(links: LinkDescriptorWithLabel[] | undefined) {
    this.#links = links;
  }

  get menu() {
    return this._menu;
  }

  get status() {
    return this.#status;
  }

  get data() {
    return this.#data;
  }

  // Only used by the UpdateGenerator
  get currentData() {
    return this.processedData ?? this.#data;
  }

  get table() {
    return this.tableSchema.table;
  }

  get config() {
    return this._config;
  }

  set config(config: WithBaseFilter<WithFullConfig>) {
    const configChanges = this.applyConfig(config);
    if (configChanges) {
      if (config) {
        const originalConfig = this._config;
        const newConfig: DataSourceConfig =
          config?.filterSpec?.filter &&
          config?.filterSpec.filterStruct === undefined
            ? {
                ...config,
                filterSpec: {
                  filter: config.filterSpec.filter,
                  filterStruct: parseFilter(config.filterSpec.filter),
                },
              }
            : config;

        this._config = withConfigDefaults(newConfig);

        let processedData: DataSourceRow[] | undefined;
        if (hasFilter(config) || hasBaseFilter(config)) {
          const {
            filterSpec: { filterStruct },
          } = combineFilters(this._config);
          if (filterStruct) {
            const fn = filterPredicate(this.#columnMap, filterStruct);
            processedData = this.#data.filter(fn);
          } else {
            throw Error("filter must include filterStruct");
          }
        }

        if (hasSort(config)) {
          processedData = sortRows(
            processedData ?? this.#data,
            config.sort,
            this.#columnMap,
          );
        }

        if (
          this.openTreeNodes.length > 0 &&
          isGroupByChanged(originalConfig, config)
        ) {
          if (this._config.groupBy.length === 0) {
            this.openTreeNodes.length = 0;
          } else {
            //TODO purge any openTreeNodes for a no-longer-present groupBy col
          }
        }

        if (hasGroupBy(config)) {
          const [groupedData, groupMap] = groupRows(
            processedData ?? this.#data,
            config.groupBy,
            this.#columnMap,
          );
          this.groupMap = groupMap;
          processedData = groupedData;

          if (this.openTreeNodes.length > 0) {
            processedData = expandGroup(
              this.openTreeNodes,
              this.#data,
              this._config.groupBy,
              this.#columnMap,
              this.groupMap as GroupMap,
              processedData as DataSourceRow[],
            );
          }
        }

        this.processedData = processedData?.map((row, i) => {
          const dolly = row.slice() as DataSourceRow;
          dolly[0] = i;
          dolly[1] = i;
          return dolly;
        });
      }

      if (this.#status === "subscribed") {
        this.setRange(resetRange(this.#range), true);
        this.emit("config", this._config, this.range, undefined, configChanges);
      }
    }
  }

  applyConfig(
    config: WithBaseFilter<DataSourceConfig>,
    preserveExistingConfigAttributes = false,
  ): DataSourceConfigChanges | undefined {
    const { noChanges, ...otherChanges } = isConfigChanged(
      this._config,
      config,
    );

    if (noChanges !== true) {
      if (config) {
        const newConfig: DataSourceConfig =
          config?.filterSpec?.filter &&
          config?.filterSpec.filterStruct === undefined
            ? {
                ...config,
                filterSpec: {
                  filter: config.filterSpec.filter,
                  filterStruct: parseFilter(config.filterSpec.filter),
                },
              }
            : config;
        if (preserveExistingConfigAttributes) {
          this._config = {
            ...this._config,
            ...config,
          };
        } else {
          this._config = withConfigDefaults(newConfig);
        }
        return otherChanges;
      }
    }
  }

  get columnMap() {
    return this.#columnMap;
  }

  get selectedRowsCount() {
    return this.#selectedRowsCount;
  }

  get size() {
    return this.processedData?.length ?? this.#data.length;
  }

  get range() {
    return this.#range;
  }

  set range(range: VuuRange) {
    this.setRange(range);
  }

  getRowAtIndex(rowIndex: number) {
    return this.processedData?.[rowIndex];
  }

  protected delete(row: VuuRowDataItemType[]) {
    console.log(`delete row ${row.join(",")}`);
  }

  protected insert = (row: VuuRowDataItemType[]) => {
    // TODO take sorting, filtering. grouping into account
    const dataSourceRow = toDataSourceRow(this.key)(row, this.size);
    (this.#data as DataSourceRow[]).push(dataSourceRow);
    const { from, to } = this.#range;
    const [rowIdx] = dataSourceRow;
    if (rowIdx >= from && rowIdx < to) {
      this.sendRowsToClient();
    }
  };

  private validateDataValue(columnName: string, value: VuuRowDataItemType) {
    const columnDescriptor = this.columnDescriptors.find(
      (col) => col.name === columnName,
    );
    if (columnDescriptor) {
      switch (columnDescriptor.serverDataType) {
        case "int":
          {
            if (typeof value === "number") {
              if (Math.floor(value) !== value) {
                throw Error(`${columnName} is int but value = ${value}`);
              }
            } else if (typeof value === "string") {
              const numericValue = parseFloat(value);
              if (Math.floor(numericValue) !== numericValue) {
                throw Error(`${columnName} is ${value} is not a valid integer`);
              }
            }
          }
          break;
        default:
      }
    } else {
      throw Error(`Unknown column ${columnName}`);
    }
  }

  protected updateDataItem = (
    keyValue: string,
    columnName: string,
    value: VuuRowDataItemType,
  ) => {
    this.validateDataValue(columnName, value);
    // TODO take sorting, filtering. grouping into account
    const colIndex = this.#columnMap[columnName];
    const dataColIndex = this.dataMap?.[columnName];
    const dataIndex = this.indexOfRowWithKey(keyValue);
    if (dataIndex !== -1 && dataColIndex !== undefined) {
      const dataSourceRow = this.#data[dataIndex];
      dataSourceRow[colIndex] = value;
      const { from, to } = this.#range;
      const [rowIdx] = dataSourceRow;
      if (rowIdx >= from && rowIdx < to) {
        this.sendRowsToClient(false, dataSourceRow);
      }
    }
  };

  private indexOfRowWithKey = (key: string) =>
    this.#data.findIndex((row) => row[KEY] === key);

  protected update = (row: VuuRowDataItemType[], columnName: string) => {
    // TODO take sorting, filtering. grouping into account
    const keyValue = row[this.key] as string;
    const dataColIndex = this.dataMap?.[columnName] as number;
    return this.updateDataItem(keyValue, columnName, row[dataColIndex]);
  };

  protected updateRow = (row: VuuRowDataItemType[]) => {
    // TODO take sorting, filtering. grouping into account
    const keyValue = row[this.key];
    const dataIndex = this.#data.findIndex((row) => row[KEY] === keyValue);
    if (dataIndex !== -1) {
      const dataSourceRow = toDataSourceRow(this.key)(row, dataIndex);
      // maybe update this in place
      this.#data[dataIndex] = dataSourceRow;
      const { from, to } = this.#range;
      if (dataIndex >= from && dataIndex < to) {
        this.sendRowsToClient(false, dataSourceRow);
      }
    }
  };

  private setRange(range: VuuRange, forceFullRefresh = false) {
    if (range.from !== this.#range.from || range.to !== this.#range.to) {
      this.#range = range;
      const keysResequenced = this.#keys.reset(range);
      this.sendRowsToClient(forceFullRefresh || keysResequenced);
    } else if (forceFullRefresh) {
      this.sendRowsToClient(forceFullRefresh);
    }
  }

  sendRowsToClient(forceFullRefresh = false, row?: DataSourceRow) {
    if (row) {
      this.clientCallback?.({
        clientViewportId: this.viewport,
        mode: "update",
        rows: [
          toClientRow(row, this.#keys, this.selectedRows, this.dataIndices),
        ],
        type: "viewport-update",
      });
    } else {
      const rowRange =
        this.rangeChangeRowset === "delta" && !forceFullRefresh
          ? rangeNewItems(this.lastRangeServed, this.#range)
          : this.#range;
      const data = this.processedData ?? this.#data;

      const rowsWithinViewport = data
        .slice(rowRange.from, rowRange.to)
        .map((row) =>
          toClientRow(row, this.#keys, this.selectedRows, this.dataIndices),
        );

      this.clientCallback?.({
        clientViewportId: this.viewport,
        mode: "batch",
        range: this.#range,
        rows: rowsWithinViewport,
        size: data.length,
        type: "viewport-update",
      });
      this.lastRangeServed = {
        from: this.#range.from,
        to: Math.min(
          this.#range.to,
          this.#range.from + rowsWithinViewport.length,
        ),
      };
    }
  }

  get columns() {
    return this._config.columns;
  }

  set columns(columns: string[]) {
    const addedColumns = getAddedItems(this.config.columns, columns);
    if (addedColumns.length > 0) {
      const columnsWithoutDescriptors = getMissingItems(
        this.columnDescriptors,
        addedColumns,
        (col) => col.name,
      );
      console.log(`columnsWithoutDescriptors`, {
        columnsWithoutDescriptors,
      });
    }
    this.#columnMap = buildColumnMap(columns);
    this.dataIndices = buildDataToClientMap(this.#columnMap, this.dataMap);

    this.config = {
      ...this._config,
      columns,
    };
  }

  get aggregations() {
    return this._config.aggregations;
  }

  set aggregations(aggregations: VuuAggregation[]) {
    this._config = {
      ...this._config,
      aggregations,
    };

    const targetData = this.processedData ?? this.#data;
    const leafData = this.#data;

    aggregateData(
      aggregations,
      targetData,
      this._config.groupBy,
      leafData,
      this.#columnMap,
      this.groupMap as GroupMap,
    );
    this.setRange(resetRange(this.#range), true);

    this.emit("config", this._config, this.range);
  }

  get sort() {
    return this._config.sort;
  }

  set sort(sort: VuuSort) {
    debug?.(`sort ${JSON.stringify(sort)}`);
    this.config = {
      ...this._config,
      sort,
    };
  }

  get baseFilter() {
    return this._config.baseFilterSpec;
  }

  set baseFilter(baseFilter: DataSourceFilter | undefined) {
    debug?.(`baseFilter ${JSON.stringify(baseFilter)}`);
    // TODO check that baseFilter has changed
    this.config = {
      ...this._config,
      baseFilterSpec: baseFilter,
    };
  }

  get filter() {
    return this._config.filterSpec;
  }

  set filter(filter: DataSourceFilter) {
    debug?.(`filter ${JSON.stringify(filter)}`);
    // TODO check that filter has changed
    this.config = {
      ...this._config,
      filterSpec: filter,
    };
  }

  get groupBy() {
    return this._config.groupBy;
  }

  set groupBy(groupBy: VuuGroupBy) {
    this.config = {
      ...this._config,
      groupBy,
    };
  }

  get title() {
    return this.#title ?? `${this.table.module} ${this.table.table}`;
  }

  set title(title: string) {
    this.#title = title;
    this.emit("title-changed", this.viewport, title);
  }

  get _clientCallback() {
    return this.clientCallback;
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

  applyEdit(
    rowKey: string,
    columnName: string,
    value: VuuRowDataItemType,
  ): Promise<true> {
    console.log(`ArrayDataSource applyEdit ${rowKey} ${columnName} ${value}`);
    return Promise.resolve(true);
  }
  async remoteProcedureCall<T extends VuuRpcResponse = VuuRpcResponse>() {
    return Promise.reject<T>();
  }

  async menuRpcCall(
    rpcRequest: Omit<VuuRpcRequest, "vpId">,
  ): Promise<VuuRpcResponse> {
    return new Promise((resolve) => {
      if (isEditCellRequest(rpcRequest)) {
        const { rowKey, field, value } = rpcRequest;
        try {
          this.updateDataItem(rowKey, field, value);
          resolve({
            action: {
              type: "VP_EDIT_SUCCESS",
            },
            rpcName: "VP_EDIT_CELL_RPC",
            type: "VIEW_PORT_MENU_RESP",
            vpId: this.viewport,
          });
        } catch (error) {
          resolve({
            error: String(error),
            rpcName: "VP_EDIT_CELL_RPC",
            type: "VIEW_PORT_MENU_REJ",
            vpId: this.viewport,
          });
        }
      } else {
        throw Error("menuRpcCall invalid rpcRequest");
      }
    });
  }

  private convertKeysToIndexValues(keys?: string[]) {
    if (Array.isArray(keys)) {
      const indexValues: number[] = [];
      keys.forEach((key) => {
        const rowIdx = this.indexOfRowWithKey(key);
        if (rowIdx !== -1) {
          indexValues.push(rowIdx);
        }
      });
      return indexValues;
    }
  }
}
