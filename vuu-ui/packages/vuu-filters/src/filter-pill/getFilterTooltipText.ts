import {
  ColumnDescriptorsByName,
  Filter,
  FilterClause,
  MultiValueFilterClause,
  SingleValueFilterClause,
} from "@vuu-ui/vuu-filter-types";
import {
  filterAsQuery,
  formatTemporalFilterValue,
  isMultiClauseFilter,
  isTemporal,
} from "@vuu-ui/vuu-utils";
import { filterClauses } from "../filter-utils";

function applyFormatter<T>(
  filter: SingleValueFilterClause<T> | MultiValueFilterClause<T[]>,
  formatter: (t: T) => string,
): FilterClause {
  if ("value" in filter) {
    return { ...filter, value: formatter(filter.value) };
  } else {
    return { ...filter, values: filter.values.map(formatter) };
  }
}

/**
 * A copy of the clause for display: the column label in place of the column
 * name, and temporal values formatted. Never sent to the server.
 */
function formatFilterForDisplay(
  filter: FilterClause,
  columnsByName?: ColumnDescriptorsByName,
): FilterClause {
  const column = columnsByName?.[filter.column];
  if (column === undefined) {
    return filter;
  }
  const labelledFilter = { ...filter, column: column.label ?? column.name };
  if (isTemporal(column)) {
    return applyFormatter(
      labelledFilter as
        | SingleValueFilterClause<number | string>
        | MultiValueFilterClause<Array<number | string>>,
      (value) => formatTemporalFilterValue(value, column),
    );
  }
  return labelledFilter;
}

export const getFilterAsFormattedText =
  (columnsByName?: ColumnDescriptorsByName) => (filter: Filter) => {
    if (isMultiClauseFilter(filter)) {
      const [firstClause] = filterClauses(filter);
      const formattedFilter = formatFilterForDisplay(
        firstClause as FilterClause,
        columnsByName,
      );
      return `${filterAsQuery(formattedFilter)} ${filter.op} ...`;
    } else {
      return filterAsQuery(formatFilterForDisplay(filter, columnsByName));
    }
  };

/**
 * The display text of a filter clause, split into the column and operator,
 * then the value, so the value can be styled apart.
 */
export const getFilterClauseTextParts =
  (columnsByName?: ColumnDescriptorsByName) =>
  (clause: FilterClause): [string, string] => {
    const formattedClause = formatFilterForDisplay(clause, columnsByName);
    const text = filterAsQuery(formattedClause);
    const prefix = `${formattedClause.column} ${formattedClause.op} `;
    return text.startsWith(prefix)
      ? [prefix, text.slice(prefix.length)]
      : [text, ""];
  };
