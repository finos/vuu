import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useEditableTable, type EditMode } from "@vuu-ui/vuu-utils";
import { type SyntheticEvent, useCallback, useEffect, useId, useMemo, useState } from "react";
import { editableColumns, moduleColumnDescriptors } from "./columnDescriptors";
import { toColumnName } from "@vuu-ui/vuu-utils/dist/index.mjs";
import { useData } from "@vuu-ui/vuu-utils2";

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

export const useModuleAdmin = () => {
  // const { getDataSource } = useSessionDataSource();
  const { VuuDataSource } = useData()
  const instanceId = useId();

  const [editMode, setEditMode] = useState<EditMode>("view");

  const onToggleEditMode = useCallback(
    async (e: SyntheticEvent<HTMLButtonElement>) => {
      const toggleButton = e.target as HTMLButtonElement;
      const editMode = toggleButton.value as EditMode;
      setEditMode(editMode);
    },
    [],
  );

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      bufferSize: 200,
      columns: moduleColumnDescriptors.map(toColumnName),
      table: { module: 'MODULE_DISCOVERY', table: 'modules' },

    })
  }, [VuuDataSource])

  const config = useMemo<TableConfig | undefined>(
    () =>
    ({
      columnLayout: "static",
      columns: editMode === 'edit'
        ? moduleColumnDescriptors.map(col => editableColumns.includes(col.name) ? { ...col, editable: true } : col)
        : moduleColumnDescriptors,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [editMode],
  );

  const exitEditMode = useCallback(() => {
    setEditMode("view");
  }, []);

  const { dataSource: ds, editSession, onCancel, onSave } = useEditableTable({
    dataSource,
    isEditMode: editMode === "edit",
    onCancel: exitEditMode,
    onSave: exitEditMode,
  });

  // if (error) {
  //   return { error, status: "error" };
  // }

  // if (!config || !dataSource) {
  //   return { status: "loading" };
  // }

  return { config, dataSource: ds, editMode, editSession, onCancel, onSave, onToggleEditMode, status: "ready" };
};
