import { buildDataColumnMap } from "../../Table";
import { BaseUpdateGenerator } from "../../UpdateGenerator";
import { schemas, SimulTableName } from "../../simul/simul-schemas";
import basketConstituentData from "./constituents";
import { initBidAsk, nextRandomDouble, random } from "../../data-utils";
import tableContainer from "../../core/table/TableContainer";

export type ask = number;
export type askSize = number;
export type bid = number;
export type bidSize = number;
export type close = number;
export type last = number;
export type open = number;
export type phase = "C";
export type ric = string;
export type scenario = "close";

export type PricesDataRow = [
  ask,
  askSize,
  bid,
  bidSize,
  close,
  last,
  open,
  phase,
  ric,
  scenario,
];

const { bid, bidSize, ask, askSize, last } = buildDataColumnMap(
  schemas,
  "prices",
);
const pricesUpdateGenerator = new BaseUpdateGenerator({
  bid,
  bidSize,
  ask,
  askSize,
  last,
});

const prices: PricesDataRow[] = [];

// prettier-ignore
for (const [,,,lastTrade,ric] of basketConstituentData) {
  const priceSeed = parseFloat(String(lastTrade));
  if (!isNaN(priceSeed)){
  const [bid, ask] = initBidAsk(5,nextRandomDouble)
  const askSize = random(1000, 3000);
  const bidSize = random(1000, 3000);
  const close = priceSeed + random(0, 1) / 10;
  const last = priceSeed + random(0, 1) / 10;
  const open = priceSeed + random(0, 1) / 10;
  const phase = "C";
  const scenario = "close";
  prices.push([
    ask,
    askSize,
    bid,
    bidSize,
    close,
    last,
    open,
    phase,
    ric as string,
    scenario,
  ]);

  }
}

const pricesTable = tableContainer.createTable(
  schemas.prices,
  prices,
  buildDataColumnMap<SimulTableName>(schemas, "prices"),
  pricesUpdateGenerator,
);

export default pricesTable;
