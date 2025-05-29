import { ColumnExpressionPanel } from "@vuu-ui/vuu-table-extras";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";

const instrumentPrices = { module: "SIMUL", table: "instrumentPrices" };

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
