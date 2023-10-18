import { ColumnExpressionPanel } from "@finos/vuu-table-extras";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { useCallback } from "react";
import { useTableConfig } from "../utils";

const instrumentPrices = { module: "SIMUL", table: "instrumentPrices" };

let displaySequence = 1;

export const DefaultColumnExpressionPanel = () => {
  const { config: tableConfig } = useTableConfig({
    rangeChangeRowset: "full",
    table: instrumentPrices,
  });

  const handleSave = useCallback((column: ColumnDescriptor) => {
    console.log(JSON.stringify(column));
  }, []);

  return (
    <div style={{ margin: 10, width: 300 }}>
      <ColumnExpressionPanel
        column={{ name: "::", serverDataType: "string" }}
        onSave={handleSave}
        tableConfig={tableConfig}
        vuuTable={instrumentPrices}
      />
    </div>
  );
};
DefaultColumnExpressionPanel.displaySequence = displaySequence++;
