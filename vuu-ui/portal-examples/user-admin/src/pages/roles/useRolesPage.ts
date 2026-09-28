import { useData } from "@vuu-ui/core";
import type {
  DataRow,
  TableConfig,
  TableRowSelectHandler,
} from "@vuu-ui/vuu-table-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ROLE_APPLICATION_CELL_RENDERER } from "../../components/ApplicationCell";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import {
  roleScopeFilter,
  useApplicationScope,
} from "../../data/useApplicationScope";

export const useRolesPage = () => {
  const { VuuDataSource } = useData();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [dataRow, setDataRow] = useState<DataRow>();

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: [
          "role_id",
          "client_id",
          "role_display_name",
          "role_name",
          "client_identifier",
          "client_name",
          "description",
          "group_count",
        ],
        table: USER_ADMIN_TABLES.roles,
      }),
    [VuuDataSource],
  );
  const { application, setApplication } = useApplicationScope(
    dataSource,
    roleScopeFilter,
  );

  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        {
          name: "client_identifier",
          label: "Application",
          type: {
            name: "string",
            renderer: { name: ROLE_APPLICATION_CELL_RENDERER },
          },
          width: 200,
        },
        { name: "role_name", label: "Role name", width: 200 },
        { name: "role_display_name", label: "Short name" },
        { name: "description", label: "Description" },
        { name: "group_count", label: "Groups" },
        { name: "client_name", label: "Client", hidden: true },
        { name: "client_id", label: "", hidden: true },
        { name: "role_id", label: "", hidden: true },
      ],
      columnSeparators: true,
      zebraStripes: true,
    }),
    [],
  );

  const handleCreateRole = useCallback(() => {
    setDataRow({
      key: "__vuu_new_row__",
    } as DataRow);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDataRow(undefined);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (params.get("create") === "true") {
      handleCreateRole();
      const next = new URLSearchParams(params);
      next.delete("create");
      setParams(next, { replace: true });
    }
  }, [handleCreateRole, params, setParams]);

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

  return {
    application,
    config,
    dataRow,
    dataSource,
    createRole: handleCreateRole,
    close: handleClose,
    onSelect: handleSelect,
    open,
    setApplication,
    setOpen,
  };
};
