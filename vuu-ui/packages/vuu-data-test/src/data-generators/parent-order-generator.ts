import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnGeneratorFn, RowGeneratorFactory } from "./vuu-row-generator";
import { getSchema } from "../tableSchemas";
import { currencies, locations, suffixes } from "./generatedData";

function random(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const accounts = [
  "Account 1",
  "Account 2",
  "Account 3",
  "Account 4",
  "Account 5",
];
const algos = ["Algo 1", "Algo 2", "Algo 3", "Algo 4", "Algo 5"];

const maxIndex = 20 * 20 * 20 * 20 * 8;

export const RowGenerator: RowGeneratorFactory = () => (index: number) => {
  if (index > maxIndex) {
    throw Error("generateRow index val is too high");
  }

  const suffix = suffixes[random(0, suffixes.length - 1)];

  const account = accounts[random(0, 4)];
  const algo = algos[random(0, 4)];
  const avgPrice = 0;
  const ccy = currencies[random(0, 4)];
  const childCount = 0;
  const exchange = locations[suffix][1];
  const filledQty = 0;
  const id = `${index}`;
  const idAsInt = index;
  const lastUpdate = Date.now();
  const openQty = 0;
  const price = 0;
  const quantity = 0;
  const ric = "AAA.L";
  const side = "buy";
  const status = "active";
  const volLimit = 10_000;

  return [
    account,
    algo,
    avgPrice,
    ccy,
    childCount,
    exchange,
    filledQty,
    id,
    idAsInt,
    lastUpdate,
    openQty,
    price,
    quantity,
    ric,
    side,
    status,
    volLimit,
  ];
};

export const ColumnGenerator: ColumnGeneratorFn = (columns = []) => {
  const schema = getSchema("parentOrders");
  const schemaColumns: ColumnDescriptor[] = schema.columns;
  if (typeof columns === "number") {
    throw Error("ParentOrderColumnGenerator must be passed columns (strings)");
  } else if (columns.length === 0) {
    return schemaColumns;
  } else {
    // TODO return just requested columns and apply extended config
    return schemaColumns;
  }
};
