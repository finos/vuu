import { useVuuMenuActions } from "@finos/vuu-data-react";
import { getSchema, SimulTableName, vuuModule } from "@finos/vuu-data-test";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { DefaultColumnConfiguration } from "@finos/vuu-shell";
import { TableNext, TableProps } from "@finos/vuu-table";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { useMemo } from "react";

let displaySequence = 1;

const SimulTable = ({
  getDefaultColumnConfig,
  tableName,
}: {
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  tableName: SimulTableName;
}) => {
  const schema = getSchema(tableName);

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columns: applyDefaultColumnConfig(schema, getDefaultColumnConfig),
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
    }),
    [getDefaultColumnConfig, schema, tableName]
  );

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
  });
  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}
    >
      <TableNext {...tableProps} renderBufferSize={50} />
    </ContextMenuProvider>
  );
};

export const Instruments = () => <SimulTable tableName="instruments" />;
Instruments.displaySequence = displaySequence++;

export const Prices = () => {
  const getDefaultColumnConfig = useMemo<DefaultColumnConfiguration>(
    () => (tableName, columnName) => {
      switch (columnName) {
        case "ask":
        case "bid":
          return {
            type: {
              name: "number",
              renderer: { name: "background", flashStyle: "arrow-bg" },
              formatting: { decimals: 2, zeroPad: true },
            },
          };
        case "askSize":
        case "bidSize":
        case "last":
        case "open":
        case "close":
          return {
            type: {
              name: "number",
              formatting: { decimals: 2, zeroPad: true },
            },
          };
      }
    },
    []
  );

  return (
    <SimulTable
      tableName="prices"
      getDefaultColumnConfig={getDefaultColumnConfig}
    />
  );
};
Prices.displaySequence = displaySequence++;

export const Orders = () => <SimulTable tableName="orders" />;
Orders.displaySequence = displaySequence++;
