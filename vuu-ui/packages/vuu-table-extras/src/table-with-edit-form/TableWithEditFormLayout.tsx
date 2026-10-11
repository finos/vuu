import {
  SidePanel,
  SidePanelHeader,
  type SidePanelHeaderProps,
  type SidePanelProps,
} from "@salt-ds/core";
import cx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import {
  TableEditorPanelCloseButton,
  TableEditorTable,
  type TableEditorTableProps,
} from "../table-editor";

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

export interface TableWithEditFormPanelHeaderProps
  extends SidePanelHeaderProps {
  /**
   * Render a close button after the children. It is hidden while the panel
   * can't be closed, i.e. while editing. Defaults to true.
   */
  canClose?: boolean;
}

/**
 * The Salt `SidePanelHeader` of a `TableWithEditFormPanel`. Its first child
 * fills the available width; a close button follows unless `canClose` is
 * false.
 */
export const TableWithEditFormPanelHeader = forwardRef<
  HTMLDivElement,
  TableWithEditFormPanelHeaderProps
>(function TableWithEditFormPanelHeader(
  { canClose = true, children, className, ...props },
  forwardedRef,
) {
  return (
    <SidePanelHeader
      {...props}
      className={cx(`${classBase}-panelHeader`, className)}
      ref={forwardedRef}
    >
      {children}
      {canClose ? <TableEditorPanelCloseButton /> : null}
    </SidePanelHeader>
  );
});
