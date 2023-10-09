import { TableSchema } from "@finos/vuu-data";
import { ColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";
import { TableNext, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
import { StatusCell } from "../cell-renderers";

console.log(`component loaded StatusCell ${typeof StatusCell}`);
import "./BasketTableLive.css";

const classBase = "vuuBasketTableLive";

export interface BasketTableLiveProps extends Omit<TableProps, "config"> {
  tableSchema: TableSchema;
}

const labels: { [key: string]: string } = {
  ask: "Ask",
  bid: "Bid",
  filled: "Pct Filled",
  limitPrice: "Limit Price",
  priceSpread: "Price Spread",
  priceStrategy: "Price Strategy",
  quantity: "Quantity",
  weighting: "Weighting",
};

const applyColumnDefaults = (tableSchema: TableSchema) =>
  tableSchema.columns.map<ColumnDescriptor>((column) => {
    switch (column.name) {
      case "ric":
        return {
          ...column,
          label: "Ticker",
          pin: "left",
        };
      case "status":
        return {
          ...column,
          label: labels[column.name] ?? column.name,
          type: {
            name: "string",
            renderer: {
              name: "basket-status",
            },
          },
        } as ColumnDescriptor;
      case "ask":
      case "bid":
      case "last":
        return {
          ...column,
          label: labels[column.name] ?? column.name,
          type: {
            name: "number",
            formatting: {
              alignOnDecimals: true,
              decimals: 2,
              zeroPad: true,
            },
          },
        } as ColumnDescriptor;
      case "limitPrice":
        return {
          ...column,
          label: labels[column.name] ?? column.name,
          type: {
            name: "number",
            formatting: {
              alignOnDecimals: true,
              decimals: 2,
              zeroPad: true,
            },
          },
        } as ColumnDescriptor;
      case "priceStrategy":
        return {
          ...column,
          label: labels[column.name] ?? column.name,
          type: {
            name: "string",
          },
        };
      case "priceSpread":
        return {
          ...column,
          label: labels[column.name] ?? column.name,
          type: {
            name: "number",
            renderer: {
              name: "basket-spread",
            },
          },
        };
      case "quantity":
        return {
          ...column,
          label: labels[column.name] ?? column.name,
          type: {
            name: "number",
            formatting: {
              decimals: 0,
            },
          },
        };
      case "filled":
        return {
          ...column,
          label: labels[column.name] ?? column.name,
          type: {
            name: "number",
            renderer: {
              name: "basket-progress",
              associatedField: "quantity",
            },
          },
        };
      case "weighting":
        return {
          ...column,
          label: labels[column.name] ?? column.name,
          type: {
            name: "number",
            formatting: {
              alignOnDecimals: true,
              decimals: 2,
              zeroPad: true,
            },
          },
        };
      default:
        return column;
    }
  });

export const BasketTableLive = ({
  tableSchema,
  ...props
}: BasketTableLiveProps) => {
  const tableConfig = useMemo<TableConfig>(
    () => ({
      columns: applyColumnDefaults(tableSchema),
      rowSeparators: true,
    }),
    [tableSchema]
  );

  return (
    <TableNext
      {...props}
      renderBufferSize={20}
      className={classBase}
      config={tableConfig}
      rowHeight={21}
    />
  );
};
