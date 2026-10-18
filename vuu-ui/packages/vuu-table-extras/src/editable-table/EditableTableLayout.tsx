import type { HTMLAttributes } from "react";
import { DataSourceStats } from "../datasource-stats/DatasourceStats";
import { TableEditorButtons } from "../table-editor";
import { useTableEditorContext } from "../table-editor/TableEditorContext";
import { TableFooter, TableFooterTray } from "../table-footer/TableFooter";

export interface EditableTableFooterProps
  extends HTMLAttributes<HTMLDivElement> {
  /** @default "Save" */
  saveLabel?: string;
}

/**
 * The footer of an `EditableTable`. Shows Save and Cancel (and Delete)
 * while a session is being edited, and `children` otherwise. `children`
 * default to the row count. With direct editing there is nothing to save,
 * so it always shows `children`.
 */
export const EditableTableFooter = ({
  children,
  saveLabel,
  ...htmlAttributes
}: EditableTableFooterProps) => {
  const { dataSource, editableTable } = useTableEditorContext(
    "EditableTableFooter",
  );
  return (
    <TableFooter {...htmlAttributes}>
      {editableTable?.isEditSessionReady ? (
        <TableFooterTray position="center">
          <TableEditorButtons saveLabel={saveLabel} />
        </TableFooterTray>
      ) : (
        (children ?? <DataSourceStats dataSource={dataSource} />)
      )}
    </TableFooter>
  );
};
