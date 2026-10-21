import {
  SidePanel,
  SidePanelHeader,
  type SidePanelHeaderProps,
  type SidePanelProps,
  useForkRef,
} from "@salt-ds/core";
import cx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { DataSourceStats } from "../datasource-stats/DatasourceStats";
import {
  TableEditorButtons,
  TableEditorPanelCloseButton,
} from "../table-editor";
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

const classBase = "vuuEditableTable";

export type EditableTableMainProps = HTMLAttributes<HTMLDivElement>;

/**
 * With a side panel (`editStrategy="form"` or `createStrategy="form"`): a
 * flex column that fills the space beside the `EditableTablePanel`. Holds a
 * `TableEditorTable` and whatever headers, toolbars or footers belong with
 * it.
 */
export const EditableTableMain = forwardRef<
  HTMLDivElement,
  EditableTableMainProps
>(function EditableTableMain({ className, ...htmlAttributes }, forwardedRef) {
  return (
    <div
      {...htmlAttributes}
      className={cx(`${classBase}-main`, className)}
      ref={forwardedRef}
    />
  );
});

export type EditableTablePanelProps = Omit<SidePanelProps, "position">;

const animationWidth = "--saltSidePanel-animation-width";

/**
 * While SidePanel animates open, its content is sized from
 * --saltSidePanel-animation-width, which SidePanel measures in a layout
 * effect. On the first open that effect runs before the panel is mounted,
 * so the width is never set and a percentage width resolves against the
 * growing panel, making the content reflow as it slides in. Measure it
 * ourselves when the panel mounts mid-animation. The panel unmounts when
 * closed, so each open starts from a fresh element.
 */
const measureAnimationWidth = (el: HTMLDivElement | null) => {
  if (
    el?.classList.contains("saltSidePanel-enterAnimation") &&
    !el.style.getPropertyValue(animationWidth)
  ) {
    const { animation } = el.style;
    el.style.animation = "none";
    const { width } = el.getBoundingClientRect();
    el.style.animation = animation;
    el.style.setProperty(animationWidth, `${width}px`);
  }
};

/**
 * The Salt `SidePanel`, on the right, that holds the form. `EditableTable`
 * opens and closes it. Use with `editStrategy="form"` or
 * `createStrategy="form"`. Compose `SidePanelHeader` and `SidePanelContent`.
 */
export const EditableTablePanel = forwardRef<
  HTMLDivElement,
  EditableTablePanelProps
>(function EditableTablePanel({ className, ...props }, forwardedRef) {
  const ref = useForkRef(measureAnimationWidth, forwardedRef);
  return (
    <SidePanel
      {...props}
      className={cx(`${classBase}-panel`, className)}
      position="right"
      ref={ref}
    />
  );
});

export interface EditableTablePanelHeaderProps extends SidePanelHeaderProps {
  /**
   * Render a close button after the children. It is hidden while the panel
   * can't be closed, i.e. while editing. Defaults to true.
   */
  canClose?: boolean;
}

/**
 * The Salt `SidePanelHeader` of a `EditableTablePanel`. Its first child
 * fills the available width; a close button follows unless `canClose` is
 * false.
 */
export const EditableTablePanelHeader = forwardRef<
  HTMLDivElement,
  EditableTablePanelHeaderProps
>(function EditableTablePanelHeader(
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
