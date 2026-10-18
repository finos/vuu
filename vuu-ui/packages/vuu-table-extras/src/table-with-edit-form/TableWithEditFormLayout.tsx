import {
  SidePanel,
  SidePanelHeader,
  type SidePanelHeaderProps,
  type SidePanelProps,
  useForkRef,
} from "@salt-ds/core";
import cx from "clsx";
import { forwardRef, type HTMLAttributes } from "react";
import { TableEditorPanelCloseButton } from "../table-editor";

const classBase = "vuuTableWithEditForm";

export type TableWithEditFormTablePanelProps = HTMLAttributes<HTMLDivElement>;

/**
 * The table side of a `TableWithEditForm`: a flex column that fills the
 * space beside the `TableWithEditFormPanel`. Holds a `TableEditorTable` and
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

export type TableWithEditFormPanelProps = Omit<SidePanelProps, "position">;

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
 * The Salt `SidePanel`, on the right, that holds the form. `TableWithEditForm`
 * opens and closes it. Compose `SidePanelHeader` and `SidePanelContent`.
 */
export const TableWithEditFormPanel = forwardRef<
  HTMLDivElement,
  TableWithEditFormPanelProps
>(function TableWithEditFormPanel({ className, ...props }, forwardedRef) {
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
