import { useEditableCell, useHeaderProps } from "@vuu-ui/vuu-table";
import {
  CommitHandler,
  FilterAggregator,
  getFieldName,
} from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import { FilterValueChangeHandler } from "./InlineFilter";

export const useInlineFilter = ({
  onChange,
}: {
  onChange: FilterValueChangeHandler;
}) => {
  const filterAggregator = useMemo(() => new FilterAggregator(), []);
  const { columns = [], virtualColSpan = 0 } = useHeaderProps();

  const handleCommit = useCallback<CommitHandler<HTMLElement>>(
    (evt, value = "") => {
      const fieldName = getFieldName(evt.target);
      const column = columns.find((c) => c.name === fieldName);
      if (column) {
        if (value === "") {
          if (filterAggregator.removeFilter(column)) {
            onChange(filterAggregator.filter);
          }
        } else {
          if (typeof value === "string" || typeof value === "number") {
            filterAggregator.addFilter(column, value);
            onChange(filterAggregator.filter);
          } else {
            throw Error(
              `[useInlineFilter] handleCommit value ${typeof value} supports string, number only`,
            );
          }
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
