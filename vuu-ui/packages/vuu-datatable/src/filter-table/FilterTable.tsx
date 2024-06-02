import { FilterBar, FilterBarProps } from "@finos/vuu-filters";
import { Table, TableProps } from "@finos/vuu-table";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { useFilterTable } from "./useFilterTable";

import filterTableCss from "./FilterTable.css";

const classBase = "vuuFilterTable";

export interface FilterTableProps extends HTMLAttributes<HTMLDivElement> {
  FilterBarProps?: Partial<FilterBarProps>;
  TableProps: TableProps;
}

export const FilterTable = ({
  FilterBarProps,
  TableProps,
  ...htmlAttributes
}: FilterTableProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-table",
    css: filterTableCss,
    window: targetWindow,
  });

  const { filterBarProps } = useFilterTable({
    TableProps,
    FilterBarProps,
  });

  return (
    <div {...htmlAttributes} className={cx(classBase)}>
      <FilterBar {...filterBarProps} />
      <Table {...TableProps} />
    </div>
  );
};
