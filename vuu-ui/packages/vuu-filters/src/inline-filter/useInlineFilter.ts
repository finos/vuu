import { useEditableCell, useHeaderProps } from "@vuu-ui/vuu-table";
import { filterAsQuery } from "@vuu-ui/vuu-utils";
import { useCallback } from "react";
import { FilterValueChangeHandler } from "./InlineFilter";
import { FilterAppliedHandler } from "../filter-container/useFilterContainer";

export const useInlineFilter = ({
  onChange,
}: {
  onChange: FilterValueChangeHandler;
}) => {
  const { columns = [], virtualColSpan = 0 } = useHeaderProps();

  const onKeyDown = useEditableCell();

  const handleFilterApplied = useCallback<FilterAppliedHandler>(
    (filter) => {
      onChange({ filter: filterAsQuery(filter) });
    },
    [onChange],
  );

  const handleFilterCleared = useCallback(() => {
    onChange({ filter: "" });
  }, [onChange]);

  return {
    columns,
    onFilterApplied: handleFilterApplied,
    onFilterCleared: handleFilterCleared,
    onKeyDown,
    virtualColSpan,
  };
};
