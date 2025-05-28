import { useVuuMenuActions } from "@finos/vuu-data-react";
import { getSchema, SimulTableName } from "@finos/vuu-data-test";
import { ContextMenuProvider, NotificationsProvider } from "@finos/vuu-popups";
import { Table, TableProps } from "@finos/vuu-table";
import type {
  ColumnDescriptor,
  ColumnLayout,
  DefaultColumnConfiguration,
} from "@finos/vuu-table-types";
import {
  applyDefaultColumnConfig,
  toColumnName,
  useDataSource,
} from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { DemoTableContainer } from "../DemoTableContainer";
import "../BuySellRowClassNameGenerator";

const getDefaultColumnConfig = (
  tableName: string,
  columnName: string,
): Partial<ColumnDescriptor> | undefined => {
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
    case "wishlist":
      return { editable: true };
  }
};

export type SimulTableProps = Partial<TableProps> & {
  columnLayout?: ColumnLayout;
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  rowClassNameGenerators?: string[];
  tableName?: SimulTableName;
};

const SimulTable = ({
  columnLayout,
  getDefaultColumnConfig,
  height = 625,
  renderBufferSize = 10,
  rowClassNameGenerators,
  tableName = "instruments",
  ...props
}: SimulTableProps) => {
  const { VuuDataSource } = useDataSource();

  const tableSchema = getSchema(tableName);

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columnLayout,
        columns: applyDefaultColumnConfig(tableSchema, getDefaultColumnConfig),
        rowClassNameGenerators,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource: new VuuDataSource({
        columns: tableSchema.columns.map(toColumnName),
        table: tableSchema.table,
      }),
    }),
    [
      columnLayout,
      tableSchema,
      getDefaultColumnConfig,
      rowClassNameGenerators,
      VuuDataSource,
    ],
  );

  const handleConfigChange = useCallback(() => {
    // console.log(JSON.stringify(config, null, 2));
  }, []);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
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

/** tags=data-consumer */
export const Instruments = (props: Omit<SimulTableProps, "tableName">) => (
  <SimulTable
    {...props}
    tableName="instruments"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);

/** tags=data-consumer */
export const InstrumentsExtended = () => (
  <SimulTable
    tableName="instrumentsExtended"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);

/** tags=data-consumer */
export const Prices = () => {
  return (
    <SimulTable
      tableName="prices"
      getDefaultColumnConfig={getDefaultColumnConfig}
    />
  );
};

const rowClassGenerators = ["buy-sell-rows"];

/** tags=data-consumer */
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

/** tags=data-consumer */
export const InstrumentPrices = () => (
  <SimulTable
    tableName="instrumentPrices"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);

/** tags=data-consumer */
export const ParentOrders = () => (
  <SimulTable
    tableName="parentOrders"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);

/** tags=data-consumer */
export const ChildOrders = () => (
  <SimulTable
    tableName="childOrders"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);
