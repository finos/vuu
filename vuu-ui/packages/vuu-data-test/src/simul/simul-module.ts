import { VuuDataRow, VuuRowDataItemType } from "packages/vuu-protocol-types";
import { buildColumnMap } from "@finos/vuu-utils";
import { UpdateGenerator } from "../rowUpdates";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import { VuuModule } from "../vuu-modules";
import instruments from "./reference-data/instruments";
import prices from "./reference-data/prices";
import { schemas, SimulTableName } from "./simul-schemas";
import { BaseUpdateGenerator } from "../UpdateGenerator";
import { OrderUpdateGenerator } from "./OrderUpdateGenerator";

const childOrders: VuuDataRow[] = [];
const instrumentPrices: VuuDataRow[] = [];
const orders: VuuDataRow[] = [];
const parentOrders: VuuDataRow[] = [];

const { bid, bidSize, ask, askSize } = buildColumnMap(schemas.prices.columns);
// prettier-ignore
const pricesUpdateGenerator = new BaseUpdateGenerator([bid, bidSize, ask, askSize]);

const orderUpdateGenerator = new OrderUpdateGenerator();

const tables: Record<SimulTableName, VuuDataRow[]> = {
  childOrders,
  instruments,
  instrumentPrices,
  orders,
  parentOrders,
  prices,
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
  return schema.columns;
};

const createDataSource = (tableName: SimulTableName) => {
  const columnDescriptors = getColumnDescriptors(tableName);
  const dataArray = populateArray(tableName, 10_000);
  return new TickingArrayDataSource({
    columnDescriptors,
    data: dataArray,
    // menu: menus[tableName],
    // rpcServices: services[tableName],
    updateGenerator: updates[tableName],
  });
};

const simulModule: VuuModule<SimulTableName> = {
  createDataSource,
};

export default simulModule;
