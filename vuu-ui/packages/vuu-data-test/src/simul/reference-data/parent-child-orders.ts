import { Clock } from "@vuu-ui/vuu-utils";
import tableContainer from "../../core/table/TableContainer";
import { random } from "../../data-utils";
import { buildDataColumnMap } from "../../Table";
import { schemas } from "../simul-schemas";
import { accounts } from "./accounts";
import { algos } from "./algos";
import { instrumentsData } from "./instruments";
import { orderStatus as statusValues } from "./orderStatus";
import { sides } from "./sides";

const instrumentMap = buildDataColumnMap(schemas, "instruments");

// const PARENT_ORDER_COUNT = 75_000;
const PARENT_ORDER_COUNT = 5_000;
const CHILD_ORDER_COUNT = 20_000;
// const CHILD_ORDER_COUNT = 200_000;

const avgChildOrderPerOrder = Math.round(
  CHILD_ORDER_COUNT / PARENT_ORDER_COUNT,
);
const childMaxMultiple = 10;

const clock = new Clock().goBack(120, "minutes");
// console.log(`starting order generation at ${clock}`);

export const parentOrdersTable = tableContainer.createTable(
  schemas.parentOrders,
  [],
  buildDataColumnMap(schemas, "parentOrders"),
);

export const childOrdersTable = tableContainer.createTable(
  schemas.childOrders,
  [],
  buildDataColumnMap(schemas, "childOrders"),
);

let parentOrderCount = 0;
let childOrderCount = 0;
let notifyNewOrders = false;

function createParentAndChildOrders() {
  parentOrderCount += 1;
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
  const parentOrderIdAsInt = parentOrderCount;
  const parentOrderId = parentOrderCount.toString().padStart(10, "0");
  const price = 100;
  const quantity = orderQuantity;
  const ric = instrument[instrumentMap.ric];
  const side = sides[random(0, sides.length - 1)];
  const status = orderStatus;
  const volLimit = 100;
  const lastUpdate = clock.now;
  const created = clock.now;

  const numberOfChildOrders = random(
    0,
    avgChildOrderPerOrder * random(1, childMaxMultiple),
  );

  let remainingQty = orderQuantity;
  for (let j = 0; j < numberOfChildOrders; j++) {
    childOrderCount += 1;

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
    const childIdAsInt = childOrderCount;
    const childId = childOrderCount.toString().padStart(10, "0");
    const lastUpdate = 0;
    const price = 100;
    const strategy = 0;

    childOrdersTable.insert(
      [
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
      ],
      notifyNewOrders,
    );
  }

  parentOrdersTable.insert(
    [
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
    ],
    notifyNewOrders,
  );
}

function createInitialOrders() {
  // const start = performance.now();
  for (let i = 0; i < PARENT_ORDER_COUNT; i++) {
    clock.advance(random(0, 100));
    createParentAndChildOrders();
  }
  // const end = performance.now();
  // console.log(
  //   `took ${end - start} to create ${parentOrdersTable.data.length} orders and ${childOrdersTable.data.length} child orders, last order created at ${clock}`,
  // );
}

let newOrderInterval: undefined | ReturnType<typeof setInterval> = undefined;

export function startGeneratingNewOrders() {
  newOrderInterval = setInterval(createParentAndChildOrders, 100);
}

export function stopGeneratingNewOrders() {
  clearInterval(newOrderInterval);
}

createInitialOrders();

clock.showCurrentTime = true;
notifyNewOrders = true;

// startGeneratingNewOrders();
