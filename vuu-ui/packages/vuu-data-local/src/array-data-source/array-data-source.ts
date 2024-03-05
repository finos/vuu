import {
  DataSource,
  DataSourceConfig,
  DataSourceConstructorProps,
  DataSourceEvents,
  DataSourceFilter,
  DataSourceRow,
  DataSourceStatus,
  MenuRpcResponse,
  Selection,
  SubscribeCallback,
  SubscribeProps,
  TableSchema,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
  WithFullConfig,
} from "@finos/vuu-data-types";
import { filterPredicate, parseFilter } from "@finos/vuu-filter-parser";
import {
  ClientToServerEditRpc,
  ClientToServerMenuRPC,
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuGroupBy,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
  VuuSort,
} from "@finos/vuu-protocol-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  buildColumnMap,
  ColumnMap,
  isConfigChanged,
  EventEmitter,
  getAddedItems,
  getMissingItems,
  isGroupByChanged,
  hasFilter,
  hasGroupBy,
  hasSort,
  KeySet,
  logger,
  metadataKeys,
  NULL_RANGE,
  rangeNewItems,
  resetRange,
  uuid,
  vanillaConfig,
  withConfigDefaults,
  DataSourceConfigChanges,
} from "@finos/vuu-utils";
import { aggregateData } from "./aggregate-utils";
import { buildDataToClientMap, toClientRow } from "./array-data-utils";
import { collapseGroup, expandGroup, GroupMap, groupRows } from "./group-utils";
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

