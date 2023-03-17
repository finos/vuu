import { DatagridSettingsPanel } from "@finos/vuu-datagrid-extras";
import { GridConfig } from "@finos/vuu-datagrid-types";
import { Table, TableProps } from "@finos/vuu-table";
import { Dialog } from "@finos/vuu-popups";
import { itemsChanged, toDataSourceColumns } from "@finos/vuu-utils";
import { ReactElement, useCallback, useRef, useState } from "react";

export const ConfigurableDataTable = ({
  config,
  dataSource,
  ...restProps
}: TableProps) => {
  const [dialogContent, setDialogContent] = useState<ReactElement | null>(null);
  const configRef = useRef<Omit<GridConfig, "headings">>(config);
  const [tableConfig, setTableConfig] =
    useState<Omit<GridConfig, "headings">>(config);

  const handleSettingsConfigChange = useCallback(
    (config: GridConfig, closePanel = false) => {
      console.log(`Table.examples config changed`, {
        config,
      });
      setTableConfig((currentConfig) => {
        if (itemsChanged(currentConfig.columns, config.columns, "name")) {
          // side effect: update columns on dataSource
          dataSource.columns = config.columns.map(toDataSourceColumns);
        }
        return (configRef.current = config);
      });
      closePanel && setDialogContent(null);
    },
    [dataSource]
  );

  const showConfigEditor = useCallback(() => {
    setDialogContent(
      <DatagridSettingsPanel
        availableColumns={config.columns}
        gridConfig={configRef.current}
        onConfigChange={handleSettingsConfigChange}
      />
    );
  }, [config.columns, handleSettingsConfigChange]);

  const hideSettings = useCallback(() => {
    setDialogContent(null);
  }, []);

  return (
    <>
      <Table
        {...restProps}
        allowConfigEditing
        config={tableConfig}
        dataSource={dataSource}
        onShowConfigEditor={showConfigEditor}
      />
      <Dialog
        className="vuuDialog-gridConfig"
        isOpen={dialogContent !== null}
        onClose={hideSettings}
        title="Grid and Column Settings"
      >
        {dialogContent}
      </Dialog>
    </>
  );
};
