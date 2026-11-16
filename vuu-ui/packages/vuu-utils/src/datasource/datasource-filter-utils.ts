import type {
  DataSourceFilter,
  WithBaseFilter,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import { isMultiClauseFilter } from "../filters/filter-utils";

// TODO as we mugrate to a Filter only API, remove parseFilter
export const combineFilters = ({
  baseFilterSpec,
  filterSpec,
  ...config
}: WithBaseFilter<WithFullConfig>) => {
  if (baseFilterSpec === undefined || baseFilterSpec.filter === "") {
    if (filterSpec.filterStruct || filterSpec.filter === "") {
      return {
        ...config,
        filterSpec,
      };
    } else {
      return {
        ...config,
        filterSpec: {
          filter: filterSpec.filter,
          filterStruct: parseFilter(filterSpec.filter),
        },
      };
    }
  } else {
    const baseFilterQuery = baseFilterSpec.filter;
    const combinedFilter =
      filterSpec.filter.length > 0 && baseFilterQuery.length > 0
        ? `${filterSpec.filter} and ${baseFilterQuery}`
        : filterSpec.filter || baseFilterQuery;

    const newConfig: WithFullConfig = {
      ...config,
      filterSpec: {
        filter: combinedFilter,
        filterStruct:
          combinedFilter.length > 0 ? parseFilter(combinedFilter) : undefined,
      },
    };

    return newConfig;
  }
};

const addFilterColumnNames = (filter: Filter, names: Set<string>) => {
  if (isMultiClauseFilter(filter)) {
    for (const f of filter.filters) {
      addFilterColumnNames(f, names);
    }
  } else {
    names.add(filter.column);
  }
};

/**
 * The names of the columns a filter references, in the order they first
 * appear.
 */
export const getFilterColumnNames = (filter?: Filter): string[] => {
  if (filter === undefined) {
    return [];
  }
  const names = new Set<string>();
  addFilterColumnNames(filter, names);
  return Array.from(names);
};

/**
 * The names of the columns a DataSourceFilter references. The filter struct
 * is used if present, otherwise the filter query is parsed. A query that
 * cannot be parsed references no columns.
 */
export const getDataSourceFilterColumnNames = (
  filterSpec?: DataSourceFilter,
): string[] => {
  if (filterSpec === undefined || filterSpec.filter === "") {
    return [];
  } else if (filterSpec.filterStruct) {
    return getFilterColumnNames(filterSpec.filterStruct);
  }
  try {
    return getFilterColumnNames(parseFilter(filterSpec.filter));
  } catch {
    return [];
  }
};
