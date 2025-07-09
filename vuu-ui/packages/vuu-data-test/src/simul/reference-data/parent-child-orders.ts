import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { Clock } from "@vuu-ui/vuu-utils";
import { random } from "../../data-utils";
import { buildDataColumnMap, Table } from "../../Table";
import { schemas } from "../simul-schemas";
import { accounts } from "./accounts";
import { instrumentsData } from "./instruments";
import { orderStatus as statusValues } from "./orderStatus";
import { sides } from "./sides";
import { algos } from "./algos";

const childOrderData: VuuRowDataItemType[][] = [];
const parentOrderData: VuuRowDataItemType[][] = [];

const instrumentMap = buildDataColumnMap(schemas, "instruments");

const PARENT_ORDER_COUNT = 75_000;
const CHILD_ORDER_COUNT = 200_000;

const avgChildOrderPerOrder = Math.round(
  CHILD_ORDER_COUNT / PARENT_ORDER_COUNT,
);
const childMaxMultiple = 10;

const clock = new Clock({ year: 2025, month: 4, day: 15, hours: 8 });

const start = performance.now();

let childOrderId = 0;

for (let i = 0; i < PARENT_ORDER_COUNT; i++) {
  clock.advance(random(0, 100));
  const instrument = instrumentsData[random(0, instrumentsData.length - 1)];

  const orderQuantity = 1000 * random(1, 100);
  const orderStatus = statusValues[random(0, statusValues.length - 1)];
  const filledQty =
    orderStatus === "FILLED"
      ? orderQuantity
      : orderStatus === "NEW"
        ? 0
        : orderQuantity - random(100, orderQuantity);
  const openQty = orderQuantity - filledQty;

  const account = accounts[random(0, accounts.length - 1)];
  const algo = algos[random(0, algos.length - 1)];
  const averagePrice = 0;
  const ccy = "GBP";
  const exchange = instrument[instrumentMap.exchange];
  const parentOrderIdAsInt = i;
  const parentOrderId = `${parentOrderIdAsInt}`;
  const price = 100;
  const quantity = orderQuantity;
  const ric = instrument[instrumentMap.ric];
  const side = sides[random(0, sides.length - 1)];
  const status = orderStatus;
  const volLimit = 100;
  const lastUpdate = clock.now;
  const created = clock.now;

  const childOrderCount = random(
    0,
    avgChildOrderPerOrder * random(1, childMaxMultiple),
  );

  let remainingQty = orderQuantity;
  for (let j = 0; j < childOrderCount; j++) {
    // console.log(`create child`);

    const childOrderQuantity = Math.round(remainingQty / (childOrderCount - j));
    remainingQty -= childOrderQuantity;
    const childOrderStatus = statusValues[random(0, statusValues.length - 1)];
    const childFilledQty =
      orderStatus === "FILLED"
        ? childOrderQuantity
        : childOrderStatus === "NEW"
          ? 0
          : childOrderQuantity - random(100, childOrderQuantity);
    const childOpenQty = childOrderQuantity - childFilledQty;

    const averagePrice = 0;
    const childIdAsInt = childOrderId++;
    const childId = `${childIdAsInt}`;
    const lastUpdate = 0;
    const price = 100;
    const strategy = 0;

    const row: VuuRowDataItemType[] = [
      account,
      averagePrice,
      ccy,
      exchange,
      childFilledQty,
      childId,
      childIdAsInt,
      childOpenQty,
      parentOrderId,
      price,
      childOrderQuantity,
      ric,
      side,
      childOrderStatus,
      strategy,
      volLimit,
      lastUpdate,
      created,
    ];

    childOrderData.push(row);
  }

  const row: VuuRowDataItemType[] = [
    account,
    algo,
    averagePrice,
    ccy,
    childOrderCount,
    exchange,
    filledQty,
    parentOrderId,
    parentOrderIdAsInt,
    openQty,
    price,
    quantity,
    ric,
    side,
    status,
    volLimit,
    lastUpdate,
    created,
  ];

  parentOrderData.push(row);
}
const end = performance.now();

console.log(
  `took ${end - start} to create ${parentOrderData.length} orders and ${childOrderData.length} child orders`,
);

export const parentOrdersTable = new Table(
  schemas.parentOrders,
  parentOrderData,
  buildDataColumnMap(schemas, "parentOrders"),
);

export const childOrdersTable = new Table(
  schemas.childOrders,
  childOrderData,
  buildDataColumnMap(schemas, "childOrders"),
);

export { childOrderData, parentOrderData };
