import { FilterBar, FilterBarProps } from "@vuu-ui/vuu-filters";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { useFilterTable } from "./useFilterTable";

import filterTableCss from "./FilterTable.css";

const classBase = "vuuFilterTable";

export interface FilterTableProps extends HTMLAttributes<HTMLDivElement> {
  FilterBarProps?: Partial<FilterBarProps>;
  TableProps: Omit<TableProps, "height" | "width">;
}

export const FilterTable = ({
  FilterBarProps,
  TableProps,
  style: styleProps,
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
    <div
      {...htmlAttributes}
      className={cx(classBase)}
      style={{ ...styleProps }}
    >
      <FilterBar {...filterBarProps} />
      <Table {...TableProps} height="auto" width="auto" />
    </div>
  );
};
