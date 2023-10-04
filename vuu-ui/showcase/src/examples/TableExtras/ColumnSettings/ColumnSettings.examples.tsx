import { ColumnFormattingPanel } from "@finos/vuu-table-extras";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { useMemo } from "react";
import { CellRendererDescriptor } from "packages/vuu-utils/src";

let displaySequence = 1;

export const ColumnFormattingPanelDouble = () => {
  const column = useMemo<ColumnDescriptor>(
    () => ({
      name: "price",
      label: "Price",
      serverDataType: "double",
    }),
    []
  );

  const availableRenderers = useMemo<CellRendererDescriptor[]>(
    () => [
      { name: "Default renderer (data type double)" },
      { name: "Background renderer" },
      { name: "Price Ticker" },
    ],

    []
  );

  return (
    <ColumnFormattingPanel
      availableRenderers={availableRenderers}
      column={column}
      selectedCellRenderer={availableRenderers[0]}
      style={{
        border: "solid 1px lightgray",
        margin: 20,
        padding: 12,
        width: 300,
      }}
    />
  );
};

ColumnFormattingPanelDouble.displaySequence = displaySequence++;
