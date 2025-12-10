import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { FilterContainerFilter } from "@vuu-ui/vuu-filter-types";
import cx from "clsx";
import {
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
  MouseEventHandler,
  useCallback,
} from "react";
import { getFilterClausesForDisplay } from "../filter-utils";

import filterDisplayCss from "./FilterDisplay.css";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { queryClosest } from "@vuu-ui/vuu-utils";

const classBase = "vuuFilterDisplay";

export interface FilterDisplayProps extends HTMLAttributes<HTMLDivElement> {
  allowDelete?: boolean;
  columns?: ColumnDescriptor[];
  filter: FilterContainerFilter | undefined;
  onDeleteFilterClause?: (columnName: string) => void;
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
  {
    allowDelete = false,
    className,
    columns,
    filter,
    onDeleteFilterClause,
    ...htmlAttributes
  }: FilterDisplayProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-display",
    css: filterDisplayCss,
    window: targetWindow,
  });

  const handleDelete = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      const {
        dataset: { columnName },
      } = queryClosest<HTMLDivElement>(e.target, "[data-column-name]", true);
      if (columnName) {
        onDeleteFilterClause?.(columnName);
      }
    },
    [onDeleteFilterClause],
  );

  const filterClauseList = getFilterClausesForDisplay(filter, columns);
  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      ref={forwardedRef}
    >
      {filterClauseList.map(
        ([columnName, value]) => (
          <div
            className={`${classBase}-filter-clause`}
            key={columnName}
            data-column-name={columnName}
          >
            <span className={`${classBase}-column`}>
              {getColumnLabel(columnName)}
            </span>
            <span className={`${classBase}-value`}>{value}</span>
            {allowDelete ? (
              <IconButton
                data-embedded
                icon="close"
                appearance="transparent"
                sentiment="neutral"
                onClick={handleDelete}
              />
            ) : null}
          </div>
        ),
        [],
      )}
    </div>
  );
});
