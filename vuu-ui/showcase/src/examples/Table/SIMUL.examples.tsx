import { useVuuMenuActions } from "@finos/vuu-data-react";
import { getSchema, SimulTableName, vuuModule } from "@finos/vuu-data-test";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { DefaultColumnConfiguration } from "@finos/vuu-shell";
import { Table, TableProps } from "@finos/vuu-table";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";

let displaySequence = 1;

const getDefaultColumnConfig = (tableName: string, columnName: string) => {
  switch (columnName) {
    case "ask":
    case "bid":
      return {
        type: {
          name: "number",
          renderer: {
            name: "vuu.price-move-background",
            flashStyle: "arrow-bg",
          },
          formatting: { decimals: 2, zeroPad: true },
        },
      };
    case "askSize":
    case "bidSize":
      return {
        type: {
          name: "number",
          renderer: {
            name: "vuu.price-move-background",
            flashStyle: "bg-only",
          },
          formatting: { decimals: 0 },
        },
      };

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
};

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

  const handleConfigChange = useCallback((config) => {
    console.log(JSON.stringify(config, null, 2));
  }, []);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
  });
  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}
    >
      <Table
        {...tableProps}
        onConfigChange={handleConfigChange}
        renderBufferSize={0}
      />
    </ContextMenuProvider>
  );
};

export const Instruments = () => <SimulTable tableName="instruments" />;
Instruments.displaySequence = displaySequence++;

export const Prices = () => {
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

export const InstrumentPrices = () => (
  <SimulTable
    tableName="instrumentPrices"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);
InstrumentPrices.displaySequence = displaySequence++;
