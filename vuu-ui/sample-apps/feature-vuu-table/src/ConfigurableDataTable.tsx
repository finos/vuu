import { GridConfig } from "@finos/vuu-datagrid-types";
import { Dialog } from "@finos/vuu-popups";
import { Table, TablePropsDeprecated as TableProps } from "@finos/vuu-table";
import { ReactElement, useCallback, useState } from "react";

export const ConfigurableDataTable = ({
  config,
  dataSource,
  ...restProps
}: TableProps) => {
  const [dialogContent, setDialogContent] = useState<ReactElement | null>(null);
  const [tableConfig] = useState<Omit<GridConfig, "headings">>(config);

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
