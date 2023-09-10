import { FilterBar, FilterBarProps } from "@finos/vuu-filters";
import { TableNext, TableProps } from "@finos/vuu-table";
import { HTMLAttributes } from "react";
import cx from "classnames";

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
      <TableNext {...TableProps} />
    </div>
  );
};
