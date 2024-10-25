import { buildValidationChecker } from "@finos/vuu-data-react";
import { DataSource, RpcResponse } from "@finos/vuu-data-types";
import { VuuRpcViewportRequest } from "@finos/vuu-protocol-types";
import type {
  ColumnDescriptor,
  DataValueTypeDescriptor,
  TableConfig,
} from "@finos/vuu-table-types";
import { hasValidationRules, isTypeDescriptor } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { Table } from "../Table";
import { BulkEditRow, type EditValueChangeHandler } from "./BulkEditRow";

import bulkEditPanelCss from "./BulkEditPanel.css";

const classBase = "vuuBulkEditPanel";

export interface BulkEditPanelProps extends HTMLAttributes<HTMLDivElement> {
  columns?: ColumnDescriptor[];
  dataSource: DataSource;
  response?: RpcResponse;
  mainTableName?: string;
  parentDs: DataSource;
}

const addRenderer = (
  colType: DataValueTypeDescriptor,
  rendererName: string,
): DataValueTypeDescriptor => {
  return {
    name: colType.name,
    rules: colType.rules,
    formatting: colType.formatting,
    renderer: { name: rendererName },
  };
};

export const BulkEditPanel = ({
  className,
  columns,
  dataSource,
  parentDs,
  ...htmlAttributes
}: BulkEditPanelProps): JSX.Element => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox-cell",
    css: bulkEditPanelCss,
    window: targetWindow,
  });

  const config: TableConfig = useMemo(() => {
    return {
      columns: columns
        ? columns.map((col) => {
            return {
              editable: col.editableBulk === "bulk",
              hidden: col.editableBulk === false,
              name: col.name,
              serverDataType: col.serverDataType ?? "string",
              type: isTypeDescriptor(col.type)
                ? addRenderer(col.type, "input-cell")
                : "string",
              clientSideEditValidationCheck: hasValidationRules(col.type)
                ? buildValidationChecker(col.type.rules)
                : undefined,
            };
          })
        : dataSource.columns.map((name) => ({
            editable: true,
            name,
            serverDataType: "string",
          })),
      rowSeparators: true,
    };
  }, [columns, dataSource.columns]);

  const bulkEditRow = useMemo(() => {
    const onBulkChange: EditValueChangeHandler = (column, value) => {
      dataSource.rpcCall?.({
        namedParams: { column: column.name, value },
        params: [],
        rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
        type: "VIEW_PORT_RPC_CALL",
      } as Omit<VuuRpcViewportRequest, "vpId">);
    };

    return <BulkEditRow dataSource={parentDs} onBulkChange={onBulkChange} />;
  }, [dataSource, parentDs]);

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
