import { currencies } from "./currencies";
import { getRic } from "./instruments";
import { random } from "../../data-utils";
import { buildDataColumnMap } from "../../Table";
import { schemas } from "../simul-schemas";
import { sides } from "./sides";
import tableContainer from "../../core/table/TableContainer";

export type status = string;
export type ccy = string;
export type created = number;
export type filledQuantity = number;
export type lastUpdate = number;
export type orderId = string;
export type quantity = number;
export type ric = string;
export type side = string;
export type trader = string;

const traders = ["Trader A", "Trader B", "Trader C"];
const orderStatus = [
  "Filled",
  "Cancelled",
  "New",
  "Partial Exec",
  "Booked",
  "All Done",
];

const isComplete = (status: string) =>
  ["Filled", "All Done", "Booked"].includes(status);

export type OrdersDataRow = [
  status,
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
  const status = orderStatus[random(0, orderStatus.length - 1)];
  const ccy = currencies[random(0, currencies.length - 1)];
  const created = now;
  const lastUpdate = now;
  const orderId = `ORD${("0000" + i).slice(-4)}`;
  const quantity = random(1000, 10000);
  const filledQuantity = isComplete(status)
    ? quantity
    : status === "New"
      ? 0
      : random(0, quantity);
  const ric = getRic("AAP.L");
  const side = sides[random(0, sides.length - 1)];
  const trader = traders[random(0, traders.length - 1)];

  ordersData.push([
    status,
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

export const ordersTable = tableContainer.createTable(
  schemas.orders,
  ordersData,
  buildDataColumnMap(schemas, "orders"),
);

export { ordersData };
