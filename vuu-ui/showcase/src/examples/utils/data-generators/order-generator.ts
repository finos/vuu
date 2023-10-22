import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ExtendedColumnConfig } from "../useTableConfig";
import { ColumnGeneratorFn, RowGeneratorFactory } from "./vuu-row-generator";
import { getSchema } from "@finos/vuu-data-test";

function random(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const chars = Array.from("ABCDEFGHIJKLMNOPQRST");
const suffixes = ["L", "N", "OQ", "AS", "PA", "MI", "FR", "AT"];
const currencies = ["CAD", "GBX", "USD", "EUR", "GBP"];
const sides = ["buy", "sell", "buy", "sell", "short"];
const traders = ["Arkwright", "Enfield", "Bailey", "Cui", "Kohl"];

/*
    each top level loop (20 x 'A...') has 64,000 iterations of nested loops, 
    so divide index by 64000 to get index of first character
    
    remainder is our index into next level of loops
    each second level loop ( 20 x 'A...') has, 3,200 iterations, so divide remainder by 
    3,200 to get index of second character

    each third level loop (20 x 'A...') has 160 iterations

*/

const maxIndex = 20 * 20 * 20 * 20 * 8;

export const RowGenerator: RowGeneratorFactory = () => (index: number) => {
  if (index > maxIndex) {
    throw Error("generateRow index val is too high");
  }
  const index1 = Math.floor(index / 64000);
  const remainder1 = index % 64000;

  const index2 = Math.floor(remainder1 / 3200);
  const remainder2 = remainder1 % 3200;

  const index3 = Math.floor(remainder2 / 160);
  const remainder3 = remainder2 % 160;

  const index4 = Math.floor(remainder3 / 8);
  const remainder4 = remainder3 % 8;

  const suffix = suffixes[remainder4];

  const ccy = currencies[random(0, 4)];
  const created = 0;
  const filledQuantity = 0;
  const lastUpdate = 0;
  const orderId = "1";
  const quantity = 0;
  const ric = `${chars[index1]}${chars[index2]}${chars[index3]}${chars[index4]}.${suffix}`;
  const side = sides[random(0, 4)];
  const trader = traders[random(0, 4)];

  return [
    ccy,
    created,
    filledQuantity,
    lastUpdate,
    orderId,
    quantity,
    ric,
    side,
    trader,
  ];
};

export const ColumnGenerator: ColumnGeneratorFn = (
  columns = [],
  columnConfig: ExtendedColumnConfig = {}
) => {
  console.log({ columnConfig });
  const schema = getSchema("orders");
  const instrumentColumns: ColumnDescriptor[] = schema.columns;
  if (typeof columns === "number") {
    throw Error("OrderColumnGenerator must be passed columns (strings)");
  } else if (columns.length === 0) {
    return instrumentColumns;
  } else {
    // TODO return just requested columns and apply extended config
    return instrumentColumns;
  }
};
