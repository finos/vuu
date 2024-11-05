import { useEditableCell, useHeaderProps } from "@finos/vuu-table";
import {
  CommitHandler,
  FilterAggregator,
  getFieldName,
} from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { FilterValueChangeHandler } from "./InlineFilter";

export const useInlineFilter = ({
  onChange,
}: {
  onChange: FilterValueChangeHandler;
}) => {
  const filterAggregator = useMemo(() => new FilterAggregator(), []);
  const { columns = [], virtualColSpan = 0 } = useHeaderProps();

  const handleCommit = useCallback<
    CommitHandler<HTMLElement, string | number | undefined>
  >(
    (evt, value = "") => {
      const fieldName = getFieldName(evt.target);
      const column = columns.find((c) => c.name === fieldName);
      if (column) {
        if (value === "") {
          if (filterAggregator.removeFilter(column)) {
            onChange(filterAggregator.filter);
          }
        } else {
          filterAggregator.addFilter(column, value);
          onChange(filterAggregator.filter);
        }
      }
    },
    [columns, filterAggregator, onChange],
  );

  const { onKeyDown } = useEditableCell();

  return {
    columns,
    onCommit: handleCommit,
    onKeyDown,
    virtualColSpan,
  };
};
