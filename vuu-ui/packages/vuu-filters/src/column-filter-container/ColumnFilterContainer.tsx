import cx from "clsx";
import {
  useCallback,
  useMemo,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  ColumnFilterContext,
  useColumnFilterContainer,
  useFilterContext,
  type ColumnFilterContainerHookProps,
} from "./useColumnFilterContainer";
import { ColumnFilterValue } from "@vuu-ui/vuu-filter-types";
import {
  ColumnFilterNext,
  ColumnFilterNextProps,
} from "../column-filter-next/ColumnFilterNext";
import { ColumnFilterCommitHandler } from "../column-filter/useColumnFilter";

const classBase = "vuuFilterContainer";

export interface FilterContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    ColumnFilterContainerHookProps {
  children: ReactNode;
}

export interface FilterContainerColumnFilterProps
  extends Omit<
    ColumnFilterNextProps,
    "defaultValue" | "onChange" | "onCommit" | "value"
  > {
  defaultValue?: ColumnFilterValue;
}

export const FilterContainerColumnFilter = ({
  column,
  ...props
}: FilterContainerColumnFilterProps) => {
  const {
    onChange: onFilterContextChange,
    onCommit: onFilterContextCommit,
    register,
  } = useFilterContext(column, true);

  console.log(`%c[FilterContainerColumnFilter] render`, "color:red");

  const defaultValue = useMemo(() => register(column), [column, register]);

  const handleCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      onFilterContextCommit(column, op, value);
    },
    [onFilterContextCommit],
  );

  return (
    <ColumnFilterNext
      {...props}
      column={column}
      defaultValue={defaultValue}
      onColumnFilterChange={onFilterContextChange}
      onCommit={handleCommit}
    />
  );
};

export const ColumnFilterContainer = ({
  children,
  className,
  filter,
  onFilterApplied,
  onFilterCleared,
  ...htmlAttributes
}: FilterContainerProps) => {
  const filterContextProps = useColumnFilterContainer({
    filter,
    onFilterApplied,
    onFilterCleared,
  });
  return (
    <ColumnFilterContext.Provider value={filterContextProps}>
      <div {...htmlAttributes} className={cx(classBase, className)}>
        {children}
      </div>
    </ColumnFilterContext.Provider>
  );
};
