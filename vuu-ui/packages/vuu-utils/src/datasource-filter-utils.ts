import { DataSourceFilter, WithFullConfig } from "@finos/vuu-data-types";
import { parseFilter } from "@finos/vuu-filter-parser";
import { FilterCombinatorOp } from "@finos/vuu-filter-types";

export const combine = (
  filter1: DataSourceFilter,
  filter2: DataSourceFilter,
  combinator: FilterCombinatorOp = "and",
): DataSourceFilter => {
  const combined =
    filter1.filter.length > 0 && filter2.filter.length > 0
      ? filter1.filter + " " + combinator + " " + filter2.filter
      : (filter1.filter ?? "") + filter2.filter;

  return {
    filter: combined,
  };
};

export const combineConfig = (config: WithFullConfig): WithFullConfig => {
  const combinedFilter =
    config.filterSpec &&
    config.filterSpec.filter.length > 0 &&
    config.baseFilterSpec &&
    config.baseFilterSpec.filter.length > 0
      ? config.filterSpec.filter + " and " + config.baseFilterSpec.filter
      : (config.filterSpec?.filter ?? "") + config.baseFilterSpec?.filter;
  const newConfig = {
    ...config,
    filterSpec: {
      filter: combinedFilter,
      filterStruct:
        combinedFilter.length > 0 ? parseFilter(combinedFilter) : undefined,
    },
  };

  return newConfig;
};
