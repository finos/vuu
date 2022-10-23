export const instrumentDataSourceConfig = {
  bufferSize: 100,
  columns: [
    "bbg",
    "currency",
    "description",
    "exchange",
    "isin",
    "lotSize",
    "ric",
  ],
  table: { table: "instruments", module: "SIMUL" },
  serverUrl: "127.0.0.1:8090/websocket",
};
