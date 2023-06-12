import { DataSourceFilter } from "@finos/vuu-data-types";
import { ColumnDescriptor, Selection } from "@finos/vuu-datagrid-types";
import { filterPredicate } from "@finos/vuu-filters";
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
  uuid,
} from "@finos/vuu-utils";
import {
  DataSource,
  DataSourceConstructorProps,
  DataSourceEvents,
  DataSourceRow,
  SubscribeCallback,
  SubscribeProps,
  vanillaConfig,
  WithFullConfig,
} from "../data-source";
import {
  MenuRpcResponse,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
} from "../vuuUIMessageTypes";
import { collapseGroup, expandGroup, GroupMap, groupRows } from "./group-utils";
import { TableSchema } from "../message-utils";
import { sortRows } from "./sort-utils";

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
    this.openTreeNodes.push(key);
    this.groupedData = expandGroup(
      this.openTreeNodes,
      this.#data,
      this.#config.groupBy,
      this.#columnMap,
      this.groupMap as GroupMap
    );
    this.setRange(resetRange(this.#range), true);
  }

  closeTreeNode(key: string) {
    this.openTreeNodes = this.openTreeNodes.filter((value) => value !== key);
    if (this.groupedData) {
      this.groupedData = collapseGroup(key, this.groupedData);
      this.setRange(resetRange(this.#range), true);
    }
  }

  get data() {
    return this.#data;
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
      this.sortedData ?? this.groupedData ?? this.filteredData ?? this.#data;

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
  }

  get sort() {
    return this.#config.sort;
  }

  set sort(sort: VuuSort) {
    debug?.(`sort ${JSON.stringify(sort)}`);
    this.#config = {
      ...this.#config,
      sort,
    };

    this.sortedData = sortRows(this.#data, sort, this.#columnMap).map(
      (row, i) => {
        const dolly = row.slice() as DataSourceRow;
        dolly[0] = i;
        dolly[1] = i;
        return dolly;
      }
    );
    this.setRange(resetRange(this.#range), true);
    this.emit("config", this.#config);
  }

  get filter() {
    return this.#config.filter;
  }

  set filter(filter: DataSourceFilter) {
    debug?.(`filter ${JSON.stringify(filter)}`);
    // TODO should we wait until server ACK before we assign #sort ?

    this.#config = {
      ...this.#config,
      filter,
    };
    const { filterStruct } = filter;
    if (filterStruct) {
      const fn = filterPredicate(this.#columnMap, filterStruct);
      // TODO this is expensive,
      this.filteredData = this.#data.filter(fn).map((row, i) => {
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
        this.#data,
        groupBy,
        this.#columnMap
      );
      this.groupMap = groupMap;
      this.groupedData = groupedData;
      console.timeEnd("group");
    } else {
      this.groupedData = undefined;
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
