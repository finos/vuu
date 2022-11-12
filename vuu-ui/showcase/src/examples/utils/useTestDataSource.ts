import { RemoteDataSource } from "@vuu-ui/vuu-data";
import { VuuTable } from "../../../../packages/vuu-protocol-types";
import { useMemo } from "react";
import { useAutoLoginToVuuServer } from "./useAutoLoginToVuuServer";

type Schema = { table: VuuTable; columns: { name: string; type: any }[] };
const Schemas: { [key: string]: Schema } = {
  instruments: {
    columns: [
      { name: "bbg", type: "string" },
      { name: "currency", type: "string" },
      { name: "description", type: "string" },
      { name: "exchange", type: "string" },
      { name: "isin", type: "string" },
      { name: "lotSize", type: "int" },
      { name: "ric", type: "string" },
    ],
    table: { module: "SIMUL", table: "instruments" },
  },
  orders: {
    columns: [
      { name: "ccy", type: "string" },
      { name: "created", type: "long" },
      {
        name: "filledQuantity",
        label: "Filled Quantity %",
        type: {
          name: "number",
          renderer: { name: "progress", associatedField: "quantity" },
          format: { decimals: 0 },
        },
        width: 120,
      },
      { name: "lastUpdate", type: "long" },
      { name: "orderId", type: "string" },
      { name: "quantity", type: "double" },
      { name: "ric", type: "string" },
      { name: "side", type: "char" },
      { name: "trader", type: "string" },
    ],
    table: { module: "SIMUL", table: "orders" },
  },
  parentOrders: {
    columns: [
      { name: "account", type: "string" },
      { name: "algo", type: "string" },
      { name: "averagePrice", type: "double" },
      { name: "ccy", type: "string" },
      { name: "childCount", type: "int" },
      { name: "exchange", type: "string" },
      { name: "filledQty", type: "int" },
      { name: "id", type: "string" },
      { name: "idAsInt", type: "int" },
      { name: "lastUpdate", type: "long" },
      { name: "openQty", type: "int" },
      { name: "price", type: "double" },
      { name: "quantity", type: "int" },
      { name: "ric", type: "string" },
      { name: "side", type: "string" },
      { name: "status", type: "string" },
      { name: "volLimit", type: "double" },
    ],
    table: { module: "SIMUL", table: "parentOrders" },
  },
  prices: {
    columns: [
      {
        name: "ask",
        label: "Ask",
        type: {
          name: "number",
          renderer: { name: "background", flashStyle: "arrow-bg" },
          formatting: { decimals: 2, zeroPad: true },
        },
        aggregate: "avg",
      },
      { name: "askSize", type: "int" },
      {
        label: "Bid",
        name: "bid",
        type: {
          name: "number",
          renderer: { name: "background", flashStyle: "arrow-bg" },
          formatting: { decimals: 2, zeroPad: true },
        },
        aggregate: "avg",
      },
      { name: "bidSize", type: "int" },
      { name: "close", type: "double" },
      { name: "last", type: "double" },
      { name: "open", type: "double" },
      { name: "phase", type: "string" },
      { name: "ric", type: "string" },
      { name: "scenario", type: "string" },
    ],
    table: { module: "SIMUL", table: "prices" },
  },
};

const configureColumns = (columns: any, columnConfig?: any) => {
  if (columnConfig) {
    return Object.keys(columnConfig).map((colname: string) => {
      const column = columns.find((col) => col.name === colname);
      return {
        ...column,
        ...columnConfig[colname],
      };
    });
  } else {
    return columns;
  }
};

export const useTestDataSource = ({
  autoLogin = true,
  bufferSize = 100,
  columnConfig,
  tablename = "instruments",
}: {
  autoLogin?: boolean;
  bufferSize?: number;
  columnConfig?: any;
  tablename?: string;
}) => {
  const [columns, columnNames, table] = useMemo(() => {
    const schema = Schemas[tablename];
    const configuredColumns = configureColumns(schema.columns, columnConfig);
    return [
      configuredColumns,
      configuredColumns.map((col) => col.name),
      schema.table,
    ];
  }, [columnConfig, tablename]);

  const dataSource = useMemo(() => {
    console.log(`create data source`);

    const dataConfig = {
      bufferSize,
      columns: columnNames,
      table,
      serverUrl: "127.0.0.1:8090/websocket",
    };
    return new RemoteDataSource(dataConfig);
  }, [bufferSize, columnNames, table]);

  const error = useAutoLoginToVuuServer(autoLogin);

  return {
    dataSource,
    columns,
    error,
  };
};
