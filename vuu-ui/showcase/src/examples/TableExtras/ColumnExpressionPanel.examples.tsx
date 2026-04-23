import { CalculatedColumnPanel, ColumnModel } from "@vuu-ui/vuu-table-extras";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useCallback, useMemo } from "react";

const instrumentPrices = { module: "SIMUL", table: "instrumentPrices" };

export const DefaultCalculatedColumnPanel = () => {
  const columnModel = useMemo(() => {
    const { columns } = getSchema("instrumentPrices");
    return new ColumnModel(columns, columns.slice(0, 10));
  }, []);

  const handleChangeColumn = useCallback((column: ColumnDescriptor) => {
    console.log(`change column ${JSON.stringify(column)}`);
  }, []);

  return (
    <div style={{ margin: 10, width: 300 }}>
      <CalculatedColumnPanel
        column={{ name: "::", serverDataType: "string" }}
        columnModel={columnModel}
        onChangeColumn={handleChangeColumn}
        vuuTable={instrumentPrices}
      />
    </div>
  );
};
