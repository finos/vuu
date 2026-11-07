import { useData } from "@vuu-ui/core";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import { Table } from "@vuu-ui/vuu-table";
import type {
  TableConfig,
  TableRowClickHandler,
} from "@vuu-ui/vuu-table-types";
import { filterAsQuery } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { USER_ADMIN_TABLES } from "../data/user-admin-tables";
import { useAdminPaths } from "../data/useAdminPaths";
import { UPDATED_COLUMN, type UserSort, userSortFor } from "../data/userList";
import {
  USER_COLUMNS,
  USER_ROW_HEIGHT,
  usersTableConfig,
} from "./usersTableConfig";
import { FirstAccessRolesContext } from "./ModuleAccessCell";
import { USER_LAST_LOGIN_CELL_RENDERER } from "./UserCells";

const NO_ACCESS_ROLES: readonly string[] = [];

export interface UsersTableProps {
  "aria-label": string;
  className?: string;
  filter?: Filter;
  /** Applications whose tags each row shows first, by access role. */
  firstAccessRoles?: readonly string[];
  /**
   * Sorts the rows and switches to a compact layout whose last column
   * matches the sort: Last sign-in, or Changed for every other sort.
   */
  sort?: UserSort;
}

/** Narrower defaults, so the compact layout fits beside another panel. */
const COMPACT_WIDTHS: Record<string, number> = {
  enabled: 100,
  last_login: 140,
  module_access: 230,
  username: 220,
};

/** The compact layout used with a sort. */
const sortedConfig = (sort: UserSort): TableConfig => {
  const base = usersTableConfig({ compact: true });
  const columns = base.columns
    .filter(({ name }) => name !== "group_count")
    .map((column) => ({
      ...column,
      width: COMPACT_WIDTHS[column.name] ?? column.width,
      ...(column.name === "last_login"
        ? { hidden: sort !== "lastLogin", label: "Last sign-in" }
        : undefined),
    }));
  return {
    ...base,
    columns:
      sort === "lastLogin"
        ? columns
        : [
            ...columns,
            {
              align: "left",
              label: "Changed",
              minWidth: 120,
              name: UPDATED_COLUMN,
              type: {
                name: "number",
                renderer: { name: USER_LAST_LOGIN_CELL_RENDERER },
              },
              width: 130,
            },
          ],
  };
};

/** A live, virtualised table of users. Clicking a row opens the user. */
export const UsersTable = ({
  "aria-label": ariaLabel,
  className,
  filter,
  firstAccessRoles = NO_ACCESS_ROLES,
  sort,
}: UsersTableProps) => {
  const { VuuDataSource } = useData();
  const navigate = useNavigate();
  const paths = useAdminPaths();
  const sorted = sort !== undefined;

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: sorted ? [...USER_COLUMNS, UPDATED_COLUMN] : USER_COLUMNS,
        table: USER_ADMIN_TABLES.users,
      }),
    [VuuDataSource, sorted],
  );

  useEffect(() => {
    if (sort) dataSource.sort = userSortFor(sort);
  }, [dataSource, sort]);

  const query = useMemo(() => {
    try {
      return filter ? { filter: filterAsQuery(filter) } : {};
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : String(cause) };
    }
  }, [filter]);

  useEffect(() => {
    dataSource.filter =
      query.filter && filter
        ? { filter: query.filter, filterStruct: filter }
        : { filter: "" };
  }, [dataSource, filter, query.filter]);

  const config = useMemo<TableConfig>(
    () => (sort ? sortedConfig(sort) : usersTableConfig()),
    [sort],
  );

  const onRowClick = useCallback<TableRowClickHandler>(
    (_event, row) => {
      if (typeof row.user_id === "string") navigate(paths.user(row.user_id));
    },
    [navigate, paths],
  );

  return query.error ? (
    <p role="alert">{query.error}</p>
  ) : (
    <div
      aria-label={ariaLabel}
      className={className ?? "vuuIdentityAdmin-tableCard"}
      role="region"
    >
      <FirstAccessRolesContext.Provider value={firstAccessRoles}>
        <Table
          config={config}
          dataSource={dataSource}
          onRowClick={onRowClick}
          rowHeight={USER_ROW_HEIGHT}
          selectionModel="none"
        />
      </FirstAccessRolesContext.Provider>
    </div>
  );
};
