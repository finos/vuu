import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { DataSource, RpcResponse } from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { HTMLAttributes, ReactElement, useMemo } from "react";
import { Table } from "../Table";
import { ColumnCascadingUpdateEditor } from "./ColumnCascadingUpdateEditor";
import { InsertNewRowEditor } from "./InsertNewRowEditor";
import { useBulkEditPanel } from "./useBulkEditPanel";

import bulkEditPanelCss from "./BulkEditPanel.css";

const classBase = "vuuBulkEditPanel";

export interface BulkEditPanelProps extends HTMLAttributes<HTMLDivElement> {
  columns?: ColumnDescriptor[];
  showColumnCascadingUpdateEditor?: boolean;
  showInsertNewRowEditor?: boolean;
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
  width?: number;
}

export const BulkEditPanel = ({
  className,
  columns,
  sessionDs,
  showColumnCascadingUpdateEditor = false,
  showInsertNewRowEditor = false,
  parentDs,
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

  const { onBulkChange, onRowChange, tableConfig } = useBulkEditPanel({
    columns,
    sessionDs,
  });

  const bulkEditRow = useMemo(() => {
    if (showColumnCascadingUpdateEditor && showInsertNewRowEditor) {
      return [
        <InsertNewRowEditor
          key={1}
          onBulkChange={onBulkChange}
          onRowChange={onRowChange}
        />,
        <ColumnCascadingUpdateEditor
          key={2}
          onBulkChange={onBulkChange}
          onRowChange={onRowChange}
        />,
      ];
    } else if (showColumnCascadingUpdateEditor) {
      return (
        <ColumnCascadingUpdateEditor
          onBulkChange={onBulkChange}
          onRowChange={onRowChange}
        />
      );
    } else if (showInsertNewRowEditor) {
      return (
        <ColumnCascadingUpdateEditor
          onBulkChange={onBulkChange}
          onRowChange={onRowChange}
        />
      );
    }
  }, [
    onBulkChange,
    onRowChange,
    showColumnCascadingUpdateEditor,
    showInsertNewRowEditor,
  ]);

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
          maxViewportRowLimit={10}
        />
      </div>
    </div>
  );
};
