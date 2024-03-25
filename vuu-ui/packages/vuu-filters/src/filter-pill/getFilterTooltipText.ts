import {
  ColumnDescriptorsByName,
  Filter,
  FilterClause,
  MultiValueFilterClause,
  SingleValueFilterClause,
} from "@finos/vuu-filter-types";
import {
  filterAsQuery,
  formatDate,
  isDateTimeColumn,
  isMultiClauseFilter,
  dateTimePattern,
  defaultPatternsByType,
} from "@finos/vuu-utils";
import { filterClauses } from "../filter-utils";

function applyFormatter<T>(
  filter: SingleValueFilterClause<T> | MultiValueFilterClause<T[]>,
  formatter: (t: T) => string
): FilterClause {
  if ("value" in filter) {
    return { ...filter, value: formatter(filter.value) };
  } else {
    return { ...filter, values: filter.values.map(formatter) };
  }
}

function formatFilterValue(
  filter: FilterClause,
  columnsByName?: ColumnDescriptorsByName
): FilterClause {
  const column = columnsByName?.[filter.column];
  if (column && isDateTimeColumn(column)) {
    const pattern = dateTimePattern(column.type);
    const formatter = (n: number) =>
      formatDate({ date: pattern.date ?? defaultPatternsByType.date })(
        new Date(n)
      );
    return applyFormatter(
      filter as
        | SingleValueFilterClause<number>
        | MultiValueFilterClause<number[]>,
      formatter
    );
  }

  return filter;
}

export const getFilterTooltipText =
  (columnsByName?: ColumnDescriptorsByName) => (filter: Filter) => {
    if (isMultiClauseFilter(filter)) {
      const [firstClause] = filterClauses(filter);
      const formattedFilter = formatFilterValue(
        firstClause as FilterClause,
        columnsByName
      );
      return `${filterAsQuery(formattedFilter)} ${filter.op} ...`;
    } else {
      return filterAsQuery(formatFilterValue(filter, columnsByName));
    }
  };
