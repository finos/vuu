import type { Filter } from "@vuu-ui/vuu-filter-types";
import { filterAsQuery } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { membershipsFrom, type UserRef } from "./admin-plans";
import {
  type ApplicationDetails,
  idsFilter,
  moduleAccessFilter,
} from "./applications";
import { USER_ADMIN_TABLES } from "./user-admin-tables";
import { useLookupRows } from "./useLookupRows";

const MEMBERSHIP_COLUMNS = ["membership_id", "user_id", "group_id"];
export const USER_SUMMARY_COLUMNS = [
  "user_id",
  "username",
  "email",
  "first_name",
  "last_name",
  "enabled",
  "module_access",
];

export interface UserSummary extends UserRef {
  email: string;
  enabled: boolean;
  firstName: string;
  lastName: string;
  /** Comma-separated access roles of the applications the user can open. */
  moduleAccess: string;
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

export const userSummaryFrom = (row: Record<string, unknown>): UserSummary => ({
  email: text(row.email),
  enabled: row.enabled !== false,
  firstName: text(row.first_name),
  lastName: text(row.last_name),
  moduleAccess: text(row.module_access),
  userId: text(row.user_id),
  username: text(row.username),
});

export const userName = (
  user: Pick<UserSummary, "firstName" | "lastName" | "username">,
) => [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;

const safeQuery = (
  build: () => Filter,
): { error?: string; filter?: string } => {
  try {
    return { filter: filterAsQuery(build()) };
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : String(cause) };
  }
};

/** Which of the application's groups each user is in, kept live. */
export const useApplicationMemberships = (entry: ApplicationDetails) => {
  const groupIds = useMemo(
    () => entry.groups.map(({ groupId }) => groupId),
    [entry.groups],
  );
  const query = useMemo(
    () => safeQuery(() => idsFilter("group_id", groupIds)),
    [groupIds],
  );
  const lookup = useLookupRows(
    USER_ADMIN_TABLES.userGroups,
    MEMBERSHIP_COLUMNS,
    !!query.filter,
    query.filter,
  );
  const memberships = useMemo(
    () =>
      membershipsFrom(
        lookup.rows.map(({ group_id, user_id }) => ({ group_id, user_id })),
        new Set(groupIds),
      ),
    [groupIds, lookup.rows],
  );
  return {
    error: query.error ?? lookup.error,
    loading: lookup.loading,
    memberships,
  };
};

/** Users who can open the application, kept live. */
export const useApplicationUserList = (entry: ApplicationDetails) => {
  const query = useMemo(
    () => safeQuery(() => moduleAccessFilter(entry.application.accessRole)),
    [entry.application.accessRole],
  );
  const lookup = useLookupRows(
    USER_ADMIN_TABLES.users,
    USER_SUMMARY_COLUMNS,
    !!query.filter,
    query.filter,
  );
  const users = useMemo(
    () =>
      lookup.rows
        .map(userSummaryFrom)
        .sort((left, right) => userName(left).localeCompare(userName(right))),
    [lookup.rows],
  );
  return { error: query.error ?? lookup.error, loading: lookup.loading, users };
};

const UNSUPPORTED_SEARCH = /["\\\t\r\n]/;

/**
 * Users whose name, username or email contains `value`. Vuu's filter grammar
 * has no escaped string literal, so some characters cannot be searched for.
 */
export const userSearchFilter = (
  value: string,
): { error?: string; filter?: Filter } => {
  const trimmed = value.trim();
  if (!trimmed) return {};
  if (UNSUPPORTED_SEARCH.test(trimmed)) {
    return {
      error:
        "Search values cannot contain double quotes, backslashes, tabs or line breaks.",
    };
  }
  return {
    filter: {
      op: "or",
      filters: ["username", "email", "first_name", "last_name"].map(
        (column) => ({ op: "contains", column, value: trimmed }),
      ),
    },
  };
};

/** Users matching a free-text search, for pickers. */
export const useUserSearch = (search: string, enabled = true) => {
  const query = useMemo<{ error?: string; filter?: string }>(() => {
    const { error, filter } = userSearchFilter(search);
    return error ? { error } : filter ? safeQuery(() => filter) : {};
  }, [search]);
  const lookup = useLookupRows(
    USER_ADMIN_TABLES.users,
    USER_SUMMARY_COLUMNS,
    enabled && !query.error,
    query.filter,
  );
  const users = useMemo(
    () =>
      lookup.rows
        .map(userSummaryFrom)
        .sort((left, right) => userName(left).localeCompare(userName(right))),
    [lookup.rows],
  );
  return { error: query.error ?? lookup.error, loading: lookup.loading, users };
};
