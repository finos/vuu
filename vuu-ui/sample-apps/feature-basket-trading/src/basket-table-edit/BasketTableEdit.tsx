import { TableSchema } from "@finos/vuu-data";
import { ColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";
import {
  DropdownCell,
  InputCell,
  TableNext,
  TableProps,
} from "@finos/vuu-table";
import { useMemo } from "react";

import "./BasketTableEdit.css";

const classBase = "vuuBasketTableEdit";

export interface BasketTableEditProps extends Omit<TableProps, "config"> {
  tableSchema: TableSchema;
}

const labels: { [key: string]: string } = {
  ask: "Ask",
  bid: "Bid",
  limitPrice: "Limit Price",
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
          editable: true,
          label: labels[column.name] ?? column.name,
          type: {
            name: "number",
            formatting: {
              alignOnDecimals: true,
              decimals: 2,
              zeroPad: true,
            },
            renderer: {
              name: "input-cell",
            },
          },
        } as ColumnDescriptor;
      case "priceStrategy":
        return {
          ...column,
          editable: true,
          label: labels[column.name] ?? column.name,
          type: {
            name: "string",
            renderer: {
              name: "dropdown-cell",
              values: [
                "Strategy 1",
                "Strategy 2",
                "Strategy 3",
                "Strategy 4",
                "Strategy 5",
              ],
            },
          },
        };
      case "quantity":
        return {
          ...column,
          editable: true,
          label: labels[column.name] ?? column.name,
          type: {
            name: "number",
            formatting: {
              decimals: 0,
            },
            renderer: {
              name: "input-cell",
            },
          },
        };
      case "weighting":
        return {
          ...column,
          editable: true,
          label: labels[column.name] ?? column.name,
          type: {
            name: "number",
            formatting: {
              alignOnDecimals: true,
              decimals: 2,
              zeroPad: true,
            },
            renderer: {
              name: "input-cell",
            },
          },
        };
      default:
        return column;
    }
  });

export const BasketTableEdit = ({
  tableSchema,
  ...props
}: BasketTableEditProps) => {
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
