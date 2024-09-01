import { useVuuMenuActions } from "@finos/vuu-data-react";
import { getSchema, SimulTableName, vuuModule } from "@finos/vuu-data-test";
import { ContextMenuProvider, NotificationsProvider } from "@finos/vuu-popups";
import { Table, TableProps } from "@finos/vuu-table";
import type {
  ColumnDescriptor,
  ColumnLayout,
  DefaultColumnConfiguration
} from "@finos/vuu-table-types";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { DemoTableContainer } from "./DemoTableContainer";
import "./BuySellRowClassNameGenerator";

//import { BulkEditRow } from "@finos/vuu-table";

let displaySequence = 1;

const getDefaultColumnConfig = (
  tableName: string,
  columnName: string
): Partial<ColumnDescriptor> | undefined => {
  switch (columnName) {
    case "ask":
    case "bid":
      return {
        type: {
          name: "number",
          renderer: {
            name: "vuu.price-move-background",
            flashStyle: "arrow-bg"
          },
          formatting: { decimals: 2, zeroPad: true }
        }
      };
    case "askSize":
    case "bidSize":
      return {
        type: {
          name: "number",
          renderer: {
            name: "vuu.price-move-background",
            flashStyle: "bg-only"
          },
          formatting: { decimals: 0 }
        }
      };

    case "last":
    case "open":
    case "close":
      return {
        type: {
          name: "number",
          formatting: { decimals: 2, zeroPad: true }
        }
      };
    case "wishlist":
      return { editable: true };
  }
};

export const SimulTable = ({
  columnLayout,
  getDefaultColumnConfig,
  height = 625,
  renderBufferSize = 0,
  rowClassNameGenerators,
  tableName = "instruments",
  ...props
}: Partial<TableProps> & {
  columnLayout?: ColumnLayout;
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  rowClassNameGenerators?: string[];
  tableName?: SimulTableName;
}) => {
  const schema = getSchema(tableName);

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columnLayout,
        columns: applyDefaultColumnConfig(schema, getDefaultColumnConfig),
        rowClassNameGenerators,
        rowSeparators: true,
        zebraStripes: true
      },
      dataSource: vuuModule<SimulTableName>("SIMUL").createDataSource(tableName)
    }),
    [
      columnLayout,
      getDefaultColumnConfig,
      rowClassNameGenerators,
      schema,
      tableName
    ]
  );

  const handleConfigChange = useCallback(() => {
    // console.log(JSON.stringify(config, null, 2));
  }, []);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource
  });

  return (
    <>
      <ContextMenuProvider
        menuActionHandler={handleMenuAction}
        menuBuilder={buildViewserverMenuOptions}
      >
        <DemoTableContainer>
          <Table
            {...tableProps}
            height={height}
            onConfigChange={handleConfigChange}
            renderBufferSize={renderBufferSize}
            {...props}
          />
        </DemoTableContainer>
      </ContextMenuProvider>
    </>
  );
};
SimulTable.displaySequence = displaySequence++;

export const InstrumentsExtended = () => (
  <SimulTable
    tableName="instrumentsExtended"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);
InstrumentsExtended.displaySequence = displaySequence++;

export const Prices = () => {
  return (
    <SimulTable
      tableName="prices"
      getDefaultColumnConfig={getDefaultColumnConfig}
    />
  );
};
Prices.displaySequence = displaySequence++;

const rowClassGenerators = ["buy-sell-rows"];

export const Orders = () => {
  return (
    <NotificationsProvider>
      <SimulTable
        tableName="orders"
        rowClassNameGenerators={rowClassGenerators}
      />
    </NotificationsProvider>
  );
};
Orders.displaySequence = displaySequence++;

export const InstrumentPrices = () => (
  <SimulTable
    tableName="instrumentPrices"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);
InstrumentPrices.displaySequence = displaySequence++;
