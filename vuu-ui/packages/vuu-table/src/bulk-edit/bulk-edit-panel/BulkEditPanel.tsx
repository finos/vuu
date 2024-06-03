import { DataSource, RpcResponse } from "@finos/vuu-data-types";
import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { TableConfig } from "packages/vuu-table-types";
import { HTMLAttributes, useMemo } from "react";
import { Table } from "../../Table";
import { BulkEditRow, EditValueChangeHandler } from "./bulk-edit-row";

import bulkEditPanelCss from "./BulkEditPanel.css";

const classBase = "vuuBulkEditPanel";

export interface BulkEditPanelProps extends HTMLAttributes<HTMLDivElement> {
  dataSource: DataSource;
  onClose?: () => void;
  onSubmit?: () => void;
  response?: RpcResponse;
  mainTableName?: string;
}

export const BulkEditPanel = ({
  className,
  dataSource,
  onClose,
  onSubmit,
  ...htmlAttributes
}: BulkEditPanelProps): JSX.Element => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox-cell",
    css: bulkEditPanelCss,
    window: targetWindow,
  });

  const bulkEditRow = useMemo(() => {
    const onChange: EditValueChangeHandler = (column, value) => {
      dataSource.rpcCall?.({
        namedParams: { column: column.name, value },
        params: [],
        rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
        type: "VIEW_PORT_RPC_CALL",
      });
    };
    return <BulkEditRow onChange={onChange} />;
  }, [dataSource]);

  const config: TableConfig = useMemo(() => {
    return {
      columns: dataSource.columns.map((name) => ({
        editable: true,
        name,
        serverDataType: "string",
      })),
    };
  }, [dataSource]);

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className={`${classBase}-table`}>
        <Table
          config={config}
          customHeader={bulkEditRow}
          dataSource={dataSource}
          height={400}
          width={600}
          showColumnHeaderMenus={false}
          selectionModel="none"
        />
      </div>

      <div className={`${classBase}-buttonBar`}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit}>Save</Button>
      </div>
    </div>
  );
};
