import { DatagridSettingsPanel } from "@finos/vuu-table-extras";
import { ColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { useCallback, useMemo } from "react";
import { useColumns } from "../utils/useColumns";

export const InstrumentsTableSettings = () => {
  const columns: ColumnDescriptor[] = useMemo(
    () => [
      { name: "bbg", serverDataType: "string" },
      { name: "currency", serverDataType: "string" },
      { name: "description", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "isin", serverDataType: "string" },
      { name: "lotSize", serverDataType: "int" },
      { name: "ric", serverDataType: "string" },
    ],
    []
  );
  const { columns: availableColumns } = useColumns(columns);

  const config = {
    columns: [],
  };

  const handleConfigChange = useCallback((config: GridConfig) => {
    console.log("config change", {
      config,
    });
  }, []);

  return (
    <DatagridSettingsPanel
      availableColumns={availableColumns}
      gridConfig={config}
      onConfigChange={handleConfigChange}
      style={{ border: "solid 1px var(--salt-container-primary-borderColor)" }}
    />
  );
};

export const PricesTableSettings = () => {
  const columns: ColumnDescriptor[] = useMemo(
    () => [
      { name: "ask", serverDataType: "double" },
      { name: "askSize", serverDataType: "int" },
      { name: "bid", serverDataType: "double" },
      { name: "bidSize", serverDataType: "int" },
      { name: "close", serverDataType: "double" },
      { name: "last", serverDataType: "double" },
      { name: "open", serverDataType: "double" },
      { name: "phase", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
      { name: "scenario", serverDataType: "string" },
    ],
    []
  );
  const { columns: availableColumns } = useColumns(columns);

  const config = {
    columns: [],
  };

  const handleConfigChange = useCallback((config: GridConfig) => {
    console.log("config change", {
      config,
    });
  }, []);

  return (
    <DatagridSettingsPanel
      availableColumns={availableColumns}
      gridConfig={config}
      onConfigChange={handleConfigChange}
      style={{ border: "solid 1px var(--salt-container-primary-borderColor)" }}
    />
  );
};
