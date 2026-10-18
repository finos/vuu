import type { HTMLAttributes } from "react";
import { DataSourceStats } from "../datasource-stats/DatasourceStats";
import {
  TableEditorButtons,
  TableEditorTable,
  type TableEditorTableProps,
} from "../table-editor";
import { useTableEditorContext } from "../table-editor/TableEditorContext";
import { TableFooter, TableFooterTray } from "../table-footer/TableFooter";

const classBase = "vuuEditableTable";

export type EditableTableTableProps = TableEditorTableProps;

/**
 * The table of an `EditableTable`, sized to fill the rest of the
 * `EditableTable`, beside any toolbar or footer. Cells are editable in edit
 * mode.
 */
export const EditableTableTable = (props: EditableTableTableProps) => (
  <div className={`${classBase}-table`}>
    <TableEditorTable {...props} />
  </div>
);

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
