import { VuuDataRow, VuuRowDataItemType } from "packages/vuu-protocol-types";
import { buildColumnMap } from "@finos/vuu-utils";
import { UpdateGenerator } from "../rowUpdates";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import { VuuModule } from "../vuu-modules";
import instrumentsTable from "./reference-data/instruments";
import pricesTable from "./reference-data/prices";
import { schemas, SimulTableName } from "./simul-schemas";
import { BaseUpdateGenerator } from "../UpdateGenerator";
import { OrderUpdateGenerator } from "./OrderUpdateGenerator";
import { buildDataColumnMap, joinTables, Table } from "../Table";

const childOrders: VuuDataRow[] = [];

const instrumentPrices: VuuDataRow[] = [];

const { bid, bidSize, ask, askSize } = buildColumnMap(schemas.prices.columns);
// prettier-ignore
const pricesUpdateGenerator = new BaseUpdateGenerator([bid, bidSize, ask, askSize]);

const orderUpdateGenerator = new OrderUpdateGenerator();

const tables: Record<SimulTableName, Table> = {
  childOrders: new Table(
    schemas.childOrders,
    [],
    buildDataColumnMap(schemas.childOrders)
  ),
  instruments: instrumentsTable,
  instrumentPrices: joinTables(
    { module: "SIMUL", table: "instrumentPrices" },
    instrumentsTable,
    pricesTable,
    "ric"
  ),
  orders: new Table(schemas.orders, [], buildDataColumnMap(schemas.orders)),
  parentOrders: new Table(
    schemas.parentOrders,
    [],
    buildDataColumnMap(schemas.parentOrders)
  ),
  prices: pricesTable,
};

const updates: Record<SimulTableName, UpdateGenerator | undefined> = {
  childOrders: undefined,
  instruments: undefined,
  instrumentPrices: undefined,
  orders: orderUpdateGenerator,
  parentOrders: undefined,
  prices: pricesUpdateGenerator,
};

export const populateArray = (tableName: SimulTableName, count: number) => {
  const table = tables[tableName];
  const data: Array<VuuRowDataItemType[]> = [];
  for (let i = 0; i < count; i++) {
    if (i >= table.length) {
      break;
    }
    data[i] = table[i];
  }
  return data;
};

const getColumnDescriptors = (tableName: SimulTableName) => {
  const schema = schemas[tableName];
  if (schema) {
    return schema.columns;
  } else {
    console.error(`simul-module no schema found for table SIMUL ${tableName}`);
  }
};

const createDataSource = (tableName: SimulTableName) => {
  const columnDescriptors = getColumnDescriptors(tableName);
  const dataArray = populateArray(tableName, 10_000);
  return new TickingArrayDataSource({
    columnDescriptors,
    keyColumn: schemas[tableName].key,
    table: tables[tableName],
    // menu: menus[tableName],
    // rpcServices: services[tableName],
    updateGenerator: updates[tableName],
  });
};

const simulModule: VuuModule<SimulTableName> = {
  createDataSource,
};

export default simulModule;
