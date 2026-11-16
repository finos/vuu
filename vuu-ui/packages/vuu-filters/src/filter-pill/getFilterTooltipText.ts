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
  isMultiValueFilter,
  isNumericColumn,
  isTemporal,
} from "@vuu-ui/vuu-utils";
import { filterClauses } from "../filter-utils";
import { formatNumericShorthand } from "../filter-bar/filter-clause/value-editors/numeric-value-utils";

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

const formatNumericValue = (value: unknown) =>
  typeof value === "number" ? formatNumericShorthand(value) : `${value}`;

/**
 * The display text of a clause. Numeric values are shown in shorthand, e.g
 * marketCap > 30bn, so are written here rather than by filterAsQuery, which
 * would quote them.
 */
function filterClauseAsText(
  filter: FilterClause,
  columnsByName?: ColumnDescriptorsByName,
): string {
  const column = columnsByName?.[filter.column];
  const formattedFilter = formatFilterForDisplay(filter, columnsByName);
  if (column && isNumericColumn(column)) {
    if (isMultiValueFilter(formattedFilter)) {
      const values = (formattedFilter.values as unknown[])
        .map(formatNumericValue)
        .join(",");
      return `${formattedFilter.column} ${formattedFilter.op} [${values}]`;
    } else if ("value" in formattedFilter) {
      const { value } = formattedFilter as SingleValueFilterClause;
      if (typeof value === "number") {
        return `${formattedFilter.column} ${formattedFilter.op} ${formatNumericValue(value)}`;
      }
    }
  }
  return filterAsQuery(formattedFilter);
}

export const getFilterAsFormattedText =
  (columnsByName?: ColumnDescriptorsByName) => (filter: Filter) => {
    if (isMultiClauseFilter(filter)) {
      const [firstClause] = filterClauses(filter);
      return `${filterClauseAsText(firstClause as FilterClause, columnsByName)} ${filter.op} ...`;
    } else {
      return filterClauseAsText(filter, columnsByName);
    }
  };

/**
 * The display text of a filter clause, split into the column and operator,
 * then the value, so the value can be styled apart.
 */
export const getFilterClauseTextParts =
  (columnsByName?: ColumnDescriptorsByName) =>
  (clause: FilterClause): [string, string] => {
    const column = columnsByName?.[clause.column];
    const text = filterClauseAsText(clause, columnsByName);
    const prefix = `${column?.label ?? column?.name ?? clause.column} ${clause.op} `;
    return text.startsWith(prefix)
      ? [prefix, text.slice(prefix.length)]
      : [text, ""];
  };
