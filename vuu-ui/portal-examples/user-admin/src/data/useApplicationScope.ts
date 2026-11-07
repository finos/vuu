import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import { filterAsQuery } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  type ApplicationModel,
  groupIdsFor,
  idsFilter,
  moduleAccessFilter,
  roleIdsFor,
  UNASSIGNED,
} from "./applications";
import { useApplicationModel } from "./useApplicationModel";

export const APPLICATION_PARAM = "application";

/** The `?application=` search param, shared by the admin pages. */
export const useApplicationParam = () => {
  const [params, setParams] = useSearchParams();
  const application = params.get(APPLICATION_PARAM) ?? "";
  const setApplication = useCallback(
    (value: string) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value) next.set(APPLICATION_PARAM, value);
          else next.delete(APPLICATION_PARAM);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  return [application, setApplication] as const;
};

export type ApplicationScopeFilter = (
  model: ApplicationModel,
  application: string,
) => Filter;

/** Groups of one application, by group ID. Needs the loaded model. */
export const groupScopeFilter: ApplicationScopeFilter = (model, application) =>
  idsFilter("group_id", groupIdsFor(model, application));

/** Roles of one application, by role ID. Needs the loaded model. */
export const roleScopeFilter: ApplicationScopeFilter = (model, application) =>
  idsFilter("role_id", roleIdsFor(model, application));

/** Users who can open one application, or who can open none. */
export const userScopeFilter: ApplicationScopeFilter = (model, application) =>
  application === UNASSIGNED
    ? { op: "=", column: "module_access_count", value: 0 }
    : moduleAccessFilter(
        model.byName.get(application)?.application.accessRole ?? "",
      );

/**
 * Restricts `dataSource` to the rows of the application selected by the
 * `?application=` param (or to UNASSIGNED rows).
 */
export const useApplicationScope = (
  dataSource: DataSource,
  filterFor: ApplicationScopeFilter,
  { waitForModel = true }: { waitForModel?: boolean } = {},
) => {
  const [application, setApplication] = useApplicationParam();
  const { loading, model } = useApplicationModel();
  const known = application === UNASSIGNED || model.byName.has(application);
  const ready = !waitForModel || !loading;

  const filterStruct = useMemo(
    () =>
      application && known && ready ? filterFor(model, application) : undefined,
    [application, filterFor, known, model, ready],
  );

  useEffect(() => {
    dataSource.filter = filterStruct
      ? { filter: filterAsQuery(filterStruct), filterStruct }
      : { filter: "" };
  }, [dataSource, filterStruct]);

  return {
    application: known ? application : "",
    setApplication,
  };
};
