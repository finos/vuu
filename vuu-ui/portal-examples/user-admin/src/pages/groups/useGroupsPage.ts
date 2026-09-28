import { useData } from "@vuu-ui/core";
import type {
  DataRow,
  TableConfig,
  TableRowSelectHandler,
} from "@vuu-ui/vuu-table-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GROUP_APPLICATION_CELL_RENDERER } from "../../components/ApplicationCell";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import {
  groupScopeFilter,
  useApplicationScope,
} from "../../data/useApplicationScope";

export const useGroupsPage = () => {
  const { VuuDataSource } = useData();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [dataRow, setDataRow] = useState<DataRow>();

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
          width: 180,
        },
        { name: "group_display_name", label: "Group" },
        { name: "group_path", label: "Path", width: 240 },
        { name: "user_count", label: "Users" },
        { name: "role_count", label: "Roles" },
        { name: "parent_group_id", label: "", hidden: true },
      ],
      columnSeparators: true,
      zebraStripes: true,
    }),
    [],
  );

  const handleCreateGroup = useCallback(() => {
    setDataRow({ key: "__vuu_new_row__" } as DataRow);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDataRow(undefined);
    setOpen(false);
    if (params.has("create")) {
      const next = new URLSearchParams(params);
      next.delete("create");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const handleSelect = useCallback<TableRowSelectHandler>(
    (nextDataRow) => {
      if (nextDataRow) {
        setDataRow(nextDataRow);
        setOpen(true);
      } else {
        handleClose();
      }
    },
    [handleClose],
  );

  useEffect(() => {
    if (params.get("create") === "true") {
      handleCreateGroup();
      const next = new URLSearchParams(params);
      next.delete("create");
      setParams(next, { replace: true });
    }
  }, [handleCreateGroup, params, setParams]);

  return {
    application,
    config,
    dataRow,
    dataSource,
    createGroup: handleCreateGroup,
    close: handleClose,
    onSelect: handleSelect,
    open,
    setApplication,
    setOpen,
  };
};
