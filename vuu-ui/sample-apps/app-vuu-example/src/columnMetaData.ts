import { ColumnDescriptor } from "@finos/vuu-datagrid-types";

const Average = 2;

const ccy: Partial<ColumnDescriptor> = {
  name: "ccy",
  label: "CCY",
  width: 60,
};

const filledQuantity: Partial<ColumnDescriptor> = {
  label: "Filled Qty",
  name: "filledQuantity",
  minWidth: 150,
  type: {
    name: "number",
    renderer: { name: "progress", associatedField: "quantity" },
    formatting: { decimals: 0 },
  },
};

const ric: Partial<ColumnDescriptor> = {
  name: "ric",
  label: "RIC",
  type: {
    name: "string",
  },
  width: 60,
};

const side: Partial<ColumnDescriptor> = {
  label: "Side",
  name: "side",
  type: {
    name: "string",
  },
  width: 60,
};

const columnMetaData: { [key: string]: Partial<ColumnDescriptor> } = {
  account: {
    label: "Account",
    name: "account",
    type: {
      name: "string",
    },
  },
  algo: {
    label: "Algo",
    name: "algo",
    type: {
      name: "string",
    },
  },
  ask: {
    name: "ask",
    label: "Ask",
    type: {
      name: "number",
      renderer: { name: "vuu.price-move-background", flashStyle: "arrow-bg" },
      formatting: { decimals: 2, zeroPad: true },
    },
    aggregate: Average,
  },
  askSize: {
    name: "askSize",
    label: "Ask Size",
    type: {
      name: "number",
    },
    aggregate: Average,
  },
  averagePrice: {
    label: "Average Price",
    name: "averagePrice",
    type: {
      name: "number",
    },
    aggregate: Average,
  },
  bbg: {
    name: "bbg",
    label: "BBG",
    type: {
      name: "string",
    },
  },
  bid: {
    label: "Bid",
    name: "bid",
    type: {
      name: "number",
      renderer: { name: "vuu.price-move-background", flashStyle: "arrow-bg" },
      formatting: { decimals: 2, zeroPad: true },
    },
    aggregate: Average,
  },
  bidSize: {
    label: "Bid Size",
    name: "bidSize",
    type: {
      name: "number",
      renderer: { name: "vuu.price-move-background", flashStyle: "bg-only" },
      formatting: { decimals: 2, zeroPad: true },
    },
    aggregate: Average,
  },
  childCount: {
    label: "Child Count",
    name: "childCount",
    type: {
      name: "number",
    },
    aggregate: Average,
  },

  close: {
    label: "Close",
    name: "close",
    type: {
      name: "number",
      formatting: { decimals: 2, zeroPad: true },
    },
    aggregate: Average,
  },
  clOrderId: {
    label: "Child Order ID",
    name: "clOrderId",
    width: 60,
  },
  created: {
    label: "Created",
    name: "created",
    type: {
      name: "time",
    },
  },
  currency: {
    name: "currency",
    label: "CCY",
    width: 60,
  },
  description: {
    name: "description",
    label: "Description",
    type: {
      name: "string",
    },
  },
  exchange: {
    name: "exchange",
    label: "Exchange",
    type: {
      name: "string",
    },
  },
  filledQty: {
    label: "Filled Qty",
    name: "filledQty",
    width: 150,
    type: {
      name: "number",
    },
  },
  id: {
    name: "id",
    label: "ID",
    type: {
      name: "string",
    },
  },
  idAsInt: {
    label: "ID (int)",
    name: "idAsInt",
    type: {
      name: "string",
    },
  },
  isin: {
    name: "isin",
    label: "ISIN",
    type: {
      name: "string",
    },
  },
  last: {
    label: "Last",
    name: "last",
    type: {
      name: "number",
      formatting: { decimals: 2, zeroPad: true },
    },
    aggregate: Average,
  },
  lastUpdate: {
    label: "Last Update",
    name: "lastUpdate",
    type: {
      name: "time",
    },
  },
  lotSize: {
    label: "Lot Size",
    name: "lotSize",
    width: 80,
    type: {
      name: "number",
    },
  },
  max: {
    label: "Max",
    name: "max",
    width: 80,
    type: {
      name: "number",
    },
  },
  mean: {
    label: "Mean",
    name: "mean",
    width: 80,
    type: {
      name: "number",
    },
  },
  open: {
    label: "Open",
    name: "open",
    type: {
      name: "number",
      formatting: { decimals: 2, zeroPad: true },
    },
    aggregate: Average,
  },
  openQty: {
    label: "Open Qty",
    name: "openQty",
    width: 80,
    type: {
      name: "number",
      formatting: { decimals: 0 },
    },
  },
  orderId: {
    label: "Order ID",
    name: "orderId",
    width: 60,
  },

  phase: {
    label: "Phase",
    name: "phase",
    type: {
      name: "string",
    },
  },
  parentOrderId: {
    label: "Parent Order Id",
    name: "parentOrderId",
    width: 80,
    type: {
      name: "number",
    },
  },
  orderType: {
    label: "Order Type",
    name: "orderType",
    type: {
      name: "string",
    },
  },
  price: {
    label: "Price",
    name: "price",
    type: {
      name: "number",
      formatting: { decimals: 2, zeroPad: true },
    },
    aggregate: Average,
  },
  priceLevel: {
    label: "Price Level",
    name: "priceLevel",
    type: {
      name: "string",
    },
  },
  quantity: {
    label: "Quantity",
    name: "quantity",
    width: 80,
    type: {
      name: "number",
    },
  },
  scenario: {
    label: "Scenario",
    name: "scenario",
    type: {
      name: "string",
    },
  },
  size: {
    label: "Size",
    name: "size",
    width: 80,
    type: {
      name: "number",
    },
  },
  status: {
    label: "Status",
    name: "status",
    type: {
      name: "string",
    },
  },
  strategy: {
    label: "Strategy",
    name: "strategy",
    type: {
      name: "string",
    },
  },
  table: {
    label: "Table",
    name: "table",
    type: {
      name: "string",
    },
  },
  trader: {
    label: "Trader",
    name: "trader",
    type: {
      name: "string",
    },
  },
  uniqueId: {
    label: "Unique ID",
    name: "uniqueId",
    type: {
      name: "string",
    },
  },
  updateCount: {
    label: "Update Count",
    name: "updateCount",
    width: 80,
    type: {
      name: "number",
    },
  },
  updatesPerSecond: {
    label: "Updates Per Second",
    name: "updatesPerSecond",
    width: 80,
    type: {
      name: "number",
    },
  },
  user: {
    label: "User",
    name: "user",
    type: {
      name: "string",
    },
  },
  volLimit: {
    label: "Vol Limit",
    name: "volLimit",
    width: 80,
    type: {
      name: "number",
    },
  },
};

type TableColDefs = { [key: string]: Partial<ColumnDescriptor> };

const tables: { [key: string]: TableColDefs } = {
  orders: {
    ccy,
    filledQuantity,
    ric,
    side,
  },
  ordersPrices: {
    ccy,
    filledQuantity,
    ric,
    side,
  },
};

export const getDefaultColumnConfig = (
  tableName: string,
  columnName: string
) => {
  return tables[tableName]?.[columnName] ?? columnMetaData[columnName];
};
