import { useData } from "@vuu-ui/core";
import type {
  DataRow,
  TableConfig,
  TableRowSelectHandler,
} from "@vuu-ui/vuu-table-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ROLE_APPLICATION_CELL_RENDERER,
  ROLE_NAME_CELL_RENDERER,
  ROLE_TYPE_CELL_RENDERER,
} from "../../components/ApplicationCell";
import { USER_ADMIN_TABLES } from "../../data/user-admin-tables";
import {
  roleScopeFilter,
  useApplicationScope,
} from "../../data/useApplicationScope";

export const ROLE_ROW_HEIGHT = 52;

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
          minWidth: 160,
          maxWidth: 320,
          width: 200,
        },
        {
          name: "role_name",
          label: "Role",
          type: {
            name: "string",
            renderer: { name: ROLE_NAME_CELL_RENDERER },
          },
          minWidth: 220,
          maxWidth: 560,
          width: 320,
        },
        {
          name: "role_id",
          label: "Type",
          type: {
            name: "string",
            renderer: { name: ROLE_TYPE_CELL_RENDERER },
          },
          minWidth: 120,
          width: 140,
        },
        {
          name: "client_name",
          label: "Client",
          minWidth: 120,
          maxWidth: 320,
          width: 160,
        },
        { name: "group_count", label: "Groups", minWidth: 80, width: 90 },
        { name: "role_display_name", label: "Short name", hidden: true },
        { name: "description", label: "Description", hidden: true },
        { name: "client_id", label: "", hidden: true },
      ],
      columnLayout: "fit",
      columnSeparators: false,
      rowSeparators: true,
      zebraStripes: false,
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
