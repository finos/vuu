import { useData } from "@vuu-ui/core";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import type { VuuSort } from "@vuu-ui/vuu-protocol-types";
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
import {
  USER_COLUMNS,
  USER_ROW_HEIGHT,
  usersTableConfig,
} from "../pages/users/usersTable";
import { USER_LAST_LOGIN_CELL_RENDERER } from "./UserCells";

export const UPDATED_COLUMN = "vuuUpdatedTimestamp";

const RECENT_SORT: VuuSort = {
  sortDefs: [{ column: UPDATED_COLUMN, sortType: "D" }],
};

export interface UsersTableProps {
  "aria-label": string;
  className?: string;
  filter?: Filter;
  /** Most recently changed first, with a Changed column. */
  recent?: boolean;
}

/** A live, virtualised table of users. Clicking a row opens the user. */
export const UsersTable = ({
  "aria-label": ariaLabel,
  className,
  filter,
  recent = false,
}: UsersTableProps) => {
  const { VuuDataSource } = useData();
  const navigate = useNavigate();
  const paths = useAdminPaths();

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: recent ? [...USER_COLUMNS, UPDATED_COLUMN] : USER_COLUMNS,
        sort: recent ? RECENT_SORT : undefined,
        table: USER_ADMIN_TABLES.users,
      }),
    [VuuDataSource, recent],
  );

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

  const config = useMemo<TableConfig>(() => {
    const base = usersTableConfig({ compact: recent });
    return recent
      ? {
          ...base,
          columns: [
            ...base.columns,
            {
              align: "left",
              label: "Changed",
              minWidth: 120,
              name: UPDATED_COLUMN,
              type: {
                name: "number",
                renderer: { name: USER_LAST_LOGIN_CELL_RENDERER },
              },
              width: 180,
            },
          ],
        }
      : base;
  }, [recent]);

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
      <Table
        config={config}
        dataSource={dataSource}
        onRowClick={onRowClick}
        rowHeight={USER_ROW_HEIGHT}
        selectionModel="none"
      />
    </div>
  );
};
