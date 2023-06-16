import { NamedDataSourceFilter } from "@finos/vuu-data-types";
import { SaveLocation, VuuUser } from "@finos/vuu-shell";
import { useRestEntityStore } from "./use-rest-config";
import { useCallback, useEffect, useState } from "react";

export interface FilterConfigHookProps {
  user: VuuUser;
  defaultFilter?: NamedDataSourceFilter; // TODO: Use a default filter
  saveUrl?: string;
  saveLocation: SaveLocation; // TODO: Make this work for "remote"
}

export const useFilterConfig = ({
  user,
  saveUrl = "api/vui/filters", // TODO: Check this is a sensible choice
  saveLocation,
}: FilterConfigHookProps) => {
  const [allFilters, setAllFilters] = useState<NamedDataSourceFilter[]>();

  const { get, getAll, save } = useRestEntityStore<NamedDataSourceFilter>({
    baseUrl: `${saveUrl}/${user.username}`,
    saveLocation,
  });

  const refreshAllFilters = useCallback(async () => {
    const filters = await getAll();
    setAllFilters(filters);
  }, [getAll]);

  useEffect(() => {
    refreshAllFilters().catch((err) => console.error(err));
  }, [refreshAllFilters]);

  const saveFilter = useCallback(
    async (filter: NamedDataSourceFilter) => {
      await save(filter);
      await refreshAllFilters();
    },
    [save, refreshAllFilters]
  );

  return {
    allFilters,
    getFilterById: get,
    saveFilter,
  };
};
