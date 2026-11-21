import type { Filter } from "@vuu-ui/vuu-filter-types";
import type { VuuSort } from "@vuu-ui/vuu-protocol-types";
import { moduleAccessFilter } from "./applications";

/** Server column holding the time a user row last changed. */
export const UPDATED_COLUMN = "vuuUpdatedTimestamp";

export type UserSort = "changed" | "name" | "lastLogin" | "applications";

export const USER_SORT_OPTIONS: readonly { label: string; value: UserSort }[] =
  [
    { label: "Recently changed", value: "changed" },
    { label: "Name", value: "name" },
    { label: "Last sign-in", value: "lastLogin" },
    { label: "Most applications", value: "applications" },
  ];

const SORTS: Record<UserSort, VuuSort> = {
  applications: {
    sortDefs: [
      { column: "module_access_count", sortType: "D" },
      { column: "username", sortType: "A" },
    ],
  },
  changed: { sortDefs: [{ column: UPDATED_COLUMN, sortType: "D" }] },
  lastLogin: { sortDefs: [{ column: "last_login", sortType: "D" }] },
  name: {
    sortDefs: [
      { column: "first_name", sortType: "A" },
      { column: "last_name", sortType: "A" },
      { column: "username", sortType: "A" },
    ],
  },
};

export const userSortFor = (sort: UserSort): VuuSort => SORTS[sort];

/** Users who can open every one of `accessRoles`; undefined when there are none. */
export const allApplicationsFilter = (
  accessRoles: readonly string[],
): Filter | undefined =>
  accessRoles.length === 0
    ? undefined
    : accessRoles.length === 1
      ? moduleAccessFilter(accessRoles[0])
      : { op: "and", filters: accessRoles.map(moduleAccessFilter) };

/** Joins the defined filters with `and`. */
export const allOf = (
  ...filters: (Filter | undefined)[]
): Filter | undefined => {
  const defined = filters.filter((filter): filter is Filter => !!filter);
  return defined.length > 1 ? { op: "and", filters: defined } : defined[0];
};

/**
 * Splits a user's access roles into the ones to show as tags and the rest.
 * Roles in `first` come first, so a filtered-for application is never hidden.
 */
export const visibleAccessRoles = (
  accessRoles: readonly string[],
  first: readonly string[],
  max: number,
) => {
  const ordered = [
    ...accessRoles.filter((role) => first.includes(role)),
    ...accessRoles.filter((role) => !first.includes(role)),
  ];
  // "+1 more" takes as much room as the tag it replaces.
  const shown = ordered.length > max + 1 ? ordered.slice(0, max) : ordered;
  return { hidden: ordered.slice(shown.length), shown };
};
