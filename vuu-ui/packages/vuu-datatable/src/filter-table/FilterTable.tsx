import { FilterBar, FilterBarProps } from "@vuu-ui/vuu-filters";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import { CSSProperties, HTMLAttributes } from "react";
import { useFilterTable } from "./useFilterTable";
import { DataSourceProvider } from "@vuu-ui/vuu-utils";

const classBase = "vuuFilterTable";

// Use inline styles as the VuuFilter stylesheet may not have been loaded
// by the time child elements need these val;ues to be in place.
const filterTableStyles: CSSProperties & {
  "--vuuFilterBar-flex": CSSProperties["flex"];
  "--vuuMeasuredContainer-flex": CSSProperties["flex"];
} = {
  "--vuuFilterBar-flex": "0 0 auto",
  "--vuuMeasuredContainer-flex": "1 1 auto",
  display: "flex",
  flexDirection: "column",
};

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
  const { filterBarProps } = useFilterTable({
    TableProps,
    FilterBarProps,
  });

  return (
    <DataSourceProvider dataSource={TableProps.dataSource}>
      <div
        {...htmlAttributes}
        className={classBase}
        style={{ ...styleProps, ...filterTableStyles }}
      >
        <FilterBar {...filterBarProps} />
        <Table {...TableProps} height="auto" width="auto" />
      </div>
    </DataSourceProvider>
  );
};
