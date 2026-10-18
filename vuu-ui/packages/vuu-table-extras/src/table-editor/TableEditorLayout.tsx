import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import type { HTMLAttributes } from "react";
import { useTableEditorContext } from "./TableEditorContext";

import tableEditorLayoutCss from "./TableEditorLayout.css";

const useLayoutCss = () => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-editor-layout",
    css: tableEditorLayoutCss,
    window: targetWindow,
  });
};

export type TableEditorToolbarProps = HTMLAttributes<HTMLDivElement>;

/** A row of controls, e.g. `TableEditorModeToggle` or `TableEditorNewButton`. */
export const TableEditorToolbar = ({
  className,
  ...htmlAttributes
}: TableEditorToolbarProps) => {
  useLayoutCss();
  return (
    <div
      {...htmlAttributes}
      className={cx("vuuTableEditorToolbar", className)}
    />
  );
};

export type TableEditorPlaceholderProps = HTMLAttributes<HTMLDivElement>;

/**
 * Form editing: renders `children` while no row is selected (and no row is
 * being created), typically alongside `TableEditorForm` in the side panel.
 */
export const TableEditorPlaceholder = ({
  className,
  ...htmlAttributes
}: TableEditorPlaceholderProps) => {
  useLayoutCss();
  const { editIn, mode, selectedRow } = useTableEditorContext(
    "TableEditorPlaceholder",
  );
  return editIn === "form" && mode !== "create" && selectedRow === undefined ? (
    <div
      {...htmlAttributes}
      className={cx("vuuTableEditorPlaceholder", className)}
    />
  ) : null;
};
