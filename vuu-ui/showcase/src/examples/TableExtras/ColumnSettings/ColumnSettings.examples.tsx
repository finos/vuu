import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { ColumnFormattingPanel } from "@finos/vuu-table-extras";
import { CellRendererDescriptor } from "@finos/vuu-utils";
import { useMemo } from "react";

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
      onChangeFormatting={() => console.log("onChangeFormatting")}
      onChangeRenderer={() => console.log("onChangeRenderer")}
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
