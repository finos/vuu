import { DataSource, RpcResponse } from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, ReactElement, useMemo } from "react";
import { Table } from "../Table";
import { BulkEditRow } from "./BulkEditRow";
import { useBulkEditPanel } from "./useBulkEditPanel";

import bulkEditPanelCss from "./BulkEditPanel.css";

const classBase = "vuuBulkEditPanel";

export interface BulkEditPanelProps extends HTMLAttributes<HTMLDivElement> {
  columns?: ColumnDescriptor[];
  /**
   * The session dataSource. This is where the edits will be processed until final
   * confirmation, at which point edits will be applied to parent dataSource and
   * the session table torn down.
   */
  sessionDs: DataSource;
  response?: RpcResponse;
  mainTableName?: string;
  /**
   * The parent dataSource. This is where the edits will be applied once confirmed
   */
  parentDs: DataSource;
  onValidationStatusChange: (isValid: boolean) => void;
  width?: number;
}

export const BulkEditPanel = ({
  className,
  columns,
  sessionDs,
  parentDs,
  onValidationStatusChange,
  style,
  width = 600,
  ...htmlAttributes
}: BulkEditPanelProps): ReactElement => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox-cell",
    css: bulkEditPanelCss,
    window: targetWindow,
  });

  const { onBulkChange, onDataEdited, onRowChange, tableConfig } =
    useBulkEditPanel({
      columns,
      sessionDs,
      onValidationStatusChange,
    });

  const bulkEditRow = useMemo(() => {
    return (
      <BulkEditRow
        dataSource={parentDs}
        onBulkChange={onBulkChange}
        onRowChange={onRowChange}
      />
    );
  }, [onBulkChange, onRowChange, parentDs]);

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      style={{ ...style, display: "flex", flexDirection: "column" }}
    >
      <div className={`${classBase}-toolbar`} />
      <div className={`${classBase}-table`}>
        <Table
          allowDragColumnHeader={false}
          config={tableConfig}
          customHeader={bulkEditRow}
          dataSource={sessionDs}
          height={380}
          width={width}
          showColumnHeaderMenus={false}
          selectionModel="none"
          onDataEdited={onDataEdited}
          maxViewportRowLimit={10}
        />
      </div>
    </div>
  );
};
