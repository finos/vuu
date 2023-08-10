import { DataSourceFilter, DataSourceRow } from "@finos/vuu-data-types";
import { ColumnDescriptor, Selection } from "@finos/vuu-datagrid-types";
import { filterPredicate, parseFilter } from "@finos/vuu-filter-parser";
import {
  ClientToServerEditRpc,
  ClientToServerMenuRPC,
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuGroupBy,
  VuuRange,
  VuuRowDataItemType,
  VuuSort,
} from "@finos/vuu-protocol-types";
import {
  buildColumnMap,
  ColumnMap,
  EventEmitter,
  getSelectionStatus,
  KeySet,
  logger,
  metadataKeys,
  rangeNewItems,
  resetRange,
  setAggregations,
  uuid,
} from "@finos/vuu-utils";
import {
  configChanged,
  DataSource,
  DataSourceConfig,
  DataSourceConstructorProps,
  DataSourceEvents,
  SubscribeCallback,
  SubscribeProps,
  vanillaConfig,
  withConfigDefaults,
  WithFullConfig,
} from "../data-source";
import { TableSchema } from "../message-utils";
import {
  MenuRpcResponse,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
} from "../vuuUIMessageTypes";
import { collapseGroup, expandGroup, GroupMap, groupRows } from "./group-utils";
import { sortRows } from "./sort-utils";
import { el } from "@faker-js/faker";
import { aggregateData } from "./aggregate-utils";

export interface ArrayDataSourceConstructorProps
  extends Omit<DataSourceConstructorProps, "bufferSize" | "table"> {
  columnDescriptors: ColumnDescriptor[];
  data: VuuRowDataItemType[][];
  rangeChangeRowset?: "delta" | "full";
}

const { debug } = logger("ArrayDataSource");

const { RENDER_IDX, SELECTED } = metadataKeys;
const NULL_RANGE: VuuRange = { from: 0, to: 0 } as const;

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
  data[0].toString(),
  0,
  ...data,
];

const buildTableSchema = (columns: ColumnDescriptor[]): TableSchema => {
  const schema: TableSchema = {
    columns: columns.map(({ name, serverDataType = "string" }) => ({
      name,
      serverDataType,
    })),
    // how do we identify the key field ?
    key: columns[0].name,
    table: { module: "", table: "Array" },
  };

  return schema;
};

const toClientRow = (
  row: DataSourceRow,
  keys: KeySet,
  selection: Selection
) => {
  const [rowIndex] = row;
  const clientRow = row.slice() as DataSourceRow;
  clientRow[RENDER_IDX] = keys.keyFor(rowIndex);
  clientRow[SELECTED] = getSelectionStatus(selection, rowIndex);

  return clientRow;
};

