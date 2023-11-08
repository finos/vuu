import { TableSchema } from "@finos/vuu-data";
import { ColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";
import { TableNext, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
import columns from "./basketConstituentEditColumns";

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
  dataSource,
  tableSchema,
  ...props
}: BasketTableEditProps) => {
  useMemo(() => {
    dataSource.columns = columns.map((col) => col.name);
  }, [dataSource]);

  const tableConfig = useMemo<TableConfig>(
    () => ({
      columns,
      rowSeparators: true,
    }),
    []
  );

  return (
    <TableNext
      {...props}
      dataSource={dataSource}
      renderBufferSize={20}
      className={classBase}
      config={tableConfig}
      rowHeight={21}
    />
  );
};
