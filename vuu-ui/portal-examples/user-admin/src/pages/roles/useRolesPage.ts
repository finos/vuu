import { useData } from "@vuu-ui/core";
import type {
  DataRow,
  TableConfig,
  TableRowSelectHandler,
} from "@vuu-ui/vuu-table-types";
import { useCallback, useMemo, useState } from "react";

export const useRolesPage = () => {
  const { VuuDataSource } = useData();
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
        ],
        table: { module: "USER_ADMIN", table: "roles" },
      }),
    [VuuDataSource],
  );

  const config = useMemo<TableConfig>(
    () => ({
      columns: [
        { name: "client_name", label: "Client name" },
        { name: "role_name", label: "Role name", width: 200 },
        { name: "role_display_name", label: "Short name" },
        { name: "description", label: "Description" },
        { name: "client_id", label: "", hidden: true },
        { name: "client_identifier", label: "Client", hidden: true },
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
    config,
    dataRow,
    dataSource,
    createRole: handleCreateRole,
    close: handleClose,
    onSelect: handleSelect,
    open,
    setOpen,
  };
};
