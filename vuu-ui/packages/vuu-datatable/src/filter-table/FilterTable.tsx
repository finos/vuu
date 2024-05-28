import { FilterBar, FilterBarProps } from "@finos/vuu-filters";
import { Table, TableProps } from "@finos/vuu-table";
import { HTMLAttributes } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";

import filterTableCss from "./FilterTable.css";

const classBase = "vuuFilterTable";

export interface FilterTableProps extends HTMLAttributes<HTMLDivElement> {
  FilterBarProps: FilterBarProps;
  TableProps: TableProps;
}

export const FilterTable = ({
  TableProps,
  FilterBarProps,
  ...htmlAttributes
}: FilterTableProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-table",
    css: filterTableCss,
    window: targetWindow,
  });

  return (
    <div {...htmlAttributes} className={cx(classBase)}>
      <FilterBar {...FilterBarProps} />
      <Table {...TableProps} />
    </div>
  );
};
