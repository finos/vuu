import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ExtendedColumnConfig } from "./useTableConfig";
import { ColumnGenerator, RowGenerator } from "./vuu-row-generator";
import { schemas } from "./useSchemas";

function random(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const chars = Array.from("ABCDEFGHIJKLMNOPQRST");
const locations: { [key: string]: string[] } = {
  L: ["London PLC", "XLON/LSE-SETS"],
  N: ["Corporation", "XNGS/NAS-GSM"],
  AS: ["B.V.", "XAMS/ENA-MAIN"],
  OQ: ["Co.", "XNYS/NYS-MAIN"],
  PA: ["Paris", "PAR/EUR_FR"],
  MI: ["Milan", "MIL/EUR_IT"],
  FR: ["Frankfurt", "FR/EUR_DE"],
  AT: ["Athens", "AT/EUR_GR"],
};
const suffixes = ["L", "N", "OQ", "AS", "PA", "MI", "FR", "AT"];
const currencies = ["CAD", "GBX", "USD", "EUR", "GBP"];

/*
    each top level loop (20 x 'A...') has 64,000 iterations of nested loops, 
    so divide index by 64000 to get index of first character
    
    remainder is our index into next level of loops
    each second level loop ( 20 x 'A...') has, 3,200 iterations, so divide remainder by 
    3,200 to get index of second character

    each third level loop (20 x 'A...') has 160 iterations

*/

const maxIndex = 20 * 20 * 20 * 20 * 8;

export const InstrumentRowGenerator: RowGenerator = () => (index: number) => {
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

  const ric = `${chars[index1]}${chars[index2]}${chars[index3]}${chars[index4]}.${suffix}`;
  const bbg = `${chars[index1]}${chars[index2]}${chars[index3]}${chars[index4]} ${suffix}`;
  const isin = `${chars[index1]}${chars[index2]}${chars[index3]}${chars[index4]}`;
  const description = `${ric} ${locations[suffix][0]}`;
  const currency = currencies[random(0, 4)];
  const exchange = locations[suffix][1];
  const lotSize = random(10, 1000);
  return [bbg, currency, description, exchange, isin, lotSize, ric];
};

export const InstrumentColumnGenerator: ColumnGenerator = (
  columns = [],
  columnConfig: ExtendedColumnConfig = {}
) => {
  console.log({ columnConfig });
  const instrumentColumns: ColumnDescriptor[] = schemas.instruments.columns;
  if (typeof columns === "number") {
    throw Error("InstrumentColumnGenerator must be passed columns (strings)");
  } else if (columns.length === 0) {
    return instrumentColumns;
  } else {
    // TODO return just erquested columns and apply extended config
    return instrumentColumns;
  }
};
