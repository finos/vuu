import { ColumnExpressionPanel } from "@finos/vuu-table-extras";
import { getSchema } from "@finos/vuu-data-test";
import { TableConfig } from "@finos/vuu-table-types";
import { useMemo } from "react";

const instrumentPrices = { module: "SIMUL", table: "instrumentPrices" };

let displaySequence = 1;

export const DefaultColumnExpressionPanel = () => {
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: getSchema("instrumentPrices").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);

  return (
    <div style={{ margin: 10, width: 300 }}>
      <ColumnExpressionPanel
        column={{ name: "::", serverDataType: "string" }}
        tableConfig={tableConfig}
        vuuTable={instrumentPrices}
      />
    </div>
  );
};
DefaultColumnExpressionPanel.displaySequence = displaySequence++;
