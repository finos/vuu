import { VuuRowDataItemType } from "packages/vuu-protocol-types";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import { VuuModule } from "../vuu-modules";
import instrumentsTable from "./reference-data/instruments";
import pricesTable from "./reference-data/prices";
import { schemas, SimulTableName } from "./simul-schemas";
import { buildDataColumnMap, joinTables, Table } from "../Table";

// prettier-ignore
// const pricesUpdateGenerator = new BaseUpdateGenerator([bid, bidSize, ask, askSize]);

// const orderUpdateGenerator = new OrderUpdateGenerator();

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
  return new TickingArrayDataSource({
    columnDescriptors,
    keyColumn: schemas[tableName].key,
    table: tables[tableName],
    // menu: menus[tableName],
    // rpcServices: services[tableName],
  });
};

const simulModule: VuuModule<SimulTableName> = {
  createDataSource,
};

export default simulModule;
