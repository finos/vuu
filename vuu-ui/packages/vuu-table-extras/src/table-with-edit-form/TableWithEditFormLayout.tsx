import { SidePanel, type SidePanelProps } from "@salt-ds/core";
import cx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { TableEditorTable, type TableEditorTableProps } from "../table-editor";

const classBase = "vuuTableWithEditForm";

export type TableWithEditFormTablePanelProps = HTMLAttributes<HTMLDivElement>;

/**
 * The table side of a `TableWithEditForm`: a flex column that fills the
 * space beside the `TableWithEditFormPanel`. Holds a `TableWithEditFormTable` and
 * whatever headers or toolbars belong with it.
 */
export const TableWithEditFormTablePanel = forwardRef<
  HTMLDivElement,
  TableWithEditFormTablePanelProps
>(function TableWithEditFormTablePanel(
  { className, ...htmlAttributes },
  forwardedRef,
) {
  return (
    <div
      {...htmlAttributes}
      className={cx(`${classBase}-tablePanel`, className)}
      ref={forwardedRef}
    />
  );
});

export type TableWithEditFormTableProps = TableEditorTableProps;

/**
 * The table of a `TableWithEditForm`, sized to fill the rest of its
 * `TableWithEditFormTablePanel`. Selecting a row selects it for the form.
 */
export const TableWithEditFormTable = (props: TableWithEditFormTableProps) => (
  <div className={`${classBase}-table`}>
    <TableEditorTable {...props} />
  </div>
);

export type TableWithEditFormPanelProps = Omit<SidePanelProps, "position">;

/**
 * The Salt `SidePanel`, on the right, that holds the form. `TableWithEditForm`
 * opens and closes it. Compose `SidePanelHeader` and `SidePanelContent`.
 */
export const TableWithEditFormPanel = forwardRef<
  HTMLDivElement,
  TableWithEditFormPanelProps
>(function TableWithEditFormPanel({ className, ...props }, forwardedRef) {
  return (
    <SidePanel
      {...props}
      className={cx(`${classBase}-panel`, className)}
      position="right"
      ref={forwardedRef}
    />
  );
});
