import { DataSource, RpcResponse } from "@finos/vuu-data-types";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { Table } from "../Table";
import { BulkEditRow } from "./BulkEditRow";
import { useBulkEditPanel } from "./useBulkEditPanel";

import bulkEditPanelCss from "./BulkEditPanel.css";

const classBase = "vuuBulkEditPanel";

export interface BulkEditPanelProps extends HTMLAttributes<HTMLDivElement> {
  columns?: ColumnDescriptor[];
  dataSource: DataSource;
  response?: RpcResponse;
  mainTableName?: string;
  parentDs: DataSource;
  onValidationStatusChange: (isValid: boolean) => void;
}

export const BulkEditPanel = ({
  className,
  columns,
  dataSource,
  parentDs,
  onValidationStatusChange,
  ...htmlAttributes
}: BulkEditPanelProps): JSX.Element => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-checkbox-cell",
    css: bulkEditPanelCss,
    window: targetWindow,
  });

  const { onBulkChange, onDataEdited, onRowChange, tableConfig } =
    useBulkEditPanel({
      columns,
      dataSource,
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
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div className={`${classBase}-toolbar`} />
      <div className={`${classBase}-table`}>
        <Table
          allowDragColumnHeader={false}
          config={tableConfig}
          customHeader={bulkEditRow}
          dataSource={dataSource}
          height={380}
          width={600}
          showColumnHeaderMenus={false}
          selectionModel="none"
          onDataEdited={onDataEdited}
          maxViewportRowLimit={10}
        />
      </div>
    </div>
  );
};
