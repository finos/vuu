import { useServerConnectionQuality } from "@finos/vuu-data-react";
import { getAllSchemas } from "@finos/vuu-data-test";
import { SubscribeCallback } from "@finos/vuu-data-types";
import { useCallback } from "react";
import { ErrorDisplay, useTestDataSource } from "../utils";

let displaySequence = 1;

export const ConnectionMetrics = () => {
  const pricesTableColumns = [
    "ask",
    "askSize",
    "bid",
    "bidSize",
    "close",
    "last",
    "open",
    "phase",
    "ric",
    "scenario",
  ];
  const messagesPerSecond = useServerConnectionQuality();
  const schemas = getAllSchemas();
  const { error, dataSource } = useTestDataSource({
    schemas,
    tablename: "prices",
  });
  const dataSourceHandler: SubscribeCallback = useCallback((message) => {
    return message;
  }, []);

  dataSource.subscribe(
    { columns: pricesTableColumns, range: { from: 0, to: 10 } },
    dataSourceHandler
  );
  if (error) return <ErrorDisplay>{error}</ErrorDisplay>;

  return <div>Connection Speed: {messagesPerSecond} msgs/s</div>;
};
ConnectionMetrics.displaySequence = displaySequence++;
