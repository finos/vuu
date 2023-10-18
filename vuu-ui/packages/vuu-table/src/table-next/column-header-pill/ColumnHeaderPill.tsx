import cx from "classnames";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { HTMLAttributes, MouseEvent, useCallback } from "react";

import "./ColumnHeaderPill.css";

export interface ColumnHeaderPillProps extends HTMLAttributes<HTMLDivElement> {
  column: KeyedColumnDescriptor;
  removable?: boolean;
  onRemove?: (column: KeyedColumnDescriptor) => void;
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
  if (removable && typeof onRemove !== "function") {
    throw Error(
      "ColumnHeaderPill onRemove prop must be provided if Pill is removable"
    );
  }

  const handleClickRemove = useCallback(
    (evt: MouseEvent<HTMLSpanElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
      onRemove?.(column);
    },
    [column, onRemove]
  );

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
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
