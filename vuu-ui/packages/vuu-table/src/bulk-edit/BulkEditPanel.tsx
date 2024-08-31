import { DataSource, RpcResponse } from "@finos/vuu-data-types";
import { VuuRpcViewportRequest } from "@finos/vuu-protocol-types";
import type { TableConfig } from "@finos/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { Table } from "../Table";
import { BulkEditRow, type EditValueChangeHandler } from "./BulkEditRow";

import bulkEditPanelCss from "./BulkEditPanel.css";

const classBase = "vuuBulkEditPanel";

export interface BulkEditPanelProps extends HTMLAttributes<HTMLDivElement> {
  dataSource: DataSource;
  response?: RpcResponse;
  mainTableName?: string;
}

export const BulkEditPanel = ({
  className,
  dataSource,
  ...htmlAttributes
}: BulkEditPanelProps): JSX.Element => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox-cell",
    css: bulkEditPanelCss,
    window: targetWindow
  });

  const bulkEditRow = useMemo(() => {
    const onChange: EditValueChangeHandler = (column, value) => {
      dataSource.rpcCall?.({
        namedParams: { column: column.name, value },
        params: [],
        rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
        type: "VIEW_PORT_RPC_CALL"
      } as Omit<VuuRpcViewportRequest, "vpId">);
    };
    return <BulkEditRow onChange={onChange} />;
  }, [dataSource]);

  const config: TableConfig = useMemo(() => {
    return {
      columns: dataSource.columns.map((name) => ({
        editable: true,
        name,
        serverDataType: "string"
      })),
      rowSeparators: true
    };
  }, [dataSource]);

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className={`${classBase}-toolbar`} />
      <div className={`${classBase}-table`}>
        <Table
          allowDragColumnHeader={false}
          config={config}
          customHeader={bulkEditRow}
          dataSource={dataSource}
          height={400}
          width={600}
          showColumnHeaderMenus={false}
          selectionModel="none"
        />
      </div>
    </div>
  );
};