const buildTableSchema = (
  columns: ColumnDescriptor[],
  keyColumn?: string
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
  #config: WithFullConfig = vanillaConfig;
  #data: DataSourceRow[];
  #links: LinkDescriptorWithLabel[] | undefined;
  #range: VuuRange = NULL_RANGE;
  #selectedRowsCount = 0;
  #size = 0;
  #status: DataSourceStatus = "initialising";
  #title: string | undefined;

  protected _menu: VuuMenu | undefined;
  protected selectedRows: Selection = [];

  public tableSchema: TableSchema;
  public viewport: string;

  private keys = new KeySet(this.#range);
  protected processedData: DataSourceRow[] | undefined = undefined;

  constructor({
    aggregations,
    // different from RemoteDataSource
    columnDescriptors,
    data,
    dataMap,
    filter,
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
        "ArrayDataSource constructor called without data or without columnDescriptors"
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
    this.#size = data.length;
    this.#title = title;

    const columns = columnDescriptors.map((col) => col.name);
    this.#columnMap = buildColumnMap(columns);
    this.dataIndices = buildDataToClientMap(this.#columnMap, this.dataMap);
    this.#data = data.map<DataSourceRow>(toDataSourceRow(this.key));

    this.config = {
      ...this.#config,
      aggregations: aggregations || this.#config.aggregations,
      columns,
      filter: filter || this.#config.filter,
      groupBy: groupBy || this.#config.groupBy,
      sort: sort || this.#config.sort,
    };

    debug?.(`columnMap: ${JSON.stringify(this.#columnMap)}`);
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
    this.viewport = viewport;
    this.#status = "subscribed";
    this.lastRangeServed = { from: 0, to: 0 };

    let config = this.#config;

    const hasConfigProps = aggregations || columns || filter || groupBy || sort;
    if (hasConfigProps) {
      if (range) {
        this.#range = range;
      }
      config = {
        ...config,
        aggregations: aggregations || this.#config.aggregations,
        columns: columns || this.#config.columns,
        filter: filter || this.#config.filter,
        groupBy: groupBy || this.#config.groupBy,
        sort: sort || this.#config.sort,
      };
    }

    this.clientCallback?.({
      ...config,
      type: "subscribed",
      clientViewportId: this.viewport,
      range: this.#range,
      tableSchema: this.tableSchema,
    });

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
      if (range) {
        // set range and trigger dispatch of initial rows
        this.range = range;
        this.sendRowsToClient();
      } else if (this.#range !== NULL_RANGE) {
        this.sendRowsToClient();
      }
    }
  }

  unsubscribe() {
    console.log(`unsubscribe noop`);
  }

  suspend() {
    console.log(`suspend #${this.viewport}, current status ${this.#status}`);
    info?.(`suspend #${this.viewport}, current status ${this.#status}`);
    this.#status = "suspended";

    return this;
  }

  resume() {
    console.log(`resume #${this.viewport}, current status ${this.#status}`);
    // const isDisabled = this.#status.startsWith("disabl");
    const isSuspended = this.#status === "suspended";
    info?.(`resume #${this.viewport}, current status ${this.#status}`);
    console.log(`resume noop`);
    if (isSuspended) {
      this.#status = "subscribed";
    }
    return this;
  }

  disable() {
    console.log(`disable noop`);
    return this;
  }

  enable() {
    console.log(`enable noop`);
    return this;
  }

  select(selected: Selection) {
    this.#selectedRowsCount = selected.length;
    debug?.(`select ${JSON.stringify(selected)}`);
    this.selectedRows = selected;
    this.setRange(resetRange(this.#range), true);
  }

  openTreeNode(key: string) {
    this.openTreeNodes.push(key);
    this.processedData = expandGroup(
      this.openTreeNodes,
      this.#data,
      this.#config.groupBy,
      this.#columnMap,
      this.groupMap as GroupMap,
      this.processedData as DataSourceRow[]
    );
    this.setRange(resetRange(this.#range), true);
  }

  closeTreeNode(key: string) {
    this.openTreeNodes = this.openTreeNodes.filter((value) => value !== key);
    if (this.processedData) {
      this.processedData = collapseGroup(key, this.processedData);
      this.setRange(resetRange(this.#range), true);
    }
  }

  get links() {
    return this.#links;
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
    return this.#config;
  }

  set config(config: DataSourceConfig) {
    const configChanges = this.applyConfig(config);
    if (configChanges) {
      if (config) {
        const originalConfig = this.#config;
        const newConfig: DataSourceConfig =
          config?.filter?.filter && config?.filter.filterStruct === undefined
            ? {
                ...config,
                filter: {
                  filter: config.filter.filter,
                  filterStruct: parseFilter(config.filter.filter),
                },
              }
            : config;

        this.#config = withConfigDefaults(newConfig);

        let processedData: DataSourceRow[] | undefined;

        if (hasFilter(config)) {
          const { filter, filterStruct = parseFilter(filter) } = config.filter;
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
            this.#columnMap
          );
        }

        if (
          this.openTreeNodes.length > 0 &&
          isGroupByChanged(originalConfig, config)
        ) {
          if (this.#config.groupBy.length === 0) {
            this.openTreeNodes.length = 0;
          } else {
            //TODO purge any openTreeNodes for a no-longer-present groupBy col
            console.log("adjust the openTReeNodes groupBy changed ", {
              originalGroupBy: originalConfig.groupBy,
              newGroupBy: newConfig.groupBy,
            });
          }
        }

        if (hasGroupBy(config)) {
          const [groupedData, groupMap] = groupRows(
            processedData ?? this.#data,
            config.groupBy,
            this.#columnMap
          );
          this.groupMap = groupMap;
          processedData = groupedData;

          if (this.openTreeNodes.length > 0) {
            processedData = expandGroup(
              this.openTreeNodes,
              this.#data,
              this.#config.groupBy,
              this.#columnMap,
              this.groupMap as GroupMap,
              processedData as DataSourceRow[]
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

      this.setRange(resetRange(this.#range), true);

      this.emit("config", this.#config, undefined, configChanges);
    }
  }

  applyConfig(config: DataSourceConfig): DataSourceConfigChanges | undefined {
    const { noChanges, ...otherChanges } = isConfigChanged(
      this.#config,
      config
    );

    if (noChanges !== true) {
      if (config) {
        const newConfig: DataSourceConfig =
          config?.filter?.filter && config?.filter.filterStruct === undefined
            ? {
                ...config,
                filter: {
                  filter: config.filter.filter,
                  filterStruct: parseFilter(config.filter.filter),
                },
              }
            : config;
        this.#config = withConfigDefaults(newConfig);
        return otherChanges;
      }
    }
  }

  get selectedRowsCount() {
    return this.#selectedRowsCount;
  }

  get size() {
    // return this.#size;
    return this.processedData?.length ?? this.#data.length;
  }

  get range() {
    return this.#range;
  }

  set range(range: VuuRange) {
    this.setRange(range);
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

  protected update = (row: VuuRowDataItemType[], columnName: string) => {
    // TODO take sorting, filtering. grouping into account
    const keyValue = row[this.key];
    const colIndex = this.#columnMap[columnName];
    const dataColIndex = this.dataMap?.[columnName];
    const dataIndex = this.#data.findIndex((row) => row[KEY] === keyValue);
    if (dataIndex !== -1 && dataColIndex !== undefined) {
      const dataSourceRow = this.#data[dataIndex];
      dataSourceRow[colIndex] = row[dataColIndex];
      const { from, to } = this.#range;
      const [rowIdx] = dataSourceRow;
      if (rowIdx >= from && rowIdx < to) {
        this.sendRowsToClient(false, dataSourceRow);
      }
    }
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
      const keysResequenced = this.keys.reset(range);
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
          toClientRow(row, this.keys, this.selectedRows, this.dataIndices),
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
          toClientRow(row, this.keys, this.selectedRows, this.dataIndices)
        );

      this.clientCallback?.({
        clientViewportId: this.viewport,
        mode: "batch",
        rows: rowsWithinViewport,
        size: data.length,
        type: "viewport-update",
      });
      this.lastRangeServed = {
        from: this.#range.from,
        to: Math.min(
          this.#range.to,
          this.#range.from + rowsWithinViewport.length
        ),
      };
    }
  }

  get columns() {
    return this.#config.columns;
  }

  set columns(columns: string[]) {
    const addedColumns = getAddedItems(this.config.columns, columns);
    if (addedColumns.length > 0) {
      const columnsWithoutDescriptors = getMissingItems(
        this.columnDescriptors,
        addedColumns,
        (col) => col.name
      );
      console.log(`columnsWithoutDescriptors`, {
        columnsWithoutDescriptors,
      });
    }
    this.#columnMap = buildColumnMap(columns);
    this.dataIndices = buildDataToClientMap(this.#columnMap, this.dataMap);

    this.config = {
      ...this.#config,
      columns,
    };
  }

  get aggregations() {
    return this.#config.aggregations;
  }

  set aggregations(aggregations: VuuAggregation[]) {
    this.#config = {
      ...this.#config,
      aggregations,
    };

    const targetData = this.processedData ?? this.#data;
    const leafData = this.#data;

    aggregateData(
      aggregations,
      targetData,
      this.#config.groupBy,
      leafData,
      this.#columnMap,
      this.groupMap as GroupMap
    );
    this.setRange(resetRange(this.#range), true);

    this.emit("config", this.#config);
  }

  get sort() {
    return this.#config.sort;
  }

  set sort(sort: VuuSort) {
    debug?.(`sort ${JSON.stringify(sort)}`);
    this.config = {
      ...this.#config,
      sort,
    };
  }

  get filter() {
    return this.#config.filter;
  }

  set filter(filter: DataSourceFilter) {
    debug?.(`filter ${JSON.stringify(filter)}`);
    // TODO check that filter has changed
    this.config = {
      ...this.#config,
      filter,
    };
  }

  get groupBy() {
    return this.#config.groupBy;
  }

  set groupBy(groupBy: VuuGroupBy) {
    this.config = {
      ...this.#config,
      groupBy,
    };
  }

  get title() {
    return this.#title;
  }

  set title(title: string | undefined) {
    this.#title = title;
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

  private findRow(rowKey: number) {
    const row = this.#data[rowKey];
    if (row) {
      return row;
    } else {
      throw `no row found for key ${rowKey}`;
    }
  }

  applyEdit(
    row: DataSourceRow,
    columnName: string,
    value: VuuRowDataItemType
  ): Promise<true> {
    console.log(`ArrayDataSource applyEdit ${row[0]} ${columnName} ${value}`);
    return Promise.resolve(true);
  }

  async menuRpcCall(
    rpcRequest: Omit<ClientToServerMenuRPC, "vpId"> | ClientToServerEditRpc
  ): Promise<
    | MenuRpcResponse
    | VuuUIMessageInRPCEditReject
    | VuuUIMessageInRPCEditResponse
    | undefined
  > {
    return new Promise((resolve) => {
      const { type } = rpcRequest;
      switch (type) {
        case "VP_EDIT_CELL_RPC":
          {
            // TODO
            // const { rowKey, field, value } = rpcRequest;
            // try {
            //   this.update(rowKey, field, value);
            //   resolve(undefined);
            // } catch (error) {
            //   resolve({ error: String(error), type: "VP_EDIT_RPC_REJECT" });
            // }
          }

          break;
        default:
          resolve(undefined);
      }
    });
  }
}
