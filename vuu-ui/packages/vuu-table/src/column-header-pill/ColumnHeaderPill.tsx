import cx from "clsx";
import { RuntimeColumnDescriptor } from "@finos/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, MouseEvent, useCallback } from "react";

import columnHeaderPillCss from "./ColumnHeaderPill.css";

export interface ColumnHeaderPillProps extends HTMLAttributes<HTMLDivElement> {
  column: RuntimeColumnDescriptor;
  removable?: boolean;
  onRemove?: (column: RuntimeColumnDescriptor) => void;
}

const classBase = "vuuColumnHeaderPill";

export const ColumnHeaderPill = ({
  children,
  className,
  column,
  onRemove,
  removable,
  ...htmlAttributes
}: ColumnHeaderPillProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-header-pill",
    css: columnHeaderPillCss,
    window: targetWindow,
  });

  console.log({ htmlAttributes });

  if (removable && typeof onRemove !== "function") {
    throw Error(
      "ColumnHeaderPill onRemove prop must be provided if Pill is removable",
    );
  }

  const handleClickRemove = useCallback(
    (evt: MouseEvent<HTMLSpanElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
      onRemove?.(column);
    },
    [column, onRemove],
  );

  return (
    <div {...htmlAttributes} className={cx(classBase, className)} tabIndex={-1}>
      {children}
      {removable ? (
        <span
          className={`${classBase}-removeButton`}
          role="button"
          data-icon="cross"
          onClick={handleClickRemove}
        />
      ) : null}
    </div>
  );
};
