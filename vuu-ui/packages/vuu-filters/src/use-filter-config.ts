import { NamedDataSourceFilter } from "@finos/vuu-data-types";
import { SaveLocation, VuuUser } from "@finos/vuu-shell";
import { useRestEntityStore } from "./use-rest-config";
import { useCallback, useEffect, useState } from "react";

export interface FilterConfigHookProps {
  user: VuuUser;
  saveUrl?: string;
  saveLocation: SaveLocation;
}

export const useFilterConfig = ({
  user,
  saveUrl = "api/vui/filters",
  saveLocation = "local", // TODO: "remote" is not supported yet
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
