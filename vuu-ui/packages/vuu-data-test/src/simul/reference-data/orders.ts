import { currencies } from "./currencies";
import { getRic } from "./instruments";
import { random } from "../../data-utils";
import { buildDataColumnMap, Table } from "../../Table";
import { schemas } from "../simul-schemas";

export type ccy = string;
export type created = number;
export type filledQuantity = number;
export type lastUpdate = number;
export type orderId = string;
export type quantity = number;
export type ric = string;
export type side = string;
export type trader = string;

const SIDE = ["BUY", "SELL"];
const traders = ["Trader A", "Trader B", "Trader C"];

export type OrdersDataRow = [
  ccy,
  created,
  filledQuantity,
  lastUpdate,
  orderId,
  quantity,
  ric,
  side,
  trader
];

export const OrderColumnMap = {
  ccy: 0,
  created: 1,
  filledQuantity: 2,
  lastUpdate: 3,
  orderId: 4,
  quantity: 5,
  ric: 6,
  side: 7,
  trader: 8,
} as const;

const ordersData: OrdersDataRow[] = [];

// const start = performance.now();
// Create 10_000 Instruments

const now = +new Date();
for (let i = 0; i < 100; i++) {
  const ccy = currencies[random(0, currencies.length - 1)];
  const created = now;
  const filledQuantity = 100;
  const lastUpdate = now;
  const orderId = `ORD${("0000" + i).slice(-4)}`;
  const quantity = 1000;
  const ric = getRic("AAP.L");
  const side = SIDE[random(0, 1)];
  const trader = traders[random(0, traders.length - 1)];

  ordersData.push([
    ccy,
    created,
    filledQuantity,
    lastUpdate,
    orderId,
    quantity,
    ric,
    side,
    trader,
  ]);
}
// const end = performance.now();
// console.log(`generating 10,000 instruments took ${end - start} ms`);

export const ordersTable = new Table(
  schemas.orders,
  ordersData,
  buildDataColumnMap(schemas.instruments)
);

export { ordersData };
