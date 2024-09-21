import { FilterBar, FilterBarProps } from "@finos/vuu-filters";
import { Table, TableProps } from "@finos/vuu-table";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { CSSProperties, HTMLAttributes } from "react";
import { useFilterTable } from "./useFilterTable";

import filterTableCss from "./FilterTable.css";

const classBase = "vuuFilterTable";

export interface FilterTableProps extends HTMLAttributes<HTMLDivElement> {
  FilterBarProps?: Partial<FilterBarProps>;
  TableProps: TableProps;
}

// Using inline styles here as Salt style injection happens too late for the
// measurements that we have to take on first render
const style = {
  "--vuuMeasuredContainer-flex": "1 1 auto",
  "--vuuMeasuredContainer-height": "auto",
  display: "flex",
  flexDirection: "column",
} as CSSProperties;

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
      style={{ ...styleProps, ...style }}
    >
      <FilterBar {...filterBarProps} style={{ flex: "0 0 33px" }} />
      <Table {...TableProps} />
    </div>
  );
};
