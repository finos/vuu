import { CalculatedColumnPanel } from "@vuu-ui/vuu-table-extras";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import { useCallback, useMemo } from "react";

const instrumentPrices = { module: "SIMUL", table: "instrumentPrices" };

export const DefaultCalculatedColumnPanel = () => {
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: getSchema("instrumentPrices").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);

  const handleChangeColumn = useCallback((column: ColumnDescriptor) => {
    console.log(`change column ${JSON.stringify(column)}`);
  }, []);

  return (
    <div style={{ margin: 10, width: 300 }}>
      <CalculatedColumnPanel
        column={{ name: "::", serverDataType: "string" }}
        onChangeColumn={handleChangeColumn}
        vuuTable={instrumentPrices}
      />
    </div>
  );
};
