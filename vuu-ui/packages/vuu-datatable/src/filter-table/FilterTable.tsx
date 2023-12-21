import { FilterBar, FilterBarProps } from "@finos/vuu-filters";
import { Table, TableProps } from "@finos/vuu-table";
import { HTMLAttributes } from "react";
import cx from "clsx";

import "./FilterTable.css";

const classBase = "vuuFilterTable";

export interface FilterTableProps extends HTMLAttributes<HTMLDivElement> {
  FilterBarProps: FilterBarProps;
  TableProps: TableProps;
}

import "./FilterTable.css";

export const FilterTable = ({
  TableProps,
  FilterBarProps,
  ...htmlAttributes
}: FilterTableProps) => {
  return (
    <div {...htmlAttributes} className={cx(classBase)}>
      <FilterBar {...FilterBarProps} />
      <Table {...TableProps} />
    </div>
  );
};
