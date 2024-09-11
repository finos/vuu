import { ColumnDescriptor } from "@finos/vuu-table-types";

const Average = 2;

const ccy: Partial<ColumnDescriptor> = {
  name: "ccy",
  label: "CCY",
  width: 100
};

const filledQuantity: Partial<ColumnDescriptor> = {
  label: "Filled Qty",
  name: "filledQuantity",
  minWidth: 150,
  type: {
    name: "number",
    renderer: { name: "progress", associatedField: "quantity" },
    formatting: { decimals: 0 }
  }
};

const ric: Partial<ColumnDescriptor> = {
  name: "ric",
  label: "RIC",
  type: {
    name: "string"
  },
  width: 60
};

const side: Partial<ColumnDescriptor> = {
  label: "Side",
  name: "side",
  type: {
    name: "string"
  },
  width: 60
};

const columnMetaData: { [key: string]: Partial<ColumnDescriptor> } = {
  bbg: {
    name: "bbg",
    label: "BBG",
    type: {
      name: "string"
    },
    editableBulk: "bulk"
  },

  currency: {
    name: "currency",
    label: "Currency",
    width: 100,
    editableBulk: "bulk"
  },
  date: {
    name: "date",
    label: "Date",
    type: {
      name: "date/time"
    },
    editableBulk: "bulk"
  },
  description: {
    name: "description",
    label: "Description",
    type: {
      name: "string"
    },
    editableBulk: "bulk",
    width: 150
  },
  exchange: {
    editableBulk: false,
    name: "exchange",
    label: "Exchange",
    type: {
      name: "string"
    }
  },

  isin: {
    editableBulk: false,
    name: "isin",
    label: "ISIN",
    type: {
      name: "string"
    }
  },

  lotSize: {
    editableBulk: "bulk",
    label: "Lot Size",
    name: "lotSize",
    width: 120,
    type: {
      name: "number"
    }
  },

  price: {
    editableBulk: "bulk",
    label: "Price",
    name: "price",
    type: {
      name: "number",
      formatting: { decimals: 2, zeroPad: true }
    },
    aggregate: Average
  },
  ric: {
    editableBulk: "read-only"
  }
};

type TableColDefs = { [key: string]: Partial<ColumnDescriptor> };

const tables: { [key: string]: TableColDefs } = {
  orders: {
    ccy,
    filledQuantity,
    ric,
    side
  },
  ordersPrices: {
    ccy,
    filledQuantity,
    ric,
    side
  }
};

export const getDefaultColumnConfig = (
  tableName: string,
  columnName: string
) => {
  return tables[tableName]?.[columnName] ?? columnMetaData[columnName];
};
