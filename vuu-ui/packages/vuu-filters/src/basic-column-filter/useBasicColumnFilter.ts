import { ChangeEventHandler, useCallback, useState } from "react";
import { BasicColumnFilterProps } from "./BasicColumnFilter";
import { CommitHandler, filterAsQuery, NoFilter } from "@vuu-ui/vuu-utils";
import { Filter, SingleValueFilterClauseOp } from "@vuu-ui/vuu-filter-types";
import { DataSourceFilter } from "@vuu-ui/vuu-data-types";

export type FilterValue = string | number;

export type BasicColumnFilterHookProps = Pick<
  BasicColumnFilterProps,
  "column" | "onApplyFilter" | "initialValue"
>;

const filterOp: SingleValueFilterClauseOp = "=";

const asDataSourceFilter = (filter: Filter): DataSourceFilter => {
  if (filter) {
    return {
      filter: filterAsQuery(filter),
      filterStruct: filter,
    };
  } else {
    return NoFilter;
  }
};

export const useBasicColumnFilter = ({
  initialValue,
  column,
  onApplyFilter,
}: BasicColumnFilterHookProps) => {
  const [filterValue, setFilterValue] = useState(initialValue);

  const handleInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      setFilterValue(e.target.value);
    },
    [],
  );

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (_, value) => {
      const filter: Filter = { column: column.name, op: filterOp, value };
      setFilterValue((value ?? "").toString());
      onApplyFilter?.(asDataSourceFilter(filter));
    },
    [column, onApplyFilter],
  );

  return {
    filterValue: filterValue ?? "",
    onInputChange: handleInputChange,
    onCommit: handleCommit,
  };
};
