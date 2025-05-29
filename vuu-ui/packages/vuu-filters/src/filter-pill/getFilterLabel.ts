import {
  ColumnDescriptorsByName,
  Filter,
  FilterClause,
} from "@vuu-ui/vuu-filter-types";
import { isMultiClauseFilter } from "@vuu-ui/vuu-utils";

const getColumnLabel = (
  filter: FilterClause,
  columnsByName?: ColumnDescriptorsByName,
) => {
  const column = columnsByName?.[filter.column];
  if (column) {
    return column.label ?? column.name;
  } else {
    return filter.column;
  }
};

export const getFilterLabel =
  (columnsByName?: ColumnDescriptorsByName) =>
  (filter: Filter): string => {
    if (isMultiClauseFilter(filter)) {
      return filter.filters
        .map((f) => getFilterLabel(columnsByName)(f))
        .join(", ");
    } else {
      return getColumnLabel(filter, columnsByName);
    }
  };
