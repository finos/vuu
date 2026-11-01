import { useData } from "@vuu-ui/core";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";
import {
  GROUP_APPLICATION_CELL_RENDERER,
  GROUP_NAME_CELL_RENDERER,
  GROUP_ROLES_CELL_RENDERER,
} from "../../components/ApplicationCell";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import {
  groupScopeFilter,
  useApplicationScope,
} from "../../data/useApplicationScope";

export const GROUP_ROW_HEIGHT = 44;

export const useGroupsPage = () => {
  const { VuuDataSource } = useData();

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: [
          "group_id",
          "group_display_name",
          "group_path",
          "parent_group_id",
          "user_count",
          "role_count",
        ],
        table: USER_ADMIN_TABLES.groups,
      }),
    [VuuDataSource],
  );
  const { application, setApplication } = useApplicationScope(
    dataSource,
    groupScopeFilter,
  );

  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        {
          name: "group_id",
          label: "Application",
          type: {
            name: "string",
            renderer: { name: GROUP_APPLICATION_CELL_RENDERER },
          },
          minWidth: 160,
          maxWidth: 320,
          width: 200,
        },
        {
          name: "group_display_name",
          label: "Group",
          type: {
            name: "string",
            renderer: { name: GROUP_NAME_CELL_RENDERER },
          },
          minWidth: 180,
          maxWidth: 400,
          width: 240,
        },
        { name: "user_count", label: "Members", minWidth: 100, width: 100 },
        {
          name: "role_count",
          label: "Roles",
          align: "left",
          type: {
            name: "number",
            renderer: { name: GROUP_ROLES_CELL_RENDERER },
          },
          minWidth: 240,
          maxWidth: 600,
          width: 360,
        },
        { name: "group_path", label: "Path", hidden: true },
        { name: "parent_group_id", label: "", hidden: true },
      ],
      columnLayout: "fit",
      columnSeparators: false,
      rowSeparators: true,
      zebraStripes: false,
    }),
    [],
  );

  return { application, config, dataSource, setApplication };
};
