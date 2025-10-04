import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { FilterContainerFilter } from "@vuu-ui/vuu-filter-types";
import cx from "clsx";
import { ForwardedRef, forwardRef, HTMLAttributes, ReactElement } from "react";
import { getFilterClausesForDisplay } from "../filter-utils";

import filterDisplayCss from "./FilterDisplay.css";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

const classBase = "vuuFilterDisplay";

export interface FilterDisplayProps extends HTMLAttributes<HTMLDivElement> {
  columns?: ColumnDescriptor[];
  filter: FilterContainerFilter | undefined;
}

const getColumnLabel = (columnName: string, columns?: ColumnDescriptor[]) => {
  if (columns) {
    const column = columns.find((c) => c.name === columnName);
    if (column) {
      return column.label ?? columnName;
    }
  }
  return columnName;
};

export const FilterDisplay = forwardRef(function FilterDisplay(
  { className, columns, filter, ...htmlAttributes }: FilterDisplayProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-display",
    css: filterDisplayCss,
    window: targetWindow,
  });

  const filterClauseList = getFilterClausesForDisplay(filter, columns);
  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      ref={forwardedRef}
    >
      {filterClauseList.reduce<Array<ReactElement>>(
        (list, [columnName, value]) => {
          list.push(
            <span className={`${classBase}-column`} key={list.length}>
              {getColumnLabel(columnName)}
            </span>,
            <span className={`${classBase}-value`} key={list.length + 1}>
              {value}
            </span>,
          );
          return list;
        },
        [],
      )}
    </div>
  );
});
