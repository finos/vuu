import { WithBaseFilter, WithFullConfig } from "@vuu-ui/vuu-data-types";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";

export const combineFilters = ({
  baseFilterSpec,
  filterSpec,
  ...config
}: WithBaseFilter<WithFullConfig>) => {
  const baseFilterQuery = baseFilterSpec?.filter ?? "";
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
};
