import {
  authenticate,
  connectToServer,
  RemoteDataSource,
} from "@vuu-ui/data-remote";
import { useEffect, useMemo } from "react";

const instrumentColumns = [
  { name: "bbg", type: "string" },
  { name: "currency", type: "string" },
  { name: "description", type: "string" },
  { name: "exchange", type: "string" },
  { name: "isin", type: "string" },
  { name: "lotSize", type: "int" },
  { name: "ric", type: "string" },
];

const instrumentColumnNames = instrumentColumns.map((col) => col.name);

export const useTestDataSource = () => {
  const dataSource = useMemo(() => {
    const dataConfig = {
      bufferSize: 100,
      columns: instrumentColumnNames,
      table: { table: "instruments", module: "SIMUL" },
      serverUrl: "127.0.0.1:8090/websocket",
    };
    return new RemoteDataSource(dataConfig);
  }, []);

  useEffect(() => {
    const connect = async () => {
      const authToken = (await authenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

  return {
    dataSource,
    instrumentColumns,
  };
};