export class ArrayDataSource
  extends EventEmitter<DataSourceEvents>
  implements DataSource
{
  private columnDescriptors: ColumnDescriptor[];
  private status = "initialising";
  private disabled = false;
  private filteredData: undefined | DataSourceRow[];
  private groupedData: undefined | DataSourceRow[];
  private sortedData: undefined | DataSourceRow[];
  private groupMap: undefined | GroupMap;
  private selectedRows: Selection = [];
  private suspended = false;
  private clientCallback: SubscribeCallback | undefined;
  private tableSchema: TableSchema;
  private lastRangeServed: VuuRange = { from: 0, to: 0 };
  private rangeChangeRowset: "delta" | "full";
  private openTreeNodes: string[] = [];

  #columns: string[] = [];
  #columnMap: ColumnMap;
  #config: WithFullConfig = vanillaConfig;
  #data: readonly DataSourceRow[];
  #range: VuuRange = NULL_RANGE;
  #selectedRowsCount = 0;
  #size = 0;
  #title: string | undefined;

  public viewport: string;

  private keys = new KeySet(this.#range);
  processedData: readonly DataSourceRow[] | undefined = undefined;

  constructor({
    aggregations,
    columnDescriptors,
    data,
    filter,
    groupBy,
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

    this.#config = {
      ...this.#config,
      aggregations: aggregations || this.#config.aggregations,
      columns: columnDescriptors.map((col) => col.name),
      filter: filter || this.#config.filter,
      groupBy: groupBy || this.#config.groupBy,
      sort: sort || this.#config.sort,
    };

    this.columnDescriptors = columnDescriptors;
    this.#columns = columnDescriptors.map((column) => column.name);
    this.#columnMap = buildColumnMap(this.#columns);
    this.rangeChangeRowset = rangeChangeRowset;
    this.tableSchema = buildTableSchema(columnDescriptors);

    this.#data = data.map<DataSourceRow>(toDataSourceRow);
    this.viewport = viewport || uuid();

    this.#size = data.length;

    this.#title = title;

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

    if (aggregations || columns || filter || groupBy || sort) {
      this.#config = {
        ...this.#config,
        aggregations: aggregations || this.#config.aggregations,
        columns: columns || this.#config.columns,
        filter: filter || this.#config.filter,
        groupBy: groupBy || this.#config.groupBy,
        sort: sort || this.#config.sort,
      };
    }

    if (this.status !== "initialising") {
      //TODO check if subscription details are still the same
      return;
    }

    this.viewport = viewport;

    this.status = "subscribed";

    this.clientCallback?.({
      ...this.#config,
      type: "subscribed",
      clientViewportId: this.viewport,
      range: this.#range,
      tableSchema: this.tableSchema,
    });

    this.clientCallback({
      clientViewportId: this.viewport,
      type: "viewport-update",
      size: this.#data.length,
    });

    if (range) {
      // set range and trigger dispatch of initial rows
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

  select(selected: Selection) {
    debug?.(`select ${JSON.stringify(selected)}`);
    this.selectedRows = selected;
    this.setRange(resetRange(this.#range), true);
  }

  openTreeNode(key: string) {
    console.log("openTreeNode before", this.processedData);
    this.openTreeNodes.push(key);
    this.processedData = expandGroup(
      this.openTreeNodes,
      this.#data,
      this.#config.groupBy,
      this.#columnMap,
      this.groupMap as GroupMap,
      this.processedData as readonly DataSourceRow[]
    );
    console.log("openTreeNode after", this.processedData);
    this.setRange(resetRange(this.#range), true);
  }

  closeTreeNode(key: string) {
    this.openTreeNodes = this.openTreeNodes.filter((value) => value !== key);
    if (this.processedData) {
      this.processedData = collapseGroup(key, this.processedData);
      this.setRange(resetRange(this.#range), true);
    }
  }

  get data() {
    return this.#data;
  }

  get config() {
    return undefined;
  }

  set config(config: DataSourceConfig | undefined) {
    console.log("! entering the setter", { old: this.#config, new: config });
    if (configChanged(this.#config, config)) {
      console.log("! config change is detected", this.#config);
      if (config) {
        console.log("! config is truthy", this.#config);
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

        console.log("&current config", this.#config);
        console.log("& config.filter", config.filter?.filter);
        console.log("& config.sort", !!config.sort?.sortDefs);
        if (Boolean(config.filter?.filter)) {
          console.log("% config has filter");
          this.filter = config.filter;
        }
        console.log("$$ config sort", config.sort?.sortDefs?.length);
        if (config.sort?.sortDefs?.length) {
          console.log("% config has sort!");
          const targetData = this.processedData ?? this.#data;
          console.table(targetData);
          this.processedData = sortRows(
            targetData,
            this.sort,
            this.#columnMap
          ).map((row, i) => {
            const dolly = row.slice() as DataSourceRow;
            dolly[0] = i;
            dolly[1] = i;
            return dolly;
          });
          this.setRange(resetRange(this.#range), true);
          this.emit("config", this.#config);
        }

        this.emit("config", this.#config);
      }
    }
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
    if (range.from !== this.#range.from || range.to !== this.#range.to) {
      this.setRange(range);
    }
  }

  private setRange(range: VuuRange, forceFullRefresh = false) {
    this.#range = range;
    this.keys.reset(range);
    this.sendRowsToClient(forceFullRefresh);
  }

  sendRowsToClient(forceFullRefresh = false) {
    // requestAnimationFrame(() => {
    const rowRange =
      this.rangeChangeRowset === "delta" && !forceFullRefresh
        ? rangeNewItems(this.lastRangeServed, this.#range)
        : this.#range;
    const data =
      this.processedData ??
      this.#data ??
      this.sortedData ??
      this.groupedData ??
      this.filteredData;

    const rowsWithinViewport = data
      .slice(rowRange.from, rowRange.to)
      .map((row) => toClientRow(row, this.keys, this.selectedRows));

    this.clientCallback?.({
      clientViewportId: this.viewport,
      mode: "batch",
      rows: rowsWithinViewport,
      size: data.length,
      type: "viewport-update",
    });
    this.lastRangeServed = this.#range;
    // });
  }

  get columns() {
    return this.#columns;
  }

  set columns(columns: string[]) {
    this.#columns = columns;
    console.log(`ArrayDataSource setColumns ${columns.join(",")}`);
  }

  get aggregations() {
    return this.#config.aggregations;
  }

  set aggregations(aggregations: VuuAggregation[]) {
    // this.#aggregations = aggregations;
    console.log("!!!! aggregations setter", aggregations);
    this.#config = {
      ...this.#config,
      aggregations,
    };

    const targetData = this.processedData ?? this.#data;
    const leafData = this.#data;
    console.log("!!!! targetData before", targetData);

    aggregateData(
      aggregations,
      targetData,
      this.#config.groupBy,
      leafData,
      this.#columnMap,
      this.groupMap as GroupMap
    );
    this.setRange(resetRange(this.#range), true);
    // this.processedData = sortRows(
    //   targetData,
    //   this.sort,
    //   this.#columnMap
    // ).map((row, i) => {
    //   const dolly = row.slice() as DataSourceRow;
    //   dolly[0] = i;
    //   dolly[1] = i;
    //   return dolly;
    // });
    // this.setRange(resetRange(this.#range), true);

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
    // TODO should we wait until server ACK before we assign #sort ?
    console.log("## in set filter");
    this.#config = {
      ...this.#config,
      filter,
    };
    const { filterStruct } = filter;

    if (filterStruct) {
      console.log("%% in filterStruct", filterStruct);
      const fn = filterPredicate(this.#columnMap, filterStruct);
      // TODO this is expensive,
      const targetData = this.processedData ?? this.#data;
      this.processedData = targetData.filter(fn).map((row, i) => {
        const dolly = row.slice() as DataSourceRow;
        dolly[0] = i;
        dolly[1] = i;
        return dolly;
      });
    } else {
      this.filteredData = undefined;
    }
    this.setRange(resetRange(this.#range), true);
    this.emit("config", this.#config);
  }

  get groupBy() {
    return this.#config.groupBy;
  }

  set groupBy(groupBy: VuuGroupBy) {
    this.#config = {
      ...this.#config,
      groupBy,
    };

    if (groupBy.length) {
      console.time("group");
      const [groupedData, groupMap] = groupRows(
        this.processedData ?? this.#data,
        groupBy,
        this.#columnMap
      );
      this.groupMap = groupMap;
      this.processedData = groupedData;
      console.timeEnd("group");
    } else {
      this.groupedData = undefined;
      this.processedData = undefined;
    }
    this.setRange(resetRange(this.#range), true);

    this.emit("config", this.#config);
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

  private findRow(rowKey: number) {
    const row = this.#data[rowKey];
    if (row) {
      return row;
    } else {
      throw `no row found for key ${rowKey}`;
    }
  }

  private updateRow(
    rowKey: string,
    colName: string,
    value: VuuRowDataItemType
  ) {
    const row = this.findRow(parseInt(rowKey));
    console.log({ row, colName, value });
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
            const { rowKey, field, value } = rpcRequest;
            try {
              this.updateRow(rowKey, field, value);
              resolve(undefined);
            } catch (error) {
              resolve({ error: String(error), type: "VP_EDIT_RPC_REJECT" });
            }
          }

          break;
        default:
          resolve(undefined);
      }
    });
  }
}
