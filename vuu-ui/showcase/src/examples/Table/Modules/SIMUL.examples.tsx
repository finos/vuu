import { NotificationsProvider } from "@vuu-ui/vuu-popups";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import "../row-classname-generators/BuySellRowClassNameGenerator";
import "../row-classname-generators/FilledRowClassNameGenerator";
import { SimulTable, SimulTableProps } from "../SimulTableTemplate";

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
    case "created":
    case "lastUpdate":
      return {
        type: {
          name: "date/time",
          formatting: {
            pattern: { time: "hh:mm:ss.ms" },
          },
        },
      };
  }
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

const rowClassGenerators = ["buy-sell-rows", "filled-rows"];

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
    rowClassNameGenerators={rowClassGenerators}
  />
);

/** tags=data-consumer */
export const ChildOrders = () => (
  <SimulTable
    tableName="childOrders"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);
